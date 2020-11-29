import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Fire } from 'org.bukkit.block.data.type';
import { BlockBurnEvent, BlockSpreadEvent } from 'org.bukkit.event.block';

const MAX_FIRE_AGE = 15; // CANNOT BE MORE THAN 15 IN VANILLA -> Errors
const VERTICAL_MULTIPLIER = 0.98;
const HORIZONTAL_MULTIPLIER = 0.3;
const OLD_EXTINGUISH_CHANCE = 0.75; // Fires might not extinguish completely if below 1-HORIZONTAL_MULTIPLIER

const FIREPLACE_BLOCKS = [Material.COAL_BLOCK, Material.MAGMA_BLOCK];

const chanceOf = (percent: number) => Math.random() < percent;

function addAge(fire: Block) {
  if (fire.type !== Material.FIRE) return;
  const fireData = fire.blockData as Fire;
  if (fireData.age + 1 >= MAX_FIRE_AGE) {
    fireData.age = MAX_FIRE_AGE;
  } else {
    fireData.age++;
  }
  fire.blockData = fireData;
}

function getAge(fire: Block): number {
  const fireData = fire.blockData as Fire;
  return fireData.age;
}

function cancelFireSpreadByChance(source: Block, dirMod: number): boolean {
  // Increase chance of canceling spread based on age of fire
  if (getAge(source) <= 1) {
    if (chanceOf(1 * dirMod)) return true; // Very young fire should spread slowly -> Higher chance of canceling spread
  } else if (getAge(source) <= 5) {
    if (chanceOf(0.8 * dirMod)) return true;
  } else if (getAge(source) <= 13) {
    if (chanceOf(0.9 * dirMod)) return true;
  } else {
    if (chanceOf(OLD_EXTINGUISH_CHANCE)) source.type = Material.AIR;
    if (chanceOf(1 * dirMod)) return true;
  }
  addAge(source);
  return false;
}

registerEvent(BlockSpreadEvent, (event) => {
  const source = event.source;
  const spreadLoc = event.block.location;

  if (source.type !== Material.FIRE) return;

  // Cancel spread from fireplace blocks
  const ignitionPointMaterial = source.location.add(0, -1, 0).block.type;
  if (FIREPLACE_BLOCKS.includes(ignitionPointMaterial)) {
    event.setCancelled(true);
    return;
  }

  // Fire spread horizontally
  if (Math.abs(spreadLoc.blockY - source.y) <= 1) {
    event.setCancelled(cancelFireSpreadByChance(source, HORIZONTAL_MULTIPLIER));
    return;
  }

  // Fire spread vertically
  event.setCancelled(cancelFireSpreadByChance(source, VERTICAL_MULTIPLIER));
});

registerEvent(BlockBurnEvent, (event) => {
  event.setCancelled(true);
});
