import { Material } from 'org.bukkit';

const LOCKABLE_MATERIALS = new Set([
  Material.OAK_DOOR,
  Material.SPRUCE_DOOR,
  Material.BIRCH_DOOR,
  Material.JUNGLE_DOOR,
  Material.ACACIA_DOOR,
  Material.DARK_OAK_DOOR,
]);

export function isLockableMaterial(material: Material) {
  return LOCKABLE_MATERIALS.has(material);
}
