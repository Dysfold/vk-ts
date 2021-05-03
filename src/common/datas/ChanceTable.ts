export interface TableEntry<T> {
  value: T;
  rarity: number;
}

export class ChanceTable<T> {
  private entries: TableEntry<T>[];

  /**
   * A chance table for getting entries based on rarity.
   * @param entries Array of table entries.
   */
  constructor(entries: TableEntry<T>[]) {
    this.entries = entries;
  }

  /**
   * Returns a randomly selected entry from LootTable
   * based on rarity. Null if table has no entries.
   */
  randomEntry(): T | null {
    if (this.entries.length === 0) return null;

    let randomRarity = Math.floor(Math.random() * this.totalRarity() + 1);

    for (const entry of this.entries) {
      randomRarity -= entry.rarity;
      if (randomRarity <= 0) return entry.value;
    }
    return null;
  }

  /**
   * Returns randomly selected entries from LootTable.
   * Null if table has no entries.
   * @param amount Amount of entries to get.
   */
  randomEntries(amount: number): TableEntry<T>[] | null {
    if (this.entries.length <= 0) return null;

    const entries: TableEntry<T>[] = [];

    for (let i = 0; i < amount; i++) {
      let randomRarity = Math.floor(Math.random() * this.totalRarity() + 1);

      for (const entry of this.entries) {
        randomRarity -= entry.rarity;
        if (randomRarity <= 0) entries.push(entry);
        break;
      }
    }
    return entries;
  }

  /**
   * Returns total rarity of all entries.
   */
  private totalRarity() {
    let total = 0;
    for (const entry of this.entries) {
      total += entry.rarity;
    }
    return total;
  }
}
