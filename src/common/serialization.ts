import { walk } from './utils';
import * as _ from 'lodash';
import { ConfigurationSerializable } from 'org.bukkit.configuration.serialization';
import { Class } from 'java.lang';
import { Entry } from 'java.util.Map';
import { HashMap } from 'java.util';

const JObject = java.lang.Object;

/**
 * Converts a `ConfigurationSerializable` to a Javascript representation
 * that can be stringified to JSON
 */
export function serializableToObject(serializable: ConfigurationSerializable) {
  const clazz = (serializable as any).class as Class<any>;
  const map = serializable.serialize().entrySet().toArray() as JArray<
    Entry<string, any>
  >;
  return {
    __class: clazz.name,
    __data: [...map].reduce(
      (obj, entry) => ({
        ...obj,
        [entry.key]: entry.value,
      }),
      {} as Record<string, any>,
    ),
  };
}

/**
 * Converts an object returned by `serializableToObject` to a `ConfigurationSerializable`
 * @returns Undefined if the conversion could not be made, a `ConfigurationSerializable` otherwise
 */
export function objectToSerializable(obj: any) {
  if (!('__class' in obj) || !('__data' in obj)) {
    return undefined;
  }
  try {
    const clazz = Java.type(obj.__class);
    if (!('deserialize' in clazz)) {
      return undefined;
    }
    const map = new HashMap();
    for (const key in obj.__data) {
      map.put(key, obj.__data[key]);
    }
    const deserialized = clazz.deserialize(map);
    return deserialized as ConfigurationSerializable;
  } catch {
    return undefined;
  }
}

export function serialize(obj: any) {
  const newObj = {};
  walk(obj, (value, key, path) => {
    if (
      value instanceof JObject &&
      (typeof value === 'object' || typeof value === 'function')
    ) {
      if (!(value instanceof ConfigurationSerializable)) {
        return;
      }
      _.set(newObj, path, serializableToObject(value));
      return;
    }
    if (typeof value === 'function') {
      return;
    }
    _.set(newObj, path, value);
  });
  return newObj;
}

export function deserialize(obj: any) {
  const newObj = {};
  walk(obj, (value, key, path) => {
    if (key === '__class') {
      const parentPath = path.slice(0, -1);
      const parent = _.get(obj, parentPath);
      _.set(newObj, parentPath, objectToSerializable(parent));
      return;
    }
    if (path.includes('__data')) {
      return;
    }
    _.set(newObj, path, value);
  });
  return newObj;
}
