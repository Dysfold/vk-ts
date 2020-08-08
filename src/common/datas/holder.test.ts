import { test, Assert } from 'zora';
import { dataHolder, DataHolder } from './holder';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import * as yup from 'yup';

function assertMsg(context: string, type: string) {
  return `${context}: ${type} persists`;
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

function setData(holder: DataHolder) {
  holder.set('bool', 'boolean', true);
  holder.set('int', 'integer', 42);
  holder.set('double2', 'number', 42);
  holder.set('double', 'number', 100.1);
  holder.set('text', 'string', 'foo');
  const obj = new TestObj();
  obj.bool = false;
  holder.set('obj', TestObj, obj);
}

function checkData(holder: DataHolder, t: Assert, ctx: string) {
  t.eq(holder.get('bool', 'boolean'), true, assertMsg(ctx, 'boolean'));
  t.eq(holder.get('int', 'integer'), 42, assertMsg(ctx, 'integer'));
  t.eq(holder.get('double', 'number'), 100.1, assertMsg(ctx, 'number'));
  t.eq(
    holder.get('double2', 'number'),
    42,
    assertMsg(ctx, 'number (no fractional)'),
  );
  t.eq(holder.get('text', 'string'), 'foo', assertMsg(ctx, 'string'));
  const obj = holder.get('obj', TestObj);
  t.eq(obj?.bool, false, assertMsg(ctx, 'object boolean'));
  t.eq(obj?.num, 42, assertMsg(ctx, 'object number'));
  t.eq(obj?.str, 'foo', assertMsg(ctx, 'object string'));
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
});
