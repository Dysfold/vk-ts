import { NamespacedKey } from 'org.bukkit';
import {
  PersistentDataType,
  PersistentDataContainer,
  PersistentDataHolder,
} from 'org.bukkit.persistence';
import { Integer, Double } from 'java.lang';
import * as yup from 'yup';
import { ItemStack } from 'org.bukkit.inventory';
import { ItemMeta } from 'org.bukkit.inventory.meta';
import * as _ from 'lodash';

/**
 * A custom data holder.
 */
export abstract class DataHolder {
  /**
   * Gets an object.
   * @param key Key.
   * @param type Type of data.
   * @param validateSchema If yup schema should be validated before returning.
   * @returns Object of given type or null.
   */
  abstract get<T extends object>(
    key: string,
    type: TypeParam<T>,
    validateSchema?: boolean,
  ): T | null;

  /**
   * Gets a boolean.
   * @param key Key.
   * @param type 'boolean'.
   * @returns Boolean or null.
   */
  abstract get(key: string, type: 'boolean'): boolean | null;

  /**
   * Gets an integer or a number. In this case, an integer is a 32-bit signed
   * integer. A number is standard JavaScript 64-bit floating point number.
   * @param key Key.
   * @param type 'integer' or 'boolean'.
   * @returns Number or null.
   */
  abstract get(key: string, type: 'integer' | 'number'): number | null;

  /**
   * Gets a string.
   * @param key Key.
   * @param type 'string'.
   * @returns String or null.
   */
  abstract get(key: string, type: 'string'): string | null;

  /**
   * Sets an object.
   * @param key Key.
   * @param type Object type.
   * @param value New value.
   * @param validateSchema If yup schema should be validated before setting.
   * Defaults to true.
   */
  abstract set<T extends object>(
    key: string,
    type: TypeParam<T>,
    value: T,
    validateSchema?: boolean,
  ): void;

  /**
   * Sets a boolean.
   * @param key Key.
   * @param type 'boolean'
   * @param value New value.
   */
  abstract set(key: string, type: 'boolean', value: boolean): void;

  /**
   * Sets an integer or a number. In this case, an integer is a 32-bit signed
   * integer. A number is standard JavaScript 64-bit floating point number.
   * @param key Key.
   * @param type 'integer' or 'number'.
   * @param value New value.
   */
  abstract set(key: string, type: 'integer' | 'number', value: number): void;

  /**
   * Sets a string.
   * @param key Key.
   * @param type 'string'.
   * @param value New value.
   */
  abstract set(key: string, type: 'string', value: string): void;

  /**
   * Deletes the value associated with given key. If the value does not exist,
   * nothing is done.
   * @param key Key to delete.
   */
  abstract delete(key: string): void;
}

/**
 * Describes type of held data, in case it is not a class.
 */
export interface DataType<T extends object> {
  /**
   * Type name.
   */
  name: string;

  /**
   * Schema for validating data of this type. Should always exist... but
   * sometimes that is inconvenient during development.
   */
  schema?: yup.ObjectSchema<T>;

  /**
   * Default data for this type. Do not access this directly, use
   * getDefaultData(). Direct access combined with failure to properly deep
   * clone the default data before assignment leads to bugs VERY difficult to
   * debug.
   */
  defaultData: T | (() => T);
}

export type TypeParam<T extends object> = DataType<T> | (new () => T);

export function getDefaultData<T extends object>(type: TypeParam<T>): T {
  if (typeof type == 'function') {
    return new type();
  } else {
    const data = type.defaultData;
    if (typeof data === 'function' && 'apply' in data) {
      // Work around TS bug by cast: https://github.com/microsoft/TypeScript/issues/37663
      return (data as () => T)();
    } else {
      return _.cloneDeep(data);
    }
  }
}

export type DataHolderSource = PersistentDataHolder | ItemStack;

export function dataHolder(storage: DataHolderSource): DataHolder {
  // TODO other storage types
  if (storage instanceof ItemStack) {
    return new ItemStackHolder(storage, storage.getItemMeta());
  } else {
    return new BukkitHolder(storage.getPersistentDataContainer());
  }
}

