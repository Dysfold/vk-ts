import { test, fail } from 'zora';
import { CustomBlock, Blocks } from './CustomBlock';

class TestBlock1 extends CustomBlock {
  counter = 0;

  check() {
    return true;
  }
}

class TestBlock2 extends TestBlock1 {
  check() {
    return false;
  }
}

test('Blocks.get', (t) => {
  const b = server.worlds[0].getBlockAt(5, 50, 5);
  const data1 = Blocks.get(b, TestBlock1);
  t.ok(data1, `Blocks.get() should return data if check() returned true`);
  const data2 = Blocks.get(b, TestBlock2);
  t.notOk(
    data2,
    `Blocks.get() should return undefined if check() returned false`,
  );
  if (data1) {
    data1.counter = 1;
  }
  t.eq(
    data1?.counter,
    1,
    'Setting the value on a custom block should store the value in the object',
  );

  const data3 = Blocks.get(b, TestBlock1);
  t.eq(
    data3?.counter,
    1,
    'The values should be saved for subsequent Blocks.get calls',
  );

  t.ok(
    data3 instanceof TestBlock1,
    'The returned object should be instanceof the CustomBlock class',
  );
});
