import { diff } from 'deep-diff';
import * as _ from 'lodash';

export function applyDefault(obj: any, def: any) {
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
