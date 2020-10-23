import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, Player } from 'org.bukkit.entity';
import {
  PlayerInteractEntityEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { playDrinkingSound } from '../hydration/hydrate';
import { FoodInfo } from './FoodInfo';

registerEvent(PlayerInteractEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  if (entity.facing !== BlockFace.UP) return;
  const itemframe = entity as any;

  const item = itemframe.item as ItemStack;
  if (!item) return;

  const type = item.type;
  const player = event.player;

  // Eating
  if (type.isEdible()) {
    event.setCancelled(true);

    // Black magic, because we can't use FoodInfo.get(type)
    const key = Material.getMaterial(type.toString());
    if (!key) return;

    const value = FoodInfo.get(key);
    if (!value) {
      return;
    }

    const maxFoodLevel = 20;
    player.foodLevel = Math.min(player.foodLevel + value.f, maxFoodLevel);

    const maxSaturation = Math.min(player.foodLevel, 20); // Max saturation is always equal to players foodlevel
    player.saturation = Math.min(player.saturation + value.s, maxSaturation);

    const consumeEvent = new PlayerItemConsumeEvent(player, item);
    server.pluginManager.callEvent(consumeEvent);

    // Empty the plate
    if (key.toString().includes('SOUP')) item.type = Material.BOWL;
    else item.type = Material.AIR;
    itemframe.item = item;

    playEatingSounds(player);
  }

  // Drinking
  else if (type === Material.POTION) {
    event.setCancelled(true);
    const drinkEvent = new PlayerItemConsumeEvent(player, item);
    server.pluginManager.callEvent(drinkEvent);
    playDrinkingSound(player);

    // Empty the bottle
    item.type = Material.GLASS_BOTTLE;
    itemframe.item = item;
  }
});

async function playEatingSounds(player: Player) {
  for (let i = 0; i < 4; i++) {
    player.world.playSound(
      player.location,
      'minecraft:entity.generic.eat',
      1,
      1,
    );
    await wait(240, 'millis');
  }
}
