import { ParticleBuilder } from 'com.destroystokyo.paper';
import { AtomicMoveNotSupportedException } from 'java.nio.file';
import { Location, Material, Particle } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import { Entity, EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';

/**
 * Add a bleeding effect for damageable entities by randomly generating blood puddles and splashes around entity
 *
 * Currently implemented features:
 *
 *  - Damage amount is relative to how much and how long entity will bleed
 *  - Bleeding duration and intensity are increased when entity is damaged again while already bleeding
 *  - Bleeding will exponentially decrease
 *  - Armor, clothing etc... will reduce bleeding amount
 *
 * @author Juffel
 */

const TIMER_DELAY = 1000; // timer delay in millia
const BLOOD_MATERIAL = Material.DEAD_BUBBLE_CORAL_FAN; // blood material
const PARTICLE_DATA = Material.REDSTONE_BLOCK.createBlockData(); // block data for the blood particle
const PARTICLE_AMOUNT = 5; // amount of particles

// entities that don't bleed
const ENTITY_BLACKLIST = [
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
];

const TIME_STEP = 0.5; // control how long the bleeding continues
const COEFFICIENT = 0.72; // control how intensely the bleeding amount decreases at each step

class BleedTask {
  private entity: Entity;
  private amount_actual = 0.0;

  amount = 0.0; // setpoint for the bleeding amount

  /**
   * Create a bleeding effect for given entity
   * @param amount Amount of blood spillage
   * @param callback Exit callback
   */
  constructor(
    entity: Entity,
    amount: number,
    callback: (error: Error) => void,
  ) {
    this.entity = entity;
    this.amount = amount;

    let time_step = 0.0;

    const handle = setInterval(() => {
      try {
        this.tick(time_step);

        time_step += TIME_STEP;

        // Trigger timer to exit when bleeding stops or entity dies
        if (this.amount_actual <= 0.1 || this.entity.isDead()) throw undefined;
      } catch (error) {
        clearInterval(handle);
        callback(error);
      }
    }, TIMER_DELAY);
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
   * @param radius Distance from the location outwards
   * @param probability Probability of a puddle to form
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

  /**
   * Handle timer cycle
   */
  tick(time_step: number) {
    // Spawn blood at exponential rate
    this.amount_actual = this.amount * Math.pow(COEFFICIENT, time_step);

    this.spawnBlood(this.entity.location, 1.0, this.amount_actual);
  }
}

// Active tasks by entity id
const tasks = new Map<number, BleedTask>();

function getTask(entity: Entity): BleedTask | undefined {
  return tasks.get(entity.entityId);
}

/**
 * Create, or continue a bleed task
 * @param entity Preferably a living target
 * @param amount Amount of blood spillage
 */
function createBleedTask(entity: Entity, amount: number) {
  let task = getTask(entity);

  // Increase bleeding amount of a existing task
  if (task) {
    task.amount += amount;

    return;
  }

  // Create a new task
  task = new BleedTask(entity, amount, (error: Error) => {
    if (error) {
      log.error('[misc/bleeding] timer terminated with an error: ${error}');
    }

    tasks.delete(entity.entityId);
  });

  tasks.set(entity.entityId, task);
}

registerEvent(EntityDamageEvent, (event) => {
  // Filter entities
  if (
    !(event.entity instanceof LivingEntity) ||
    ENTITY_BLACKLIST.includes(event.entityType)
  )
    return;

  // Filter cause
  if (
    event.cause != DamageCause.CUSTOM &&
    event.cause != DamageCause.PROJECTILE &&
    event.cause != DamageCause.ENTITY_ATTACK
  )
    return;

  // Create or continue bleed task on entity
  // Damage is divided by 20 to get the estimated bleeding amount
  // Final damage is used to reduce bleeding for entities that, for example, wear armor or clothing
  createBleedTask(event.entity, event.finalDamage / 20.0);
});
