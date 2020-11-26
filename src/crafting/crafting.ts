import { Material, NamespacedKey } from 'org.bukkit';
import { ItemStack, ShapedRecipe } from 'org.bukkit.inventory';
import { HandSaw } from '../misc/saw';
import { SHAPED_RECIPES } from './recipes/shaped';

server.resetRecipes();

for (const RECIPE of SHAPED_RECIPES) {
  const key = new NamespacedKey('vk', RECIPE.key);
  const recipe = new ShapedRecipe(key, RECIPE.result);

  server.broadcastMessage(RECIPE.result.toString());

  // Shape
  const shape = RECIPE.shape;
  (recipe.shape as any)(...shape);

  RECIPE.ingredients.forEach((item, key) => {
    // We want the item to be either Material or ItemStack but not "Material | ItemStack"
    if (item instanceof Material) {
      recipe.setIngredient(key, item);
    } else {
      recipe.setIngredient(key, item);
    }
  });
  server.addRecipe(recipe);
}

// registerEvent(PrepareItemCraftEvent, (event) => {
//   const inv = event.inventory as CraftingInventory;
//   if (
//     inv.type !== InventoryType.WORKBENCH &&
//     inv.type !== InventoryType.CRAFTING
//   )
//     return;

//   const recipe = event.recipe as ShapedRecipe;
//   if (!recipe) return; // Is this even needed?

//   const key = recipe.key;
//   server.broadcastMessage(key.toString());

//   const res = RecipeManager.getRecipe(key);
//   if (!res) {
//     return;
//   }
//   const recipes = RecipeManager.getRecipes(
//     Object.keys(res.ingredients).map((key) => res.ingredients[key]),
//     res.shape,
//   );
//   const ingredients: (ItemStack | null)[] = [];
//   for (let i = 1; i < 10; i++) {
//     ingredients.push(inv.getItem(i));
//   }
//   const checkRecipe = (res: Recipe) => {
//     const list = res.shape.reduce((acc, cur) => acc + cur, '').split('');
//     const mappedList = list
//       .map((key) => res.ingredients[key])
//       .filter((val) => Boolean(val));
//     const filtered = ingredients.filter((item) => Boolean(item));
//     const pass = filtered.every((_, i) =>
//       RecipeManager.compareItem(filtered[i], mappedList[i]),
//     );
//     return pass;
//   };
//   let pass = false;
//   for (const recipe of recipes) {
//     if (!checkRecipe(recipe)) {
//       continue;
//     }
//     pass = true;
//     inv.setResult(RecipeManager.generateItem(recipe.result));
//   }
//   if (!pass) {
//     inv.setResult(new ItemStack(Material.AIR));
//   }
// });
