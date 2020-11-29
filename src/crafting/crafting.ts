import { Material, NamespacedKey } from 'org.bukkit';
import {
  BlastingRecipe,
  CampfireRecipe,
  FurnaceRecipe,
  ItemStack,
  ShapedRecipe,
  ShapelessRecipe,
  SmokingRecipe,
  StonecuttingRecipe,
} from 'org.bukkit.inventory';
import { CustomFurnaceRecipe, FURNACE_RECIPES } from './recipes/furnace';
import { CustomShapedRecipe, SHAPED_RECIPES } from './recipes/shaped';
import { CustomShapelessRecipe, SHAPELESS_RECIPES } from './recipes/shapeless';
import {
  CustomStonecutterRecipe,
  STONECUTTER_RECIPES,
} from './recipes/stonecutter';

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
for (const RECIPE of STONECUTTER_RECIPES) {
  addStonecutterRecipe(RECIPE);
}
server.broadcastMessage('Reseptit generoitu');

function addShapedRecipe(data: CustomShapedRecipe) {
  const key = new NamespacedKey('vk', data.key);
  const shapedRecipe = new ShapedRecipe(key, data.result);

  // Shape
  const shape = data.shape;
  (shapedRecipe.shape as any)(...shape);

  for (const ingredient of data.ingredients) {
    const item = ingredient.item;
    const symbol = ingredient.key;

    // We want the item to be either Material or ItemStack or RecipeChoice but not "Material | ItemStack | RecipeChoice"
    if (item instanceof Material) {
      shapedRecipe.setIngredient(symbol, item);
    } else if (item instanceof ItemStack) {
      shapedRecipe.setIngredient(symbol, item);
    } else {
      // TODO: RecipeChoice
      continue;
      //shapedRecipe.setIngredient(symbol, item);
    }
  }
  server.addRecipe(shapedRecipe);
}

function addShapelessRecipe(data: CustomShapelessRecipe) {
  const key = new NamespacedKey('vk', data.key);
  const recipe = new ShapelessRecipe(key, data.result);

  data.ingredients.forEach((item) => {
    // We want the item to be either Material, RecipeChoice or ItemStack but not "Material | ItemStack | RecipeChoice"
    if (item instanceof Material) {
      recipe.addIngredient(item);
    } else if (item instanceof ItemStack) {
      recipe.addIngredient(item);
    } else {
      // TODO: RecipeChoice
      return;
      //recipe.addIngredient(item);
    }
  });
  server.addRecipe(recipe);
}

function addFurnaceRecipe(data: CustomFurnaceRecipe) {
  let RecipeConstructor;
  for (const furnace of data.furnaces) {
    let ticks = data.seconds * 20;
    const key = new NamespacedKey('vk', data.key);
    switch (furnace) {
      case 'blasting':
        RecipeConstructor = BlastingRecipe;
        ticks = ticks / 2; // Blast furnace is twice as fast
        break;
      case 'campfire':
        RecipeConstructor = CampfireRecipe;
        break;
      case 'smoking':
        RecipeConstructor = SmokingRecipe;
        ticks = ticks / 2; // Smoker is twice as fast
        break;
      default:
        // Smelting
        RecipeConstructor = FurnaceRecipe;
        break;
    }

    ticks = Math.floor(ticks);

    const recipe = new RecipeConstructor(
      key,
      data.result,
      data.input,
      0,
      ticks,
    );
    server.addRecipe(recipe);
  }
}

// Does't work yet for some reason
function addStonecutterRecipe(data: CustomStonecutterRecipe) {
  const key = new NamespacedKey('vk', data.key);

  const recipe = new StonecuttingRecipe(key, data.result, data.source);
  server.addRecipe(recipe);
}
