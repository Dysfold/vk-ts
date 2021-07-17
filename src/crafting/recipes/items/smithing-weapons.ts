import { Material } from 'org.bukkit';
import { HotIronBlade } from '../../../blacksmith/blacksmith';
import { makeDamaged } from '../../../blacksmith/damaged-tools';
import { IronSwordPart } from '../../../blacksmith/metal-parts';
import { VkItem } from '../../../common/items/VkItem';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

shapedRecipe({
  key: 'iron_sword_part',
  shape: ['B ', 'B '],
  ingredients: {
    B: HotIronBlade.create({}),
  },
  result: IronSwordPart.create({}),
});

shapelessRecipe({
  key: 'iron_sword',
  ingredients: [IronSwordPart.create({}), Material.STICK],
  result: makeDamaged(VkItem.SWORD),
});
