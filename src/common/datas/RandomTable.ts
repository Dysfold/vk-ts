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
    let rand = Math.floor(
      Math.random() * this.totalProbability(this.entries) + 1,
    );
    for (const entry of this.entries) {
      rand -= entry.probability;
      if (rand <= 0) return entry.value;
    }
    return null;
  }

  /**
   * @param amount Amount of entries to get. ( Ignored if unique property is set to true
   * and there isn't enough entries to fullfill amount )
   * @param unique Whether all entries should be unique. Defaults to false.
   * @returns Array of table entries based on probability. Null if table has no entries.
   */
  randomEntries(amount: number, unique?: boolean): T[] | null {
    let allEntries = [...this.entries];
    if (allEntries.length <= 0) return null;
    const entries: T[] = [];

    for (let i = 0; i < amount; i++) {
      let rand = Math.floor(
        Math.random() * this.totalProbability(allEntries) + 1,
      );
      for (const entry of allEntries) {
        rand -= entry.probability;
        if (rand > 0) continue;
        entries.push(entry.value);
        if (unique) allEntries = allEntries.filter((e) => e !== entry);
        break;
      }
    }
    return [...entries];
  }

  /**
   * @param entries Table entries.
   * @returns Total probability of all entries.
   */
  private totalProbability(entries: TableEntry<T>[]) {
    return entries.reduce((total, entry) => total + entry.probability, 0);
  }
}
