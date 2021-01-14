type Newable<T> = new (...args: any[]) => T;

interface Array<T> {
  /**
   * Removes the value at given index from array and shifts back the values
   * after it.
   * @param index Array index.
   */
  remove(index: number): void;
  /**
   * Tries to remove the first occurrance of given value from this array.
   * @param value Value to remove.
   * @returns If the value was found and removed.
   */
  removeValue(value: T): boolean;
}
