import { test } from 'zora';
import { after } from 'lodash';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { NBT } from './NBT';

test('NBT', (t) => {
  const testSuite = {
    'a number': 4,
    'a string': 'hello world',
    'a boolean': true,
    'an object': {
      a: {
        b: 4,
      },
    },
    'an array': [
      {
        a: 'hello world',
      },
      { b: true },
    ],
  };

  const item = new ItemStack(Material.STICK);
  for (const key in testSuite) {
    const nbtKey = key.replace(/\s/g, '_');
    const value = testSuite[key as keyof typeof testSuite];
    NBT.set(item, nbtKey, value);

    t.deepEqual(
      NBT.get(item, nbtKey),
      value,
      `Setting a tag to ${key} should work`,
    );
  }
});
