import { NamespacedKey } from 'org.bukkit';
import {
  PersistentDataType,
  PersistentDataContainer,
  PersistentDataHolder,
} from 'org.bukkit.persistence';
import { Integer, Double } from 'java.lang';

/**
 * A custom data holder.
 */
export abstract class DataHolder {
  /**
   * Gets an object.
   * @param key Key.
   * @param type Type of data.
   * @returns Object of given type or null.
   */
  abstract get<T>(key: string, type: new () => T): T | null;

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
   */
  abstract set<T>(key: string, type: new () => T, value: T): void;

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
   * @param type 'integer' or 'boolean'.
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
}

export function dataHolder(storage: PersistentDataHolder): DataHolder {
  // TODO other storage types
  return new BukkitHolder(storage.getPersistentDataContainer());
}

function fromTypedJson<T>(
  type: new () => T,
  json: string | null,
): T | undefined {
  if (json == null) {
    return undefined;
  }
  const data = JSON.parse(json);
  if (data.t != type.name) {
    throw new Error(`type in JSON is ${data.t}, ${type.name} expected`);
  }
  return data.d;
}

function toTypedJson<T>(type: new () => T, data: T): string {
  return JSON.stringify({ t: type.name, d: data });
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

  get(key: string, type: any): any {
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
        return fromTypedJson(
          type,
          this.container.get(containerKey, PersistentDataType.STRING),
        );
    }
  }

  set(key: string, type: any, value: any): void {
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
          toTypedJson(type, value),
        );
    }
  }
}
