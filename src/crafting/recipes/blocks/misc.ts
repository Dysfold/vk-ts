import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { VkMaterial } from '../../../common/items/VkMaterial';
import { shapedRecipe } from '../../utilities/shaped-recipe';

shapedRecipe({
  key: 'piano',
  shape: ['QQQ', 'DND', 'DDD'],
  ingredients: {
    Q: VkMaterial.MARMOR_SLAB,
    D: Material.DARK_OAK_PLANKS,
    N: Material.NOTE_BLOCK,
  },
  result: new ItemStack(VkMaterial.PIANO),
});
