import { ParticleBuilder } from 'com.destroystokyo.paper';
import { Location, Material, Particle } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import { Entity, EntityType, LivingEntity } from 'org.bukkit.entity';
import { EntityDamageEvent, EntityDeathEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';

/**
 * Adds a bleeding effect for damageable entities by randomly generating blood puddles and splashes around entity
 *
 * Currently implemented features:
 *
 * - Damage amount and health determine how much the entity bleeds
 * - Injured entities bleed more violently when damaged again
 * - Bleeding exponentially decreases if not injured
 * - Armor, clothing etc... will affect bleeding amount
 * - It is now possible to determine entity health just by looking how much they bleed
 *
 * @author Juffel
 */

const TIMER_DELAY = 1000; // timer delay in millis
const BLOOD_MATERIAL = Material.DEAD_BUBBLE_CORAL_FAN; // blood material
const PARTICLE_DATA = Material.REDSTONE_BLOCK.createBlockData(); // block data for the blood particle
const PARTICLE_AMOUNT = 5; // amount of particles

// list of living entities that don't bleed
const ENTITY_BLACKLIST = new Set([
  EntityType.CREEPER,
  EntityType.SKELETON,
  EntityType.SPIDER,
  EntityType.CAVE_SPIDER,
  EntityType.ENDERMAN,
  EntityType.SLIME,
  EntityType.SHULKER,
  EntityType.GHAST,
  EntityType.STRAY,
  EntityType.VEX,
  EntityType.TROPICAL_FISH,
  EntityType.PUFFERFISH,
  EntityType.SQUID,
]);

const TIME_STEP = 0.5; // control how long the bleeding continues
const COEFFICIENT = 0.69; // control how intensely the bleeding amount decreases at each step

class BleedTask {
  private entity: Entity;
  private time = 0.0;

  amount = 0.0; // setpoint for the bleeding amount

  /**
   * Create a bleeding effect for given entity
   * @param amount initial bleeding amount from the range of 0.0 to 1.0
   * @param callback Exit callback
   */
  constructor(
    entity: Entity,
    amount: number,
    callback: (error: Error) => void,
  ) {
    this.entity = entity;
    this.amount = amount;

    const handle = setInterval(() => {
      try {
        if (!this.tick()) throw undefined;

        this.time += TIME_STEP;
      } catch (error) {
        clearInterval(handle);
        callback(error);
      }
    }, TIMER_DELAY);
  }

  /**
   * Handle timer cycle
   */
  tick() {
    // Spawn blood at exponential rate
    const chance = this.amount * Math.pow(COEFFICIENT, this.time);

    this.spawnBlood(this.entity.location, 1.0, chance);

    // Stop task if entity either stops bleeding, dies or is removed
    return chance > 0.1 && this.entity.isValid();
  }

  /**
   * Increases bleeding amount and duration
   * @param amount from the range of 0.0 to 1.0
   */
  extend(amount: number) {
    // Cap value to 1.0
    this.amount = Math.max(0.0, Math.min(this.amount + amount, 1.0));

    this.time = 0.0;
  }

  /**
   * Spawn blood particles at location.
   *
   * * Note that this method relies on Paper API
   */
  spawnBloodParticles(location: Location, count: number) {
    new ParticleBuilder(Particle.BLOCK_DUST)
      .location(location)
      .data(PARTICLE_DATA)
      .count(count)
      .spawn();
  }

  /**
   * Spawn blood puddles and splashes
   * @param radius blood spawn radius from the entity outwards
   * @param probability
   */
  spawnBlood(location: Location, radius: number, probability: number) {
    const origin = location.block;

    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        if (Math.random() > probability) continue;

        // Compare against squared radius to check that point is inside circle
        if (x * x + z * z > radius * radius) continue;

        // Splatter blood
        this.spawnBloodParticles(
          location.clone().add(0.0, 0.8, 0.0),
          PARTICLE_AMOUNT,
        );

        const block = origin.getRelative(x, 0.0, z);

        // Check that block and location is valid
        if (
          !block.type.isAir() ||
          !block.getRelative(BlockFace.UP).type.isAir() ||
          !block.getRelative(BlockFace.DOWN).type.isOccluding()
        )
          return;

        // Form a puddle
        block.type = BLOOD_MATERIAL;
        const data = block.blockData as Waterlogged;
        data.setWaterlogged(false);
        block.blockData = data;
      }
    }
  }
}

// Active tasks by entity id
const tasks = new Map<number, BleedTask>();

/**
 * Sets entity bleeding or extends bleeding duration and amount
 * @param entity
 * @param amount from the range of 0.0 to 1.0
 */
function setBleeding(entity: Entity, amount: number) {
  let task = tasks.get(entity.entityId);

  if (task) {
    // Increase bleeding amount and duration
    task.extend(amount);

    return;
  }

  // Create a new task
  task = new BleedTask(entity, amount, (error: Error) => {
    if (error) {
      log.error('[misc/bleeding] timer terminated with an error: ' + error);
    }

    tasks.delete(entity.entityId);
  });

  tasks.set(entity.entityId, task);
}

registerEvent(EntityDamageEvent, (event) => {
  // Filter cause
  if (
    event.cause !== DamageCause.CUSTOM &&
    event.cause !== DamageCause.PROJECTILE &&
    event.cause !== DamageCause.ENTITY_ATTACK
  )
    return;

  // Filter entities
  if (
    !(event.entity instanceof LivingEntity) ||
    ENTITY_BLACKLIST.has(event.entityType)
  )
    return;

  setBleeding(event.entity, event.finalDamage / event.entity.health);
});

/**
 * Stop bleeding when player dies
 * Even though bleeding should stop when !entity.isValid(), there could still be situations where player respawns between timer cycles and death is not registered
 */
registerEvent(EntityDeathEvent, (event) => {
  if (event.entityType === EntityType.PLAYER) {
    const task = tasks.get(event.entity.entityId);

    if (task) {
      task.amount = 0.0;
    }
  }
});
