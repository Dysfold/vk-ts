import { test } from 'zora';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import {
  objectToSerializable,
  serializableToObject,
  serialize,
  deserialize,
} from './serialization';

test('ConfigurationSerializables', (t) => {
  const item = new ItemStack(Material.STONE, 15);
  const serialized = serializableToObject(item);
  t.deepEqual(
    serialized,
    {
      __class: 'org.bukkit.inventory.ItemStack',
      __data: {
        v: 2567,
        type: 'STONE',
        amount: 15,
      },
    },
    'Converting ItemStack to object should return correct object',
  );

  const deserialized = objectToSerializable(serialized) as ItemStack;
  t.ok(deserialized, 'Deserialization should work');
  t.eq(
    deserialized.type,
    item.type,
    'Deserialized ItemStack should have same type',
  );
  t.eq(
    deserialized.amount,
    item.amount,
    'Deserialized ItemStack should have same amount',
  );
});

test('Serialization', (t) => {
  const getItem = () => new ItemStack(Material.STICK, 10);
  const obj = {
    item: getItem(),
    nested: {
      item: [getItem(), getItem()],
      primitive: 'string',
    },
  };

  // TODO: maybe more verbose testing?

  const serialized = serialize(obj);
  t.ok(serialized, 'Serialization should work');
  const deserialized = deserialize(obj) as typeof obj;
  t.ok(
    deserialized.item instanceof ItemStack,
    'Deserialization works for shallow properties',
  );
  t.ok(
    deserialized.nested.item.every((item) => item instanceof ItemStack),
    'Deserialization works for deep nested arrays',
  );
  t.eq(
    deserialized.nested.primitive,
    'string',
    'Deserialization works for deep nested primitives',
  );
});
