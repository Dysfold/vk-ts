import { GameMode, Location, Material, Sound, SoundCategory } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { Vector } from 'org.bukkit.util';

const COLLAPSE_CHECK_CHANCE = 0.1;

const STONES = new Set([
  Material.STONE,
  Material.DIORITE,
  Material.GRANITE,
  Material.ANDESITE,
]);

function isStone(type: Material) {
  return STONES.has(type);
}

function canFall(type: Material) {
  if (type.toString().includes('_SLAB')) return true;
  if (type.toString().includes('_STAIRS')) return true;
  return false;
}

const COLLAPSE_RADIUS = 10;
const SUPPORT_RADIUS = 6;

function isSupport(type: Material) {
  const str = type.toString();
  return str.includes('_LOG') || str.includes('_WOOD');
}

registerEvent(BlockBreakEvent, (event) => {
  const block = event.block;

  if (event.player.gameMode === GameMode.CREATIVE) return;
  // We only collapse underground mines
  if (event.player.location.block.lightFromSky !== 0) return;
  // Breaking a stone or a support block can cause the mine to collapse
  if (!isStone(block.type) && !isSupport(block.type)) return;
  if (Math.random() > COLLAPSE_CHECK_CHANCE) return;

  const location = block.location;
  if (isSupported(location)) return;

  shake(event.player);
  playSound(location);
  collapseCave(location);
});

function isSupported(location: Location) {
  const world = location.world;
  const x = location.x;
  const y = location.y;
  const z = location.z;
  for (let i = x - SUPPORT_RADIUS; i < location.x + SUPPORT_RADIUS; i++) {
    for (let j = -1; j < 1; j++) {
      for (let k = z - SUPPORT_RADIUS; k < z + SUPPORT_RADIUS; k++) {
        if (i === x && j === 0 && k === z) {
          // This was the block we broke. No need to check it.
          continue;
        }
        const material = world.getBlockAt(i, y + j, k).type;
        if (isSupport(material)) {
          // The mine was supported
          return true;
        }
      }
    }
  }
  return false;
}

// Collapse large area of stone
function collapseCave(location: Location) {
  const world = location.world;
  const x = location.x;
  const y = location.y;
  const z = location.z;

  // Select blocks which are air
  for (let i = -COLLAPSE_RADIUS; i < COLLAPSE_RADIUS; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = -COLLAPSE_RADIUS; k < COLLAPSE_RADIUS; k++) {
        const distance = Math.sqrt(i * i + k * k);
        if (distance > COLLAPSE_RADIUS) continue;

        const block = world.getBlockAt(x + i, y - j, z + k);
        const material = block.type;
        if (material.isAir() || !material.isSolid()) {
          collapse(block);
        }
      }
    }
  }
}

// Collapse 1x1 pillar of stone
function collapse(air: Block) {
  const location = air.location;
  const height = 1 + Math.floor(Math.random() * 6);
  for (let i = 1; i < height; i++) {
    location.add(0, 1, 0);

    const block = location.block;
    const type = block.type;
    if (isStone(type)) {
      block.type = Material.AIR;
      const fallingBlock = block.world.spawnFallingBlock(
        block.location.add(0.5, 0.5, 0.5),
        Material.COBBLESTONE,
        0,
      );
      fallingBlock.setHurtEntities(true);
      fallingBlock.setDropItem(false);
      fallingBlock.velocity = new Vector();
    }

    // Player placed blocks which can fall
    else if (canFall(type)) {
      block.type = Material.AIR;
      const fallingBlock = block.world.spawnFallingBlock(
        block.location.add(0.5, 0.5, 0.5),
        type,
        0,
      );
      fallingBlock.setHurtEntities(true);
      fallingBlock.velocity = new Vector();
    }
  }
}

async function shake(player: Player) {
  const directions = [new Vector(0.1, 0, 0.1), new Vector(-0.1, 0, -0.1)];

  for (let i = 0; i < 15; i++) {
    player.velocity = player.velocity.add(directions[i % directions.length]);
    await wait(10 * i, 'millis');
  }
  return;
}

function playSound(location: Location) {
  location.world.playSound(
    location,
    Sound.ENTITY_WITHER_DEATH,
    // Alternative sounds
    //'minecraft:item.totem.use',
    //'minecraft:block.chorus_flower.death',
    SoundCategory.BLOCKS,
    0.5,
    0.2,
  );
}
