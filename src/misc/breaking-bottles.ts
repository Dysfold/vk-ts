import { Material, Particle, Sound } from 'org.bukkit';
import { Damageable, Item, Snowball } from 'org.bukkit.entity';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import { PlayerDropItemEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { PotionMeta } from 'org.bukkit.inventory.meta';
import { Location } from 'org.bukkit';
import { Vector } from 'org.bukkit.util';

// Materials for different colored potion particles
const particles: Record<string, Material> = {
  FIRE_RESISTANCE: Material.YELLOW_WOOL,
  SLOW_FALLING: Material.WHITE_WOOL,
  STRENGTH: Material.RED_WOOL,
};

const BREAK_VELOCITY = 0.12;
const HIT_DAMAGE = 0.2;

/**
 *  Plays bottle break sound and particles at location of dropped bottle
 * @param drop Dropped bottle
 */
function playBottleBreakEffects(loc: Location, item: ItemStack) {
  const meta = item.itemMeta as PotionMeta;
  const type = meta.basePotionData ? meta.basePotionData.type : null;

  const itemParticle = (type && particles[`${type}`]) || null;
  const waterParticle = item.type === Material.POTION;

  loc.world.playSound(loc, Sound.BLOCK_GLASS_BREAK, 1, 1);

  // Default broken glass particle
  loc.world.spawnParticle(Particle.ITEM_CRACK, loc, 8, 0.3, 0.5, 0.3, 0, item);

  // Special potion particle (If potion has been assigned extra material for color)
  if (itemParticle) {
    loc.world.spawnParticle(
      Particle.ITEM_CRACK,
      loc,
      8,
      0.2,
      0.5,
      0.2,
      0,
      new ItemStack(itemParticle),
    );
  }

  // Water splash particle (If bottle isn't empty)
  if (waterParticle) {
    loc.world.spawnParticle(Particle.WATER_SPLASH, loc, 10, 0.2, 0.5, 0.2, 0);
  }
}

/**
 * Checks if dropped bottle has hit the ground and breaks the
 * bottle if hit velocity is high enough
 * @param drop Dropped bottle
 */
async function breakAfterFall(drop: Item) {
  let previousY = drop.velocity.y;
  let currentVel = 0;
  await wait(100, 'millis'); // Wait for bottle to move before checks

  while (drop && drop.velocity.y < previousY) {
    previousY = drop.velocity.y;
    currentVel = drop.velocity.lengthSquared();
    await wait(100, 'millis');
  }

  // Bottle hit ground
  if (currentVel >= BREAK_VELOCITY) {
    playBottleBreakEffects(drop.location, drop.itemStack);
    // Damage and push entities that got hit by the bottle
    const entities = drop.getNearbyEntities(0.5, 0.5, 0.5);
    for (const entity of entities) {
      if (entity instanceof Damageable) {
        const damagee = entity as Damageable;
        damagee.damage(HIT_DAMAGE);
        const pushVel = new Vector(drop.velocity.x, 0.5, drop.velocity.z);
        damagee.velocity = damagee.velocity.add(pushVel.multiply(0.6));
      }
    }
    drop.remove();
  }
}

registerEvent(PlayerDropItemEvent, (event) => {
  const drop = event.itemDrop;
  const item = drop.itemStack;

  if (item.type !== Material.POTION && item.type !== Material.GLASS_BOTTLE)
    return;

  breakAfterFall(drop);
});

registerEvent(ProjectileHitEvent, (event) => {
  if (!(event.entity instanceof Snowball)) return;
  const snowball = event.entity as Snowball;
  const item = snowball.item;

  if (item.type !== Material.POTION && item.type !== Material.GLASS_BOTTLE)
    return;

  playBottleBreakEffects(snowball.location, item);
  item.type = Material.AIR;
});
