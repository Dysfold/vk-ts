import { Material } from 'org.bukkit';
import { Piglin } from 'org.bukkit.entity';
import { EntityDropItemEvent, EntitySpawnEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';

interface TradeItem {
  item: ItemStack;
  rarity: number;
}

/**
 * Initialize barter items. Total rarity must add up to 1.
 */
const trades: TradeItem[] = [
  { item: new ItemStack(Material.BLACK_WOOL, 1), rarity: 0.1 },
  { item: new ItemStack(Material.RED_WOOL, 1), rarity: 0.2 },
  { item: new ItemStack(Material.GRAY_WOOL, 1), rarity: 0.3 },
  { item: new ItemStack(Material.LIME_WOOL, 1), rarity: 0.4 },
];

/**
 * Returns a trade depending on drop rarity.
 */
function getTrade(): ItemStack {
  let randomRarity = Math.random();
  for (const trade of trades) {
    randomRarity -= trade.rarity;
    if (randomRarity <= 0) return trade.item;
  }
  return trades[0].item;
}

// Prevent zombification of piglins in overworld.
registerEvent(EntitySpawnEvent, (event) => {
  if (!(event.entity instanceof Piglin)) return;
  const piglin = event.entity;
  piglin.setImmuneToZombification(true);
});

// Change barter item.
registerEvent(EntityDropItemEvent, (event) => {
  if (!(event.entity instanceof Piglin)) return;
  const drop = event.itemDrop;
  drop.itemStack = getTrade();
});
