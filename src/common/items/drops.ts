import { CustomItem } from './CustomItem';
import { Material, GameMode } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { Container } from 'org.bukkit.block';
import { BlockPlaceEvent, BlockBreakEvent } from 'org.bukkit.event.block';
import { CustomBlock } from '../blocks/CustomBlock';

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

export function setBlockDrops<T>(block: CustomBlock<T>, loot: LootDrop<T>[]) {
  block.onBreak(async (event, data) => {
    const block = event.block;
    // Drop contents if block is container
    if (block.state instanceof Container) {
      for (const item of block.state.inventory.contents) {
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
    block.setType(Material.AIR); // 'Break' the block
    return false; // We did the breaking
  });
}

export function setBlockForm(item: CustomItem<any>, block: CustomBlock<any>) {
  item.event(
    BlockPlaceEvent,
    (event) => event.itemInHand,
    async (event) => {
      // Place custom block over Vanilla one
      block.create(event.block);
    },
  );
}

export function bindItemBlock(item: CustomItem<any>, block: CustomBlock<any>) {
  setBlockDrops(block, [{ item: item, rarity: 1, count: 1 }]);
  setBlockForm(item, block);
}
