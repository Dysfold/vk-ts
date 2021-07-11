import { Block } from 'org.bukkit.block';
import { ItemStack } from 'org.bukkit.inventory';
import { spawnHiddenItemFrame } from '../../../common/entities/item-frame';
import { getLockClass } from '../blocklocks/block-lock-list';
import { getLock } from './getLock';

export function createLock(block: Block) {
  if (isAlreadyLocked(block)) return;

  const LockClass = getLockClass(block);
  if (!LockClass) return;
  const lockCustomItem = LockClass.getCustomItem(block);
  if (!lockCustomItem) return;

  const lockData = {
    code: 1234,
    isLocked: false,
    created: new Date().getTime(),
  };
  const lockItem = lockCustomItem.create(lockData);

  const itemFrame = createLockItemFrame(block, lockItem);
  if (!itemFrame) return;

  return new LockClass({
    block: block,
    itemFrame: itemFrame,
    lockCustomItem: lockCustomItem,
    lockData: lockData,
  });
}

function isAlreadyLocked(block: Block) {
  const oldLock = getLock(block);
  return oldLock !== undefined;
}

function createLockItemFrame(block: Block, lockInItemFrame: ItemStack) {
  const Lock = getLockClass(block);
  if (!Lock) return;
  const frameFacing = Lock.getItemFrameFacing(block);
  if (!frameFacing) return;
  const attachTo = Lock.getBlockForItemFrame(block);
  const rotation = Lock.getItemFrameRotation(block);

  const frame = spawnHiddenItemFrame(attachTo, frameFacing, lockInItemFrame);
  if (!frame) return;
  frame.setInvulnerable(true);
  frame.rotation = rotation;
  return frame;
}
