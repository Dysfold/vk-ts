import { Player } from 'org.bukkit.entity';
import { Key } from '../../keys/key';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { BlockLock } from '../blocklocks/BlockLock';
import { t } from '../../../common/localization/localization';
import {
  playSetUnlockedSound,
  playWrongKeySound,
  playSetLockedSound,
} from './sounds';
import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Openable } from 'org.bukkit.block.data';
import { color, text } from 'craftjs-plugin/chat';
import { NamedTextColor } from 'net.kyori.adventure.text.format';

const red = (msg: string) => color(NamedTextColor.RED, text(msg));
const green = (msg: string) => color(NamedTextColor.GREEN, text(msg));

function hasRightKey(player: Player, code?: number) {
  const itemInHand = player.inventory.itemInMainHand;
  if (!Key.check(itemInHand)) return false;
  const codeInKey = Key.get(itemInHand)?.code;
  return code === codeInKey;
}

export function clickLockedBlock(event: PlayerInteractEvent, lock: BlockLock) {
  const player = event.player;
  const codeInLock = lock.getCode();
  const soundLocation = event.interactionPoint ?? lock.location;

  if (hasRightKey(player, codeInLock)) {
    player.sendActionBar(green(`${t(player, 'lock.unlocking')}`));
    openTheLock(lock, player, event);
    playSetUnlockedSound(soundLocation);
    return;
  }

  // When clicking lectern without correct key, we just open it
  // instead of cancelling it
  if (event.clickedBlock?.type === Material.LECTERN) return;

  event.setCancelled(true);
  player.sendActionBar(red(`${t(player, 'lock.is_locked')}`));
  playWrongKeySound(soundLocation);
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
    lock.update();
  }

  // Cancel the event always when clicking a lectern
  // This is because we dont want to read the book when locking/unlocking
  if (event.clickedBlock?.type === Material.LECTERN) event.setCancelled(true);
}

export function clickUnlockedBlock(
  event: PlayerInteractEvent,
  lock: BlockLock,
) {
  const player = event.player;
  const codeInLock = lock.getCode();
  const soundLocation = event.interactionPoint ?? lock.location;

  if (hasRightKey(player, codeInLock)) {
    lockTheLock(player, lock, event);
    player.sendActionBar(green(`${t(player, 'lock.locking')}`));
    playSetLockedSound(soundLocation);
    return;
  }

  lock.update();
}

function lockTheLock(
  player: Player,
  lock: BlockLock,
  event: PlayerInteractEvent,
) {
  lock.lock();

  if (player.isSneaking()) {
    event.setCancelled(true);
  } else {
    if (isOpenable(event.clickedBlock)) {
      lock.update();
    } else {
      event.setCancelled(true);
    }
  }

  // Cancel the event always when clicking a lectern
  // This is because we dont want to read the book when locking/unlocking
  if (event.clickedBlock?.type === Material.LECTERN) event.setCancelled(true);
}

function isOpenable(block: Block | null) {
  return block?.blockData instanceof Openable;
}
