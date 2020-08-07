import { test } from 'zora';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { dataHolderView } from './view';
import { dataHolder } from './holder';

class TestA {
  bool = true;
  num = 42;
  str = 'foo';
}

class TestB {
  bool = true;
  num = 42;
  str = 'foo';
}

test('DataHolder view works', (t) => {
  const item = new ItemStack(Material.STONE, 1);
  const meta = item.getItemMeta();

  const a = dataHolderView(TestA, dataHolder(meta));
  a.bool = false;
  const b = dataHolderView(TestB, dataHolder(meta));
  b.num = 30;

  const a2 = dataHolderView(TestA, dataHolder(meta));
  t.eq(a2.bool, false, 'A change persisted');
  t.eq(a2.num, 42, 'B did not overlap A');
  const b2 = dataHolderView(TestB, dataHolder(meta));
  t.eq(b2.num, 30, 'B change persisted');
  t.eq(b2.bool, true, 'A did not overlap B');
});
