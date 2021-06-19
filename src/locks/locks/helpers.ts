import { Block, BlockFace } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import { Door } from 'org.bukkit.block.data.type';
import { getItemFrame } from '../../common/entities/item-frame';

export function getFacingForLockItemFrame(block: Block) {
  const data = block.blockData;

  if (data instanceof Door) {
    return data.facing.oppositeFace;
  }
  return undefined;
}

export function getBlockForLockItemFrame(block: Block) {
  const data = block.blockData;

  if (data instanceof Door) {
    if (data.half == Half.TOP) {
      return block.getRelative(BlockFace.DOWN);
    }
  }
  return block;
}

export function getLockItemFrame(block: Block) {
  const attachedBlock = getBlockForLockItemFrame(block);
  const frameFacing = getFacingForLockItemFrame(block);

  if (frameFacing) {
    return getItemFrame(attachedBlock, frameFacing);
  }
}
