import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { HandGrindstone } from '../../misc/grindstone';

export interface CustomFurnaceRecipe {
  key: string;
  input: Material;
  result: ItemStack;
  seconds: number;
}

export const FURNACE_RECIPES: CustomFurnaceRecipe[] = [
  {
    key: 'hand_grindstone',
    input: Material.FLINT,
    result: HandGrindstone.create(),
    seconds: 4,
  },
];
