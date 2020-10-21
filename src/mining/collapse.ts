import { Float } from 'java.lang';
import { Location, Material } from 'org.bukkit';
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

const COLLAPSE_RADIUS = 7;
const SUPPORT_RADIUS = 5;
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
  if (STONES.indexOf(block.type) === -1) return;
  if (Math.random() > COLLAPSE_CHECK_CHANCE) return;

  const location = block.location;
  if (isSupported(location)) return;

  shake(event.player);
  playSound(location);
  playSound(location);
  playSound(location);
  accident(location);
});

function isSupported(location: Location) {
  const world = location.world;
  const x = location.x;
  const y = location.y;
  const z = location.z;
  for (let i = x - SUPPORT_RADIUS; i < location.x + SUPPORT_RADIUS; i++) {
    for (let j = z - SUPPORT_RADIUS; j < z + SUPPORT_RADIUS; j++) {
      const material = world.getBlockAt(i, y, j).type;
      if (SUPPORTS.indexOf(material) !== -1) {
        // The mine was supported
        server.broadcastMessage('supported');
        return true;
      }
    }
  }
  return false;
}

// Collapse large area of stone
function accident(location: Location) {
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
      fallingBlock.velocity = new Vector();
    }
  }
}

async function shake(player: Player) {
  const directions = [new Vector(0.1, 0, 0.1), new Vector(-0.1, 0, -0.1)];

  let count = 0;
  const shaking = setInterval(() => {
    player.setVelocity(player.velocity.add(directions[count % 2]));
    if (count++ > 12) {
      clearInterval(shaking);
    }
  }, 40);
  return;
}

function playSound(location: Location) {
  location.world.playSound(
    location,
    //'minecraft:item.totem.use',
    //'minecraft:entity.wither.death',
    'minecraft:block.chorus_flower.death',
    2,
    (new Float(0.3) as unknown) as number,
  );
  // GraalJS float handling is weird, need to explicitly "cast"
  // And of course, TS types don't know that (yet)
}
