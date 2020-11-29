import { Material } from 'org.bukkit';
import { ItemStack, RecipeChoice } from 'org.bukkit.inventory';

export interface CustomShapelessRecipe {
  key: string;
  ingredients: (Material | ItemStack | RecipeChoice)[];
  result: ItemStack;
}

export const SHAPELESS_RECIPES: CustomShapelessRecipe[] = [
  {
    key: 'berry_soup',
    ingredients: [
      Material.BOWL,
      Material.SWEET_BERRIES,
      Material.SWEET_BERRIES,
      Material.SWEET_BERRIES,
      Material.SWEET_BERRIES,
      Material.SWEET_BERRIES,
      Material.SWEET_BERRIES,
    ],
    result: new ItemStack(Material.BEETROOT_SOUP),
  },
];
