import { Location, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import { Damageable, EntityType } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';

/**
 * Creates a bleeding effect for given entity
 */
class BleedTask {
  private entity: Damageable;
  public duration = 0.0;
  public severity = 0.0;

  constructor(
    entity: Damageable,
    duration: number,
    severity: number,
    callback: (error: Error) => void,
  ) {
    this.entity = entity;
    this.duration = duration;
    this.severity = severity;

    const handle = setInterval(() => {
      try {
        // Tick
        this.bleed();

        // Trigger timer to exit
        if (this.duration-- < 1) throw undefined;
      } catch (error) {
        // Shutdown timer
        clearInterval(handle);
        callback(error);
      }
    }, 1000);
  }

  /**
   * Spawn blood around given location
   */
  spawnBlood(location: Location, radius: number, chance: number) {
    const origin = location.block;

    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        // Randomly splutter blood
        if (Math.random() > chance) continue;

        // Compare against squared radius to check that point is inside circle
        if (x * x + z * z > radius * radius) continue;

        const block = origin.getRelative(x, 0.0, z);

        // Check that block is valid
        if (
          !block.type.isAir() ||
          !block.getRelative(BlockFace.UP).type.isAir() ||
          !block.getRelative(BlockFace.DOWN).type.isOccluding()
        )
          return;

        // Place blood
        block.type = Material.DEAD_BUBBLE_CORAL_FAN;
        const data = block.blockData as Waterlogged;
        data.setWaterlogged(false);
        block.blockData = data;
      }
    }
  }

  /**
   * Handle tick
   * 
   * TODO: Decrease bloodloss; if (severity > min) severity-=0.1...
   */
  bleed() {
    this.entity.sendMessage(
      'You are bleeding for ' +
        this.duration +
        ' seconds at a rate of ' +
        Math.fround(this.severity),
    );

    this.spawnBlood(this.entity.location, 1.0, this.severity);
  }
}

// Store active tasks by entity id
const tasks = new Map<number, BleedTask>();

/**
 * Causes entity to bleed for a given time
 * @param entity Damageable entity
 * @param duration Duration in seconds
 * @param severity Blood amount in the range of 0.0 to 1.0
 */
function startEntityBleed(
  entity: Damageable,
  duration: number,
  severity: number,
) {
  if (
    tasks.has(entity.entityId) &&
    tasks.get(entity.entityId)!.duration > 0.0
  ) {
    // Increase duration and severity if entity is damaged again while bleeding
    const task = tasks.get(entity.entityId);
    task!.duration += 1.0;
    task!.severity += 0.1;
  } else {
    // Create new task for entity
    tasks.set(
      entity.entityId,
      new BleedTask(entity, duration, severity, (error: Error) => {
        if (error) {
          log.error('[misc/bleeding] timer terminated with an error: ' + error);
        }

        // Remove task
        tasks.delete(entity.entityId);
      }),
    );
  }
}

registerEvent(EntityDamageEvent, (event) => {
  if (event.entityType == EntityType.PLAYER) {
    switch (event.cause) {
      case DamageCause.CUSTOM:
      case DamageCause.PROJECTILE:
      case DamageCause.ENTITY_ATTACK:
        startEntityBleed(
          event.entity as Damageable,
          3.0,
          event.finalDamage / 12.0,
        );
        break;
      default:
        return;
    }
  }
});
