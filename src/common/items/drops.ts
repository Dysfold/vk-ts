import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';

type LootItem = CustomItem<any> | Material | ItemStack;

/**
 * Single item loot drop.
 */
export interface LootDrop<T> {
  /**
   * The loot item or a function that creates it.
   */
  item: LootItem | ((data: T) => LootItem | undefined);

  /**
   * Propability of this item drop, in range 0..1.
   */
  rarity: number;

  /**
   * How many items this loot drop contains. Stacking is handled automatically
   * if possible. If ItemStack function was used and the item is stackable,
   * this will override stack size.
   */
  count: number;
}

/**
 * Generates random loot from given loot table.
 * @param data Data to be given to functions in loot drops.
 * @param loot Loot table, i.e. array of potential loot drops.
 */
export function generateLoot<T>(data: T, loot: LootDrop<T>[]): ItemStack[] {
  const items: ItemStack[] = [];
  for (const drop of loot) {
    if (Math.random() > drop.rarity) {
      continue; // Not dropping, better luck next time...
    }

    // Make ItemStack of the loot drop
    const result = typeof drop.item == 'function' ? drop.item(data) : drop.item;
    let item;
    if (result instanceof CustomItem) {
      item = result.create();
    } else if (result instanceof Material) {
      item = new ItemStack(result);
    } else if (result instanceof ItemStack) {
      item = result;
    } else {
      throw new Error(`invalid LootDrop item: ${result}`);
    }

    // Create as many stacks as needed for count
    let remaining = drop.count;
    while (remaining > 0) {
      const stackSize = Math.min(remaining, item.getType().getMaxStackSize());
      remaining -= stackSize;
      const droppedItem = item.clone() as ItemStack;
      droppedItem.setAmount(stackSize);
      items.push(droppedItem); // FIXME wrong return type for ItemStack#clone()
    }
  }
  return items;
}
