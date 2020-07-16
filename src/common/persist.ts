import * as _ from 'lodash';
import { Paths } from 'java.nio.file';
import { hash } from './utils';

const persistantObjects: Record<string, any> = {};

export function persist<T>(value: T): T {
  const caller = _.last(__requireStack);
  if (!caller) {
    throw new Error('Persist called from an unexpected place!');
  }
  const path = Paths.get(__jsdir).relativize(Paths.get(caller).normalize());
  const hashed = hash(path.toString());
  return value;
}
