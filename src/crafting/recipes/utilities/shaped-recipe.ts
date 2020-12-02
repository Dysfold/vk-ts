import { Material, NamespacedKey } from 'org.bukkit';
import { ItemStack, ShapedRecipe } from 'org.bukkit.inventory';
import { MaterialChoice } from 'org.bukkit.inventory.RecipeChoice';

interface Ingredient {
  key: string;
  item: Material | ItemStack | MaterialChoice;
}

export function shapedRecipe({
  key,
  shape,
  ingredients,
  result,
}: {
  key: string;
  shape: string[];
  ingredients: Ingredient[];
  result: ItemStack | Material;
}) {
  const namespacedKey = new NamespacedKey('vk', key);
  let shapedRecipe;

  if (result instanceof ItemStack)
    shapedRecipe = new ShapedRecipe(namespacedKey, result);
  else shapedRecipe = new ShapedRecipe(namespacedKey, new ItemStack(result));

  (shapedRecipe.shape as any)(...shape);

  for (const ingredient of ingredients) {
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
