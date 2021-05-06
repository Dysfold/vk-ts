import { translate } from 'craftjs-plugin/chat';
import { Material } from 'org.bukkit';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { SHOP_DATA } from './ShopData';

/**
 * Tries to find similar itemstacks from the container
 * @param inventory Inventory used in the shop
 * @param lookfor ItemStack to be looked for from the container
 */
export function findItemsFromInventory(
  inventory: Inventory,
  lookfor: ItemStack,
) {
  return inventory.contents.filter((i) => {
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
 * This is an estimation of the item in the shop.
 */
export function getShopItem(itemData: yup.TypeOf<typeof SHOP_DATA.item>) {
  if (!itemData.material) return;
  const material = Material.valueOf(itemData.material);
  const item = new ItemStack(material);
  const meta = item.itemMeta;
  if (itemData.modelId) meta.customModelData = itemData.modelId;
  if (itemData.name) meta.displayName = itemData.name;
  if (itemData.translationKey)
    meta.displayNameComponent = [translate(itemData.translationKey)];
  item.itemMeta = meta;
  return item;
}
