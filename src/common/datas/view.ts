import { ObjectShape } from 'yup/lib/object';
import { DataHolder, dataHolder, DataHolderStorage, DataType } from './holder';
import { Data } from './yup-utils';

/**
 * Creates a typed view into a data holder. The view contains values that were
 * in the data holder when this was called. Any mutations to the view or its
 * contents are immediately reflected to data holder, unless autoSave is turned
 * off.
 *
 * Views of different types in same data holder do not affect each other,
 * provided that there are no duplicate type names.
 * @param type Type (constructor) of data.
 * @param source Data holder or a data holder source.
 * @param autoSave If changes to this view or objects under it should be
 * immediately reflected back to holder.
 * @param validateRead If yup schema should be validated when reading the data.
 * @param validateWrite If yup schema should be validated when writing (saving)
 * the changes. With autoSave enabled, this causes frequent validations.
 * @returns Typed view into the data holder.
 */
export function dataView<T extends ObjectShape>(
  type: DataType<T>,
  source: DataHolder | DataHolderStorage,
  autoSave = true,
  validateRead = true,
  validateWrite = false,
): Data<T> {
  const holder = source instanceof DataHolder ? source : dataHolder(source);
  const obj =
    holder.get(type.name, type, validateRead) ?? type.schema.getDefault() ?? {};

  // Define proxy handler
  const handler: ProxyHandler<any> = {} as ProxyHandler<any>;
  handler['get'] = function (target, property) {
    const val = target[property];
    if (typeof val == 'object') {
      // Recursively proxy objects so that set handler is always called
      return new Proxy(val, handler);
    } else {
      return val;
    }
  };
  if (autoSave) {
    // Save on change
    handler['set'] = function (target, property, value) {
      target[property] = value; // Set BEFORE saving
      holder.set(type.name, type, obj, validateWrite);
      return true; // We'll just have to save twice, returning false is an error
    };
  } else {
    // Save data to view for saveView
    const objAny: any = obj; // Ignore type safety for a moment...
    objAny._self = obj;
    objAny._type = type;
    objAny._holder = holder;
    objAny._validateOnWrite = validateWrite;
    // Just mark changed if anything changes
    handler['set'] = function (target, property, value) {
      target[property] = value;
      objAny._changed = true;
      return true;
    };
  }
  return new Proxy(obj, handler);
}

/**
 * Saves a data view. If a view has auto save enabled, has not been changed,
 * or was saved after last changed, this has no effect.
 * @param view Data view to save.
 */
export function saveView(view: any) {
  if (!view._changed) {
    return; // Already saved
  }
  delete view._changed; // Saving changes...
  const saved = { ...view._self }; // Skip proxy

  // Don't serialize view metadata
  delete saved._self;
  delete saved._type;
  delete saved._holder;
  delete saved._validateOnWrite;

  // Save changes
  (view._holder as DataHolder).set(
    view._type.name,
    view._type,
    saved,
    view._validateOnWrite,
  );
}

/**
 * Deletes a view of given type from data holder.
 * @param Type (constructor) of data.
 * @param holder Data holder or data holder source.
 */
export function deleteView(
  type: DataType<any>,
  source: DataHolder | DataHolderStorage,
) {
  const holder = source instanceof DataHolder ? source : dataHolder(source);
  holder.delete(type.name);
}
