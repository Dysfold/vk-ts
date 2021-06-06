export interface TableEntry<T> {
  value: T;
  probability: number;
}

export class RandomTable<T> {
  private entries: TableEntry<T>[];

  /**
   * A table for getting entries based on probability.
   * @param entries Array of table entries.
   */
  constructor(entries: TableEntry<T>[]) {
    this.entries = entries;
  }

  /**
   * @returns Random table entry based on probability.
   * Null if table has no entries.
   */
  randomEntry(): T | null {
    let rand = Math.floor(Math.random() * this.totalProbability() + 1);
    for (const entry of this.entries) {
      rand -= entry.probability;
      if (rand <= 0) return entry.value;
    }
    return null;
  }

  /**
   * @param amount Amount of entries to get.
   * @returns Array of table entries based on probability. Null if table has no entries.
   */
  randomEntries(amount: number): T[] | null {
    if (this.entries.length <= 0) return null;
    const entries: T[] = [];
    for (let i = 0; i < amount; i++) {
      let rand = Math.floor(Math.random() * this.totalProbability() + 1);
      for (const entry of this.entries) {
        rand -= entry.probability;
        if (rand <= 0) entries.push(entry.value);
        break;
      }
    }
    return [...entries];
  }

  /**
   * @returns Total probability of all entries.
   */
  private totalProbability() {
    return this.entries.reduce((total, entry) => total + entry.probability, 0);
  }
}
