import { VkMaterial } from '../items/VkMaterial';

/**
 * Map vanilla translation keys to vk material alias
 * For example:
 *  block.minecraft.warped_sign -> stone_sign
 *  item.minecraft.turtle_helmet -> diving_mask
 *  block.minecraft.stone -> undefined (no custom alias)
 */
const TRANSLATION_KEY_TO_VK_MATERIAL_NAME = new Map<string, string>();

for (const [vkMaterialAlias, material] of Object.entries(VkMaterial)) {
  const translation = material.translationKey;
  TRANSLATION_KEY_TO_VK_MATERIAL_NAME.set(
    translation,
    vkMaterialAlias.toLowerCase(),
  );
}

/**
 * Get custom alias for vanilla material
 * For example:
 *  block.minecraft.warped_sign -> stone_sign
 *  item.minecraft.turtle_helmet -> diving_mask
 *  block.minecraft.stone -> undefined (no custom alias)
 *
 * @param translationKey Vanilla minecraft tranlastion. For example: item.minecraft.turtle_helmet
 * @returns Lowercase custom alias for the material. For example: diving_mask
 */
export function translationKeyToVkMaterialAlias(translationKey: string) {
  return TRANSLATION_KEY_TO_VK_MATERIAL_NAME.get(translationKey);
}
