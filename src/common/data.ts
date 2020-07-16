import { diff } from 'deep-diff';
import * as _ from 'lodash';
import * as yup from 'yup';

const testSchema = yup.object({
  deep: yup.object({
    counter: yup.number().required(),
  }),
  deep2: yup.object({
    counter: yup.number().required(),
  }),
});

function set(obj: any, path: string[], value: any) {
  const subObjPath = path.slice(0, -1) ?? [];
  const finalKey = _.last(path);
  const subObj = subObjPath.reduce((obj, key) => obj[key], obj);
  if (finalKey) {
    subObj[finalKey] = value;
  }
}

export function getErrorneousPaths(value: any, schema: yup.Schema<any>) {
  try {
    schema.validateSync(value, {
      abortEarly: false,
    });
    return [];
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      return e.inner.map((e) => e.path).map((p) => p.split('.'));
    }
    throw e;
  }
}

/**
 * Applies values from `def` to `obj` if they don't exist. Works with nested
 * objects and arrays
 * @param obj Object to apply diff to
 * @param def Default object
 */
export function applyDefault<T>(obj: any, def: T, schema?: yup.Schema<T>): T {
  const newObj = { ...obj };
  const diffObj = diff(obj, def);
  for (const prop of diffObj ?? []) {
    if (prop.kind !== 'N') {
      continue;
    }
    set(newObj, prop.path ?? [], prop.rhs);
  }
  return newObj;
}
