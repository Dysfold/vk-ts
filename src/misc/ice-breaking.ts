import { PlayerJumpEvent } from 'com.destroystokyo.paper.event.player';
import { Bukkit, Material, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Ageable } from 'org.bukkit.block.data';
import { Entity, FallingBlock, Player } from 'org.bukkit.entity';
import {
  EntityChangeBlockEvent,
  EntityDamageEvent,
} from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { Vector } from 'org.bukkit.util';
import { chanceOf } from '../common/helpers/math';

// Materials list
const materials = [
  Material.ICE,
  Material.FROSTED_ICE,
  Material.FROSTED_ICE,
  Material.FROSTED_ICE,
];

const IceBreakChance = {
  SNEAKING: 0.02,
  WALKING: 0.08,
  SPRINTING: 0.15,
  JUMP_LANDING: 0.15,
  FALL_DAMAGE_LANDING: 0.9,
};

function getBlockBelow(entity: Entity | Player) {
  return entity.location.block.getRelative(BlockFace.DOWN);
}

const BREAKABLE_ICE_MATERIALS = new Set([
  Material.ICE,
  Material.PACKED_ICE,
  Material.FROSTED_ICE,
]);

function isIce(material: Material) {
  return BREAKABLE_ICE_MATERIALS.has(material);
}

registerEvent(PlayerJumpEvent, async (event) => {
  const blockBelow = getBlockBelow(event.player);
  if (!isIce(blockBelow.type)) return;

  // Chance for the ice to play sound when jumping on ice
  if (chanceOf(0.05)) {
    playCrackSound(event.player.location.block);
  }

  if (!chanceOf(IceBreakChance.JUMP_LANDING)) return;

  // Waiting for the player to be on ground
  await wait(12, 'ticks');

  playIceBreakSound(blockBelow);
  const breakRadius = Math.floor(2 + Math.random() * 4.3);
  const landingBlock = getBlockBelow(event.player);
  breakIce(landingBlock, breakRadius);
});

registerEvent(EntityDamageEvent, (event) => {
  if (event.cause !== DamageCause.FALL) return;
  const blockBelow = getBlockBelow(event.entity);
  if (!chanceOf(IceBreakChance.FALL_DAMAGE_LANDING)) return;
  if (!isIce(blockBelow.type)) return;

  const radius = Math.min(5, Math.ceil(1.5 * event.damage));
  breakIce(blockBelow, radius);
});

function breakIce(ice: Block, radius: number) {
  playCrackSound(ice);

  const iceStength = 0.2 + 0.8 * Math.random();

  const droppable: Block[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      const block = ice.getRelative(x, 0.0, z);
      if (!isIce(block.type)) continue;

      // Compare against squared radius to check that point is inside circle
      if (x * x + z * z > radius * radius) continue;
      const index = Math.floor(Math.random() * materials.length);
      const material = materials[index];

      // If the material from the list is Frosted Ice set the age
      if (material == Material.FROSTED_ICE) {
        const ageable = material.createBlockData() as Ageable;
        ageable.age = Math.ceil(Math.random() * 3);
        block.blockData = ageable;
      } else {
        // This needs to be here to prevent weird interaction with frosted ice
        block.type = material;
      }

      if (material.isSolid()) {
        if (!chanceOf(iceStength)) {
          droppable.push(block);
        }
      }
    }
  }
  dropIceBlocks(droppable);
}

const ICE_CHECK_INTERVAL_SEC = 10;
setInterval(() => {
  for (const player of Bukkit.onlinePlayers) {
    const blockBelow = getBlockBelow(player);
    if (!isIce(blockBelow.type)) continue;
    if (player.velocity.length() < 0.1) continue;
    if (!player.isOnGround()) continue;
    const breakChance = getIceBreakChance(player);
    if (!chanceOf(breakChance)) continue;
    breakIce(blockBelow, 3);
  }
}, ICE_CHECK_INTERVAL_SEC * 1000);

function getIceBreakChance(player: Player) {
  if (player.isSneaking()) return IceBreakChance.SNEAKING;
  if (player.isSprinting()) return IceBreakChance.SPRINTING;
  return IceBreakChance.WALKING;
}

// Drop selected ice blocks as falling blocks
async function dropIceBlocks(blocks: Block[]) {
  blocks.forEach(async (block) => {
    spawnFallingIce(block);
    block.type = Material.WATER;
  });
}

function spawnFallingIce(block: Block) {
  block.type = Material.WATER;
  const fallingBlock = block.world.spawnFallingBlock(
    block.location.add(0.5, 0, 0.5),
    Material.ICE.createBlockData(),
  );
  fallingBlock.setDropItem(false);
  fallingBlock.velocity = new Vector(0, 0.3 * Math.random(), 0);
}

function playCrackSound(block: Block) {
  block.world.playSound(
    block.location,
    'custom.ice_crack_long',
    SoundCategory.BLOCKS,
    1,
    0.6 + 0.6 * Math.random(),
  );
}

// Sound when ice is actually broken
function playIceBreakSound(block: Block) {
  block.world.playSound(
    block.location,
    'block.glass.break',
    SoundCategory.BLOCKS,
    1,
    0.74,
  );
}

// Destroy ice falling blokcs
registerEvent(EntityChangeBlockEvent, (event) => {
  if (event.entity instanceof FallingBlock) {
    const block = event.entity;
    if (isIce(block.blockData.material)) {
      event.setCancelled(true);
      block.remove();
    }
  }
});
