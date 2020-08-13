import { test, Assert } from 'zora';
import { dataHolder, DataHolder, DataType } from './holder';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import * as yup from 'yup';

function persistMsg(context: string, type: string) {
  return `${context}: ${type} persists`;
}

function deleteMsg(type: string) {
  return `${type} deleted`;
}

class TestObj {
  static schema = yup.object({
    bool: yup.boolean(),
    num: yup.number(),
    str: yup.string(),
  });

  bool = true;
  num = 42;
  str = 'foo';
}

const TestType: DataType<any> = {
  name: 'typename',
  defaultData: {
    bool: true,
    num: 42,
    str: 'foo',
  },
  schema: yup.object({
    bool: yup.boolean(),
    num: yup.number(),
    str: yup.string(),
  }),
};

function setData(holder: DataHolder) {
  holder.set('bool', 'boolean', true);
  holder.set('int', 'integer', 42);
  holder.set('double2', 'number', 42);
  holder.set('double', 'number', 100.1);
  holder.set('text', 'string', 'foo');

  const obj = new TestObj();
  obj.bool = false;
  holder.set('obj', TestObj, obj);

  const obj2 = {
    bool: false,
  };
  holder.set('obj2', TestType, obj2);
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

  const obj = holder.get('obj', TestObj);
  t.eq(obj?.bool, false, persistMsg(ctx, 'object boolean'));
  t.eq(obj?.num, 42, persistMsg(ctx, 'object number'));
  t.eq(obj?.str, 'foo', persistMsg(ctx, 'object string'));

  const obj2 = holder.get('obj2', TestType);
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
  t.eq(holder.get('obj', TestObj), null, deleteMsg('object'));
  t.eq(holder.get('obj', 'boolean'), null, deleteMsg('object/boolean'));
}

test('PersistentDataHolder serialization', (t) => {
  const stack = new ItemStack(Material.STONE, 1);
  const meta = stack.getItemMeta();
  const holder = dataHolder(meta);
  setData(holder);
  checkData(holder, t, 'same holder');
  checkData(dataHolder(meta), t, 'same ItemMeta');
  stack.setItemMeta(meta);
  checkData(dataHolder(stack.getItemMeta()), t, 'new ItemMeta'); // New ItemMeta from same stack
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
