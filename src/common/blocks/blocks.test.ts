import { CustomBlock } from './CustomBlock';
import { Material, Bukkit } from 'org.bukkit';
import { setBlock } from './blocks';
import { dataHolder } from '../datas/holder';
import * as yup from 'yup';
import { Directional } from 'org.bukkit.material';
import { BlockFace } from 'org.bukkit.block';
import { test } from 'craftjs-plugin';

const TestBlock1 = new CustomBlock({
  type: Material.STRUCTURE_BLOCK,
});

const TestBlock2 = new CustomBlock({
  type: Material.LAPIS_BLOCK,
  data: {
    str: yup.string().default('foo').required(),
  },
});

const TestBlock3 = new CustomBlock({
  type: Material.BARREL,
  state: {
    facing: ['north', 'south', 'east', 'west'],
  },
});

const TestBlock4 = new CustomBlock(TestBlock3, {
  state: { facing: 'south' },
});

const block = Bukkit.server.worlds[0].getBlockAt(0, 0, 0);

test('Simple custom block', (t) => {
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

test('Custom block with custom data', (t) => {
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

test('Custom block with block states', (t) => {
  TestBlock3.create(block);
  t.truthy(TestBlock3.check(block), 'custom block with block states created');
  const facing = ((block.blockData as unknown) as Directional).facing;
  t.isNot(facing, BlockFace.UP, 'block facing is valid #1');
  t.isNot(facing, BlockFace.DOWN, 'block facing is valid #2');
});

test('Custom block variant', (t) => {
  TestBlock4.create(block);
  t.truthy(TestBlock4.check(block), 'custom block variant created');
  t.truthy(TestBlock3.check(block), 'custom block variant matches parent');
  t.is(
    ((block.blockData as unknown) as Directional).facing,
    BlockFace.SOUTH,
    'custom block variant override works',
  );
});
