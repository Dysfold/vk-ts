import {
  PlayerInteractEvent,
  PlayerTakeLecternBookEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { clickLockedBlock, clickUnlockedBlock } from '../helpers/clickLock';
import { getLock } from '../helpers/getLock';
import { playWrongKeySound } from '../helpers/sounds';

registerEvent(PlayerInteractEvent, (event) => {
  if (event.isCancelled()) return;
  if (!event.clickedBlock) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  const lock = getLock(event.clickedBlock);
  if (!lock) return;

  if (lock.isLocked()) {
    clickLockedBlock(event, lock);
  } else {
    clickUnlockedBlock(event, lock);
  }
});

registerEvent(PlayerTakeLecternBookEvent, (event) => {
  const lock = getLock(event.lectern.block);
  if (lock?.isLocked()) {
    event.setCancelled(true);
    playWrongKeySound(event.lectern.location);
    event.player.closeInventory();
  }
});
