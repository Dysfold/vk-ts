/**
 * @param chance Chance of success. 0-1
 * @returns True of false based on the chance.
 */
export function chanceOf(chance: number) {
  return Math.random() < chance;
}
