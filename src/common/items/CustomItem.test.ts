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

  try {
    TestItem.set(invalidItem, { counter: 10 });
    t.ok('CustomItem.set() on an invalid item should not throw error');
  } catch (e) {
    t.fail(e);
  }

  TestItem.set(test1, { counter: 5 });
  t.eq(
    TestItem.get(test1)?.counter,
    5,
    'CustomItem.set() with complete data should set the data',
  );

  TestItem.set(test1, (data) => (data.counter = 12));
  t.eq(
    TestItem.get(test1)?.counter,
    12,
    `A function supplied to CustomItem.set() should be able to mutate the item's data`,
  );
});
