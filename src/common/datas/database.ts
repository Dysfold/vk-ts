/**
 * Names of all databases.
 */
const TABLE_NAMES = ['players', 'test'];

/**
 * An entry in database.
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

/**
 * Database table.
 */
export interface Table {
  get(key: string): any;
  put(key: string, value: any): void;
  remove(key: string): void;
}

/**
 * Gets a table(must be specified in TABLE_NAMES).
 * @param name Database name.
 * @returns Database.
 */
export function getTable(name: string): Table {
  return TABLES[name];
}

function openDatabase(): Record<string, Table> {
  const db = (__plugin as any).openDatabase('valtakausi.db');
  const tables: Record<string, Table> = {};
  for (const name of TABLE_NAMES) {
    tables[name] = db.openMap(name);
  }
  return tables;
}

const TABLES: Record<string, Table> = openDatabase();
