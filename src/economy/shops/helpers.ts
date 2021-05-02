import { Container } from 'org.bukkit.block';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';

/**
 * Tries to find similar itemstack from the container
 * @param container Container used in the shop
 * @param lookfor ItemStack to be looked for from the container
 */
export function findItemFromContainer(
  container: Container,
  lookfor: ItemStack,
) {
  return container.inventory.contents.find((i) => {
    if (!i) return false;
    if (i.type != lookfor.type) return false;
    const metaA = i.itemMeta;
    const metaB = lookfor.itemMeta;
    if (metaA.displayName != metaB.displayName) return false;
    if (metaA.hasCustomModelData() !== metaB.hasCustomModelData()) return false;
    if (metaB.hasCustomModelData() && metaA.hasCustomModelData()) {
      if (metaA.customModelData !== metaB.customModelData) return false;
    }

    // Items were similar enough
    return true;
  });
}

/**
 * Creates new item stack with given information.
 * This is an estimation of the item in the shop
 * @param type Material of the item
 * @param modelId Custom model data of the item
 * @param name Display name of the item
 */
export function getShopItem(type: string, modelId?: number, name?: string) {
  const material = Material.valueOf(type);
  const item = new ItemStack(material);
  const meta = item.itemMeta;
  if (modelId) meta.customModelData = modelId;
  if (name) meta.displayName = name;
  item.itemMeta = meta;
  return item;
}
