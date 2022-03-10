import { CustomItem } from '../../common/items/CustomItem';
import { translate } from 'craftjs-plugin/chat';
import { VkItem } from '../../common/items/VkItem';

export const Picklock = new CustomItem({
  name: translate('vk.picklock'),
  id: 3,
  type: VkItem.TOOL,
});
