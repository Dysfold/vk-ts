import { translate } from 'craftjs-plugin/chat';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

export const IronSwordPart = new CustomItem({
  id: 19,
  type: VkItem.SMITHING,
  name: translate('vk.iron_sword_part'),
});
