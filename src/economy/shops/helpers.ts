import { text, translate } from 'craftjs-plugin/chat';
import { TextDecoration } from 'net.kyori.adventure.text.format';
import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { WallSign } from 'org.bukkit.block.data.type';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import {
  getPlainText,
  getTranslationKey,
  removeDecorations,
} from '../../chat/utils';
import { getDisplayName } from '../../common/helpers/items';
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
  const contents = inventory.contents ?? [];
  return contents.filter((item) => {
    if (!item) return false;
    if (item.type != lookfor.type) return false;
    const metaA = item.itemMeta;
    const metaB = lookfor.itemMeta;

    if (!hasSameName(item, lookfor)) return false;
    if (metaA.hasCustomModelData() !== metaB.hasCustomModelData()) return false;
    if (metaB.hasCustomModelData() && metaA.hasCustomModelData()) {
      if (metaA.customModelData !== metaB.customModelData) return false;
    }

    // Items were similar enough
    return true;
  });
}

function hasSameName(itemA: ItemStack, itemB: ItemStack) {
  const nameA = getDisplayName(itemA);
  const nameB = getDisplayName(itemB);
  return getPlainText(nameA) == getPlainText(nameB);
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
  if (itemData.name)
    meta.displayName(
      removeDecorations(text(itemData.name), TextDecoration.ITALIC),
    );
  if (itemData.translationKey)
    meta.displayName(translate(itemData.translationKey));
  item.itemMeta = meta;
  return item;
}

export function getBlockBehind(sign: Block) {
  if (!(sign.blockData instanceof WallSign)) return undefined;
  return sign.getRelative(sign.blockData.facing.oppositeFace);
}

export function getRenamedCustomName(item: ItemStack) {
  const meta = item.itemMeta;
  if (meta.hasDisplayName()) {
    return getPlainText(meta.displayName());
  }
}

/**
 * Get the translation key for this item stack, if it exists
 * @param item The item
 */
export function getCustomTranslationKeyForItem(item: ItemStack) {
  const displayName = getDisplayName(item);
  return displayName ? getTranslationKey(displayName) : undefined;
}
