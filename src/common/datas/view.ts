import { DataHolder, DataHolderSource, dataHolder } from './holder';

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
export function dataView<T>(
  type: new () => T,
  source: DataHolder | DataHolderSource,
  autoSave = true,
  validateRead = true,
  validateWrite = false,
): T {
  const holder = source instanceof DataHolder ? source : dataHolder(source);
  let obj: any = holder.get(type.name, type, validateRead);
  if (obj == null) {
    // Unlike holder API, we'll just return with default values
    obj = new type();
  }

  // If autosave is disabled, don't create proxy
  if (!autoSave) {
    obj._holder = holder;
    obj._validateOnWrite = validateWrite; // Used by saveView
    return obj;
  }

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
  handler['set'] = function (target, property, value) {
    target[property] = value; // Set BEFORE saving
    holder.set(type.name, type, obj);
    return true; // We'll just have to save twice, returning false is an error
  };

  // Proxy everything
  return (new Proxy(obj, handler) as unknown) as T;
}

/**
 * Saves a data view that does not have autoSave enabled.
 * @param view Data view to save.
 */
export function saveView(view: any) {
  if (view._holder == undefined) {
    throw new Error('not a data view');
  }
  (view._holder as DataHolder).set(
    view.constructor.name,
    view.constructor,
    view,
    view._validateOnWrite,
  );
}

/**
 * Deletes a view of given type from data holder.
 * @param Type (constructor) of data.
 * @param holder Data holder or data holder source.
 */
export function deleteView(
  type: new () => any,
  source: DataHolder | DataHolderSource,
) {
  const holder = source instanceof DataHolder ? source : dataHolder(source);
  holder.delete(type.name);
}
