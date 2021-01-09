import { ItemStack } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { Material, Server, Bukkit } from 'org.bukkit';
import { Damageable } from 'org.bukkit.inventory.meta';

export function makeDamaged(tool: Material | ItemStack | CustomItem<{}>) {
  let item: ItemStack;
  if (tool instanceof Material) {
    item = new ItemStack(tool);
  } else if (tool instanceof CustomItem) {
    item = tool.create();
  } else {
    item = tool;
  }

  const meta = item.itemMeta;
  if (meta instanceof Damageable) {
    meta.damage = item.type.maxDurability - 1;
    item.itemMeta = meta;
    Bukkit.server.broadcastMessage('DMG');
  }
  Bukkit.server.broadcastMessage('NONI');
  return item;
}
