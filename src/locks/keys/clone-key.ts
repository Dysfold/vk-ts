import { Bukkit, Location, SoundCategory, Material } from 'org.bukkit';
import {
  InventoryClickEvent,
  PrepareAnvilEvent,
} from 'org.bukkit.event.inventory';
import { AnvilInventory, ItemStack } from 'org.bukkit.inventory';
import { createLockItem, LockItem } from '../locks/lock-items';
import { createKey, Key } from './key';

const RESULT_SLOT = 2;

/**
 * Copy the code from the first item (key)
 * to the second item (lock, key, handcuff etc)
 */
registerEvent(PrepareAnvilEvent, (event) => {
  const inv = event.inventory;
  const { firstItem, secondItem } = inv;

  if (!isKey(firstItem)) return;

  // Copy the code to a key
  if (isKey(secondItem)) {
    const data = Key.get(firstItem);
    event.result = createKey(data?.code);
    event.result.amount = secondItem.amount;
  }

  // Copy the code to a lock
  if (isLock(secondItem)) {
    const data = Key.get(firstItem);
    event.result = createLockItem(data?.code);
    event.result.amount = secondItem.amount;
  }
});

/**
 * Take the copied item from the result slot
 */
registerEvent(InventoryClickEvent, (event) => {
  if (event.clickedInventory instanceof AnvilInventory) {
    const inv = event.clickedInventory;
    const { firstItem, secondItem } = inv;
    if (!isKey(firstItem)) return;
    if (event.slot != RESULT_SLOT) return;
    if (event.cursor?.type !== Material.AIR) return;

    if (isKey(secondItem) || isLock(secondItem)) {
      // Take the item from the anvil
      const result = inv.result;
      if (!result) return;

      event.cursor = result.clone();
      result.amount = 0;
      secondItem.amount = 0;

      const soundLocation = inv.location ?? event.whoClicked.location;
      playAnvilSound(soundLocation);
    }
  }
});

function isKey(item: ItemStack | null): item is ItemStack {
  if (!item) return false;
  return Key.check(item);
}

function isLock(item: ItemStack | null): item is ItemStack {
  if (!item) return false;
  return LockItem.check(item);
}

function playAnvilSound(location: Location) {
  location.world.playSound(
    location,
    'minecraft:block.anvil.use',
    SoundCategory.BLOCKS,
    1,
    1,
  );
}
