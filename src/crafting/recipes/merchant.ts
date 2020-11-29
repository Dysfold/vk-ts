import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';

export interface CustomMerchantRecipe {
  key: string;
  source: Material;
  result: ItemStack;
}

export const MERCHANT_RECIPE: CustomMerchantRecipe[] = [
  {
    key: 'cobblestone_trapdoor',
    source: Material.COBBLESTONE,
    result: new ItemStack(Material.CRIMSON_TRAPDOOR, 2),
  },
];
