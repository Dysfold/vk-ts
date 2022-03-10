import { Material, Sound, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import { Door } from 'org.bukkit.block.data.type';
import { Hinge } from 'org.bukkit.block.data.type.Door';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { purgeCustomData } from '../common/blocks/blocks';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { chanceOf } from '../common/helpers/math';
import { VkMaterial } from '../common/items/VkMaterial';

const DOOR_REVEAL_CHANCE = 0.9;
const DOOR_HIDE_CHANCE = 0.9;

const CobblestoneDoor = new CustomBlock({
  type: Material.COBBLESTONE,
  data: {
    hasLeftHinge: yup.bool().required(),
    facing: yup.string().required(),
  },
});
const StoneBrickDoor = new CustomBlock({
  type: Material.STONE_BRICKS,
  data: {
    hasLeftHinge: yup.bool().required(),
    facing: yup.string().required(),
  },
});

const DOORS = new Map([
  [VkMaterial.STONEBRICK_DOOR, StoneBrickDoor],
  [VkMaterial.COBBLESTONE_DOOR, CobblestoneDoor],
]);

const DOOR_TYPES = new Map([
  [Material.STONE_BRICKS, VkMaterial.STONEBRICK_DOOR],
  [Material.COBBLESTONE, VkMaterial.COBBLESTONE_DOOR],
]);

const doorCooldowns = new Set<Player>();

// Hide the door
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.action !== Action.LEFT_CLICK_BLOCK) return;
  const block = event.clickedBlock;
  if (!block) return;
  if (doorCooldowns.has(event.player)) return;
  const secretDoor = DOORS.get(block.type);
  if (!secretDoor) return;
  if (chanceOf(DOOR_HIDE_CHANCE)) return;

  const door = block.blockData as Door;
  let upper: Block;
  let lower: Block;
  if (door.half === Half.TOP) {
    upper = block;
    lower = block.getRelative(BlockFace.DOWN);
  } else {
    upper = block.getRelative(BlockFace.UP);
    lower = block;
  }

  upper.setType(Material.AIR, false);
  lower.setType(Material.AIR, false);
  await wait(1, 'millis');
  secretDoor.create(upper, {
    hasLeftHinge: door.hinge === Hinge.LEFT,
    facing: door.facing.toString(),
  });
  lower.type = upper.type;

  playDoorCloseSound(block);
  doorCooldowns.add(event.player);
  await wait(0.5, 'seconds');
  doorCooldowns.delete(event.player);
});

// Reveal the door
const revealEvent = async (
  event: PlayerInteractEvent,
  data: { hasLeftHinge: boolean; facing: string },
) => {
  if (data.hasLeftHinge === undefined) return;
  if (doorCooldowns.has(event.player)) return;
  if (chanceOf(DOOR_REVEAL_CHANCE)) return;
  if (!event.clickedBlock) return;

  const hinge = data.hasLeftHinge ? Hinge.LEFT : Hinge.RIGHT;
  const block = event.clickedBlock;

  // This deletes the customblock data
  // We don't want to use setBlock, beucause we replace blockdata of the door
  // without updating physics (the door would break otherwise)
  purgeCustomData(block);

  const upper = block;
  const lower = upper.getRelative(BlockFace.DOWN);

  // The door material (Warped or crimson door)
  const type = DOOR_TYPES.get(block.type);
  if (!type) return;

  // Set lower half of the door
  lower.setType(type, false);
  const lowerDoor = lower.blockData as Door;
  lowerDoor.hinge = hinge;
  lowerDoor.half = Half.BOTTOM;
  lowerDoor.facing = BlockFace.valueOf(data.facing);
  lower.blockData = lowerDoor;

  // Set upper half of the door
  upper.setType(type, false);
  const upperDoor = upper.blockData as Door;
  upperDoor.hinge = hinge;
  upperDoor.half = Half.TOP;
  upperDoor.facing = BlockFace.valueOf(data.facing);
  upper.blockData = upperDoor;

  doorCooldowns.add(event.player);
  playDoorRevealSound(block);
  await wait(0.5, 'seconds');
  doorCooldowns.delete(event.player);
};

StoneBrickDoor.onClick('left', revealEvent);
CobblestoneDoor.onClick('left', revealEvent);

// TODO: Better sound for this?
function playDoorCloseSound(block: Block) {
  block.world.playSound(
    block.location.toCenterLocation(),
    Sound.ENTITY_ARMOR_STAND_HIT,
    SoundCategory.BLOCKS,
    1,
    0.6,
  );
}

// TODO: Better sound for this?
async function playDoorRevealSound(block: Block) {
  block.world.playSound(
    block.location.toCenterLocation(),
    Sound.ENTITY_ARMOR_STAND_HIT,
    SoundCategory.BLOCKS,
    1,
    0.7,
  );
  await wait(0.1, 'seconds');
  block.world.playSound(
    block.location.toCenterLocation(),
    Sound.BLOCK_STONE_BREAK,
    SoundCategory.BLOCKS,
    1,
    1,
  );
  await wait(0.1, 'seconds');
  block.world.playSound(
    block.location.toCenterLocation(),
    Sound.ENTITY_ARMOR_STAND_HIT,
    SoundCategory.BLOCKS,
    1,
    0.5,
  );
}
