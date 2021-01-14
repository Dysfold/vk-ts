import { Material } from 'org.bukkit';
import { EntityType, Item, LivingEntity } from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { PlayerFishEvent } from 'org.bukkit.event.player';
import { Vector } from 'org.bukkit.util';

const FISHES = new Map([
  [Material.COD, EntityType.COD],
  [Material.SALMON, EntityType.SALMON],
  [Material.TROPICAL_FISH, EntityType.TROPICAL_FISH],
  [Material.PUFFERFISH, EntityType.PUFFERFISH],
]);

const FISH_ENTITIES = new Set(FISHES.values());

// Replace fished item with fish entity
registerEvent(PlayerFishEvent, async (event) => {
  const caught = event.caught;
  if (!(caught instanceof Item)) return;

  const fishEntity = FISHES.get(caught.itemStack.type);
  if (!fishEntity) return;

  const fish = caught.world.spawnEntity(
    caught.location.add(0, 1, 0),
    fishEntity,
  );

  // We don't need the itemstack anymore
  caught.remove();

  // Give the fish enought velocity to reach the player
  const diff = event.player.location
    .toVector()
    .subtract(fish.location.toVector());

  // Custom multiplier to make the velocity right
  const power = Math.sqrt(Math.min(16, Math.max(10, diff.length()))) / 30;
  const upwardsForce = new Vector(0, 5, 0);
  const velocity = diff.add(upwardsForce).multiply(power);
  fish.velocity = velocity;
});

// Make fish harder to kill when it is in water
registerEvent(EntityDamageByEntityEvent, async (event) => {
  if (!FISH_ENTITIES.has(event.entityType)) return;
  if (event.damager.type !== EntityType.PLAYER) return;

  const fish = event.entity as LivingEntity;
  if (fish.isInWater()) {
    event.damage = Math.min(0.2 * event.damage, 0.2 * fish.maxHealth);
    fishEscape(fish);
  }
});

// Give the fish a boost
async function fishEscape(fish: LivingEntity) {
  let direction = fish.location.direction.multiply(1.5);
  for (let i = 0; i < 5; i++) {
    fish.velocity = direction;
    direction = direction.rotateAroundY(Math.random() - 0.5);
    await wait(0.3, 'seconds');
    if (!fish.isInWater()) return;
  }
}
