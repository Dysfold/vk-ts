import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { test } from 'craftjs-plugin';
import { text } from 'craftjs-plugin/chat';
import { dataHolder, dataType } from '../datas/holder';

const TestItem = new CustomItem({
  id: 0,
  type: Material.STICK,
  name: text('Test 1'),
  data: {
    counter: yup.number().default(0),
  },
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

const TestItem5 = new CustomItem({
  id: 5,
  type: Material.STICK,
  data: {
    first: yup.number().default(0).required(),
    second: yup.number().default(0),
  },
});

const TestItem6 = new CustomItem({
  id: 6,
  type: Material.STICK,
  customModel: false,
});

test('CustomItems workflow', (t) => {
  const test1 = TestItem.create({});
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
  t.falsy(
    TestItem.get(invalidItem),
    'CustomItem.get() on an invalid item returns undefined',
  );
  t.eq(
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

  t.doesNotThrow(
    () => TestItem.set(invalidItem, { counter: 10 }),
    'CustomItem.set() on an invalid item does not throw error',
  );

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

test('CustomItem method overriding', (t) => {
  const item = TestItem3.create({});
  t.eq(
    item.type,
    Material.DIRT,
    'CustomItem.create() overload receives the default created itemstack',
  );
  t.eq(
    item.amount,
    3,
    'CustomItem.create() overloading changes the output of CustomItem.create()',
    // and does not unnecessarily mess with amount
  );

  t.falsy(TestItem3.check(item), 'CustomItem.check() overloading should work');
});

test('CustomItem custom amount', (t) => {
  t.eq(
    TestItem.create({}, 42).amount,
    42,
    'CustomItem.create() properly sets custom amount',
  );
  t.eq(
    TestItem.create({}).amount,
    1,
    'CustomItem.create() defaults to stack of 1',
  );
});

test('CustomItem model ids', (t) => {
  t.eq(
    TestItem.create({}).itemMeta.customModelData,
    0,
    'CustomModelData is item id',
  );
  t.eq(
    TestItem6.create({}).itemMeta.customModelData,
    100006,
    'CustomModelData is unused when customModel === false',
  );
});

test('CustomItem.get() with no data', (t) => {
  t.eq(
    TestItem6.get(TestItem6.create({})),
    {},
    'custom item without data has {} as data',
  );
  t.eq(
    TestItem6.get(new ItemStack(Material.STICK)),
    undefined,
    'non-custom item has undefined data',
  );
});

test('CustomItem with extra data', (t) => {
  const item = TestItem6.create({});
  const extraType = dataType('cd', {
    extra: yup.string(),
  });
  dataHolder(item).set('cd', extraType, { extra: 'works' });
  t.eq(
    TestItem6.get(item),
    { extra: 'works' },
    'CustomItem.get() returns data missing from schema',
  );
});
