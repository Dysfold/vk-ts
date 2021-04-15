import { Material, Sound, SoundCategory } from 'org.bukkit';
import { Damageable, EntityType, Player, Snowball } from 'org.bukkit.entity';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import { PlayerDropItemEvent } from 'org.bukkit.event.player';
import { Vector } from 'org.bukkit.util';
import { LockedHandcuffs } from '../combat/handcuffs';
import { Whip } from '../combat/whip';

import { canBreak } from '../hydration/bottles';

const VELOCITY_MULTIPLIER = 0.8;
const HIT_DAMAGE = 0.2;
const THROW_SOUND = Sound.ENTITY_SNOWBALL_THROW;
const HIT_SOUND = Sound.BLOCK_STONE_HIT;
const ZERO_VECTOR = new Vector();

const THROW_COOLDOWN = 2; // ticks
const cooldowns = new Set<Player>();

const NOT_THROWABLE = new Set([
  Material.SNOWBALL,
  Material.EGG,
  Material.SPLASH_POTION,
  Material.HEART_OF_THE_SEA,
]);

const NOT_THROWABLE_CUSTOMITEMS = [LockedHandcuffs, Whip];

registerEvent(PlayerDropItemEvent, async (event) => {
  const player = event.player;
  const item = event.itemDrop.itemStack;
  const itemType = item.type;

  if (player.velocity.y < 0.08) return; // Return if player didn't jump
  if (NOT_THROWABLE.has(itemType)) return;
  // Check if item was unthrowable customitem
  if (NOT_THROWABLE_CUSTOMITEMS.some((i) => i.check(item))) return;

  if (cooldowns.has(player)) return; // prevent throwing items while cooldown
  cooldowns.add(player);

  event.setCancelled(true);

  const snowball = player.world.spawnEntity(
    player.location.add(0, 1.4, 0),
    EntityType.SNOWBALL,
  ) as Snowball;

  snowball.item = item;
  snowball.item.amount = 1;
  item.amount--;

  snowball.velocity = player.eyeLocation.direction.multiply(
    VELOCITY_MULTIPLIER,
  );

  player.world.playSound(
    player.location,
    THROW_SOUND,
    SoundCategory.PLAYERS,
    0.5,
    1,
  );

  await wait(THROW_COOLDOWN, 'ticks');
  cooldowns.delete(player);
});

registerEvent(ProjectileHitEvent, (event) => {
  if (event.entity.type !== EntityType.SNOWBALL) return;
  const snowball = event.entity as Snowball;
  const item = snowball.item;
  if (NOT_THROWABLE.has(item.type)) return;

  // Push and damage entity who got hit
  if (event.hitEntity) {
    const damagee = event.hitEntity as Damageable;
    damagee.damage(HIT_DAMAGE);
    const pushVel = new Vector(snowball.velocity.x, 0.5, snowball.velocity.z);
    damagee.velocity = damagee.velocity.add(pushVel.multiply(0.6));
  }

  // Prevent dropping broken bottles -> Breaking handled at breaking-bottles.ts
  if (
    (item.type === Material.POTION || item.type === Material.GLASS_BOTTLE) &&
    canBreak(item)
  )
    return;

  const drop = event.entity.world.dropItem(
    event.entity.location,
    snowball.item,
  );

  drop.velocity = ZERO_VECTOR; // Remove random velocity from the dropped item
  drop.world.playSound(drop.location, HIT_SOUND, SoundCategory.PLAYERS, 0.5, 1);
});
