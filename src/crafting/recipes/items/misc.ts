import { Material } from 'org.bukkit';
import { Tobacco } from '../../../food/custom-foods';
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
  furnaces: ['furnace', 'blast_furnace'],
});

shapedRecipe({
  key: 'chair',
  shape: ['P  ', 'PPP', 'P P'],
  ingredients: {
    P: Material.DARK_OAK_PLANKS,
  },
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
  input: Tobacco.create({}),
  result: DriedTobacco.create({}),
  seconds: 30,
  furnaces: ['furnace', 'smoker'],
});

shapelessRecipe({
  key: 'dice',
  ingredients: [Material.BONE_BLOCK, Material.INK_SAC],
  result: Dice.create({}),
});

console.log('Furnace recipes created');
