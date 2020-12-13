import { Material } from 'org.bukkit';
import { HandGrindstone } from '../../misc/grindstone';
import { furnaceRecipe } from './utilities/furnace-recipe';

furnaceRecipe({
  key: 'hand_grindstone',
  input: Material.ANDESITE,
  result: HandGrindstone.create(),
  seconds: 10,
  furnaces: ['smelting', 'blasting'],
});

console.log('Furnace recipes created');
