import { Rotation, Bukkit } from 'org.bukkit';
import { Block, BlockFace, Chest } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import {
  Chest as ChestBlockData,
  Door,
  TrapDoor,
  Lectern,
} from 'org.bukkit.block.data.type';
import { DoubleChestInventory } from 'org.bukkit.inventory';
import { getItemFrame } from '../../common/entities/item-frame';

export function getFacingForLockItemFrame(block: Block) {
  const data = block.blockData;

  if (data instanceof Door) {
    return data.facing.oppositeFace;
  }

  if (data instanceof ChestBlockData) {
    return data.facing;
  }

  if (data instanceof TrapDoor) {
    if (data.half == Half.TOP) return BlockFace.UP;
    return BlockFace.DOWN;
  }

  if (data instanceof Lectern) {
    return BlockFace.UP;
  }

  return undefined;
}

export function getBlockForLockItemFrame(block: Block) {
  const data = block.blockData;
  const state = block.state;

  if (data instanceof Door) {
    if (data.half == Half.TOP) {
      return block.getRelative(BlockFace.DOWN);
    }
  }

  if (state instanceof Chest) {
    const righSide = getChestRightSide(state);
    if (righSide) return righSide;
  }

  return block;
}

export function getRotationForLockItemFrame(block: Block) {
  const data = block.blockData;

  if (data instanceof TrapDoor) {
    if (data.half == Half.TOP) {
      return TOP_TRAPDOOR_FACING_TO_ROTATION.get(data.facing) ?? Rotation.NONE;
    }
    return BOTTOM_TRAPDOOR_FACING_TO_ROTATION.get(data.facing) ?? Rotation.NONE;
  }

  if (data instanceof Lectern) {
    return LECTERN_FACING_TO_ROTATION.get(data.facing) ?? Rotation.NONE;
  }

  return Rotation.NONE;
}

export function getLockItemFrame(block: Block) {
  const attachedBlock = getBlockForLockItemFrame(block);
  const frameFacing = getFacingForLockItemFrame(block);
  const frameRotation = getRotationForLockItemFrame(block);

  if (frameFacing !== undefined) {
    const frame = getItemFrame(attachedBlock, frameFacing);
    if (frame) frame.rotation = frameRotation;
    return frame;
  }
}

function getChestRightSide(state: Chest) {
  if (state.inventory instanceof DoubleChestInventory) {
    if (state.inventory.rightSide) {
      const location = state.inventory.rightSide.location;
      if (!location) throw new Error('Invalid double chest inventory');
      return location.block;
    }
  }
}

const TOP_TRAPDOOR_FACING_TO_ROTATION = new Map([
  [BlockFace.SOUTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.NORTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);

const BOTTOM_TRAPDOOR_FACING_TO_ROTATION = new Map([
  [BlockFace.NORTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.SOUTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);

const LECTERN_FACING_TO_ROTATION = new Map([
  [BlockFace.SOUTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.NORTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);
