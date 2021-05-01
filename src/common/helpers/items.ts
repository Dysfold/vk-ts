import { Sound, SoundCategory, Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { Damageable, ItemMeta } from 'org.bukkit.inventory.meta';
import { TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { translate, text } from 'craftjs-plugin/chat';

/**
 * Damages flint and steel, breaks item if max damage is reached.
 * @param player Player who used flint and steel
 * @param item Flint and steel
 */
export function useFlintAndSteel(player: Player, item: ItemStack) {
  const meta = (item.itemMeta as unknown) as Damageable;
  meta.damage++;
  item.itemMeta = (meta as unknown) as ItemMeta;

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
 * Tries to get translated name of the item or the display name
 */
export function getItemName(item: ItemStack) {
  if (!item.itemMeta.hasDisplayName()) {
    const key = item.type.translationKey;

    // For some reason
    // spigot gives "item.minecraft..." instead of "block.minecraft..."
    if (item.type.isBlock()) {
      return translate(key.replace('item', 'block'));
    }
    return translate(key);
  }

  const components = item.itemMeta.displayNameComponent;
  for (const component of components) {
    // Check if the name is the original name
    if (component instanceof TranslatableComponent) {
      return component;
    }
  }
  return text(item.itemMeta.displayName);
}
