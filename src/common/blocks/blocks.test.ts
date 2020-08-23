import { CustomBlock } from './CustomBlock';
import { Material, Bukkit } from 'org.bukkit';
import { test } from 'zora';
import { setBlock } from './blocks';
import { dataHolder } from '../datas/holder';
import * as yup from 'yup';

const TestBlock1 = new CustomBlock({
  type: Material.STRUCTURE_BLOCK,
});

const TestBlock2 = new CustomBlock({
  type: Material.LAPIS_BLOCK,
  data: {
    str: yup.string().default('foo').required(),
  },
});

const block = Bukkit.server.worlds[0].getBlockAt(0, 0, 0);

test('Simple custom block works', (t) => {
  t.falsy(
    TestBlock1.check(block),
    'Vanilla block not detected as custom block',
  );
  TestBlock1.create(block);
  t.eq(block.type, Material.STRUCTURE_BLOCK, 'Vanilla material is set');
  t.truthy(TestBlock1.check(block), 'simple custom block created');
  t.falsy(
    dataHolder(block).get('cd', 'string'),
    'simple block did not store to DB',
  );
  setBlock(block, Material.AIR);
  t.falsy(TestBlock1.check(block), 'simple custom block deleted');
});

test('Custom block with data works', (t) => {
  TestBlock2.create(block);
  t.eq(
    TestBlock2.get(block)?.str,
    'foo',
    'default custom data of block is available',
  );

  TestBlock2.set(block, {}); // Should NOT change anything
  t.eq(TestBlock2.get(block)?.str, 'foo', 'setting nothing changed nothing');
  TestBlock2.set(block, { str: 'bar' });
  t.eq(TestBlock2.get(block)?.str, 'bar', 'setting data changes it');
  (TestBlock2.get(block) ?? { str: '' }).str = 'hello';
  t.eq(TestBlock2.get(block)?.str, 'hello', 'changing data with proxy works');

  setBlock(block, Material.AIR);
  t.falsy(dataHolder(block).get('cd', 'string'), 'block data deleted properly');
});
