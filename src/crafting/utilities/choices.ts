import { Material } from 'org.bukkit';
import { MaterialChoice } from 'org.bukkit.inventory.RecipeChoice';
import { VkMaterial } from '../../common/items/VkMaterial';

export const PLANKS = new MaterialChoice(
  Material.OAK_PLANKS,
  Material.DARK_OAK_PLANKS,
  Material.BIRCH_PLANKS,
  Material.SPRUCE_PLANKS,
  Material.JUNGLE_PLANKS,
  VkMaterial.WILLOW_PLANKS,
);

export const LOGS = new MaterialChoice(
  Material.OAK_LOG,
  Material.DARK_OAK_LOG,
  Material.BIRCH_LOG,
  Material.SPRUCE_LOG,
  Material.JUNGLE_LOG,
  VkMaterial.WILLOW_LOG,
);

export const WOODS = new MaterialChoice(
  Material.OAK_WOOD,
  Material.DARK_OAK_WOOD,
  Material.BIRCH_WOOD,
  Material.SPRUCE_WOOD,
  Material.JUNGLE_WOOD,
  VkMaterial.WILLOW_WOOD,
);

export const COBBLESTONE_LIKE = new MaterialChoice(
  Material.COBBLESTONE,
  Material.DEEPSLATE,
  Material.BLACKSTONE,
);
