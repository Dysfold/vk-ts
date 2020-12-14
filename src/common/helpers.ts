import { Action } from 'org.bukkit.event.block';
import { Player } from 'org.bukkit.entity';
import {
  ItemStack,
  EquipmentSlot,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';

/**
 * @param chance Chance of success. 0-1
 * @returns True of false based on the chance.
 */
export function chanceOf(chance: number) {
  return Math.random() < chance;
}

/**
 * @param action Action of the click event.
 * @returns True of false.
 */
export function isLeftClick(action: Action) {
  return action === Action.LEFT_CLICK_AIR || action === Action.LEFT_CLICK_BLOCK;
}

/**
 * @param action Action of the click event.
 * @returns True of false.
 */
export function isRightClick(action: Action) {
  return (
    action === Action.RIGHT_CLICK_AIR || action === Action.RIGHT_CLICK_BLOCK
  );
}

/**
 * Gives item to the player or drops it on the ground, if the inventory is full.
 * @param player The player to whom the item is given
 * @param item ItemStack to be given
 * @param hand Prioritized hand
 */
export function giveItem(
  player: Player,
  item: ItemStack,
  hand?: EquipmentSlot,
) {
  if (item.type === Material.AIR) return;
  const inventory = player.inventory as PlayerInventory;

  // Prioritice players current hand
  // OffHand
  if (hand === EquipmentSlot.OFF_HAND) {
    if (inventory.itemInOffHand.type.isEmpty()) {
      inventory.itemInOffHand = item;
      return;
    }
  }
  // MainHand (default)
  else {
    if (inventory.itemInMainHand.type.isEmpty()) {
      inventory.itemInMainHand = item;
      return;
    }
  }

  // We can't place the item on the hand. Try to add the item to inventory
  const leftOver = inventory.addItem(item);

  // Drop leftover on the ground
  if (leftOver.size()) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}
