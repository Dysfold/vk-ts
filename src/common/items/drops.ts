import { GameMode, Material } from 'org.bukkit';
import { Container } from 'org.bukkit.block';
import { BlockBreakEvent, BlockPlaceEvent } from 'org.bukkit.event.block';
import { ItemStack } from 'org.bukkit.inventory';
import { ObjectShape } from 'yup/lib/object';
import { CustomBlock } from '../blocks/CustomBlock';
import { Data, PartialData } from '../datas/yup-utils';
import { CustomItem } from './CustomItem';

type LootItem = Material | ItemStack;

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
    if (result instanceof Material) {
      item = new ItemStack(result);
    } else if (result instanceof ItemStack) {
      item = result;
    } else {
      throw new Error(`invalid LootDrop item: ${result}`);
    }

    // Create as many stacks as needed for count
    let remaining = drop.count;
    while (remaining > 0) {
      const stackSize = Math.min(remaining, item.type.maxStackSize);
      remaining -= stackSize;
      const droppedItem = item.clone() as ItemStack;
      droppedItem.amount = stackSize;
      items.push(droppedItem); // FIXME wrong return type for ItemStack#clone()
    }
  }
  return items;
}

/**
 * Sets drops (loot table) of a custom block.
 * @param block Custom block.
 * @param loot Loot table of the block.
 */
export function setBlockDrops<T extends ObjectShape>(
  block: CustomBlock<T>,
  loot: LootDrop<Data<T>>[],
) {
  block.onBreak(async (event, data) => {
    const block = event.block;
    // Drop contents if block is container
    if (block.state instanceof Container) {
      for (const item of block.state.inventory.contents ?? []) {
        if (item) {
          block.world.dropItemNaturally(block.location, item);
        }
      }
    }
    // Drop the custom item (if not in creative mode)
    if (
      !(
        event instanceof BlockBreakEvent &&
        event.player.gameMode.equals(GameMode.CREATIVE)
      )
    ) {
      for (const item of generateLoot(data, loot)) {
        block.world.dropItemNaturally(block.location, item);
      }
    }
    block.type = Material.AIR; // 'Break' the block
    return false; // We did the breaking
  });
}

/**
 * Sets block form of given custom item.
 * @param item Custom item.
 * @param block Custom block.
 * @param data Data for the custom block.
 */
export function setBlockForm<T extends ObjectShape>(
  item: CustomItem<any>,
  block: CustomBlock<T>,
  data: PartialData<T>,
) {
  item.event(
    BlockPlaceEvent,
    (event) => event.itemInHand,
    async (event) => {
      // Place custom block over Vanilla one
      block.create(event.block, data);
    },
  );
}

/**
 * Binds given item and block. Placing the item in world creates custom block.
 * Breaking the block drops one custom item.
 * @param item Custom item.
 * @param itemData Data for the custom item.
 * @param block Custom block.
 * @param blockData Data for the custom block.
 */
export function bindItemBlock<T extends ObjectShape, U extends ObjectShape>(
  item: CustomItem<T>,
  itemData: PartialData<T>,
  block: CustomBlock<U>,
  blockData: PartialData<U>,
) {
  setBlockDrops(block, [{ item: item.create(itemData), rarity: 1, count: 1 }]);
  setBlockForm(item, block, blockData);
}
