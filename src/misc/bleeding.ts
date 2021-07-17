import { ParticleBuilder } from 'com.destroystokyo.paper';
import { Location, Material, Particle } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import {
  Entity,
  EntityType,
  HumanEntity,
  LivingEntity,
} from 'org.bukkit.entity';
import { EntityDamageEvent, EntityDeathEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { VkMaterial } from '../common/items/VkMaterial';

const TIMER_DELAY = 1000; // timer delay in millis
const PARTICLE_DATA = Material.REDSTONE_BLOCK.createBlockData(); // block data for the blood particle
const PARTICLE_AMOUNT = 5; // amount of particles
const TIME_STEP = 0.7; // control how long the bleeding continues. Higher is faster
const COEFFICIENT = 0.53; // control how intensely the bleeding amount decreases at each step. Lower is faster
const NAUSEA_LIMIT = 0.79; // add nausea if blood loss amount exceeds this value
const NAUSEA_DURATION = 15; // nausea duration in seconds

// worlds where bleeding should be disabled
const WORLD_BLACKLIST = new Set(['Tuonela']);

// list of living entities that should bleed
const ENTITY_WHITELIST = new Set([
  EntityType.CAT,
  EntityType.CHICKEN,
  EntityType.COW,
  EntityType.DOLPHIN,
  EntityType.DONKEY,
  EntityType.DROWNED,
  EntityType.EVOKER,
  EntityType.FOX,
  EntityType.GIANT,
  EntityType.HOGLIN,
  EntityType.HORSE,
  EntityType.HUSK,
  EntityType.ILLUSIONER,
  EntityType.LLAMA,
  EntityType.MULE,
  EntityType.OCELOT,
  EntityType.PANDA,
  EntityType.PARROT,
  EntityType.PIG,
  EntityType.PIGLIN,
  EntityType.PIGLIN_BRUTE,
  EntityType.PILLAGER,
  EntityType.PLAYER,
  EntityType.POLAR_BEAR,
  EntityType.RABBIT,
  EntityType.RAVAGER,
  EntityType.SHEEP,
  EntityType.STRIDER,
  EntityType.TRADER_LLAMA,
  EntityType.TURTLE,
  EntityType.VILLAGER,
  EntityType.WANDERING_TRADER,
  EntityType.VINDICATOR,
  EntityType.WITCH,
  EntityType.WOLF,
  EntityType.ZOGLIN,
  EntityType.ZOMBIE,
  EntityType.ZOMBIE_HORSE,
  EntityType.ZOMBIE_VILLAGER,
  EntityType.ZOMBIFIED_PIGLIN,
]);

class BleedTask {
  private entity: Entity;
  private time = 0.0;

  amount = 0.0; // setpoint for the bleeding amount

  /**
   * Create new bleeding task
   * @param amount initial bleeding amount from the range of 0.0 to 1.0
   */
  constructor(entity: Entity, amount: number) {
    this.entity = entity;
    this.amount = amount;
  }

  /**
   * Start bleeding task
   * @param callback Exit callback
   */
  start(callback: () => void) {
    const handle = setInterval(() => {
      if (this.tick()) {
        this.time += TIME_STEP;
      } else {
        clearInterval(handle);
        callback();
      }
    }, TIMER_DELAY);
  }

  /**
   * Handle timer cycle
   */
  tick() {
    // Spawn blood at exponential rate
    const chance = this.amount * Math.pow(COEFFICIENT, this.time);

    // Spawn particles and blood
    this.spawnBlood(this.entity.location, 1.0, chance);

    // Make player nauseous if loses a lot of blood
    if (this.amount > NAUSEA_LIMIT) {
      this.addConfusion(NAUSEA_DURATION);
    }

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
        block.type = VkMaterial.BLOOD;
        const data = block.blockData as Waterlogged;
        data.setWaterlogged(false);
        block.blockData = data;
      }
    }
  }

  /**
   * Add nausea if a lot of blood is lost
   */
  addConfusion(duration: number) {
    if (this.entity.type == EntityType.PLAYER) {
      const player = this.entity as HumanEntity;
      if (player.hasPotionEffect(PotionEffectType.CONFUSION)) return;
      player.addPotionEffect(
        new PotionEffect(PotionEffectType.CONFUSION, duration * 20, 1),
      );
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
  task = new BleedTask(entity, amount);

  // Register task
  tasks.set(entity.entityId, task);

  // Start task
  task.start(() => {
    // Delete after finishing
    tasks.delete(entity.entityId);
  });
}

registerEvent(EntityDamageEvent, (event) => {
  // Filter cause
  if (
    event.cause !== DamageCause.CUSTOM &&
    event.cause !== DamageCause.PROJECTILE &&
    event.cause !== DamageCause.ENTITY_ATTACK
  )
    return;

  // Filter world
  if (WORLD_BLACKLIST.has(event.entity.world.name)) return;

  // Filter entities
  if (
    !(event.entity instanceof LivingEntity) ||
    !ENTITY_WHITELIST.has(event.entityType)
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
