import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Key } from '../keys/key';
import { BlockLock } from './BlockLock';

registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  const lock = BlockLock.getFrom(event.clickedBlock);
  if (!lock) return;

  if (lock.isLocked()) {
    clickLockedBlock(event, lock);
  } else {
    clickUnlockedBlock(event, lock);
  }
});

function hasRightKey(player: Player, code?: number) {
  const itemInHand = player.inventory.itemInMainHand;
  if (!Key.check(itemInHand)) return false;
  const codeInKey = Key.get(itemInHand)?.code;
  return code == codeInKey;
}

function clickLockedBlock(event: PlayerInteractEvent, lock: BlockLock) {
  const player = event.player;
  const codeInLock = lock.getCode();

  if (hasRightKey(player, codeInLock)) {
    player.sendMessage('Avataan');
    lock.open();
    return;
  }

  event.setCancelled(true);
  event.player.sendMessage('Lukittu');
}

function clickUnlockedBlock(event: PlayerInteractEvent, lock: BlockLock) {
  const player = event.player;
  const codeInLock = lock.getCode();

  if (hasRightKey(player, codeInLock)) {
    player.sendMessage('Lukitaan');
    lock.lock();

    /**
     * Player can keep the
     */
    if (player.isSneaking()) {
      event.setCancelled(true);
    } else {
      lock.interact();
    }
    return;
  }

  lock.interact();
  event.player.sendMessage('Klikattiin avattua lukkoa');
}
