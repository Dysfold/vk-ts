import { Material } from 'org.bukkit';
import { PlayerItemConsumeEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { giveItem } from '../common/helpers/inventory';
import { CUSTOM_FOOD_INFO } from './FoodInfo';
import { addFoodPoints, addSaturation } from './helpers';

const CUSTOM_FOOD_MATERIAL = Material.POISONOUS_POTATO;

export function isCustomFood(item: ItemStack) {
  if (item.type !== CUSTOM_FOOD_MATERIAL) return false;
  if (!item.itemMeta.hasCustomModelData()) return false;
  return true;
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
    if (foodInfo.result) giveItem(event.player, foodInfo.result);
  } else if (inv.itemInOffHand.isSimilar(food)) {
    inv.itemInOffHand.amount--;
    if (foodInfo.result)
      giveItem(event.player, foodInfo.result, EquipmentSlot.OFF_HAND);
  }

  addFoodPoints(event.player, foodInfo.foodPoints);
  addSaturation(event.player, foodInfo.saturation);

  event.replacement = foodInfo.result || null;
});
