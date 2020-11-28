import { Material, NamespacedKey } from 'org.bukkit';
import {
  FurnaceRecipe,
  RecipeChoice,
  ShapedRecipe,
  ShapelessRecipe,
} from 'org.bukkit.inventory';
import { CustomFurnaceRecipe, FURNACE_RECIPES } from './recipes/furnace';
import { CustomShapedRecipe, SHAPED_RECIPES } from './recipes/shaped';
import { CustomShapelessRecipe, SHAPELESS_RECIPES } from './recipes/shapeless';

server.resetRecipes();

for (const RECIPE of SHAPED_RECIPES) {
  addShapedRecipe(RECIPE);
}
for (const RECIPE of SHAPELESS_RECIPES) {
  addShapelessRecipe(RECIPE);
}
for (const RECIPE of FURNACE_RECIPES) {
  addFurnaceRecipe(RECIPE);
}

function addShapedRecipe(data: CustomShapedRecipe) {
  const key = new NamespacedKey('vk', data.key);
  const shapedRecipe = new ShapedRecipe(key, data.result);

  // Shape
  const shape = data.shape;
  (shapedRecipe.shape as any)(...shape);

  data.ingredients.forEach((item, key) => {
    // We want the item to be either Material or ItemStack but not "Material | ItemStack"
    if (item instanceof Material) {
      shapedRecipe.setIngredient(key, item);
    } else {
      shapedRecipe.setIngredient(key, item);
    }
  });
  server.addRecipe(shapedRecipe);
}

function addShapelessRecipe(data: CustomShapelessRecipe) {
  const key = new NamespacedKey('vk', data.key);
  const recipe = new ShapelessRecipe(key, data.result);

  data.ingredients.forEach((item) => {
    // We want the item to be either Material or ItemStack but not "Material | ItemStack"
    if (item instanceof Material) {
      recipe.addIngredient(item);
    } else {
      recipe.addIngredient(item);
    }
  });
  server.broadcastMessage('...' + data.key);
  server.addRecipe(recipe);
}

function addFurnaceRecipe(data: CustomFurnaceRecipe) {
  const key = new NamespacedKey('vk', data.key);
  const recipe = new FurnaceRecipe(
    key,
    data.result,
    data.input,
    0,
    data.seconds * 20, // Ticks
  );
  server.addRecipe(recipe);
}
