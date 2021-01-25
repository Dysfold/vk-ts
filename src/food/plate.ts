import { Bukkit, Location, Material, Particle } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import {
  PlayerInteractEntityEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { playDrinkingEffects } from '../hydration/hydrate';
import { FoodInfo } from './FoodInfo';

registerEvent(PlayerInteractEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  if (entity.facing !== BlockFace.UP) return;
  const itemframe = entity as ItemFrame;

  const item = itemframe.item as ItemStack;
  if (!item) return;

  const type = item.type;
  const player = event.player;
  if (player.isSneaking()) return;

  // Eating
  if (type.isEdible()) {
    event.setCancelled(true);

    const food = FoodInfo.get(type);
    if (!food) {
      return;
    }

    const maxFoodLevel = 20;
    player.foodLevel = Math.min(
      player.foodLevel + food.foodPoints,
      maxFoodLevel,
    );

    const maxSaturation = Math.min(player.foodLevel, 20); // Max saturation is always equal to players foodlevel
    player.saturation = Math.min(
      player.saturation + food.saturation,
      maxSaturation,
    );

    const consumeEvent = new PlayerItemConsumeEvent(player, item);
    Bukkit.server.pluginManager.callEvent(consumeEvent);

    // Empty the plate
    itemframe.item = food.result || new ItemStack(Material.AIR);

    playEatingEffects(itemframe.location, item);
  }

  // Drinking
  else if (type === Material.POTION) {
    event.setCancelled(true);
    const drinkEvent = new PlayerItemConsumeEvent(player, item);
    Bukkit.server.pluginManager.callEvent(drinkEvent);
    playDrinkingEffects(player);

    // Empty the bottle
    item.type = Material.GLASS_BOTTLE;
    itemframe.item = item;
  }
});

async function playEatingEffects(location: Location, item: ItemStack) {
  location = location.add(0, 0.15, 0);
  for (let i = 0; i < 4; i++) {
    location.world.playSound(location, 'minecraft:entity.generic.eat', 1, 1);

    for (let particles = 0; particles < 5; particles++) {
      location.world.spawnParticle(
        Particle.ITEM_CRACK,
        location,
        0,
        (Math.random() - 0.5) * 0.1,
        0.1,
        (Math.random() - 0.5) * 0.1,
        item,
      );
    }

    await wait(240, 'millis');
  }
}
