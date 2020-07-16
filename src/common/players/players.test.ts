import { test } from 'zora';
import { Players } from '.';
import { UUID } from 'java.util';
import { defaultPlayerData } from '../types';
import { Files } from 'java.nio.file';

test('Players', (t) => {
  try {
    Players.get('invalid-uuid');
    t.fail();
  } catch {
    t.ok(true, 'Players.get() with invalid uuid throws error');
  }

  const uuid = UUID.randomUUID().toString();
  const file = Players['getFile'](uuid);
  if (Files.exists(file)) {
    t.fail('UUID collision! Please try again');
  }
  const data = Players.get(uuid) as any;
  t.deepEqual(
    data,
    defaultPlayerData,
    'Players.get() on a new uuid should return the default data',
  );

  data['__test'] = 'foo';
  t.equal(
    (Players.get(uuid) as any).__test,
    'foo',
    'Mutating Players.get() -object should mutate the data',
  );

  t.equal(
    data,
    Players.get(uuid),
    'Players.get() returns the reference, not a copy',
  );

  t.ok(
    Files.exists(file),
    'Players.get() on a new uuid should create the corresponding file',
  );

  delete Players['loaded'][uuid];
  Files.deleteIfExists(file);
});
