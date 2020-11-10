import { Material } from 'org.bukkit';
import { Attribute } from 'org.bukkit.attribute';
import {
  AbstractHorse,
  Donkey,
  EntityType,
  Horse,
  Mule,
  Player,
} from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { CustomItem } from '../common/items/CustomItem';

const MAX_DISTANCE = 4;
const MIN_DISTANCE = 2;
const HORSE_MAX_SPEED = 0.3375;
const MULTIPLIER = 8;

const Spear = new CustomItem({
  id: 7,
  name: 'Keihäs',
  type: Material.IRON_HOE,
  modelId: 7,
});

registerEvent(EntityDamageByEntityEvent, (event) => {
  const damager = event.damager;
  if (!damager) return;
  if (damager.type !== EntityType.PLAYER) return;
  const attacker = damager as Player;

  const item = attacker.itemInHand;
  if (!item) return;
  if (!Spear.check(item)) return;

  // The weapon has cooled down if the value is 1
  if (attacker.attackCooldown < 1) return;

  const target = event.entity;
  if (target.type !== EntityType.PLAYER) return;

  const vehicle = target.vehicle;
  if (!vehicle) return;
  if (!(vehicle instanceof AbstractHorse)) return;

  // Calculate the chance of dropping the enemy
  const distance = attacker.location.distance(target.location);
  const chance1 = 1 - minMaxScale(distance, MIN_DISTANCE, MAX_DISTANCE);
  const chance2 = getSpeed(attacker);
  const total = 1 - Math.pow(1 - chance1 * chance2, MULTIPLIER);
  if (Math.random() > total) return;

  // Drop the target
  vehicle.eject();
});

function getSpeed(player: Player) {
  const vehicle = player.vehicle;

  let speed = 0;
  if (vehicle instanceof AbstractHorse) {
    // Max speed of the horse
    speed =
      vehicle.getAttribute(Attribute.GENERIC_MOVEMENT_SPEED)?.value || speed;
  } else {
    // Max speed of the player (but only 30% effective)
    0.3 * (player.getAttribute(Attribute.GENERIC_MOVEMENT_SPEED)?.value || 0);
  }
  return minMaxScale(speed, 0, HORSE_MAX_SPEED);
}

function minMaxScale(val: number, min: number, max: number) {
  if (val < min) return 0;
  if (val > max) return 1;
  return (val - min) / (max - min);
}
