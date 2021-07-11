import { Material } from 'org.bukkit';
import {
  InventoryClickEvent,
  PrepareAnvilEvent,
} from 'org.bukkit.event.inventory';
import { AnvilInventory, ItemStack } from 'org.bukkit.inventory';
import { playKeyRenameSound } from '../locks/helpers/sounds';
import { createLockItem, LockItem } from '../locks/lock-items';
import { createKey, Key } from './key';

const RESULT_SLOT = 2;

/******************************************************
 * Use anvil to copy a code to locks and other keys etc
 ******************************************************/

/**
 * Copy the code from the first item (key)
 * to the second item (lock, key, handcuff etc)
 */
registerEvent(PrepareAnvilEvent, (event) => {
  const inv = event.inventory;
  const { firstItem, secondItem } = inv;
  if (firstItem == null) return;
  if (secondItem == null) return;

  if (!isKey(firstItem)) return;

  // Copy the code to a key
  if (isKey(secondItem)) {
    const data = Key.get(firstItem);
    event.result = createKey(data?.code);
    event.result.amount = secondItem.amount;
  }

  // Copy the code to a lock
  else if (isLock(secondItem)) {
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
    if (firstItem === null) return;
    if (secondItem === null) return;
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
      playKeyRenameSound(soundLocation);
    }
  }
});

function isKey(item: ItemStack) {
  if (!item) return false;
  return Key.check(item);
}

function isLock(item: ItemStack) {
  if (!item) return false;
  return LockItem.check(item);
}
