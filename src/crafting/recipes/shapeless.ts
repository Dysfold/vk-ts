import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { shapelessRecipe } from './utilities/shapeless-recipes';
import { IronSwordPart } from '../../blacksmith/metal-parts';
import { makeDamaged } from '../../blacksmith/damaged-tools';

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

shapelessRecipe({
  key: 'iron_sword',
  ingredients: [IronSwordPart.create(), Material.STICK],
  result: makeDamaged(Material.IRON_SWORD),
});

console.log('Shapeless recipes created');
