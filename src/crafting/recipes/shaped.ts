import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { MaterialChoice } from 'org.bukkit.inventory.RecipeChoice';
import { HandSaw } from '../../misc/saw';
import { PLANKS } from './choices';

export interface CustomShapedRecipe {
  key: string;
  shape: string[];
  ingredients: Ingredient[];
  result: ItemStack;
}

interface Ingredient {
  key: string;
  item: Material | ItemStack | MaterialChoice;
}

export const SHAPED_RECIPES: CustomShapedRecipe[] = [
  {
    // TEST ITEMSTACK
    key: 'itemstack_test',
    shape: ['G'],
    ingredients: [{ key: 'G', item: HandSaw.create() }],
    result: new ItemStack(Material.DIRT),
  },
  {
    key: 'planks',
    shape: ['L'],
    ingredients: [{ key: 'L', item: Material.OAK_LOG }],
    result: new ItemStack(Material.OAK_PLANKS),
  },
  {
    key: 'handsaw',
    shape: ['SII'],
    ingredients: [
      { key: 'S', item: PLANKS },
      { key: 'I', item: Material.IRON_INGOT },
    ],
    result: HandSaw.create(),
  },
  {
    key: 'piano',
    shape: ['QQQ', 'DND', 'DDD'],
    ingredients: [
      { key: 'Q', item: Material.QUARTZ_SLAB },
      { key: 'D', item: Material.DARK_OAK_PLANKS },
      { key: 'N', item: Material.NOTE_BLOCK },
    ],
    result: new ItemStack(Material.BROWN_GLAZED_TERRACOTTA),
  },
];
