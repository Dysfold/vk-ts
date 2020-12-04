import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { HandSaw } from '../../misc/saw';
import { shapedRecipe } from './utilities/shaped-recipe';

shapedRecipe({
  key: 'itemstack_test',
  shape: ['G'],
  ingredients: {
    G: HandSaw.create(),
  },
  result: new ItemStack(Material.DIRT),
});

shapedRecipe({
  key: 'planks',
  shape: ['L'],
  ingredients: {
    L: Material.OAK_LOG,
  },
  result: new ItemStack(Material.OAK_PLANKS),
});

shapedRecipe({
  key: 'handsaw',
  shape: ['SII'],
  ingredients: {
    S: Material.OAK_PLANKS,
    I: Material.IRON_INGOT,
  },
  result: HandSaw.create(),
});

shapedRecipe({
  key: 'piano',
  shape: ['QQQ', 'DND', 'DDD'],
  ingredients: {
    Q: Material.QUARTZ_SLAB,
    D: Material.DARK_OAK_PLANKS,
    N: Material.NOTE_BLOCK,
  },
  result: new ItemStack(Material.BROWN_GLAZED_TERRACOTTA),
});

server.broadcastMessage('Shaped recipes created');
