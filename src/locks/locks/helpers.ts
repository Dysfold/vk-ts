import { Block, BlockFace } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import { Door } from 'org.bukkit.block.data.type';
import { isLockableMaterial } from './lockable-materials';
import { getItemFrame } from '../../common/entities/item-frame';
import { getLockCustomItem, LockInfo } from './lock-items';

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

export function getLockInfo(block: Block): LockInfo | undefined {
  if (!isLockableMaterial(block.type)) return;

  const frame = getLockItemFrame(block);
  if (!frame) return;

  const itemInFrame = frame.item;
  if (!itemInFrame) return;

  const customItem = getLockCustomItem(itemInFrame);
  if (!customItem) return;

  const data = customItem.get(itemInFrame);
  if (!data) return;

  return {
    customItem: customItem,
    itemStack: itemInFrame,
    itemFrame: frame,
    data: data,
  };
}

function getLockItemFrame(block: Block) {
  const attachedBlock = getBlockForLockItemFrame(block);
  const frameFacing = getFacingForLockItemFrame(block);

  if (frameFacing) {
    return getItemFrame(attachedBlock, frameFacing);
  }
}
