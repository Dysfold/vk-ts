import { Database, Table } from 'craftjs-plugin';

/**
 * Main Valtakausi database. In future, there might be other databases so we
 * don't export this but use getTable() instead.
 */
const mainDb = new Database('valtakausi');

/**
 * Tables that someone has asked for, cached.
 */
const tables: Map<string, Table<any, any>> = new Map();

/**
 * Gets key-value database table.
 * @param name Table name.
 */
export function getTable(name: string): Table<any, any> {
  let table = tables.get(name);
  if (!table) {
    table = mainDb.getTable(name);
    tables.set(name, table);
  }
  return table;
}

/**
 * An entry in one table.
 */
export class DatabaseEntry {
  /**
   * Table in database.
   */
  table: string;
  /**
   * Key to data.
   */
  key: string;

  constructor(table: string, key: string) {
    this.table = table;
    this.key = key;
  }
}
