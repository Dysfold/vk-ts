import { GameMode, Location, Material } from 'org.bukkit';
import {
  InventoryClickEvent,
  InventoryPickupItemEvent,
} from 'org.bukkit.event.inventory';
import { PlayerAttemptPickupItemEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { dataHolder } from '../common/datas/holder';
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

/**
 * Key for boolean value used to mark items that would normally not be hidden.
 */
const HIDDEN_KEY = 'hidden_item';

/**
 * Checks if an item is hidden. Hidden items should never be obtainable by
 * players. 'Hidden' does not mean 'invisible' in this case.
 * @param item Item to check.
 * @returns If the given item is hidden.
 */
export function isHiddenItem(item: ItemStack | null): boolean {
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
  return dataHolder(item).get(HIDDEN_KEY, 'boolean') == true;
}

/**
 * Makes the given item hidden by setting custom data to it.
 * Beware: the item in question is mutated through its ItemMeta.
 * @param item Item to make hidden.
 * @returns The given item.
 */
export function makeItemHidden(item: ItemStack): ItemStack {
  dataHolder(item).set(HIDDEN_KEY, 'boolean', true);
  return item;
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
    location.world.dropItem(location, item);
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
