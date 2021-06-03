import { Location, SoundCategory } from 'org.bukkit';
import { ArmorStand, EntityType } from 'org.bukkit.entity';
import { EventPriority } from 'org.bukkit.event';
import {
  EntityDamageByEntityEvent,
  EntityDeathEvent,
} from 'org.bukkit.event.entity';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { EulerAngle } from 'org.bukkit.util';
import { dropVisibleItem } from '../../misc/hidden-items';
import { isHiddenEntity } from './hidden-entity';

function handleDrops(entity: ArmorStand) {
  const eqp = entity.equipment;
  if (eqp) {
    // Drop all equipment that exists and is not hidden
    // Armor stands don't, despite Javadoc, support drop rates for items
    const loc = entity.location;
    dropVisibleItem(eqp.itemInMainHand, loc);
    dropVisibleItem(eqp.itemInOffHand, loc);
    dropVisibleItem(eqp.helmet, loc);
    dropVisibleItem(eqp.chestplate, loc);
    dropVisibleItem(eqp.leggings, loc);
    dropVisibleItem(eqp.boots, loc);
  }
}

/**
 * Spawns item on the ground with armor stand
 * @param loc Clicked location
 * @param item Item to be placed
 */
export function spawnHolderArmorStand(
  loc: Location,
  item: ItemStack,
): ArmorStand {
  const tempLoc = loc.clone();
  tempLoc.y = 1000;
  // Clever hack to make the teleport instant ":)"
  // If the armorstand is ~75 blocks away,
  // the teleportation will not have an animation
  tempLoc.x += 75;
  const armorStand = loc.world.spawnEntity(
    tempLoc,
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  const clone = item.clone();
  clone.amount = 1;
  armorStand.setSilent(true);
  armorStand.setVisible(false);
  armorStand.teleport(loc);
  armorStand.setItem(EquipmentSlot.HEAD, clone);
  armorStand.setCanPickupItems(false);
  armorStand.setCollidable(false);
  armorStand.setSilent(true);
  armorStand.setSmall(true);
  armorStand.setArms(false);
  armorStand.addDisabledSlots(
    EquipmentSlot.HEAD,
    EquipmentSlot.CHEST,
    EquipmentSlot.LEGS,
    EquipmentSlot.FEET,
    EquipmentSlot.HAND,
    EquipmentSlot.OFF_HAND,
  );

  // Prevent texture overlapping
  armorStand.headPose = new EulerAngle(0.005, 0.005, 0.005);

  loc.world.playSound(
    loc,
    'minecraft:block.wood.break',
    SoundCategory.BLOCKS,
    0.5,
    1.3,
  );

  return armorStand;
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
