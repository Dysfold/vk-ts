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
