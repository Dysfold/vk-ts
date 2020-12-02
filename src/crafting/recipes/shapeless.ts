import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { shapelessRecipe } from './utilities/shapeless-recipes';

shapelessRecipe({
  key: 'berry_soup',
  ingredients: [
    Material.BOWL,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SUGAR,
  ],
  result: new ItemStack(Material.BEETROOT_SOUP),
});

server.broadcastMessage('Shapeless recipes created');
