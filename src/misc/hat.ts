import { GameMode, Material, Sound, SoundCategory } from 'org.bukkit';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { BlockDispenseArmorEvent } from 'org.bukkit.event.block';
import {
  InventoryAction,
  InventoryClickEvent,
  InventoryDragEvent,
  InventoryType,
} from 'org.bukkit.event.inventory';
import {
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { isRightClick } from '../common/helpers/click';
import { VkItem } from '../common/items/VkItem';
import { equipPipe, Pipe } from './pipe';

export const HAT_MATERIAL = VkItem.HAT;
const HELMET_SLOT = 39;
const BOOTS_SLOT = 36;

function isHat(item: ItemStack | null) {
  if (item?.type !== HAT_MATERIAL) return false;
  if (item.itemMeta.hasCustomModelData()) return true;
  return false; // The item was not a custom item
}

// Prevent dispensing a hat to boots-slot
registerEvent(BlockDispenseArmorEvent, (event) => {
  if (!isHat(event.item)) return;
  event.setCancelled(true);
});

// Equip hat with right click
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.item) return;
  if (!isHat(event.item)) return;
  if (!isRightClick(event.action)) return;
  event.setCancelled(true);

  const inventory = event.player.inventory as PlayerInventory;
  if (inventory.helmet) return;

  // Special case for the pipe. (Player might be filling the pipe)
  if (Pipe.check(event.item)) {
    if (!equipPipe(event.player)) {
      return;
    }
  }

  inventory.helmet = event.item;
  event.item.amount = 0;
  playEquipSound(event.player);
});

// Shift click a hat to equip
registerEvent(InventoryClickEvent, (event) => {
  if (!event.currentItem) return;
  if (!isHat(event.currentItem)) return;
  if (event.slot === HELMET_SLOT) return;
  if (event.action !== InventoryAction.MOVE_TO_OTHER_INVENTORY) return;
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
  event.setCancelled(true);
  if (inventory.helmet) return;
  inventory.helmet = event.currentItem;
  event.currentItem.amount = 0;
});

// Drag a hat to helmet slot
registerEvent(InventoryClickEvent, (event) => {
  if (!event.cursor) return;
  if (!isHat(event.cursor)) return;
  if (event.slot === BOOTS_SLOT) {
    // Player tried to place hat to boots slot
    event.setCancelled(true);
    return;
  }
  if (event.slot !== HELMET_SLOT) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
  if (event.action === InventoryAction.NOTHING) {
    // Swap hats by clicking on the slot
    const hat = event.cursor.clone();
    event.cursor = inventory.helmet;
    inventory.helmet = hat;
    event.setCancelled(true);
    return;
  }
  if (event.action !== InventoryAction.PLACE_ALL) return;
  inventory.helmet = event.cursor;
  event.cursor.amount = 0;
  event.setCancelled(true);
});

// Equip a hat for armorstand
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  if (event.hand !== EquipmentSlot.HAND) return;
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ARMOR_STAND) return;
  const inventory = event.player.inventory as PlayerInventory;
  if (!isHat(inventory.itemInMainHand)) return;
  const armorstand = entity as ArmorStand;
  if (armorstand.isInvisible()) return;
  const itemInHand = inventory.itemInMainHand.clone() as ItemStack;
  inventory.itemInMainHand = armorstand.helmet;
  armorstand.helmet = itemInHand;
  event.setCancelled(true);
  playEquipSound(event.player);

  // Creative players do not lose item when placing it on armorstand
  if (event.player.gameMode === GameMode.CREATIVE) {
    if (inventory.itemInMainHand.type === Material.AIR) {
      inventory.itemInMainHand = armorstand.helmet;
    }
  }
});

function playEquipSound(player: Player) {
  player.world.playSound(
    player.location,
    Sound.ITEM_ARMOR_EQUIP_LEATHER,
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

// Prevent hat equipping with hotbar buttons
registerEvent(InventoryClickEvent, (event) => {
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  if (event.hotbarButton !== -1) {
    if (event.slot !== BOOTS_SLOT) return;
    const swapped = event.whoClicked.inventory.getItem(event.hotbarButton);
    if (isHat(swapped)) {
      event.setCancelled(true);
      return;
    }
  }
});

// Drag a hat to boots slot
registerEvent(InventoryDragEvent, (event) => {
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  if (!event.inventorySlots.contains(BOOTS_SLOT)) return;
  if (isHat(event.oldCursor)) event.setCancelled(true);
});
