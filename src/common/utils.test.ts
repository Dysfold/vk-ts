import { test } from 'zora';
import { walk } from './utils';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';

test('walk', (t) => {
  const keys: (string | number)[] = [];
  const values: any[] = [];
  walk(
    {
      a: {
        b: {
          c: [1, 2, 3],
          d: 'asd',
        },
      },
    },
    (value, key) => {
      keys.push(key);
      values.push(value);
    },
  );
  t.deepEqual(keys, [0, 1, 2, 'd'], 'Should traverse correct keys');
  t.deepEqual(values, [1, 2, 3, 'asd'], 'Should traverse correct values');

  const values2: ItemStack[] = [];

  walk(
    {
      a: {
        b: {
          c: new ItemStack(Material.STONE),
        },
      },
    },
    (value) => {
      values2.push(value);
    },
  );

  t.ok(
    values2.every((v) => v instanceof ItemStack),
    `Callback get's called on Java objects`,
  );
});
