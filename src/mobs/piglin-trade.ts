import { Material } from 'org.bukkit';
import { Piglin } from 'org.bukkit.entity';
import { EntityDropItemEvent, EntitySpawnEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { ChanceTable } from '../common/datas/ChanceTable';

const trades = new ChanceTable<ItemStack>([
  { value: new ItemStack(Material.YELLOW_WOOL, 1), rarity: 1 },
  { value: new ItemStack(Material.BLACK_WOOL, 1), rarity: 5 },
  { value: new ItemStack(Material.RED_WOOL, 1), rarity: 14 },
  { value: new ItemStack(Material.BLUE_WOOL, 1), rarity: 30 },
  { value: new ItemStack(Material.LIME_WOOL, 1), rarity: 50 },
]);

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
  const tradeItem = trades.randomEntry();
  if (tradeItem) drop.itemStack = tradeItem;
  else drop.itemStack.amount = 0;
});
