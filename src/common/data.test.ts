import { test } from 'zora';
import { applyDefault } from './data';

test('applyDefault', (t) => {
  const def = {
    a: 5,
    b: [],
    c: {
      a: 0,
    },
  };

  t.deepEqual(
    applyDefault({}, def),
    def,
    'Applying defaults to empty object should return defaults',
  );

  t.deepEqual(
    applyDefault(
      {
        a: 15,
        b: [1, 2, 3],
        c: {
          a: 10,
        },
      },
      def,
    ) as any,
    {
      a: 15,
      b: [1, 2, 3],
      c: {
        a: 10,
      },
    },
    'Applying defaults should not overwrite existing values',
  );

  t.deepEqual(
    applyDefault(
      {
        a: 10,
      },
      {
        a: 0,
        b: 0,
      },
    ),
    {
      a: 10,
      b: 0,
    },
    'Applying defaults to partial objects should fill in the missing properties',
  );
});
