import { test } from 'zora';
import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { ItemMeta } from 'org.bukkit.inventory.meta';

const TestItem = new CustomItem({
  id: 0,
  type: Material.STICK,
  name: 'Test 1',
  data: {
    counter: 0,
  },
});

const TestItem2 = new CustomItem({
  id: 1,
  type: Material.DIAMOND_PICKAXE,
  name: 'Test 2',
});

const TestItem3 = new CustomItem({
  id: 3,
  type: Material.DIRT,
  create(item) {
    return new ItemStack(item.type, 3);
  },

  check() {
    return false;
  },
});

const TestItem4 = new CustomItem({
  id: 4,
  type: Material.BEEF,
  data: () => ({
    rand: Math.random(),
  }),
});

const TestItem5 = new CustomItem({
  id: 5,
  type: Material.STICK,
  data: {
    first: 0,
    second: 0,
  },
});

test('CustomItems workflow', (t) => {
  const test1 = TestItem.create();
  t.eq(
    test1.type,
    Material.STICK,
    'CustomItem.create() creates an ItemStack with the correct type',
  );

  const test2 = TestItem.create({ counter: -1 });
  t.eq(
    TestItem.get(test2)?.counter,
    -1,
    'Calling CustomItem.create() with specified data creates an item with the data',
  );

  const test3 = TestItem5.create({ first: -1 });
  const test3Data = TestItem5.get(test3);
  t.eq(
    { ...test3Data },
    { first: -1, second: 0 },
    'CustomItem.create() with partial data falls back to default data',
  );

  const invalidItem = new ItemStack(Material.DIRT);
  t.notOk(
    TestItem.get(invalidItem),
    'CustomItem.get() on an invalid item returns undefined',
  );
  t.deepEqual(
    TestItem.get(test1)?.counter,
    0,
    `CustomItem.get() on unmodified item returns it's default data`,
  );

  const data = TestItem.get(test1);
  if (data) {
    data.counter = 1;
  }
  t.eq(
    TestItem.get(test1)?.counter,
    1,
    `Mutating object returned by CustomItem.get() mutates the item's data`,
  );

  try {
    TestItem.set(invalidItem, { counter: 10 });
    t.ok('CustomItem.set() on an invalid item does not throw error');
  } catch (e) {
    t.fail(e);
  }

  TestItem.set(test1, { counter: 5 });
  t.eq(
    TestItem.get(test1)?.counter,
    5,
    'CustomItem.set() with complete data sets the data',
  );

  TestItem.set(test1, (data) => ({ data: data.counter, counter: 12 }));
  t.eq(
    TestItem.get(test1)?.counter,
    12,
    `A function supplied to CustomItem.set() should be able to mutate the item's data`,
  );
  t.truthy(
    'data' in (TestItem.get(test1) as object),
    'A function supplied to CustomItem.set() should receive existing/default data',
  );
});

test('CustomItem options', (t) => {
  const item2 = new ItemStack(Material.DIAMOND_PICKAXE);
  const meta = item2.itemMeta as ItemMeta;

  // TODO test display name, CustomModelData

  const [a, b] = [TestItem4.create(), TestItem4.create()];
  const [dataA, dataB] = [TestItem4.get(a), TestItem4.get(b)];
  t.notEq(
    dataA?.rand,
    dataB?.rand,
    'Passing a function as defaultData runs the function on creation and generate the data',
  );
});

test('CustomItem method overriding', (t) => {
  const item = TestItem3.create();
  t.eq(
    item.type,
    Material.DIRT,
    'CustomItem.create() overload receives the default created itemstack',
  );
  t.eq(
    item.amount,
    3,
    'CustomItem.create() overloading changes the output of CustomItem.create()',
  );

  t.notOk(TestItem3.check(item), 'CustomItem.check() overloading should work');
});
