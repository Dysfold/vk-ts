import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { dataView, saveView, deleteView } from './view';
import { dataHolder, dataType } from './holder';
import * as yup from 'yup';
import { test } from 'craftjs-plugin';

const TestA = dataType('test_a', {
  bool: yup.boolean().default(true).required(),
  num: yup.number().default(42).required(),
  str: yup.string().default('foo').required(),
  obj: yup
    .object({
      str: yup.string().default('inside').required(),
    })
    .required(),
});

const TestB = dataType('test_b', {
  bool: yup.boolean().default(true).required(),
  num: yup.number().default(42).required(),
  str: yup.string().default('foo').required(),
  obj: yup
    .object({
      str: yup.string().default('inside').required(),
    })
    .required(),
});

test('DataHolder view works', (t) => {
  const item = new ItemStack(Material.STONE, 1);
  const meta = item.itemMeta;

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

  deleteView(TestA, meta);
  const a3 = dataView(TestA, meta);
  t.eq(a3.bool, true, 'A deleted');
});

test('DataHolder view without autoSave', (t) => {
  const item = new ItemStack(Material.STONE, 1);
  const meta = item.itemMeta;

  const a = dataView(TestA, meta, false);
  a.bool = false;

  const a2 = dataView(TestA, meta, false);
  t.eq(a2.bool, true, 'autosave did not happen');

  saveView(a);
  const a3 = dataView(TestA, meta, false);
  t.eq(a3.bool, false, 'manual save worked');
});
