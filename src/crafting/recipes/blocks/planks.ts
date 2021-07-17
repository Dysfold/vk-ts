import { Material } from 'org.bukkit';
import { VkMaterial } from '../../../common/items/VkMaterial';
import { shapedRecipe } from '../../utilities/shaped-recipe';

shapedRecipe({
  key: 'oak_planks',
  shape: ['L'],
  ingredients: {
    L: Material.OAK_LOG,
  },
  result: Material.OAK_PLANKS,
});

shapedRecipe({
  key: 'spruce_planks',
  shape: ['L'],
  ingredients: {
    L: Material.SPRUCE_LOG,
  },
  result: Material.SPRUCE_PLANKS,
});

shapedRecipe({
  key: 'birch_planks',
  shape: ['L'],
  ingredients: {
    L: Material.BIRCH_LOG,
  },
  result: Material.BIRCH_PLANKS,
});

shapedRecipe({
  key: 'jungle_planks',
  shape: ['L'],
  ingredients: {
    L: Material.JUNGLE_LOG,
  },
  result: Material.JUNGLE_PLANKS,
});

shapedRecipe({
  key: 'willow_planks',
  shape: ['L'],
  ingredients: {
    L: VkMaterial.WILLOW_LOG,
  },
  result: VkMaterial.WILLOW_PLANKS,
});

shapedRecipe({
  key: 'dark_oak_planks',
  shape: ['L'],
  ingredients: {
    L: Material.DARK_OAK_LOG,
  },
  result: Material.DARK_OAK_PLANKS,
});
