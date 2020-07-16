import * as _ from 'lodash';
import { Paths } from 'java.nio.file';
import { md5 } from './utils';

const persistantObjects: Record<string, any> = {};

export function persist<T>(value: T): T {
  const caller = _.last(__requireStack);
  if (!caller) {
    throw new Error('Persist called from an unexpected place!');
  }
  const path = Paths.get(caller).normalize();
  md5(path.toString());
  return value;
}