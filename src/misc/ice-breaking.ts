import { PlayerJumpEvent } from 'com.destroystokyo.paper.event.player';
import { Location, Material, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Ageable } from 'org.bukkit.block.data';
import { FallingBlock, Player } from 'org.bukkit.entity';
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

registerEvent(PlayerJumpEvent, async (event) => {
  if (
    event.player.location.block.getRelative(BlockFace.DOWN).type !==
    Material.ICE
  )
    return;

  // Chance for the ice to play sound when jumping on ice
  if (chanceOf(0.05)) {
    playCrackSound(event.player.location.block);
  }

  // 70% chance for the ice not to break
  if (chanceOf(0.7)) return;

  // Waiting for the player to be on ground
  await wait(12, 'ticks');

  const ice = event.player.location.block.getRelative(BlockFace.DOWN);

  playIceBreakSound(ice);
  breakIce(ice.location, Math.floor(2 + Math.random() * 4.3));
});

registerEvent(EntityDamageEvent, (event) => {
  if (!(event.entity instanceof Player)) return;
  if (event.cause !== DamageCause.FALL) return;
  if (
    event.entity.location.block.getRelative(BlockFace.DOWN).type !==
    Material.ICE
  )
    return;

  // Block under player
  const locBlock = event.entity.location.block.getRelative(BlockFace.DOWN);
  breakIce(locBlock.location, 5);
});

function breakIce(location: Location, radius: number) {
  const ice = location.block;

  if (chanceOf(0.5)) {
    playCrackSound(ice);
  }

  const iceStength = 0.2 + 0.8 * Math.random();

  const droppable: Block[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      const block = ice.getRelative(x, 0.0, z);
      if (block.type !== Material.ICE) continue;

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
    if (block.blockData.material == Material.ICE) {
      if (block.fallDistance > 1) {
        event.setCancelled(true);
        block.remove();
      }
    }
  }
});
