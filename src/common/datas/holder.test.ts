import { Bukkit, Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { Assert, test } from 'zora';
import { DatabaseEntry } from './database';
import { dataHolder, DataHolder, dataType } from './holder';

function persistMsg(context: string, type: string) {
  return `${context}: ${type} persists`;
}

function deleteMsg(type: string) {
  return `${type} deleted`;
}

const TestType = dataType('TestType', {
  bool: yup.boolean().default(true),
  num: yup.number().default(42),
  str: yup.string().default('foo'),
});

function setData(holder: DataHolder) {
  holder.set('bool', 'boolean', true);
  holder.set('int', 'integer', 42);
  holder.set('double2', 'number', 42);
  holder.set('double', 'number', 100.1);
  holder.set('text', 'string', 'foo');

  const obj2 = {
    bool: false,
    num: 42,
    str: 'foo',
  };
  holder.set('obj', TestType, obj2);
}

function checkData(holder: DataHolder, t: Assert, ctx: string) {
  t.eq(holder.get('bool', 'boolean'), true, persistMsg(ctx, 'boolean'));
  t.eq(holder.get('int', 'integer'), 42, persistMsg(ctx, 'integer'));
  t.eq(holder.get('double', 'number'), 100.1, persistMsg(ctx, 'number'));
  t.eq(
    holder.get('double2', 'number'),
    42,
    persistMsg(ctx, 'number (no fractional)'),
  );
  t.eq(holder.get('text', 'string'), 'foo', persistMsg(ctx, 'string'));

  const obj2 = holder.get('obj', TestType);
  t.eq(obj2?.bool, false, persistMsg(ctx, 'DataType boolean'));
  t.eq(obj2?.num, 42, persistMsg(ctx, 'DataType number'));
  t.eq(obj2?.str, 'foo', persistMsg(ctx, 'DataType string'));
}

function checkDelete(holder: DataHolder, t: Assert) {
  holder.delete('bool');
  t.eq(holder.get('bool', 'boolean'), null, deleteMsg('boolean'));
  holder.delete('int');
  t.eq(holder.get('int', 'integer'), null, deleteMsg('integer'));
  holder.delete('double');
  t.eq(holder.get('double', 'number'), null, deleteMsg('number'));
  holder.delete('text');
  t.eq(holder.get('text', 'string'), null, deleteMsg('text'));
  holder.delete('obj');
  t.eq(holder.get('obj', 'boolean'), null, deleteMsg('object/boolean'));
}

test('PersistentDataHolder serialization', (t) => {
  const stack = new ItemStack(Material.STONE, 1);
  const meta = stack.itemMeta;
  const holder = dataHolder(meta);
  setData(holder);
  checkData(holder, t, 'same holder');
  checkData(dataHolder(meta), t, 'same ItemMeta');
  stack.itemMeta = meta;
  checkData(dataHolder(stack.itemMeta), t, 'new ItemMeta'); // New ItemMeta from same stack
  checkDelete(holder, t);
});

test('ItemStack serialization', (t) => {
  const stack = new ItemStack(Material.STONE, 1);
  const holder = dataHolder(stack);
  setData(holder);
  checkData(holder, t, 'same holder');
  checkData(dataHolder(stack), t, 'same ItemStack');
  checkDelete(holder, t);
});

test('Database serialization', (t) => {
  const entry = new DatabaseEntry('test', 'foo');
  const holder = dataHolder(entry);
  setData(holder);
  checkData(holder, t, 'same holder');
  checkData(dataHolder(entry), t, 'same database');
});

test('Block serialization', (t) => {
  const block = Bukkit.worlds[0].getBlockAt(0, 0, 0);
  const holder = dataHolder(block);
  setData(holder);
  checkData(holder, t, 'same holder');
  checkData(dataHolder(block), t, 'same block');
});
