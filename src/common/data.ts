import { diff } from 'deep-diff';
import * as _ from 'lodash';
import * as yup from 'yup';

/**
 * Set the value of `obj` at `path` to `value`
 */
export function set(obj: any, path: string[], value: any) {
  const subObjPath = path.slice(0, -1) ?? [];
  const finalKey = _.last(path);
  const subObj = subObjPath.reduce((obj, key) => obj[key], obj);
  if (finalKey) {
    subObj[finalKey] = value;
  }
}

/**
 * Get the value of obj at `path`
 */
export function get(obj: any, path: string[]) {
  return path.reduce((obj, key) => obj[key], obj);
}

/**
 * Get invalid paths of an object based on a Yup schema
 * @param value the object to check
 * @param schema the schema to use to validate the object
 */
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
 * @param schema If provided, used to validate the object supplied and replace invalid
 * fields with default ones
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
  if (schema) {
    const errPaths = getErrorneousPaths(obj, schema);
    errPaths.forEach((path) => set(newObj, path, get(def, path)));
  }
  return newObj;
}
