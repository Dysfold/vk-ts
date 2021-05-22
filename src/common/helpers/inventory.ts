import { Entity, Player } from 'org.bukkit.entity';
import {
  ItemStack,
  EquipmentSlot,
  PlayerInventory,
  Inventory,
  BlockInventoryHolder,
} from 'org.bukkit.inventory';
import { Material, SoundCategory } from 'org.bukkit';
import { Vector } from 'org.bukkit.util';

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
  // MainHand
  if (hand === EquipmentSlot.HAND) {
    if (inventory.itemInMainHand.type.isEmpty()) {
      inventory.itemInMainHand = item;
      return;
    }
  }

  // We can't place the item on the hand. Try to add the item to inventory
  const leftOver = inventory.addItem(item);

  // Drop leftover on the ground
  if (leftOver.size() > 0) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}

/**
 * Adds an item to inventory or drops it on the ground, if the inventory is full.
 * @param inventory The inventory where the item is placed
 * @param item ItemStack to be given
 */
export function addItemTo(inventory: Inventory, item: ItemStack) {
  if (item.type === Material.AIR) return;

  // We can't place the item on the hand. Try to add the item to inventory
  const leftOver = inventory.addItem(item);

  // Drop leftover on the ground
  if (leftOver.size()) {
    const isBlock = inventory.holder instanceof BlockInventoryHolder;
    const location = isBlock
      ? inventory.location?.add(0.5, 1.2, 0.5)
      : inventory.location;

    // The location should always exist unless we are adding items to some kind of virtual inventory
    // In that case more checks will be needed or we need to get the location with some other way (maybe additional argument)
    if (!location) {
      log.error('Inventory is not found!');
      return;
    }

    const drop = location.world.dropItem(location, leftOver.get(0));

    // If the inventory holder is a block, drop the item with very little velocity -> more cleaner drop
    if (isBlock) {
      drop.velocity = new Vector(0, 0.2, 0);
    }

    location.world.playSound(
      location,
      'minecraft:entity.chicken.egg',
      SoundCategory.NEUTRAL,
      1,
      0.9,
    );
  }
}

/**
 * Gets the currently equipped item in given slot. Note that currently only
 * players are supported - for all other entities, null is always returned.
 * @param entity Entity to get equipment from.
 * @param slot Equipment slot.
 * @returns An equipped item or null.
 */
export function equippedItem(
  entity: Entity,
  slot: EquipmentSlot,
): ItemStack | null {
  if (entity instanceof Player) {
    return entity.inventory.getItem(slot);
  }
  return null;
}
