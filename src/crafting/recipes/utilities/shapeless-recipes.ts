import { Material, NamespacedKey } from 'org.bukkit';
import { ItemStack, RecipeChoice, ShapelessRecipe } from 'org.bukkit.inventory';
import { MaterialChoice } from 'org.bukkit.inventory.RecipeChoice';

export function shapelessRecipe({
  key,
  ingredients,
  result,
}: {
  key: string;
  ingredients: (Material | ItemStack | RecipeChoice)[];
  result: ItemStack | Material;
}) {
  const namespacedKey = new NamespacedKey('vk', key);
  let recipe: ShapelessRecipe;
  if (result instanceof ItemStack)
    recipe = new ShapelessRecipe(namespacedKey, result);
  else recipe = new ShapelessRecipe(namespacedKey, new ItemStack(result));

  ingredients.forEach((item) => {
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
