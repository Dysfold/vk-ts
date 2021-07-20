import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { translate } from 'craftjs-plugin/chat';

export const Saber = new CustomItem({
  id: 1,
  type: VkItem.SWORD,
  name: translate('vk.saber'),
});

export const Knife = new CustomItem({
  id: 2,
  type: VkItem.SWORD,
  name: translate('vk.knife'),
});

export const Longsword = new CustomItem({
  id: 3,
  type: VkItem.SWORD,
  name: translate('vk.longsword'),
});

export const Rapier = new CustomItem({
  id: 4,
  type: VkItem.SWORD,
  name: translate('vk.rapier'),
});

export const Katana = new CustomItem({
  id: 5,
  type: VkItem.SWORD,
  name: translate('vk.katana'),
});

export const JungleKnife = new CustomItem({
  id: 6,
  type: VkItem.SWORD,
  name: translate('vk.jungle_knife'),
});

export const Gladius = new CustomItem({
  id: 7,
  type: VkItem.SWORD,
  name: translate('vk.gladius'),
});

export const Glaive = new CustomItem({
  id: 8,
  type: VkItem.SWORD,
  name: translate('vk.glaive'),
});

export const FlamingSword = new CustomItem({
  id: 9,
  type: VkItem.SWORD,
  name: translate('vk.flaming_sword'),
});

export const WalkingStickSword = new CustomItem({
  id: 10,
  type: VkItem.SWORD,
  name: translate('vk.walking_stick_sword'),
});
