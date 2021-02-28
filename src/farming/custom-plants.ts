import { Material, SoundCategory, GameMode } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Ageable } from 'org.bukkit.block.data';
import {
  Action,
  BlockBreakEvent,
  BlockPlaceEvent,
  BlockSpreadEvent,
} from 'org.bukkit.event.block';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { chanceOf } from '../common/helpers/math';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

interface Plant {
  seeds: CustomItem<{}>;
  minAge: number;
  maxAge: number;
  drops: ItemStack[];
  /* From 0 to 1. 1 = always grows, 0 = never grows*/
  growth?: number;
}

const PLANT_BLOCK = Material.TWISTING_VINES;

/**
 * Plant 1
 */
const ExamplePlant1Seeds = new CustomItem({
  id: 1,
  modelId: 1,
  type: VkItem.SEED,
});
const ExamplePlant1: Plant = {
  seeds: ExamplePlant1Seeds,
  minAge: 0,
  maxAge: 2,
  drops: [ExamplePlant1Seeds.create(), new ItemStack(Material.WHEAT, 2)],
  growth: 0.2,
};

/**
 * Plant 2
 */
const ExamplePlant2Seeds = new CustomItem({
  id: 2,
  modelId: 2,
  type: VkItem.SEED,
});
const ExamplePlant2: Plant = {
  seeds: ExamplePlant2Seeds,
  minAge: 3,
  maxAge: 5,
  drops: [ExamplePlant2Seeds.create(), new ItemStack(Material.APPLE, 5)],
};

/**
 * Plant 3
 */
const ExamplePlant3Seeds = new CustomItem({
  id: 3,
  modelId: 3,
  type: VkItem.SEED,
});
const ExamplePlant3: Plant = {
  seeds: ExamplePlant3Seeds,
  minAge: 6,
  maxAge: 8,
  drops: [ExamplePlant3Seeds.create(), new ItemStack(Material.CARROT, 3)],
};

/**
 * Plant 4
 */
