import { CustomItem } from '../common/items/CustomItem';
import { Material } from 'org.bukkit';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { VkItem } from '../common/items/VkItem';
import { translate } from 'craftjs-plugin/chat';

const CoconutBlock = new CustomBlock({
  type: Material.DEAD_BUBBLE_CORAL_WALL_FAN,
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
