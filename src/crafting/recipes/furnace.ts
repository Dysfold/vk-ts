import { Material } from 'org.bukkit';
import { HandGrindstone } from '../../misc/grindstone';
import { furnaceRecipe } from './utilities/furnace-recipe';
import { DriedTobacco } from '../../misc/pipe';

furnaceRecipe({
  key: 'hand_grindstone',
  input: Material.ANDESITE,
  result: HandGrindstone.create(),
  seconds: 10,
  furnaces: ['smelting', 'blasting'],
});

furnaceRecipe({
  key: 'dried_tobacco',
  input: Material.BEETROOT,
  result: DriedTobacco.create(),
  seconds: 30,
  furnaces: ['smelting', 'smoking'],
});

console.log('Furnace recipes created');
