import { test } from 'zora';
import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';

const TestItem = new CustomItem({
  type: Material.STICK,
  defaultData: {
    counter: 0,
  },
});

test('CustomItems workflow', (t) => {
  const test1 = TestItem.create();
  t.eq(
    test1.type,
    Material.STICK,
    'CustomItem.create() should create an itemstack with the correct type',
  );
  const invalidItem = new ItemStack(Material.DIRT);
  t.notOk(
    TestItem.get(invalidItem),
    'CustomItem.get() on an invalid item should return undefined',
  );
  t.deepEqual(
    TestItem.get(test1)?.counter,
    0,
    `CustomItem.get() on a just created item should return it's default data`,
  );

  const data = TestItem.get(test1);
  if (data) {
    data.counter = 1;
  }
  t.eq(
    TestItem.get(test1)?.counter,
    1,
    `Mutating object returned by CustomItem.get() should mutate the item's data`,
  );
});
