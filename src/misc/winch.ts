import { Axis, GameMode, Material } from 'org.bukkit';
import { Block, BlockFace, Dispenser } from 'org.bukkit.block';
import { Levelled, Orientable, Waterlogged } from 'org.bukkit.block.data';
import { Dispenser as DispenserData, Fence } from 'org.bukkit.block.data.type';
import { BlockDispenseEvent } from 'org.bukkit.event.block';
import { InventoryOpenEvent, InventoryType } from 'org.bukkit.event.inventory';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { CustomBlock } from '../common/blocks/CustomBlock';

const Winch = new CustomBlock({
  type: Material.DISPENSER,
});

const winches = new Map<string, { block: Block; direction: BlockFace }>();

const WinchRopes = new Set<number>([Material.CHAIN.ordinal()]);
const LiftableMaterials = new Set<number>([Material.CAULDRON.ordinal()]);

function isRope(block: Block) {
  const isRopeMaterial = WinchRopes.has(block.type.ordinal());

  if (block.type === Material.CHAIN) {
    // Allow only vertical chains
    const axis = (block.blockData as Orientable).axis;
    if (axis !== Axis.Y) return false;
  }
  return isRopeMaterial;
}

function isLog(block: Block) {
  const name = block.type.toString();
  return name.endsWith('_LOG') || name.endsWith('_WOOD');
}

function isFence(block: Block) {
  const name = block.type.toString();
  return name.endsWith('_FENCE');
}

// Check if the block is a rope block or a liftable block
function isLiftable(block: Block) {
  const key = block.type.ordinal();
  return (
    isRope(block) ||
    LiftableMaterials.has(key) ||
    isLog(block) ||
    isFence(block)
  );
}

Winch.event(
  BlockDispenseEvent,
  (event) => event.block,
  async (event) => {
    const winch = event.block;

    const blockData = winch.blockData as DispenserData;
    if (blockData.facing !== BlockFace.DOWN) return;
    if (!WinchRopes.has(event.item.type.ordinal())) return;

    const inventory = (winch.state as Dispenser).inventory;
    const ropes = countRopes(inventory) + 1;
    if (ropes === 0) return;
    event.setCancelled(true);
    await wait(1, 'ticks'); // Delay because we need the inventory to update after cancelling the drop

    const key = winch.location.toString();
    const activeWinch = winches.get(winch.location.toString());
    if (activeWinch) {
      // Reverce the direction of the winch
      const oldDirection = activeWinch.direction;
      winches.set(key, { block: winch, direction: oldDirection.oppositeFace });
      return;
    }
    // Lift the rope
    if (ropes === 1) {
      winches.set(key, { block: winch, direction: BlockFace.UP });
    }
    // Lower the rope
    else {
      winches.set(key, { block: winch, direction: BlockFace.DOWN });
    }
  },
);

const MAX_LEN = 20;
function lift(winch: Block) {
  let blockAbove: Block | undefined;
  const inventory = (winch.state as Dispenser).inventory;

  for (let i = 1; i < MAX_LEN + 1; i++) {
    const block = winch.getRelative(BlockFace.DOWN, i);
    if (blockAbove) {
      if (!isLiftable(block)) {
        return;
      }
      const data = block.blockData;
      if (data instanceof Waterlogged) {
        data.setWaterlogged(false);
      }

      blockAbove.setType(block.type, true);
      blockAbove.blockData = data;
      if (data instanceof Fence) {
        blockAbove.setType(Material.AIR, true);
        blockAbove.state.update(true, true);
        blockAbove.setType(block.type, true);
      }
      block.type = Material.AIR;
    } else {
      // There needs to be 2 rope blocks below the winch
      if (!isRope(block) || !isRope(block.getRelative(BlockFace.DOWN))) {
        winches.delete(winch.location.toString());
        return;
      }
      // Put the rope inside the winch
      const ropeItem = new ItemStack(Material.CHAIN);
      inventory.addItem(ropeItem);
    }

    blockAbove = block;
  }
}

function lower(winch: Block) {
  const inventory = (winch.state as Dispenser).inventory;
  const slot = inventory.first(Material.CHAIN);
  const rope = inventory.getItem(slot);
  if (!rope || rope.amount <= 1) {
    const key = winch.location.toString();
    winches.delete(key);
    return true;
  }

  // Select all blocks to be moved
  const loweredBlocks: Block[] = [];
  for (let i = 1; i < MAX_LEN; i++) {
    const block = winch.getRelative(BlockFace.DOWN, i);
    if (!isLiftable(block)) break;
    loweredBlocks.unshift(block);
  }

  // Loop blocks from bottom to top
  for (const block of loweredBlocks) {
    const blockBelow = block.getRelative(BlockFace.DOWN);
    if (
      blockBelow.type !== Material.AIR &&
      blockBelow.type !== Material.WATER
    ) {
      return false;
    }

    const isWater = blockBelow.type === Material.WATER;

    blockBelow.setType(block.type, true);
    const data = blockBelow.blockData;
    blockBelow.blockData = data;

    // Update fence connections
    if (data instanceof Fence) {
      blockBelow.setType(Material.AIR, true);
      blockBelow.state.update(true, true);
      blockBelow.setType(block.type, true);
    }
    // Fill the cauldron
    else if (isWater && data instanceof Levelled) {
      const cauldron = data as Levelled;
      cauldron.level = cauldron.maximumLevel;
      blockBelow.blockData = cauldron;
    }

    block.type = Material.AIR;
  }

  // Remove rope item from winch
  rope.amount--;
  winch.getRelative(BlockFace.DOWN).type = Material.CHAIN;

  return true;
}

// Don't allow players to open DISPENSER inventory if it contains only rope items
registerEvent(InventoryOpenEvent, (event) => {
  const inventory = event.inventory;
  if (inventory.type !== InventoryType.DISPENSER) return;
  if (
    ((inventory.holder as Dispenser).block.blockData as DispenserData)
      .facing !== BlockFace.DOWN
  )
    return;
  if (event.player.gameMode === GameMode.CREATIVE) return;
  const hasRope = countRopes(inventory);
  if (hasRope > 0) event.setCancelled(true);
});

setInterval(() => {
  winches.forEach((winch) => {
    const block = winch.block;
    switch (winch.direction) {
      case BlockFace.UP: {
        lift(block);
        break;
      }
      case BlockFace.DOWN: {
        const canBeLowered = lower(block);
        if (!canBeLowered) {
          winch.direction = BlockFace.UP;
          lift(block);
        }
        break;
      }
    }
  });
}, 500);

function countRopes(inventory: Inventory) {
  let ropes = 0;
  for (const content of inventory.storageContents) {
    if (!content) continue;
    if (!WinchRopes.has(content.type.ordinal())) return -1;
    else ropes += content.amount;
  }
  return ropes;
}
