import { Axis, GameMode, Material, Location, SoundCategory } from 'org.bukkit';
import { Block, BlockFace, Dispenser } from 'org.bukkit.block';
import { Levelled, Orientable, Waterlogged } from 'org.bukkit.block.data';
import { Dispenser as DispenserData, Fence } from 'org.bukkit.block.data.type';
import { BlockDispenseEvent } from 'org.bukkit.event.block';
import { InventoryOpenEvent, InventoryType } from 'org.bukkit.event.inventory';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { LivingEntity } from 'org.bukkit.entity';

const MAX_LEN = 20;
const MAX_GATE_HEIGHT = 10;
const WINCH_SPEED = 500; // millis

const Winch = new CustomBlock({
  type: Material.DISPENSER,
});

const winches = new Map<Block, { direction: BlockFace }>();

// Materials which will go into the winch. Allow only CHAIN for now
const RopeMaterials = new Set<Material>([Material.CHAIN]);

// Liftable blocks (other than logs, ropes or fences)
const LiftableMaterials = new Set<Material>([Material.CAULDRON]);

function isRope(block: Block) {
  const isRopeMaterial = RopeMaterials.has(block.type);

  if (block.type === Material.CHAIN) {
    // Allow only vertical chains
    const axis = (block.blockData as Orientable).axis;
    if (axis !== Axis.Y) return false;
  }
  return isRopeMaterial;
}

// Allow all types of log-like blocks
function isLog(block: Block) {
  const name = block.type.toString();
  return name.endsWith('_LOG') || name.endsWith('_WOOD');
}

function isFence(block: Block) {
  const name = block.type.toString();
  // Count iron bars as fences, since they are similar
  return name.endsWith('_FENCE') || block.type === Material.IRON_BARS;
}

// Can the block be replaced by moving gate/rope/block
function isEmpty(block: Block) {
  return block.type === Material.AIR || block.type === Material.WATER;
}

// Check if the block is a rope block or a liftable block
function isLiftable(block: Block) {
  return (
    isRope(block) ||
    LiftableMaterials.has(block.type) ||
    isLog(block) ||
    isFence(block)
  );
}

// Start the winch
Winch.event(
  BlockDispenseEvent,
  (event) => event.block,
  async (event) => {
    const winch = event.block;

    const blockData = winch.blockData as DispenserData;
    if (blockData.facing !== BlockFace.DOWN) return;
    if (!RopeMaterials.has(event.item.type)) return;

    const inventory = (winch.state as Dispenser).inventory;
    const ropes = countRopes(inventory) + 1;
    if (ropes === 0) return;
    event.setCancelled(true);
    await wait(1, 'ticks'); // Delay because we need the inventory to update after cancelling the drop/event

    const key = winch.blockKey;
    const activeWinch = winches.get(winch);
    if (activeWinch) {
      // Reverce the direction of the winch
      const oldDirection = activeWinch.direction;
      winches.set(winch, {
        direction: oldDirection.oppositeFace,
      });
      return;
    }
    // Lift the rope
    if (ropes === 1) {
      winches.set(winch, { direction: BlockFace.UP });
    }
    // Lower the rope
    else {
      winches.set(winch, { direction: BlockFace.DOWN });
    }
  },
);

function lift(winch: Block) {
  const inventory = (winch.state as Dispenser).inventory;

  // Select all blocks below the winch to be moved
  const liftedBlocks: Block[] = [];
  const logs: Block[] = [];
  for (let i = 1; i < MAX_LEN; i++) {
    const block = winch.getRelative(BlockFace.DOWN, i);

    // 1st and 2nd blocks need to be ropes
    if (i <= 2 && !isRope(block)) return false;

    if (!isLiftable(block)) break;
    liftedBlocks.push(block);
    if (isLog(block)) {
      logs.push(block);

      // Get adjanced logs
      const logData = block.blockData as Orientable;
      const direction =
        logData.axis === Axis.X ? BlockFace.WEST : BlockFace.NORTH;

      for (let i = 1; i < 4; i++) {
        const log = block.getRelative(direction, i);
        if (isLog(log)) {
          if (!isEmpty(log.getRelative(BlockFace.UP))) return false;
          liftedBlocks.push(log);
          logs.push(log);
        } else break;
      }
      for (let i = 1; i < 4; i++) {
        const log = block.getRelative(direction, -i);
        if (isLog(log)) {
          if (!isEmpty(log.getRelative(BlockFace.UP))) return false;
          liftedBlocks.push(log);
          logs.push(log);
        } else break;
      }
      break;
    }
  }

  // Select all fences below logs
  for (const log of logs) {
    for (let i = 1; i < MAX_GATE_HEIGHT; i++) {
      const block = log.getRelative(BlockFace.DOWN, i);
      if (!isFence(block)) break;
      liftedBlocks.push(block);
    }
  }

  for (const log of logs) liftEntities(log);

  for (const block of liftedBlocks) {
    const blockAbove = block.getRelative(BlockFace.UP);
    if (blockAbove.type === Material.DISPENSER) continue;
    const data = block.blockData;

    if (block.type === Material.CAULDRON) {
      // Lift entities standing on cauldron
      // (entities on logs lifted earlier)
      liftEntities(block);
    }

    // Remove water from block to avoid weird fountains :)
    if (data instanceof Waterlogged) {
      data.setWaterlogged(false);
    }

    blockAbove.setType(block.type, true);
    blockAbove.blockData = data;

    // Update fence connections
    if (data instanceof Fence) {
      blockAbove.setType(Material.AIR, true);
      blockAbove.state.update(true, true);
      blockAbove.setType(block.type, true);
    }

    // Deleting the previus block
    block.type = Material.AIR;
  }

  // Put the rope inside the winch
  const ropeItem = new ItemStack(Material.CHAIN);
  inventory.addItem(ropeItem);

  playWinchSound(winch.location.add(0.5, 0.5, 0.5));
  return true;
}