function fromJson<T extends object>(
  type: TypeParam<T>,
  json: string | null,
  validateSchema: boolean,
): T | null {
  if (json == null) {
    return null;
  }
  // Assign default data to object (for migrations and to get methods)
  const obj = getDefaultData(type);
  Object.assign(obj, JSON.parse(json));

  // Validate schema if requested
  if (validateSchema) {
    const schema: yup.ObjectSchema = (type as any).schema;
    if (schema != undefined) {
      schema.validateSync(obj);
    } else {
      // Asked to validate, but couldn't do that
      console.warn(`Missing schema for ${type.name}`);
    }
  }

  return obj;
}

function toJson<T extends object>(
  type: TypeParam<T>,
  data: T,
  validateSchema: boolean,
): string {
  // If asked, validate schema before creating JSON
  if (validateSchema) {
    const schema: yup.ObjectSchema = (type as any).schema;
    if (schema != undefined) {
      schema.validateSync(data);
    } else {
      // Asked to validate, but couldn't do that
      console.warn(`Missing schema for ${type.name}`);
    }
  }
  return JSON.stringify(data);
}

function intToBoolean(value: Integer | null): boolean | null {
  return value != null ? ((value as unknown) as number) != 0 : null;
}

function namespacedKey(key: string): NamespacedKey {
  return new NamespacedKey(__plugin, key);
}

/**
 * Holds data in Spigot's PersistentDataContainer.
 */
class BukkitHolder extends DataHolder {
  container: PersistentDataContainer;

  constructor(container: PersistentDataContainer) {
    super();
    this.container = container;
  }

  get(key: string, type: any, validateSchema = true): any {
    const containerKey = namespacedKey(key);
    switch (type) {
      case 'boolean':
        return intToBoolean(
          this.container.get(containerKey, PersistentDataType.INTEGER),
        );
      case 'integer':
        return this.container.get(containerKey, PersistentDataType.INTEGER);
      case 'number':
        return this.container.get(containerKey, PersistentDataType.DOUBLE);
      case 'string':
        return this.container.get(containerKey, PersistentDataType.STRING);
      default:
        return fromJson(
          type,
          this.container.get(containerKey, PersistentDataType.STRING),
          validateSchema,
        );
    }
  }

  set(key: string, type: any, value: any, validateSchema = true): void {
    const containerKey = namespacedKey(key);
    switch (type) {
      case 'boolean':
        this.container.set(
          containerKey,
          PersistentDataType.INTEGER,
          ((value ? 1 : 0) as unknown) as Integer,
        );
        break;
      case 'integer':
        if (Math.floor(value) !== value) {
          throw new Error(`not an integer: ${value}`);
        }
        this.container.set(containerKey, PersistentDataType.INTEGER, value);
        break;
      case 'number':
        this.container.set(
          containerKey,
          PersistentDataType.DOUBLE,
          Double.valueOf(value), // Graal can't auto-cast number to boxed Double
        );
        break;
      case 'string':
        this.container.set(containerKey, PersistentDataType.STRING, value);
        break;
      default:
        this.container.set(
          containerKey,
          PersistentDataType.STRING,
          toJson(type, value, validateSchema),
        );
    }
  }

  delete(key: string): void {
    this.container.remove(namespacedKey(key));
  }
}

/**
 * Wraps BukkitHolder to automatically setItemMeta() after modifications.
 */
class ItemStackHolder extends BukkitHolder {
  private stack: ItemStack;
  private meta: ItemMeta;

  constructor(stack: ItemStack, meta: ItemMeta) {
    super(meta.getPersistentDataContainer());
    this.stack = stack;
    this.meta = meta;
  }

  set(key: string, type: any, value: any, validateSchema = true): void {
    super.set(key, type, value, validateSchema); // Set to container
    this.stack.itemMeta = this.meta; // Re-set ItemMeta
  }
}
