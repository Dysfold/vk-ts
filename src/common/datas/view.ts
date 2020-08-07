import { DataHolder } from './holder';

/**
 * Creates a typed view into a data holder. The view contains values that were
 * in the data holder when this was called. New values assigned to the view are
 * immediately reflected to the data holder. Mutations to values in view are
 * not updated to the data holder; immutable values should be preferred.
 *
 * Currently supported data types are booleans, numbers, strings and
 * user-specified classes. To preserve runtime type safety, TypeScript
 * interfaces are NOT supported (they are erased during compilation).
 *
 * Views of different types in same data holder do not affect each other,
 * provided that there are no duplicate type names.
 * @param type Type (constructor) of data.
 * @param holder Data holder.
 * @returns Typed view into the data holder.
 */
export function dataHolderView<T>(type: new () => T, holder: DataHolder): T {
  const prefix = type.name + '_';
  const data: any = new type(); // Initialize with constructor (gets default values)
  // Override defaults that exist from data holder
  for (const key of Object.keys(data)) {
    const defaultVal = data[key];
    const type = typeof defaultVal;

    // Try to get stored value from holder
    const holderKey = prefix + key;
    let newValue;
    if (type == 'string') {
      newValue = holder.get(holderKey, 'string');
    } else if (type == 'number') {
      newValue = holder.get(holderKey, 'number');
    } else if (type == 'boolean') {
      newValue = holder.get(holderKey, 'boolean');
    } else {
      newValue = holder.get(holderKey, defaultVal.constructor as new () => any);
    }

    // If found, store to data object
    if (newValue !== null) {
      data[key] = newValue;
    }
  }
  return (new Proxy(data, {
    set: function (_target, property, value) {
      const key = prefix + (property as string); // TODO Symbol support?
      const type = typeof value;
      if (type == 'string') {
        holder.set(key, 'string', value);
      } else if (type == 'number') {
        holder.set(key, 'number', value);
      } else if (type == 'boolean') {
        holder.set(key, 'boolean', value);
      } else {
        holder.set(key, value.constructor as new () => any, value);
      }
      return true;
    },
  }) as unknown) as T;
}
