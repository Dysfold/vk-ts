import { Material } from 'org.bukkit';
import { Ageable } from 'org.bukkit.block.data';
import { BlockPlaceEvent, BlockSpreadEvent } from 'org.bukkit.event.block';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

interface Plant {
  seeds: CustomItem<{}>;
  minAge: number;
  maxAge: number;
  drops: ItemStack[];
}

const ExamplePlant1Seeds = new CustomItem({
  id: 1,
  modelId: 1,
  type: VkItem.SEED,
});
const ExamplePlant1: Plant = {
  seeds: ExamplePlant1Seeds,
  minAge: 0,
  maxAge: 2,
  drops: [ExamplePlant1Seeds.create()],
};

const ExamplePlant2Seeds = new CustomItem({
  id: 2,
  modelId: 2,
  type: VkItem.SEED,
});
const ExamplePlant2: Plant = {
  seeds: ExamplePlant2Seeds,
  minAge: 3,
  maxAge: 5,
  drops: [ExamplePlant2Seeds.create()],
};

const ExamplePlant3Seeds = new CustomItem({
  id: 3,
  modelId: 3,
  type: VkItem.SEED,
});
const ExamplePlant3: Plant = {
  seeds: ExamplePlant3Seeds,
  minAge: 6,
  maxAge: 8,
  drops: [ExamplePlant3Seeds.create()],
};

const ExamplePlant4Seeds = new CustomItem({
  id: 4,
  modelId: 4,
  type: VkItem.SEED,
});
const ExamplePlant4: Plant = {
  seeds: ExamplePlant4Seeds,
  minAge: 9,
  maxAge: 11,
  drops: [ExamplePlant4Seeds.create()],
};

const ExamplePlant5Seeds = new CustomItem({
  id: 5,
  modelId: 5,
  type: VkItem.SEED,
});
const ExamplePlant5: Plant = {
  seeds: ExamplePlant5Seeds,
  minAge: 12,
  maxAge: 14,
  drops: [ExamplePlant5Seeds.create()],
};

const ExamplePlant6Seeds = new CustomItem({
  id: 6,
  modelId: 6,
  type: VkItem.SEED,
});
const ExamplePlant6: Plant = {
  seeds: ExamplePlant6Seeds,
  minAge: 15,
  maxAge: 17,
  drops: [ExamplePlant6Seeds.create()],
};

const ExamplePlant7Seeds = new CustomItem({
  id: 7,
  modelId: 7,
  type: VkItem.SEED,
});
const ExamplePlant7: Plant = {
  seeds: ExamplePlant7Seeds,
  minAge: 18,
  maxAge: 20,
  drops: [ExamplePlant7Seeds.create()],
};

const ExamplePlant8Seeds = new CustomItem({
  id: 8,
  modelId: 8,
  type: VkItem.SEED,
});
const ExamplePlant8: Plant = {
  seeds: ExamplePlant8Seeds,
  minAge: 21,
  maxAge: 25,
  drops: [ExamplePlant8Seeds.create()],
};

const ExamplePlant9Seeds = new CustomItem({
  id: 9,
  modelId: 9,
  type: VkItem.SEED,
});
const ExamplePlant9: Plant = {
  seeds: ExamplePlant9Seeds,
  minAge: 24,
  maxAge: 25,
  drops: [ExamplePlant9Seeds.create()],
};

const AGES = new Map<number /* Age of the plant */, Plant /* Plant info */>([
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

const PLANTS = new Set(AGES.values());

// Custom growth for plants
registerEvent(BlockSpreadEvent, (event) => {
  const block = event.source;
  if (block.type !== Material.TWISTING_VINES) return;
  event.setCancelled(true);

  const oldAgeable = block.blockData as Ageable;
  const newAgeable = event.newState.blockData as Ageable;

  const oldPlant = AGES.get(oldAgeable.age);
  if (!oldPlant) return;
  const newPlant = AGES.get(newAgeable.age);
  if (!newPlant) return;

  // Plants are the same, if they have same minAge
  if (oldPlant.minAge === newPlant.minAge) {
    oldAgeable.age++;
    block.blockData = oldAgeable;
  }
});

// Prevent regular twisting vines
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === Material.TWISTING_VINES) {
    event.setCancelled(true);
  }
});

// Prevent twisting vines items from dropping
registerEvent(ItemSpawnEvent, (event) => {
  if (event.entity?.itemStack?.type === Material.TWISTING_VINES)
    event.setCancelled(true);
});

// Place seeds on the fground
registerEvent(BlockPlaceEvent, (event) => {
  if (event.itemInHand.type !== VkItem.SEED) return;
  const seed = event.itemInHand;
  if (!seed.itemMeta.hasCustomModelData()) return;
  const modelId = seed.itemMeta.customModelData;
  if (!modelId) return;

  const minAge = getMinAge(event.itemInHand);
  if (minAge === undefined) return;

  event.block.type = Material.TWISTING_VINES;
  const ageable = event.block.blockData as Ageable;
  ageable.age = minAge;
  event.block.blockData = ageable;
});

function getMinAge(seeds: ItemStack) {
  for (const plant of PLANTS) {
    if (plant.seeds.check(seeds)) {
      return plant.minAge;
    }
  }
}
