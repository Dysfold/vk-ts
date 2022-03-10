import { CustomBlock } from '../common/blocks/CustomBlock';
import { VkMaterial } from '../common/items/VkMaterial';
import { Coconut } from '../food/custom-foods';

const CoconutBlock = new CustomBlock({
  type: VkMaterial.COCONUT_BLOCK,
});

/**
 * Drop 2 coconut items
 */
CoconutBlock.onBreak(async (event) => {
  const drop = Coconut.create({});
  drop.amount = 2;
  event.block.world.dropItem(event.block.location.add(0.5, 0.5, 0.5), drop);
  return true;
});