function lower(winch: Block) {
  const inventory = (winch.state as Dispenser).inventory;
  const slot = inventory.first(Material.CHAIN);
  const rope = inventory.getItem(slot);
  if (!rope || rope.amount <= 1) {
    const key = winch.blockKey;
    winches.delete(winch);
    return true;
  }

  // Select all blocks below the winch to be moved
  const loweredBlocks: Block[] = [];
  const logs: Block[] = [];
  for (let i = 1; i < MAX_LEN; i++) {
    const block = winch.getRelative(BlockFace.DOWN, i);
    if (!isLiftable(block)) break;
    loweredBlocks.unshift(block);
    if (isLog(block)) {
      logs.push(block);

      // Get direction of the log (X OR Y)
      const logData = block.blockData as Orientable;
      const direction =
        logData.axis === Axis.X ? BlockFace.WEST : BlockFace.NORTH;

      // Get adjanced logs
      for (let i = 1; i < 4; i++) {
        const log = block.getRelative(direction, i);
        if (isLog(log)) {
          loweredBlocks.unshift(log);
          logs.push(log);
        } else break;
      }
      for (let i = 1; i < 4; i++) {
        const log = block.getRelative(direction, -i);
        if (isLog(log)) {
          loweredBlocks.unshift(log);
          logs.push(log);
        } else break;
      }
      break;
    }
  }

  // Select all fences below logs
  for (const log of logs) {
    for (let i = 1; i < MAX_GATE_HEIGHT; i++) {
      const block = log.getRelative(BlockFace.DOWN, i);
      if (!isFence(block)) {
        if (block.type !== Material.AIR && block.type !== Material.WATER) {
          return false;
        }
        break;
      }
      loweredBlocks.unshift(block);
    }
  }

  // Loop blocks from bottom to top
  for (const block of loweredBlocks) {
    const blockBelow = block.getRelative(BlockFace.DOWN);
    if (!isEmpty(blockBelow)) {
      return false;
    }

    const isWater = blockBelow.type === Material.WATER;

    blockBelow.setType(block.type, true);
    const data = block.blockData;
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

  playWinchSound(winch.location.add(0.5, 0.5, 0.5));
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

// Move blocks affected by a winch
setInterval(() => {
  winches.forEach((winch, block) => {
    switch (winch.direction) {
      case BlockFace.UP: {
        if (!lift(block)) {
          winches.delete(block);
        }
        break;
      }
      case BlockFace.DOWN: {
        const canBeLowered = lower(block);
        if (!canBeLowered) {
          // Change direction, because the winch did hit a block or limit
          winch.direction = BlockFace.UP;
          lift(block);
        }
        break;
      }
    }
  });
}, WINCH_SPEED);

// Count rope items inside winch block
// Note: If this is called on BlockDispenseEvent, the dispensed item will not be included
function countRopes(inventory: Inventory) {
  let ropes = 0;
  for (const content of inventory.storageContents) {
    if (!content) continue;
    if (!RopeMaterials.has(content.type)) return -1;
    else ropes += content.amount;
  }
  return ropes;
}

// Lift entities standing on lifted the block (log or cauldron)
function liftEntities(block: Block) {
  const entities = block.world.getNearbyEntities(
    block.location.add(0.5, 1.5, 0.5),
    1,
    1.5,
    1,
  );
  for (const entity of entities) {
    if (entity instanceof LivingEntity) {
      const destination = entity.location;
      destination.y = block.y + 2;
      entity.teleport(destination);
    }
  }
}

function playWinchSound(location: Location) {
  location.world.playSound(
    location,
    'minecraft:block.chain.step',
    SoundCategory.BLOCKS,
    0.5,
    0.7,
  );
}
