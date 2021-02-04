import { Entity, EntityType } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';

/**
 * TODO: Minimum damage
 * TODO: Increase bleeding when more damage is caused
 * 
 * TODO: makeEntityBleed() is probably going to be used globally
 */

type TimerCallback = (time: number) => void; // Callback type for the timer

/**
 * General purpose timer. Counts in seconds
 */
class CountDownTimer {
  duration: number = 0;

  /**
   * Timer status
   */
  isDead(): boolean {
    return this.duration < 1;
  }

  /**
   * Create a new timer instance
   * @param duration timer duration in seconds
   * @param callback callback function that provides remaining time
   */
  constructor(duration: number, callback: TimerCallback) {
    this.duration = duration;

    const handle = setInterval(() => {
      callback(this.duration);
      if (this.duration-- < 1) clearInterval(handle);
    }, 1000);
  }
}

const timers = new Map<number, CountDownTimer>(); // store active timers

/**
 * Make entity bleed for given time
 * @param entity
 * @param duration in seconds
 * @param severity control bleeding amount
 */
function makeEntityBleed(entity: Entity, duration: number, severity: number) {
  if (timers.has(entity.entityId)) {
    // Increase bleeding duration if entity is hurt again
    timers.get(entity.entityId)!.duration += 2.0;
  } else {
    // Create new timer
    timers.set(
      entity.entityId,
      new CountDownTimer(duration, (time) => {
        bleed(time, entity, severity);
      }),
    );

    // Check inactive timers in 10 second intervals
    const handle = setInterval(() => {
      if (timers.get(entity.entityId)!.isDead()) {
        timers.delete(entity.entityId);
        clearInterval(handle);
      }
    }, 1000 * 10);
  }
}

/**
 * Damage entity, play particles and throw blood everywhere
 * @param time time left in seconds
 * @param entity
 * @param severity
 */
function bleed(time: number, entity: Entity, severity: number) {
  entity.sendMessage("You're bleeding for " + time + ' second(s)');
}

registerEvent(EntityDamageEvent, (event) => {
  if (event.entityType == EntityType.PLAYER) {
    makeEntityBleed(event.entity, 5.0, 1.0);

    /*
    switch (event.cause) {
      case DamageCause.CUSTOM ||
        DamageCause.PROJECTILE ||
        DamageCause.ENTITY_ATTACK:
        break;
      default:
        return;
    }
    */
  }
});
