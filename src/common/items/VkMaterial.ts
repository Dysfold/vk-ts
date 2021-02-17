import { Material } from 'org.bukkit';
import { CustomItem } from '../items/CustomItem';

// prettier-ignore
export const VkMaterial = {
  MISC:         Material.SHULKER_SHELL,
  TOOL:         Material.IRON_HOE,
  SWORD:        Material.IRON_SWORD,
  HAT:          Material.LEATHER_BOOTS,
  FOOD:         Material.POISONOUS_POTATO,
  THROWABLE:    Material.SNOWBALL,
  BOTTLE:       Material.GLASS_BOTTLE,
  HIDDEN:       Material.HEART_OF_THE_SEA,
  MOLTEN:       Material.IRON_INGOT,
  SMITHING:     Material.BLAZE_ROD,
  MONEY:        Material.PRISMARINE_SHARD,
  CARD:         Material.PRISMARINE_CRYSTALS,
  SHIELD:       Material.SHIELD,
  DRINK:        Material.POTION,
  UNSTACKABLE:  Material.GOLDEN_HORSE_ARMOR,
  COLORABLE:    Material.LEATHER_HORSE_ARMOR,
};

// Example
export const Banana = new CustomItem({
  id: 5,
  type: VkMaterial.FOOD,
  modelId: 5,
  name: 'Banaani',
});
