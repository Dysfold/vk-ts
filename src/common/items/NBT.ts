import { ItemStack } from 'org.bukkit.inventory';
import { NamespacedKey } from 'org.bukkit';
import { config } from '../config';
import { ItemTagType } from 'org.bukkit.inventory.meta.tags';
export class NBT {
  private static getKey(tagName: string) {
    return new NamespacedKey(config.NAMESPACE, tagName);
  }

  static set(item: ItemStack, tagName: string, value: any) {
    const { itemMeta } = item;
    itemMeta.customTagContainer.setCustomTag(
      this.getKey(tagName),
      ItemTagType.STRING,
      JSON.stringify(value),
    );
    item.itemMeta = itemMeta;
  }

  static get(item: ItemStack, tagName: string) {
    const {
      itemMeta: { customTagContainer },
    } = item;
    const key = this.getKey(tagName);
    const value = customTagContainer.getCustomTag(key, ItemTagType.STRING);
    try {
      return value ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }
}
