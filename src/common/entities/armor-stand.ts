import { ArmorStand } from 'org.bukkit.entity';
import { EventPriority } from 'org.bukkit.event';
import {
  EntityDamageByEntityEvent,
  EntityDeathEvent,
} from 'org.bukkit.event.entity';
import { dropVisibleItem } from '../../misc/hidden-items';
import { isHiddenEntity } from './hidden-entity';

function handleDrops(entity: ArmorStand) {
  const eqp = entity.equipment;
  if (eqp) {
    // Drop all equipment that exists and is not hidden
    // (and respect the drop chances)
    const loc = entity.location;
    dropVisibleItem(eqp.itemInMainHand, loc, eqp.itemInMainHandDropChance);
    dropVisibleItem(eqp.itemInOffHand, loc, eqp.itemInOffHandDropChance);
    dropVisibleItem(eqp.helmet, loc, eqp.helmetDropChance);
    dropVisibleItem(eqp.chestplate, loc, eqp.chestplateDropChance);
    dropVisibleItem(eqp.leggings, loc, eqp.leggingsDropChance);
    dropVisibleItem(eqp.boots, loc, eqp.bootsDropChance);
  }
}

// Destroy hidden armor stands when they take damage
// To avoid this, make the armor stands invulnerable or cancel this
// before event priority HIGH
registerEvent(
  EntityDamageByEntityEvent,
  (event) => {
    const entity = event.entity;
    if (!isHiddenEntity(entity)) return;
    if (!(entity instanceof ArmorStand)) return;

    // Remove and don't drop an armor stand
    event.setCancelled(true);
    entity.remove();
    handleDrops(entity);
  },
  {
    priority: EventPriority.HIGH,
  },
);

// If hidden armor stands die without taking damage from entities
// => handle drops the same way
registerEvent(
  EntityDeathEvent,
  (event) => {
    const entity = event.entity;
    if (!isHiddenEntity(entity)) return;
    if (!(entity instanceof ArmorStand)) return;

    // Remove and don't drop an armor stand
    event.setCancelled(true); // Also mutes death sound
    entity.remove();
    handleDrops(entity);
  },
  {
    priority: EventPriority.HIGH,
  },
);
