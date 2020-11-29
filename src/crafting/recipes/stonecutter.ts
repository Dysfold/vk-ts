import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';

export interface CustomStonecutterRecipe {
  key: string;
  source: Material;
  result: ItemStack;
}

// Not yet functional
export const STONECUTTER_RECIPES: CustomStonecutterRecipe[] = [
  {
    key: 'cobblestone_trapdoor',
    source: Material.COBBLESTONE,
    result: new ItemStack(Material.CRIMSON_TRAPDOOR, 2),
  },
];
