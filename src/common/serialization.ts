import { walk } from './utils';
import * as _ from 'lodash';
import { ConfigurationSerializable } from 'org.bukkit.configuration.serialization';
import { Class } from 'java.lang';
import { Entry } from 'java.util.Map';

const JObject = java.lang.Object;

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
      {},
    ),
  };
}

export function serialize(obj: any) {
  const newObj = {};
  walk(obj, (value, key, path) => {
    if (value instanceof JObject) {
      if (!(value instanceof ConfigurationSerializable)) {
        return;
      }
      _.set(newObj, path, serializableToObject(value));
      return;
    }
  });
}
