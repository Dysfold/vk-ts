import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { Damageable } from 'org.bukkit.inventory.meta';

export function makeDamaged(tool: Material | ItemStack) {
  let item: ItemStack;
  if (tool instanceof Material) {
    item = new ItemStack(tool);
  } else {
    item = tool;
  }

  const meta = item.itemMeta;
  if (meta instanceof Damageable) {
    meta.damage = item.type.maxDurability - 1;
    item.itemMeta = meta;
  }
  return item;
}