const ExamplePlant4Seeds = new CustomItem({
  id: 4,
  modelId: 4,
  type: VkItem.SEED,
});
const ExamplePlant4: Plant = {
  seeds: ExamplePlant4Seeds,
  minAge: 9,
  maxAge: 11,
  drops: [ExamplePlant4Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Plant 5
 */
const ExamplePlant5Seeds = new CustomItem({
  id: 5,
  modelId: 5,
  type: VkItem.SEED,
});
const ExamplePlant5: Plant = {
  seeds: ExamplePlant5Seeds,
  minAge: 12,
  maxAge: 14,
  drops: [ExamplePlant5Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Plant 6
 */
const ExamplePlant6Seeds = new CustomItem({
  id: 6,
  modelId: 6,
  type: VkItem.SEED,
});
const ExamplePlant6: Plant = {
  seeds: ExamplePlant6Seeds,
  minAge: 15,
  maxAge: 17,
  drops: [ExamplePlant6Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Plant 7
 */
const ExamplePlant7Seeds = new CustomItem({
  id: 7,
  modelId: 7,
  type: VkItem.SEED,
});
const ExamplePlant7: Plant = {
  seeds: ExamplePlant7Seeds,
  minAge: 18,
  maxAge: 20,
  drops: [ExamplePlant7Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Plant 8
 */
const ExamplePlant8Seeds = new CustomItem({
  id: 8,
  modelId: 8,
  type: VkItem.SEED,
});
const ExamplePlant8: Plant = {
  seeds: ExamplePlant8Seeds,
  minAge: 21,
  maxAge: 25,
  drops: [ExamplePlant8Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Plant 9
 */
const ExamplePlant9Seeds = new CustomItem({
  id: 9,
  modelId: 9,
  type: VkItem.SEED,
});
const ExamplePlant9: Plant = {
  seeds: ExamplePlant9Seeds,
  minAge: 24,
  maxAge: 25,
  drops: [ExamplePlant9Seeds.create(), new ItemStack(Material.GRASS)],
};

/**
 * Maps the age of the twisting vines to the corresponding plant
 */
const AGE_TO_PLANT = new Map<
  number /* Age of the plant */,
  Plant /* Plant info */
>([
  [0, ExamplePlant1],
  [1, ExamplePlant1],
  [2, ExamplePlant1],

  [3, ExamplePlant2],
  [4, ExamplePlant2],
  [5, ExamplePlant2],

  [6, ExamplePlant3],
  [7, ExamplePlant3],
  [8, ExamplePlant3],

  [9, ExamplePlant4],
  [10, ExamplePlant4],
  [11, ExamplePlant4],

  [12, ExamplePlant5],
  [13, ExamplePlant5],
  [14, ExamplePlant5],

  [15, ExamplePlant6],
  [16, ExamplePlant6],
  [17, ExamplePlant6],

  [18, ExamplePlant7],
  [19, ExamplePlant7],
  [20, ExamplePlant7],

  [21, ExamplePlant8],
  [22, ExamplePlant8],
  [23, ExamplePlant8],

  [24, ExamplePlant9],
  [25, ExamplePlant9],
]);

const PLANTS = new Set(AGE_TO_PLANT.values());

/**
 * Custom growth of the custom plants
 */
registerEvent(BlockSpreadEvent, (event) => {
  const block = event.source;
  if (block.type !== PLANT_BLOCK) return;
  event.setCancelled(true);

  const ageable = block.blockData as Ageable;
  const newAgeable = event.newState.blockData as Ageable;

  const plant = AGE_TO_PLANT.get(ageable.age);
  if (!plant) return;
  const newPlant = AGE_TO_PLANT.get(newAgeable.age);
  if (!newPlant) return;

  // Plants are the same, if they have same minAge
  if (plant.minAge !== newPlant.minAge) return;

  // If the plant has custom growth rate, modify the growth
  if (plant.growth && !chanceOf(plant.growth)) return;

  ageable.age++;
  block.blockData = ageable;
});

/**
 * Prevent twisting vines items from being placed (removed from the game)
 */
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === PLANT_BLOCK) {
    event.setCancelled(true);
  }
});

/**
 * Prevent twisting vines items from dropping (removed from the game)
 */
registerEvent(ItemSpawnEvent, (event) => {
  if (event.entity?.itemStack?.type === PLANT_BLOCK) event.setCancelled(true);
});

/**
 * All blocks where custom plants can be planted
 */
const FARMLAND_BLOCKS = new Set([
  Material.GRASS_BLOCK,
  Material.DIRT,
  Material.COARSE_DIRT,
  Material.GRAVEL,
]);

/**
 * Place seeds on the ground.
 * Set the age of the twisting vines according to the seeds
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (!isCustomSeed(event.item)) return;

  const block = event.clickedBlock;
  if (!block) return;
  const plantBlock = block.getRelative(event.blockFace);
  if (plantBlock.type !== Material.AIR) return;

  const ground = plantBlock.getRelative(BlockFace.DOWN);
  if (!FARMLAND_BLOCKS.has(ground.type)) return;

  const minAge = getMinAge(event.item);
  if (minAge === undefined) return;

  event.setCancelled(true);

  plantBlock.type = PLANT_BLOCK;
  const ageable = plantBlock.blockData as Ageable;
  ageable.age = minAge;
  plantBlock.blockData = ageable;

  if (event.player.gameMode !== GameMode.CREATIVE) event.item.amount--;

  block.world.playSound(
    block.location,
    'minecraft:item.crop.plant',
    SoundCategory.BLOCKS,
    1,
    1,
  );
});

/**
 * Prevent player from placing this item as vanilla block (Pumpkin stem)
 */
registerEvent(BlockPlaceEvent, (event) => {
  if (isCustomSeed(event.itemInHand)) {
    event.setCancelled(true);
  }
});

/**
 * Check if this item is a custom seed item
 * @param item Item to be checked
 */
function isCustomSeed(item: ItemStack | null): item is ItemStack {
  if (!item) return false;
  if (item.type !== VkItem.SEED) return false;
  if (!item.itemMeta.hasCustomModelData()) return false;
  return item.itemMeta.customModelData > 0;
}

/**
 * Gets the age for the twisting vines
 * @param seeds Seed item
 */
function getMinAge(seeds: ItemStack) {
  for (const plant of PLANTS) {
    if (plant.seeds.check(seeds)) {
      return plant.minAge;
    }
  }
}

/**
 * Drop items/seeds of the plant
 */
registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type !== PLANT_BLOCK) return;
  const age = (event.block.blockData as Ageable).age;
  const plant = AGE_TO_PLANT.get(age);
  if (!plant) return;
  if (event.isCancelled()) return;
  if (age < plant.maxAge) {
    dropSeeds(plant, event.block);
    return;
  } else {
    dropDrops(plant, event.block);
    return;
  }
});

function dropSeeds(plant: Plant, block: Block) {
  const dropLoc = block.location.toBlockLocation();
  block.world.dropItemNaturally(dropLoc, plant.seeds.create());
}

function dropDrops(plant: Plant, block: Block) {
  const dropLoc = block.location.toBlockLocation();
  for (const drop of plant.drops) {
    block.world.dropItemNaturally(dropLoc, drop);
  }
}
