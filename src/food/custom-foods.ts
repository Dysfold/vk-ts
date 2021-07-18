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

export const PotatoPie = new CustomItem({
  type: VkItem.FOOD,
  id: 11,
  name: translate('vk.potato_pie'),
});

export const FishPie = new CustomItem({
  type: VkItem.FOOD,
  id: 12,
  name: translate('vk.fish_pie'),
});

export const ApplePie = new CustomItem({
  type: VkItem.FOOD,
  id: 13,
  name: translate('vk.apple_pie'),
});

export const ChocolatePie = new CustomItem({
  type: VkItem.FOOD,
  id: 14,
  name: translate('vk.chocolate_pie'),
});

export const MeatPie = new CustomItem({
  type: VkItem.FOOD,
  id: 15,
  name: translate('vk.meat_pie'),
});

export const ChickenPie = new CustomItem({
  type: VkItem.FOOD,
  id: 16,
  name: translate('vk.chicken_pie'),
});

export const CreamPie = new CustomItem({
  type: VkItem.FOOD,
  id: 17,
  name: translate('vk.cream_pie'),
});

export const CheesePie = new CustomItem({
  type: VkItem.FOOD,
  id: 18,
  name: translate('vk.cheese_pie'),
});

export const CaramelApple = new CustomItem({
  type: VkItem.FOOD,
  id: 19,
  name: translate('vk.caramel_apple'),
});

export const Cherry = new CustomItem({
  type: VkItem.FOOD,
  id: 20,
  name: translate('vk.cherry'),
});

export const GreenApple = new CustomItem({
  type: VkItem.FOOD,
  id: 21,
  name: translate('vk.green_apple'),
});

export const Coconut = new CustomItem({
  type: VkItem.FOOD,
  id: 22,
  name: translate('vk.coconut'),
});

export const Crab = new CustomItem({
  type: VkItem.FOOD,
  id: 23,
  name: translate('vk.crab'),
});

export const Gingerbread = new CustomItem({
  type: VkItem.FOOD,
  id: 24,
  name: translate('vk.gingerbread'),
});

export const Tobacco = new CustomItem({
  type: VkItem.FOOD,
  id: 25,
  name: translate('vk.tobacco'),
});

export const BlueBerries = new CustomItem({
  type: VkItem.FOOD,
  id: 26,
  name: translate('vk.blue_berries'),
});

export const FreshCoffeeBeans = new CustomItem({
  type: VkItem.FOOD,
  id: 27,
  name: translate('vk.fresh_coffee_beans'),
});

export const CoffeeBeans = new CustomItem({
  type: VkItem.FOOD,
  id: 28,
  name: translate('vk.coffee_beans'),
});

export const Tomato = new CustomItem({
  type: VkItem.FOOD,
  id: 29,
  name: translate('vk.tomato'),
});

export const Pineapple = new CustomItem({
  type: VkItem.FOOD,
  id: 30,
  name: translate('vk.pineapple'),
});
