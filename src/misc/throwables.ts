import { Material, Sound, SoundCategory } from 'org.bukkit';
import { EntityType, Snowball } from 'org.bukkit.entity';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import { PlayerDropItemEvent } from 'org.bukkit.event.player';
import { Vector } from 'org.bukkit.util';
import { LockedHandcuffs } from '../combat/handcuffs';
import { Whip } from '../combat/whip';
import { CustomItem } from '../common/items/CustomItem';

const VELOCITY_MULTIPLIER = 0.8;
const THROW_SOUND = Sound.ENTITY_SNOWBALL_THROW;
const HIT_SOUND = Sound.BLOCK_STONE_HIT;
const ZERO_VECTOR = new Vector();

const NOT_THROWABLE: Material[] = [
  Material.SNOWBALL,
  Material.SPLASH_POTION,
  Material.HEART_OF_THE_SEA,
];

const NOT_THROWABLE_CUSTOMITEMS = [LockedHandcuffs, Whip];

registerEvent(PlayerDropItemEvent, (event) => {
  const player = event.player;
  const item = event.itemDrop.itemStack;
  const itemType = item.type;

  if (player.velocity.y < 0.08) return; // Return if player didn't jump
  if (NOT_THROWABLE.includes(itemType)) return;
  // Check if item was unthrowable customitem
  if (NOT_THROWABLE_CUSTOMITEMS.some((i) => i.check(item))) return;

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
});

registerEvent(ProjectileHitEvent, (event) => {
  if (event.entity.type !== EntityType.SNOWBALL) return;
  const snowball = event.entity as Snowball;
  if (NOT_THROWABLE.includes(snowball.item.type)) return;

  const drop = event.entity.world.dropItem(
    event.entity.location,
    snowball.item,
  );
  drop.velocity = ZERO_VECTOR; // Remove random velocity from the dropped item
  drop.world.playSound(drop.location, HIT_SOUND, SoundCategory.PLAYERS, 0.5, 1);
});
