import { Bukkit, Location, Material, Particle } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
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
  const itemframe = entity as ItemFrame;

  const item = itemframe.item as ItemStack;
  if (!item) return;

  const type = item.type;
  const player = event.player;
  if (player.isSneaking()) return;

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
    Bukkit.server.pluginManager.callEvent(consumeEvent);

    // Empty the plate
    if (key.toString().includes('STEW')) item.type = Material.BOWL;
    else if (key.toString().includes('SOUP')) item.type = Material.BOWL;
    else if (key === Material.HONEY_BOTTLE) item.type = Material.GLASS_BOTTLE;
    else item.type = Material.AIR;
    itemframe.item = item;

    playEatingEffects(itemframe.location, type);
  }

  // Drinking
  else if (type === Material.POTION) {
    event.setCancelled(true);
    const drinkEvent = new PlayerItemConsumeEvent(player, item);
    Bukkit.server.pluginManager.callEvent(drinkEvent);
    playDrinkingSound(player);

    // Empty the bottle
    item.type = Material.GLASS_BOTTLE;
    itemframe.item = item;
  }
});

async function playEatingEffects(location: Location, material: Material) {
  location = location.add(0, 0.15, 0);
  const data = new ItemStack(material, 1);
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
        data,
      );
    }

    await wait(240, 'millis');
  }
}
