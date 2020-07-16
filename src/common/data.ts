import { diff } from 'deep-diff';
import * as _ from 'lodash';

/**
 * Applies values from `def` to `obj` if they don't exist. Works with nested
 * objects and arrays
 * @param obj Object to apply diff to
 * @param def Default object
 */
export function applyDefault<T>(obj: any, def: T): T {
  const newObj = { ...obj };
  const diffObj = diff(obj, def);
  for (const prop of diffObj ?? []) {
    if (prop.kind !== 'N') {
      continue;
    }
    const subObjPath = prop.path?.slice(0, -1) ?? [];
    const finalKey = _.last(prop.path ?? []);
    const subObj = subObjPath.reduce((obj, key) => obj[key], newObj);
    if (finalKey) {
      subObj[finalKey] = prop.rhs;
    }
  }
  return newObj;
}
