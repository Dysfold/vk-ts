import { Block } from 'org.bukkit.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { spawnHiddenItemFrame } from '../../common/entities/item-frame';
import { getBlockForLockItemFrame, getFacingForLockItemFrame } from './helpers';
import { getLockItem, LockItem } from './lock-items';

LockItem.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const blockToBeLocked = event.clickedBlock;
    if (!blockToBeLocked) return;

    const lockCustomItem = getLockItem(blockToBeLocked);
    if (!lockCustomItem) return;

    event.setCancelled(true);

    const lock = lockCustomItem.create({
      code: 1234,
      isLocked: true,
      created: new Date().getTime(),
    });
    createLockItemFrame(blockToBeLocked, lock);
  },
);

function createLockItemFrame(block: Block, lockInItemFrame: ItemStack) {
  const frameFacing = getFacingForLockItemFrame(block);
  const attachTo = getBlockForLockItemFrame(block);
  if (!frameFacing) return undefined;
  return spawnHiddenItemFrame(attachTo, frameFacing, lockInItemFrame);
}
