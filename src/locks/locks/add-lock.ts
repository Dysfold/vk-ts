import { Block } from 'org.bukkit.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { spawnHiddenItemFrame } from '../../common/entities/item-frame';
import {
  getBlockForLockItemFrame,
  getFacingForLockItemFrame,
  getRotationForLockItemFrame,
} from './helpers';
import { getLockItem, LockItem } from './lock-items';
import { SoundCategory, Location } from 'org.bukkit';
import { BlockLock } from './BlockLock';
import { Action } from 'org.bukkit.event.block';

LockItem.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    if (!event.item) return;
    if (event.isCancelled()) return;
    event.setCancelled(true);

    const blockToBeLocked = event.clickedBlock;
    if (!blockToBeLocked) return;

    if (isAlreadyLocked(blockToBeLocked)) return;

    const lockCustomItem = getLockItem(blockToBeLocked);
    if (!lockCustomItem) return;

    const lock = lockCustomItem.create({
      code: 1234,
      isLocked: false,
      created: new Date().getTime(),
    });
    const frame = createLockItemFrame(blockToBeLocked, lock);
    if (frame) {
      playAddLockSound(frame.location);
      event.item.amount--;
    }
  },
);

function createLockItemFrame(block: Block, lockInItemFrame: ItemStack) {
  const frameFacing = getFacingForLockItemFrame(block);
  const attachTo = getBlockForLockItemFrame(block);
  const rotation = getRotationForLockItemFrame(block);
  if (!frameFacing) return undefined;
  const frame = spawnHiddenItemFrame(attachTo, frameFacing, lockInItemFrame);
  if (frame) frame.rotation = rotation;
  return frame;
}

function playAddLockSound(location: Location) {
  location.world.playSound(
    location,
    'minecraft:block.stone_button.click_on',
    // 'minecraft:block.iron_trapdoor.open',
    SoundCategory.PLAYERS,
    0.7,
    1.5,
  );
}

function isAlreadyLocked(block: Block) {
  const oldLock = BlockLock.getFrom(block);
  return oldLock !== undefined;
}
