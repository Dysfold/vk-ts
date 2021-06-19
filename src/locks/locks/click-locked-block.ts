import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { Key } from '../keys/key';
import { BlockLock } from './BlockLock';

registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  if (event.hand !== EquipmentSlot.HAND) return;
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
    openTheLock(lock, player, event);
    return;
  }

  event.setCancelled(true);
  event.player.sendMessage('Lukittu');
}

function openTheLock(
  lock: BlockLock,
  player: Player,
  event: PlayerInteractEvent,
) {
  lock.open();

  if (player.isSneaking()) {
    event.setCancelled(true);
  } else {
    lock.interact();
  }
}

function clickUnlockedBlock(event: PlayerInteractEvent, lock: BlockLock) {
  const player = event.player;
  const codeInLock = lock.getCode();

  if (hasRightKey(player, codeInLock)) {
    lockTheLock(player, lock, event);
    return;
  }

  lock.interact();
  event.player.sendMessage('Klikattiin avattua lukkoa');
}
function lockTheLock(
  player: Player,
  lock: BlockLock,
  event: PlayerInteractEvent,
) {
  player.sendMessage('Lukitaan');
  lock.lock();

  if (player.isSneaking()) {
    event.setCancelled(true);
  } else {
    lock.interact();
  }
}
