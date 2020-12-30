import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { ArmorStand, EntityType } from 'org.bukkit.entity';
import { BlockPistonExtendEvent } from 'org.bukkit.event.block';
import { EntityDeathEvent } from 'org.bukkit.event.entity';
import { PlayerInteractAtEntityEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { EulerAngle } from 'org.bukkit.util';

// prettier-ignore
const POSE_X = {
    head:     new EulerAngle(0, 0, 0),
    leftArm:  new EulerAngle(0, 0, -2),
    rightArm: new EulerAngle(0, 0, 2),
    leftLeg:  new EulerAngle(0, 0, -0.5),
    rightLeg: new EulerAngle(0, 0, 0.5),
};
// prettier-ignore
const POSE_HUG = {
  head:     new EulerAngle(0, 0, 0),
  leftArm:  new EulerAngle(-1, 0, -1),
  rightArm: new EulerAngle(-1, 0, 1),
  leftLeg:  new EulerAngle(0, 0, -0.2),
  rightLeg: new EulerAngle(0, 0, 0.2),
};
// prettier-ignore
const POSE_HAND_RAISED = {
    head:     new EulerAngle(0, 0, 0),
    leftArm:  new EulerAngle(-3, 0, 2.5),
    rightArm: new EulerAngle(0, 0, 2.5),
    leftLeg:  new EulerAngle(0, 0, -0.2),
    rightLeg: new EulerAngle(0, 0, -0.2),
  };
// prettier-ignore
const POSE_ZOMBIE = {
    head:     new EulerAngle(0, 0, 0),
    leftArm:  new EulerAngle(-1.57, 0, -1.57),
    rightArm: new EulerAngle(-1.57, 0, 1.57),
    leftLeg:  new EulerAngle(0.1, 0, -0.1),
    rightLeg: new EulerAngle(-0.1, 0, 0.1),
};
// prettier-ignore
const POSE_RUNNING = {
    head:     new EulerAngle(0, 0, 0),
    leftArm:  new EulerAngle(-2, 0, -0.5),
    rightArm: new EulerAngle(1, 0, 0.5),
    leftLeg:  new EulerAngle(1, 0, -0.2),
    rightLeg: new EulerAngle(-1, 0, 0.2),
};
// prettier-ignore
const POSE_STICK = {
    head:     new EulerAngle(1, 0, 0),
    leftArm:  new EulerAngle(3, 0, -3),
    rightArm: new EulerAngle(3, 0, 3),
    leftLeg:  new EulerAngle(3, 0, -3),
    rightLeg: new EulerAngle(3, 0, 3),
};
// prettier-ignore
const POSE_LAUNCH = {
    head:     new EulerAngle(-1, 0, 0),
    leftArm:  new EulerAngle(2, 0, -2),
    rightArm: new EulerAngle(2, 0, 2),
    leftLeg:  new EulerAngle(2, 0, -2),
    rightLeg: new EulerAngle(2, 0, 2),
};
// prettier-ignore
const POSE_SITTING = {
    head:     new EulerAngle(-0.1, 0, 0),
    leftArm:  new EulerAngle(0, 0, -0.1),
    rightArm: new EulerAngle(0, 0, 0.1),
    leftLeg:  new EulerAngle(-1.6, 0, 1.6),
    rightLeg: new EulerAngle(-1.6, 0, -1.6),
};

// prettier-ignore
const POSES = [
    POSE_X,
    POSE_HUG,
    POSE_HAND_RAISED,
    POSE_ZOMBIE,
    POSE_RUNNING,
    POSE_STICK,
    POSE_LAUNCH,
    POSE_SITTING
]

// Change the pose of the armorstand
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ARMOR_STAND) return;
  const inventory = event.player.inventory as PlayerInventory;
  if (!inventory.itemInMainHand.type.isEmpty()) return;
  if (!inventory.itemInOffHand.type.isEmpty()) return;
  const armorstand = entity as ArmorStand;
  if (!canBeChanged(armorstand)) return;
  if (hasItems(armorstand)) return;

  event.setCancelled(true);

  let pose = POSES[Math.floor(Math.random() * POSES.length)];

  // Chance to get completely random pose
  if (Math.random() < 0.2) {
    pose = {
      head: randomEulerAngle(),
      leftArm: randomEulerAngle(),
      rightArm: randomEulerAngle(),
      leftLeg: randomEulerAngle(),
      rightLeg: randomEulerAngle(),
    };
  }

  armorstand.headPose = pose.head;
  armorstand.leftLegPose = pose.leftLeg;
  armorstand.rightLegPose = pose.rightLeg;
  armorstand.leftArmPose = pose.leftArm;
  armorstand.rightArmPose = pose.rightArm;
});

// Add hands for armorstand (Click with a stick)
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ARMOR_STAND) return;
  const inventory = event.player.inventory as PlayerInventory;
  if (inventory.itemInMainHand.type !== Material.STICK) return;
  if (inventory.itemInMainHand.amount < 2) return;
  const armorstand = entity as ArmorStand;
  if (!canBeChanged(armorstand)) return;
  if (hasItems(armorstand)) return;
  inventory.itemInMainHand.amount -= 2;

  event.setCancelled(true);
  armorstand.setArms(true);
});

// Make armorstand small with a piston
registerEvent(BlockPistonExtendEvent, (event) => {
  if (event.direction !== BlockFace.DOWN) return;
  const block = event.block.getRelative(BlockFace.DOWN, 2);
  const location = event.block.location;
  location.add(0.5, 0.5, 0.5);
  const entities = block.world.getNearbyEntities(location, 0.5, 1, 0.5);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;
      if (canBeChanged(armorstand)) {
        armorstand.setSmall(true);
      }
    }
  }
});

// Drop 2 sticks when armorstand with arms dies
const ARM_DROPS = new ItemStack(Material.STICK, 2);
registerEvent(EntityDeathEvent, (event) => {
  if (event.entity.type !== EntityType.ARMOR_STAND) return;
  const armorstand = event.entity as ArmorStand;
  if (armorstand.hasArms()) {
    if (canBeChanged(armorstand)) {
      event.drops.push(ARM_DROPS);
    }
  }
});

function hasItems(armorstand: ArmorStand) {
  return !(
    armorstand.helmet.type.isEmpty() &&
    armorstand.chestplate.type.isEmpty() &&
    armorstand.leggings.type.isEmpty() &&
    armorstand.boots.type.isEmpty() &&
    armorstand.itemInHand.type.isEmpty()
  );
}

// Check if editing the armorstand is allowed.
// Prevent player from changing the pose of armorstands used by other features or plugins
function canBeChanged(armorstand: ArmorStand) {
  if (armorstand.isInvulnerable()) return false;
  if (armorstand.isMarker()) return false;
  if (!armorstand.isVisible()) return false;
  return true;
}

function randomEulerAngle() {
  return new EulerAngle(
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
  );
}
