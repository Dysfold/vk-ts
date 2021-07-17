import { Material } from 'org.bukkit';
import { Dice } from '../../../games/dice';
import { ChairItem } from '../../../misc/chairs';
import { HandGrindstone } from '../../../misc/grindstone';
import { DriedTobacco } from '../../../misc/pipe';
import { SealingWax } from '../../../misc/sealing-wax';
import { furnaceRecipe } from '../../utilities/furnace-recipe';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

furnaceRecipe({
  key: 'hand_grindstone',
  input: Material.ANDESITE,
  result: HandGrindstone.create({}),
  seconds: 10,
  furnaces: ['smelting', 'blasting'],
});

shapedRecipe({
  key: 'chair',
  shape: ['P  ', 'PPP', 'P P'],
  ingredients: {
    P: Material.DARK_OAK_PLANKS,
  },
  result: ChairItem.create({}, 4),
});

shapedRecipe({
  key: 'lock',
  shape: ['PPP', 'P P', 'PPP'],
  ingredients: {
    P: Material.GOLD_INGOT,
  },
  // TODO: Add Lock Item Here
  result: ChairItem.create({}, 4),
});

furnaceRecipe({
  key: 'sealing_wax',
  input: Material.JUNGLE_LEAVES,
  result: SealingWax.create({}),
  seconds: 10,
  furnaces: [],
});

furnaceRecipe({
  key: 'dried_tobacco',
  input: Material.BEETROOT,
  result: DriedTobacco.create({}),
  seconds: 30,
  furnaces: ['smelting', 'smoking'],
});

shapelessRecipe({
  key: 'dice',
  ingredients: [Material.BONE_BLOCK, Material.INK_SAC],
  result: Dice.create({}),
});

console.log('Furnace recipes created');
