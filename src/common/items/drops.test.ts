import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { generateLoot } from './drops';
import { ItemStack } from 'org.bukkit.inventory';
import { test } from 'craftjs-plugin';

const TestItem = new CustomItem({
  id: 0,
  type: Material.ALLIUM,
});

test('Loot drops generate correctly', (t) => {
  const items = generateLoot(undefined, [
    { item: TestItem, rarity: 1, count: 1 },
    { item: Material.STONE, rarity: 1, count: 129 },
    { item: new ItemStack(Material.STONE_BRICKS), rarity: 1, count: 2 },
  ]);
  t.truthy(TestItem.check(items[0]), 'custom item');
  t.truthy(new ItemStack(Material.STONE, 64).equals(items[1]), 'Material #1');
  t.truthy(new ItemStack(Material.STONE, 64).equals(items[2]), 'Material #2');
  t.truthy(new ItemStack(Material.STONE, 1).equals(items[3]), 'Material #3');
  t.truthy(
    new ItemStack(Material.STONE_BRICKS, 2).equals(items[4]),
    'ItemStack',
  );
});
