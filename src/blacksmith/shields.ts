import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { translate } from 'craftjs-plugin/chat';

export const HeaterShield = new CustomItem({
  id: 1,
  type: VkItem.SHIELD,
  name: translate('vk.sheater_shield'),
});

export const RoundShield = new CustomItem({
  id: 2,
  type: VkItem.SHIELD,
  name: translate('vk.round_shield'),
});

export const ScutumShield = new CustomItem({
  id: 3,
  type: VkItem.SHIELD,
  name: translate('vk.scutum_shield'),
});

export const RedVikingShield = new CustomItem({
  id: 4,
  type: VkItem.SHIELD,
  name: translate('vk.red_viking_shield'),
});
