// TODO: Move these to own files when features are implemented

import { VkItem } from '../common/items/VkItem';
import { CustomItem } from '../common/items/CustomItem';
import { translate } from 'craftjs-plugin/chat';

export const WarAxe = new CustomItem({
  id: 6,
  type: VkItem.TOOL,
  name: translate('vk.war_axe'),
});

export const Spear = new CustomItem({
  id: 7,
  type: VkItem.TOOL,
  name: translate('vk.spear'),
});

export const WarHammer = new CustomItem({
  id: 18,
  type: VkItem.TOOL,
  name: translate('vk.war_hammer'),
});
