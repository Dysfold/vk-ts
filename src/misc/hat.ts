import { GameMode, Material, SoundCategory } from 'org.bukkit';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  InventoryAction,
  InventoryClickEvent,
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

const HAT_MATERIAL = Material.DIAMOND_HOE;
const HELMET_SLOT = 39;

// Equip hat with right click
registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== HAT_MATERIAL) return;
  if (
    event.action !== Action.RIGHT_CLICK_AIR &&
    event.action !== Action.RIGHT_CLICK_BLOCK
  ) {
    return;
  }
  const inventory = event.player.inventory as PlayerInventory;
  if (inventory.helmet) return;
  inventory.helmet = event.item;
  event.item.amount = 0;
  playEquipSound(event.player);
});

// Shift click a hat to equip
registerEvent(InventoryClickEvent, (event) => {
  if (event.currentItem?.type !== HAT_MATERIAL) return;
  if (event.action !== InventoryAction.MOVE_TO_OTHER_INVENTORY) return;
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
  if (inventory.helmet) return;
  inventory.helmet = event.currentItem;
  event.currentItem.amount = 0;
  event.setCancelled(true);
});

// Drag a hat to helmet slot
registerEvent(InventoryClickEvent, (event) => {
  if (event.cursor?.type !== HAT_MATERIAL) return;
  if (event.action !== InventoryAction.PLACE_ALL) return;
  if (event.slot !== HELMET_SLOT) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
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
  if (inventory.itemInMainHand.type !== HAT_MATERIAL) return;
  const itemInHand = inventory.itemInMainHand.clone() as ItemStack;
  const armorstand = entity as ArmorStand;
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
    'minecraft:item.armor.equip_leather',
    SoundCategory.PLAYERS,
    1,
    1,
  );
}