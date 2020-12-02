import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { HandSaw } from '../../misc/saw';
import { shapedRecipe } from './utilities/shaped-recipe';

shapedRecipe({
  key: 'itemstack_test',
  shape: ['G'],
  ingredients: [{ key: 'G', item: HandSaw.create() }],
  result: new ItemStack(Material.DIRT),
});

shapedRecipe({
  key: 'planks',
  shape: ['L'],
  ingredients: [{ key: 'L', item: Material.OAK_LOG }],
  result: new ItemStack(Material.OAK_PLANKS),
});

shapedRecipe({
  key: 'handsaw',
  shape: ['SII'],
  ingredients: [
    { key: 'S', item: Material.DARK_OAK_PLANKS },
    { key: 'I', item: Material.IRON_INGOT },
  ],
  result: HandSaw.create(),
});

shapedRecipe({
  key: 'piano',
  shape: ['QQQ', 'DND', 'DDD'],
  ingredients: [
    { key: 'Q', item: Material.QUARTZ_SLAB },
    { key: 'D', item: Material.DARK_OAK_PLANKS },
    { key: 'N', item: Material.NOTE_BLOCK },
  ],
  result: new ItemStack(Material.BROWN_GLAZED_TERRACOTTA),
});

server.broadcastMessage('Shaped recipes created');
