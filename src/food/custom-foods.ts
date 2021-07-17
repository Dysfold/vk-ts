import { translate } from 'craftjs-plugin/chat';
import { PlayerItemConsumeEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { giveItem } from '../common/helpers/inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { CUSTOM_FOOD_INFO } from './FoodInfo';
import { addFoodPoints, addSaturation } from './helpers';

export function isCustomFood(item: ItemStack) {
  if (item.type !== VkItem.FOOD) return false;
  return item.itemMeta.hasCustomModelData();
}

registerEvent(PlayerItemConsumeEvent, (event) => {
  const food = event.item;
  if (!isCustomFood(food)) return;
  const modelId = food.itemMeta.customModelData;
  event.setCancelled(true);

  food.amount--;
  const foodInfo = CUSTOM_FOOD_INFO.get(modelId);
  if (!foodInfo) return;

  const inv = event.player.inventory;
  if (inv.itemInMainHand.isSimilar(food)) {
    inv.itemInMainHand.amount--;
    if (foodInfo.result)
      giveItem(event.player, foodInfo.result, EquipmentSlot.HAND);
  } else if (inv.itemInOffHand.isSimilar(food)) {
    inv.itemInOffHand.amount--;
    if (foodInfo.result)
      giveItem(event.player, foodInfo.result, EquipmentSlot.OFF_HAND);
  }

  addFoodPoints(event.player, foodInfo.foodPoints);
  addSaturation(event.player, foodInfo.saturation);

  event.replacement = foodInfo.result || null;
});

/**
 * All custom food items
 */

export const Cheese = new CustomItem({
  type: VkItem.FOOD,
  id: 1,
  name: translate('vk.cheese'),
});

export const Meatballs = new CustomItem({
  type: VkItem.FOOD,
  id: 2,
  name: translate('vk.meatballs'),
});

export const FriedEgg = new CustomItem({
  type: VkItem.FOOD,
  id: 3,
  name: translate('vk.fried_egg'),
});

export const MashedPotatoes = new CustomItem({
  type: VkItem.FOOD,
  id: 4,
  name: translate('vk.mashed_potatoes'),
});

export const Banana = new CustomItem({
  type: VkItem.FOOD,
  id: 5,
  name: translate('vk.banana'),
});

export const Ham = new CustomItem({
  type: VkItem.FOOD,
  id: 6,
  name: translate('vk.ham'),
});

export const ChocolateCookie = new CustomItem({
  type: VkItem.FOOD,
  id: 7,
  name: translate('vk.chocolate_cookie'),
});

export const Chocolate = new CustomItem({
  type: VkItem.FOOD,
  id: 8,
  name: translate('vk.chocolate'),
});

export const Ginger = new CustomItem({
  type: VkItem.FOOD,
  id: 9,
  name: translate('vk.ginger'),
});

export const BerryPie = new CustomItem({
  type: VkItem.FOOD,
  id: 10,
  name: translate('vk.meatballs'),
});
