import { test } from 'zora';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { dataView, saveView } from './view';
import { dataHolder } from './holder';
import * as yup from 'yup';

class TestA {
  static schema = yup.object({
    bool: yup.boolean(),
    num: yup.number(),
    str: yup.string(),
    obj: yup.object({
      str: yup.string(),
    }),
  });

  bool = true;
  num = 42;
  str = 'foo';
  obj = { str: 'inside' };
}

class TestB {
  static schema = yup.object({
    bool: yup.boolean(),
    num: yup.number(),
    str: yup.string(),
    obj: yup.object({
      str: yup.string(),
    }),
  });

  bool = true;
  num = 42;
  str = 'foo';
  obj = { str: 'inside' };
}

test('DataHolder view works', (t) => {
  const item = new ItemStack(Material.STONE, 1);
  const meta = item.getItemMeta();

  const a = dataView(TestA, dataHolder(meta));
  a.bool = false;
  a.obj.str = 'hello';
  const b = dataView(TestB, dataHolder(meta));
  b.num = 30;

  const a2 = dataView(TestA, dataHolder(meta));
  t.eq(a2.bool, false, 'A change persisted');
  t.eq(a2.obj.str, 'hello', 'A obj change persisted');
  t.eq(a2.num, 42, 'B did not overlap A');
  const b2 = dataView(TestB, dataHolder(meta));
  t.eq(b2.num, 30, 'B change persisted');
  t.eq(b2.bool, true, 'A did not overlap B');
  t.eq(b2.obj.str, 'inside', 'A obj did not overlap B');
});

test('DataHolder view without autoSave', (t) => {
  const item = new ItemStack(Material.STONE, 1);
  const meta = item.getItemMeta();

  const a = dataView(TestA, meta, false);
  a.bool = false;

  const a2 = dataView(TestA, meta, false);
  t.eq(a2.bool, true, 'autosave did not happen');

  saveView(a);
  const a3 = dataView(TestA, meta, false);
  t.eq(a3.bool, false, 'manual save worked');
});
