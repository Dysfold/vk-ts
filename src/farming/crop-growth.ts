import { Location, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { BlockGrowEvent } from 'org.bukkit.event.block';
import { VkMaterial } from '../common/items/VkMaterial';

const COLD_TEMP = 0.2; // Less than 0.15 will be snowy
const COOL_TEMP = 0.5;
const WARM_TEMP = 0.89;
const HOT_TEMP = 0.95; // Greater than 0.95 will be dry biome (savanna etc), jungles are 0.85-0.95

// Yeast has its own growth rates and is not affected by location
const YEAST_MATERIAL = VkMaterial.WHITE_MUSHROOM;
const YEAST_GROWTH_RATE = 0.05;
const YEAST_LIGHT_LEVEL = 3;
const YEAST_WATER_RADIUS = 3;

const ZONES = {
  northern: {
    min: -2000,
    optimal: -1000,
    max: 0,
  },
  normal: {
    min: -1000,
    optimal: 0,
    max: 2000,
  },
  tropical: {
    min: -200,
    optimal: 1000,
    max: 3000,
  },
};

registerEvent(BlockGrowEvent, (event) => {
  const block = event.block;
  let cancelled = false;
  const temperature = block.temperature;
  let chance = 0;

  switch (block.type) {
    case Material.WHEAT:
    case Material.BEETROOTS:
    case Material.CARROTS:
    case Material.POTATOES:
    case Material.PUMPKIN_STEM:
      // Normal climate
      if (temperature > WARM_TEMP) cancelled = true;
      if (temperature < COLD_TEMP) cancelled = true;
      chance = calculateSuccess(block.z, ZONES.normal);
      if (chanceOf(chance)) cancelled = true;
      break;

    case Material.MELON_STEM:
    case Material.COCOA:
      // Tropical climate
      if (temperature > HOT_TEMP) cancelled = true;
      if (temperature < COOL_TEMP) cancelled = true;
      chance = calculateSuccess(block.z, ZONES.tropical);
      if (chanceOf(chance)) cancelled = true;
      break;

    case Material.SWEET_BERRY_BUSH:
      chance = calculateSuccess(block.z, ZONES.northern);
      if (chanceOf(chance)) cancelled = true;
      break;
  }
  event.setCancelled(cancelled);
});

// Special conditions for yeast
registerEvent(BlockGrowEvent, (event) => {
  const block = event.block;
  if (block.type !== YEAST_MATERIAL) return;

  if (block.lightLevel > YEAST_LIGHT_LEVEL) {
    event.setCancelled(true);
    block.type = Material.DEAD_BUSH; // TODO: Maybe use different block because dead bush breaks after blockupdate?
    return;
  }
  // Slow down the growth
  if (!chanceOf(YEAST_GROWTH_RATE)) {
    event.setCancelled(true);
    return;
  }

  if (!hasWaterNearby(block.location, YEAST_WATER_RADIUS)) {
    event.setCancelled(true);
    event.block.getRelative(BlockFace.DOWN).type = Material.COARSE_DIRT;
  }
});

// Check if there is water within the radius
function hasWaterNearby(location: Location, r: number) {
  const x = location.x;
  const y = location.y;
  const z = location.z;
  for (let xi = x - r; xi <= location.x + r; xi++) {
    for (let zi = z - r; zi <= z + r; zi++) {
      const material = location.world.getBlockAt(xi, y - 1, zi).type;
      if (material === Material.WATER) {
        return true;
      }
    }
  }
  return false;
}

// Returns probability of growth at given z
function calculateSuccess(
  z: number,
  zone: { min: number; optimal: number; max: number },
) {
  // Linear scaling based on z
  // returns 0 when near min and goes linearly to 1, when reaching optimal
  // And then linearlly decreases back to 0, when reaching max
  if (z > zone.optimal) {
    // Min-max scaling
    // Optimal returns 1, and max 0
    return 1 - (z - zone.optimal) / (zone.max - zone.optimal);
  } else {
    // Min-max scaling
    // Optimal returns 1, and min 0
    return (z - zone.min) / (zone.optimal - zone.min);
  }
}

function chanceOf(x: number) {
  return Math.random() > x;
}
