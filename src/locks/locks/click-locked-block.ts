import { Location, SoundCategory, Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Openable } from 'org.bukkit.block.data';
import { Player } from 'org.bukkit.entity';
import {
  PlayerInteractEvent,
  PlayerTakeLecternBookEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { t } from '../../common/localization/localization';
import { Key } from '../keys/key';
import { BlockLock } from './BlockLock';

registerEvent(PlayerInteractEvent, (event) => {
  if (event.isCancelled()) return;
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
  const soundLocation = event.interactionPoint ?? lock.location;

  if (hasRightKey(player, codeInLock)) {
    player.sendActionBar(`§a${t(player, 'lock.unlocking')}`);
    openTheLock(lock, player, event);
    playSetUnlockedSound(soundLocation);
    return;
  }

  // When clicking lectern without correct key, we just open it
  // instead of cancelling it
  if (event.clickedBlock?.type == Material.LECTERN) return;

  event.setCancelled(true);
  player.sendActionBar(`§c${t(player, 'lock.is_locked')}`);
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
    lock.interact();
  }

  // Cancel the event always when clicking a lectern
  // This is because we dont want to read the book when locking/unlocking
  if (event.clickedBlock?.type == Material.LECTERN) event.setCancelled(true);
}

function clickUnlockedBlock(event: PlayerInteractEvent, lock: BlockLock) {
  const player = event.player;
  const codeInLock = lock.getCode();
  const soundLocation = event.interactionPoint ?? lock.location;

  if (hasRightKey(player, codeInLock)) {
    lockTheLock(player, lock, event);
    player.sendActionBar(`§a${t(player, 'lock.locking')}`);
    playSetLockedSound(soundLocation);
    return;
  }

  lock.interact();
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
      lock.interact();
    } else {
      event.setCancelled(true);
    }
  }

  // Cancel the event always when clicking a lectern
  // This is because we dont want to read the book when locking/unlocking
  if (event.clickedBlock?.type == Material.LECTERN) event.setCancelled(true);
}

function isOpenable(block: Block | null) {
  return block?.blockData instanceof Openable;
}

function playSetUnlockedSound(location: Location) {
  location.world.playSound(
    location,
    'custom.lock',
    SoundCategory.PLAYERS,
    0.4,
    1.7,
  );
}

function playSetLockedSound(location: Location) {
  location.world.playSound(
    location,
    'custom.lock',
    SoundCategory.PLAYERS,
    0.4,
    1.1,
  );
}

function playWrongKeySound(location: Location) {
  location.world.playSound(
    location,
    // 'minecraft:block.stone_button.click_on',
    'minecraft:block.iron_trapdoor.open',
    SoundCategory.PLAYERS,
    0.7,
    1.5,
  );
}

registerEvent(PlayerTakeLecternBookEvent, (event) => {
  const lock = BlockLock.getFrom(event.lectern.block);
  if (lock?.isLocked()) {
    event.setCancelled(true);
    playWrongKeySound(event.lectern.location);
    event.player.closeInventory();
  }
});
