import { GameMode } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { createLock } from '../helpers/createLock';
import { playAddLockSound } from '../helpers/sounds';
import { LockItem } from '../lock-items';

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

    const lock = createLock(blockToBeLocked);
    if (lock) {
      playAddLockSound(lock.location);
      lock.update();
      if (event.player.gameMode !== GameMode.CREATIVE) {
        event.item.amount--;
      }
    }
  },
);
