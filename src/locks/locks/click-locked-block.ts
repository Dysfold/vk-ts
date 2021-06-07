import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Key } from '../keys/key';
import { getLockInfo } from './helpers';
import { getToggledDoorLock, LockInfo } from './lock-items';

registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  const lockInfo = getLockInfo(event.clickedBlock);
  if (!lockInfo) return;

  Bukkit.broadcastMessage(JSON.stringify(lockInfo.data));
  if (lockInfo.data.isLocked) {
    clickLockedBlock(event, lockInfo);
  }
});

function hasRightKey(player: Player, code?: number) {
  const itemInHand = player.inventory.itemInMainHand;
  if (!Key.check(itemInHand)) return false;
  const codeInKey = Key.get(itemInHand)?.code;
  return code == codeInKey;
}

function clickLockedBlock(event: PlayerInteractEvent, lockInfo: LockInfo) {
  const player = event.player;

  if (hasRightKey(player, lockInfo.data.code)) {
    return openLock(player, lockInfo);
  }

  event.setCancelled(true);
  event.player.sendMessage('Lukittu');
}

function openLock(player: Player, lockInfo: LockInfo) {
  player.sendMessage('Avataan');
  const toggledLock = getToggledDoorLock(lockInfo.itemStack);
  lockInfo.itemFrame.item = toggledLock.create(lockInfo.data);
}
