import { Float } from 'java.lang';
import { Location, Material, Sound, SoundCategory } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { Vector } from 'org.bukkit.util';

const COLLAPSE_CHECK_CHANCE = 1;

const STONES = [
  Material.STONE,
  Material.DIORITE,
  Material.GRANITE,
  Material.ANDESITE,
];

const COLLAPSE_RADIUS = 10;
const SUPPORT_RADIUS = 6;
const SUPPORTS = [
  Material.ACACIA_LOG,
  Material.BIRCH_LOG,
  Material.DARK_OAK_LOG,
  Material.JUNGLE_LOG,
  Material.OAK_LOG,
  Material.SPRUCE_LOG,
  Material.STRIPPED_ACACIA_LOG,
  Material.STRIPPED_BIRCH_LOG,
  Material.STRIPPED_DARK_OAK_LOG,
  Material.STRIPPED_JUNGLE_LOG,
  Material.STRIPPED_OAK_LOG,
  Material.STRIPPED_SPRUCE_LOG,
];

registerEvent(BlockBreakEvent, (event) => {
  if (event.player.itemInHand.type === Material.AIR) return;
  const block = event.block;

  // We only collapse underground mines
  if (block.lightFromSky !== 0) return;
  if (STONES.indexOf(block.type) === -1) return;
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
        const material = world.getBlockAt(i, y + j, k).type;
        if (SUPPORTS.indexOf(material) !== -1) {
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
    if (STONES.indexOf(block.type) !== -1) {
      block.setType(Material.AIR);
      const fallingBlock = block.world.spawnFallingBlock(
        block.location.add(0.5, 0.5, 0.5),
        Material.COBBLESTONE,
        0,
      );
      fallingBlock.setHurtEntities(true);
      fallingBlock.setDropItem(false);
      fallingBlock.velocity = new Vector();
    }
  }
}

async function shake(player: Player) {
  const directions = [new Vector(0.1, 0, 0.1), new Vector(-0.1, 0, -0.1)];

  for (let i = 0; i < 15; i++) {
    player.setVelocity(player.velocity.add(directions[i % directions.length]));
    await wait(10 * i, 'millis');
  }
  return;
}

function playSound(location: Location) {
  location.world.playSound(
    location,
    //'minecraft:item.totem.use',
    'minecraft:entity.wither.death',
    //'minecraft:block.chorus_flower.death',
    0.5,
    (new Float(0.2) as unknown) as number,
  );
}
