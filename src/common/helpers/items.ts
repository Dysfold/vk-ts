import { translate } from 'craftjs-plugin/chat';
import { Component } from 'net.kyori.adventure.text';
import { Sound, SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { Damageable, ItemMeta } from 'org.bukkit.inventory.meta';

/**
 * Damages flint and steel, breaks item if max damage is reached.
 * @param player Player who used flint and steel
 * @param item Flint and steel
 */
export function useFlintAndSteel(player: Player, item: ItemStack) {
  const meta = item.itemMeta as unknown as Damageable;
  meta.damage++;
  item.itemMeta = meta as unknown as ItemMeta;

  // Check if the tools breaks. 64 -> broken item
  if (meta.damage >= 64) {
    item.amount = 0;
    player.world.playSound(
      player.location,
      Sound.ENTITY_ITEM_BREAK,
      SoundCategory.PLAYERS,
      1,
      1,
    );
  }
}

/**
 * Gets display name or translation of an item for shop usage.
 * @param item The item.
 * @returns Player-provided display name, or the default translatable name.
 */
export function getItemNameAsComponent(item: ItemStack): Component {
  const meta = item.itemMeta;
  if (!meta.hasDisplayName()) {
    const key = item.type.translationKey;
    // For some reason
    // spigot gives "item.minecraft..." instead of "block.minecraft..."
    if (item.type.isBlock()) {
      return translate(key.replace('item', 'block'));
    }
    return translate(key);
  }
  const name = meta.displayName();
  if (!name) {
    throw new Error('display name should exist');
  }
  return name;
}

/**
 * Gets display name of an item.
 * @param item The item.
 * @returns Display name component
 */
export function getDisplayName(item: ItemStack) {
  if (item.itemMeta.hasDisplayName()) {
    return item.itemMeta.displayName();
  }
  return null;
}
