import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { HandSaw } from '../../misc/saw';

interface CustomShapedResipe {
  key: string;
  shape: string[];
  ingredients: Map<string, Material | ItemStack>;
  result: ItemStack;
}

export const SHAPED_RECIPES: CustomShapedResipe[] = [
  {
    // TEST ITEMSTACK
    key: 'itemstack_test',
    shape: ['G'],
    ingredients: new Map([['G', HandSaw.create()]]),
    result: new ItemStack(Material.DIRT),
  },
  {
    key: 'planks',
    shape: ['L'],
    ingredients: new Map([['L', Material.OAK_LOG]]),
    result: new ItemStack(Material.OAK_PLANKS),
  },
  {
    key: 'handsaw',
    shape: ['SII'],
    ingredients: new Map([
      ['S', Material.STICK],
      ['I', Material.IRON_INGOT],
    ]),
    result: HandSaw.create(),
  },
  {
    key: 'piano',
    shape: ['QQQ', 'DND', 'DDD'],
    ingredients: new Map([
      ['Q', Material.QUARTZ_SLAB],
      ['D', Material.DARK_OAK_PLANKS],
      ['N', Material.NOTE_BLOCK],
    ]),
    result: new ItemStack(Material.BROWN_GLAZED_TERRACOTTA),
  },
];
