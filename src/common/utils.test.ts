import { test } from 'zora';
import { walk } from './utils';

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
});
