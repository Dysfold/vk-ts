import { GameMode, Location, Material } from 'org.bukkit';
import {
  InventoryClickEvent,
  InventoryPickupItemEvent,
} from 'org.bukkit.event.inventory';
import { PlayerAttemptPickupItemEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { chanceOf } from '../common/helpers/math';

/**
 * Prevent players from getting heart of the sea -items
 * because they are reserved for hidden or forbidden items.
 */
export const HIDDEN_MATERIAL = Material.HEART_OF_THE_SEA;
/**
 * Colorable custom items are in leather horse armor and
 * colorable items with modelId >= 1000, are reserved for hidden or forbidden items
 */
import { COLORABLE_MATERIAL } from './horse-armor-items';

export function isHiddenItem(item: ItemStack | null) {
  if (!item) return false;

  // Check if default hidden item
  if (item.type === HIDDEN_MATERIAL) return true;

  if (item.type === COLORABLE_MATERIAL) {
    // Check if normal horse armor
    if (!item.itemMeta.hasCustomModelData()) return false;

    // Check if normal colorable custom item
    if (item.itemMeta.customModelData < 1000) return false;

    // Hidden colorable customitem
    return true;
  }
  return false;
}

/**
 * Drops an item if it exists, is not hidden and we are lucky.
 * @param item The item to drop.
 * @param location Location where to drop the item.
 * @param chance Chance of dropping the item, mainly for armor stands.
 */
export function dropVisibleItem(
  item: ItemStack | null,
  location: Location,
  chance = 1,
) {
  if (item && !item.type.isEmpty() && !isHiddenItem(item) && chanceOf(chance)) {
    location.world.dropItemNaturally(location, item);
  }
}

registerEvent(PlayerAttemptPickupItemEvent, (event) => {
  if (!isHiddenItem(event.item.itemStack)) return;
  event.setCancelled(true);
});

// Delete the item if hopper picks it up
registerEvent(InventoryPickupItemEvent, (event) => {
  if (!isHiddenItem(event.item.itemStack)) return;
  event.item.itemStack.amount = 0;
});

// Delete the item if player clicks it in inventory
registerEvent(InventoryClickEvent, (event) => {
  if (event.whoClicked.gameMode === GameMode.CREATIVE) return;
  if (isHiddenItem(event.cursor)) event.cursor = null;
  if (isHiddenItem(event.currentItem)) event.currentItem = null;
});
