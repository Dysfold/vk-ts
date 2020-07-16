import { test } from 'zora';
import { applyDefault, getErrorneousPaths } from './data';
import * as yup from 'yup';

test('getErrorneusPaths', (t) => {
  const schema = yup.object({
    a: yup.number().required(),
    b: yup.object({
      a: yup.string().required(),
    }),
  });

  t.deepEqual(getErrorneousPaths({}, schema), [['a'], ['b', 'a']]);

  t.deepEqual(getErrorneousPaths({ a: 'hello world' }, schema), [
    ['a'],
    ['b', 'a'],
  ]);

  t.deepEqual(
    getErrorneousPaths(
      {
        a: 0,
        b: 'asd',
      },
      schema,
    ),
    [['b']],
  );

  t.deepEqual(
    getErrorneousPaths(
      {
        a: 0,
        b: {
          a: 5,
        },
      },
      schema,
    ),
    [],
  );
});

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

  const schema = yup.object({
    a: yup.number().required(),
    b: yup.object({
      a: yup.number().required(),
    }),
  });

  const def2 = {
    a: 0,
    b: {
      a: 0,
    },
  };

  t.deepEqual(
    applyDefault(
      {
        a: 5,
        b: {
          a: 10,
        },
      },
      def2,
      schema,
    ),
    {
      a: 5,
      b: {
        a: 10,
      },
    },
    'Applying defaults to valid object should not change object',
  );

  t.deepEqual(
    applyDefault(
      {
        a: 'foo',
        b: {
          a: 5,
        },
      },
      def2,
      schema,
    ),
    {
      a: 0,
      b: {
        a: 5,
      },
    },
    'Invalid fields based on schema should be replaced with default values',
  );
});
