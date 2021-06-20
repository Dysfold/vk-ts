import { Material } from 'org.bukkit';

const LOCKABLE_MATERIALS = new Set([
  Material.OAK_DOOR,
  Material.SPRUCE_DOOR,
  Material.BIRCH_DOOR,
  Material.JUNGLE_DOOR,
  Material.ACACIA_DOOR,
  Material.DARK_OAK_DOOR,

  Material.CHEST,

  Material.OAK_TRAPDOOR,
  Material.SPRUCE_TRAPDOOR,
  Material.BIRCH_TRAPDOOR,
  Material.JUNGLE_TRAPDOOR,
  Material.ACACIA_TRAPDOOR,
  Material.DARK_OAK_TRAPDOOR,
]);

export function isLockableMaterial(material: Material) {
  return LOCKABLE_MATERIALS.has(material);
}
