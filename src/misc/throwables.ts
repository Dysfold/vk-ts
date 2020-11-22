import { Material, Sound } from 'org.bukkit';
import { EntityType, Snowball } from 'org.bukkit.entity';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import { PlayerDropItemEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';

const VELOCITY_MULTIPLIER = 0.8;
const THROW_SOUND = Sound.ENTITY_SNOWBALL_THROW;
const HIT_SOUND = Sound.BLOCK_STONE_HIT;

const notThrowable: Material[] = [
  Material.SNOWBALL,
  Material.SPLASH_POTION,
  Material.HEART_OF_THE_SEA,
];

registerEvent(PlayerDropItemEvent, (event) => {
  const player = event.player;
  const item = event.itemDrop.itemStack;
  const itemType = item.type;

  if (player.velocity.y < 0.08) return; // Return if player didn't jump
  if (notThrowable.includes(itemType)) return;

  event.setCancelled(true);
  item.setAmount(item.amount - 1);

  const snowball = player.world.spawnEntity(
    player.location.add(0, 1.4, 0),
    EntityType.SNOWBALL,
  ) as Snowball;

  snowball.setItem(new ItemStack(itemType, 1));
  snowball.setVelocity(
    player.eyeLocation.direction.multiply(VELOCITY_MULTIPLIER),
  );
  player.world.playSound(player.location, THROW_SOUND, 0.5, 1);
});

registerEvent(ProjectileHitEvent, (event) => {
  if (event.entity.type !== EntityType.SNOWBALL) return;
  const snowball = event.entity as Snowball;
  if (notThrowable.includes(snowball.item.type)) return;

  event.entity.world.dropItem(event.entity.location, snowball.item);
  event.entity.world.playSound(event.entity.location, HIT_SOUND, 0.5, 1);
});
