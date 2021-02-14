import { Material } from 'org.bukkit';
import { Horse } from 'org.bukkit.entity';
import {
  InventoryAction,
  InventoryClickEvent,
  InventoryDragEvent,
} from 'org.bukkit.event.inventory';
import { ItemStack } from 'org.bukkit.inventory';

/**
 * Golden horse armors and leather horse armors are used for custom items
 * and can't be userd as regular horse armor
 */

export const COLORABLE_MATERIAL = Material.LEATHER_HORSE_ARMOR;
export const NOSTACK_MATERIAL = Material.LEATHER_HORSE_ARMOR;

const HORSE_ARMOR_SLOT = 1;

function isHorseArmorCustomItem(item: ItemStack | null) {
  if (!item) return false;
  if (item.type === COLORABLE_MATERIAL && item.itemMeta.hasCustomModelData())
    return true;
  if (item.type === NOSTACK_MATERIAL && item.itemMeta.hasCustomModelData())
    return true;
  return false;
}

// Click horse armor to horse armor slot
registerEvent(InventoryClickEvent, (event) => {
  if (!(event.inventory.holder instanceof Horse)) return;
  if (event.slot !== HORSE_ARMOR_SLOT) return;
  if (isHorseArmorCustomItem(event.cursor)) event.setCancelled(true);
});

// Shift click a horse armor to equip or use hotbar button
registerEvent(InventoryClickEvent, (event) => {
  if (event.hotbarButton !== -1) {
    // Player used hotbar button to swap items
    if (event.slot !== HORSE_ARMOR_SLOT) return;
    const swapped = event.whoClicked.inventory.getItem(event.hotbarButton);
    if (isHorseArmorCustomItem(swapped)) {
      event.setCancelled(true);
      return;
    }
  }

  if (!isHorseArmorCustomItem(event.currentItem)) return;
  if (event.action !== InventoryAction.MOVE_TO_OTHER_INVENTORY) return;
  if (!(event.inventory.holder instanceof Horse)) return;
  event.setCancelled(true);
});

// Drag a horse armor to horse armor slot
registerEvent(InventoryDragEvent, (event) => {
  if (!(event.inventory.holder instanceof Horse)) return;
  if (!event.inventorySlots.contains(HORSE_ARMOR_SLOT)) return;
  if (isHorseArmorCustomItem(event.oldCursor)) event.setCancelled(true);
});
