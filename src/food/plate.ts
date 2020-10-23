import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { hydrate, playDrinkingSound } from '../hydration/hydrate';

registerEvent(PlayerInteractEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  if (entity.facing !== BlockFace.UP) return;
  const itemframe = entity as any;

  const item = itemframe.item as ItemStack;
  if (!item) return;

  const type = item.type;
  const player = event.player;

  if (type === Material.POTION) {
    // Drink the item
    event.setCancelled(true);
    hydrate(player, 0.2, type);
    playDrinkingSound(player);
    item.type = Material.GLASS_BOTTLE;
    itemframe.item = item;
    ////itemframe.item = new ItemStack(Material.GLASS_BOTTLE, 1);
  }
  // TODO: Get saturation and foodlevel change somehow
  //   if (type.isEdible()) {
  //     // Eat the item
  //     event.setCancelled(true);
  //     player.foodLevel += 1;
  //   }
});
