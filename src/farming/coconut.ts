import { translate } from 'craftjs-plugin/chat';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { VkMaterial } from '../common/items/VkMaterial';

const CoconutBlock = new CustomBlock({
  type: VkMaterial.COCONUT_BLOCK,
});

const CoconutItem = new CustomItem({
  id: 22,
  name: translate('vk.coconut'),
  type: VkItem.FOOD,
});

/**
 * Drop 2 coconut items
 */
CoconutBlock.onBreak(async (event) => {
  const drop = CoconutItem.create({});
  drop.amount = 2;
  event.block.world.dropItem(event.block.location.add(0.5, 0.5, 0.5), drop);
  return true;
});
