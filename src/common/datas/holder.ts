import { NamespacedKey, OfflinePlayer, Location } from 'org.bukkit';
import {
  PersistentDataType,
  PersistentDataContainer,
  PersistentDataHolder,
} from 'org.bukkit.persistence';
import * as yup from 'yup';
import { ItemStack } from 'org.bukkit.inventory';
import { ItemMeta } from 'org.bukkit.inventory.meta';
import { DatabaseEntry, getTable } from './database';
import { Block } from 'org.bukkit.block';
import { Table } from 'craftjs-plugin';

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
    type: DataType<T>,
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
    type: DataType<T>,
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
   * Schema for validating data of this type. May contain default values.
   */
  schema: yup.ObjectSchema<T>;
}

export function dataType<T extends object>(
  name: string,
  schema: yup.ObjectSchemaDefinition<T>,
): DataType<T> {
  return { name: name, schema: yup.object(schema) as yup.ObjectSchema<T> };
}

/**
 * Types that can be used as DataHolder storages.
 */
export type DataHolderStorage =
  | PersistentDataHolder
  | DatabaseEntry
  | ItemStack
  | Block
  | OfflinePlayer;

/**
 * Creates a persistent data holder backed by given storage.
 * @param storage Where data should be stored.
 * @returns A new data holder.
 */
export function dataHolder(storage: DataHolderStorage): DataHolder {
  if (storage instanceof OfflinePlayer) {
    // Store ALL player data in DB so it is accessible when player is offline
    // For other entities, default PersistentDataHolder is fine
    return new DatabaseHolder(
      new DatabaseEntry('players', storage.uniqueId.toString()),
    );
  } else if (storage instanceof ItemStack) {
    // Use wrapper that automatically sets ItemMeta on changes
    return new ItemStackHolder(storage, storage.itemMeta);
  } else if (storage instanceof Block) {
    // Storage custom block data in database by location
    // Custom building materials etc. won't have data, so this is fine
    return new DatabaseHolder(
      new DatabaseEntry('blocks', locationToString(storage.location)),
    );
  } else if (storage instanceof DatabaseEntry) {
    return new DatabaseHolder(storage);
  } else if (storage instanceof PersistentDataHolder) {
    return new BukkitHolder(storage.persistentDataContainer);
  } else {
    throw new Error('unknown dataHolder storage');
  }
}

function locationToString(location: Location) {
  return `${location.x},${location.y},${location.z}`;
}

function fromJson<T extends object>(
  type: DataType<T>,
  json: string | null,
  validateSchema: boolean,
): T | null {
  if (json == null) {
    return null;
  }
  // Assign to default data from schema
  const schema = type.schema;
  const obj = schema.default();
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
  type: DataType<T>,
  data: T,
  validateSchema: boolean,
): string {
  // If asked, validate schema before creating JSON
  if (validateSchema) {
    const schema = type.schema;
    if (schema != undefined) {
      schema.validateSync(data);
    } else {
      // Asked to validate, but couldn't do that
      console.warn(`Missing schema for ${type.name}`);
    }
  }
  return JSON.stringify(data);
}

function intToBoolean(value: number | null): boolean | null {
  return value != null ? value != 0 : null;
}

function namespacedKey(key: string): NamespacedKey {
  // TODO CraftJS should have public wrapper for __craftjs.plugin
  return new NamespacedKey('vk', key);
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
          value ? 1 : 0,
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Interop API not exposed yet (CraftJS#44)
          __interop.toDouble(value),
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

function checkType(value: any, type: any) {
  if (value == null) {
    return; // Null can be any type (annoying, but consistent)
  } else if (type == 'integer') {
    if (typeof value != 'number' || value != Math.floor(value)) {
      throw new Error(`type of ${value} is not integer`);
    }
  } else if (typeof value != type) {
    throw new Error(`type of ${value} is not ${type}`);
  }
}

/**
 * Stores data by prefix in database.
 */
class DatabaseHolder extends DataHolder {
  table: Table<any, any>;
  prefix: string;

  constructor(entry: DatabaseEntry) {
    super();
    this.table = getTable(entry.table);
    this.prefix = entry.key + '.';
  }

  get(key: string, type: any, validateSchema = true): any {
    const value = this.table.get(this.prefix + key);
    if (typeof type == 'string') {
      checkType(value, type); // boolean, integer, number or string
      return value;
    } else {
      checkType(value, 'string'); // JSON string
      return fromJson(type, value, validateSchema);
    }
  }

  set(key: string, type: any, value: any, validateSchema = true): void {
    const fullKey = this.prefix + key;
    if (typeof type == 'string') {
      this.table.set(fullKey, value); // boolean, integer, number or string
    } else {
      this.table.set(fullKey, toJson(type, value, validateSchema));
    }
  }

  delete(key: string): void {
    this.table.delete(this.prefix + key);
  }
}

/**
 * Wraps BukkitHolder to automatically setItemMeta() after modifications.
 */
class ItemStackHolder extends BukkitHolder {
  private stack: ItemStack;
  private meta: ItemMeta;

  constructor(stack: ItemStack, meta: ItemMeta) {
    super(meta.persistentDataContainer);
    this.stack = stack;
    this.meta = meta;
  }

  set(key: string, type: any, value: any, validateSchema = true): void {
    super.set(key, type, value, validateSchema); // Set to container
    this.stack.itemMeta = this.meta; // Re-set ItemMeta
  }

  delete(key: string): void {
    super.delete(key);
    this.stack.itemMeta = this.meta;
  }
}
