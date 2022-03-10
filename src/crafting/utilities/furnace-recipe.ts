import { Bukkit, Material, NamespacedKey } from 'org.bukkit';
import {
  BlastingRecipe,
  CampfireRecipe,
  FurnaceRecipe,
  ItemStack,
  SmokingRecipe,
} from 'org.bukkit.inventory';
import { ExactChoice } from 'org.bukkit.inventory.RecipeChoice';
import { getNamespacedKey } from './helpers';

type FurnaceType = 'blast_furnace' | 'campfire' | 'smoker' | 'furnace';

interface CustomFurnaceRecipe {
  key: string;
  input: Material | ItemStack;
  result: Material | ItemStack;
  seconds: number;
  furnaces: FurnaceType[];
}

const DEFAULT_MULTIPLIER = 1;
const FURNACE_TIME_MULTIPLIER = new Map<FurnaceType, number>([
  ['blast_furnace', 0.5],
  ['smoker', 0.5],
  ['furnace', 1],
  ['campfire', 2],
]);

const getTimeMultiplier = (type: FurnaceType) =>
  FURNACE_TIME_MULTIPLIER.get(type) ?? DEFAULT_MULTIPLIER;

type AnyFurnaceRecipe =
  | typeof BlastingRecipe
  | typeof SmokingRecipe
  | typeof FurnaceRecipe
  | typeof CampfireRecipe;

const DEFAULT_CLASS = FurnaceRecipe;
const FURNACE_RECIPE_CLASS = new Map<FurnaceType, AnyFurnaceRecipe>([
  ['blast_furnace', BlastingRecipe],
  ['smoker', SmokingRecipe],
  ['furnace', FurnaceRecipe],
  ['campfire', CampfireRecipe],
]);

const getRecipeClass = (type: FurnaceType) =>
  FURNACE_RECIPE_CLASS.get(type) ?? DEFAULT_CLASS;

export function furnaceRecipe({
  key,
  input,
  result,
  seconds,
  furnaces,
}: CustomFurnaceRecipe) {
  for (const furnace of furnaces) {
    const ticks = getCookingTimeTicks(seconds, furnace);
    const RecipeClass = getRecipeClass(furnace);
    const namespacedKey = getNamespacedKey(`${key}_${furnace}`);

    // Params allows material and itemstack, but we need an ItemStack
    const output = toItemStack(result);

    const recipe = createFurnaceRecipe(
      input,
      RecipeClass,
      namespacedKey,
      output,
      ticks,
    );
    Bukkit.server.addRecipe(recipe);
  }
}

function getCookingTimeTicks(seconds: number, furnace: FurnaceType) {
  return seconds * 20 * getTimeMultiplier(furnace);
}

function createFurnaceRecipe(
  input: Material | ItemStack,
  RecipeClass: AnyFurnaceRecipe,
  namespacedKey: NamespacedKey,
  output: ItemStack,
  ticks: number,
) {
  if (input instanceof Material) {
    return createFurnaceRecipeWithMaterial(
      RecipeClass,
      namespacedKey,
      output,
      input,
      ticks,
    );
  }
  return createFurnaceRecipeWithItemStack(
    input,
    RecipeClass,
    namespacedKey,
    output,
    ticks,
  );
}

function createFurnaceRecipeWithItemStack(
  input: ItemStack,
  RecipeClass: AnyFurnaceRecipe,
  namespacedKey: NamespacedKey,
  output: ItemStack,
  ticks: number,
) {
  const choice = new ExactChoice(input);
  const recipe = new RecipeClass(
    namespacedKey,
    output,
    choice,
    0,
    Math.floor(ticks),
  );
  return recipe;
}

function createFurnaceRecipeWithMaterial(
  RecipeClass: AnyFurnaceRecipe,
  namespacedKey: NamespacedKey,
  output: ItemStack,
  input: Material,
  ticks: number,
) {
  const recipe = new RecipeClass(
    namespacedKey,
    output,
    input,
    0,
    Math.floor(ticks),
  );
  return recipe;
}

function toItemStack(result: Material | ItemStack) {
  return result instanceof Material ? new ItemStack(result) : result;
}
