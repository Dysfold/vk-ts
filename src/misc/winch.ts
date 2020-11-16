import { Material, Axis } from 'org.bukkit';
import { BlockFace, Dispenser, Block } from 'org.bukkit.block';
import { Dispenser as DispenserData } from 'org.bukkit.block.data.type';
import { BlockDispenseEvent } from 'org.bukkit.event.block';
import { InventoryOpenEvent, InventoryType } from 'org.bukkit.event.inventory';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { Orientable, Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Cauldron } from 'org.bukkit.material';

const Winch = new CustomBlock({
  type: Material.DROPPER,
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

// Check if the block is a rope block or a liftable block
function isLiftable(block: Block) {
  const key = block.type.ordinal();
  return isRope(block) || LiftableMaterials.has(key);
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
      blockAbove.type = block.type;
      const data = block.blockData;
      if (data instanceof Waterlogged) {
        data.setWaterlogged(false);
      }
      blockAbove.blockData = data;
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

    if (blockBelow.type === Material.WATER) {
      if (block.type === Material.CAULDRON) {
        const data = block.blockData as Levelled;
        data.level = data.maximumLevel;
        block.blockData = data;
      }
    }

    blockBelow.type = block.type;
    blockBelow.blockData = block.blockData;
    block.type = Material.AIR;
  }

  // Remove rope item from winch
  rope.amount--;
  winch.getRelative(BlockFace.DOWN).type = Material.CHAIN;

  return true;
}

// Don't allow players to open dropper inventory if it contains only rope items
// registerEvent(InventoryOpenEvent, (event) => {
//   const inventory = event.inventory;
//   if (inventory.type !== InventoryType.DROPPER) return;
//   if (
//     ((inventory.holder as Dispenser).block.blockData as DispenserData)
//       .facing !== BlockFace.DOWN
//   )
//     return;
//   const hasRope = countRopes(inventory);
//   if (hasRope > 0) event.setCancelled(true);
// });

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
