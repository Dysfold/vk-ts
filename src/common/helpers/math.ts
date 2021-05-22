/**
 * @param chance Chance of success. 0-1
 * @returns True of false based on the chance.
 */
export function chanceOf(chance: number) {
  return Math.random() < chance;
}

/**
 * Performs min-max scaling for a number
 * @param x Value to be scaled (between min and max)
 * @param min Value for 0%
 * @param max Value for 100%
 */
export function minMax(x: number, min: number, max: number) {
  const value = (x - min) / (max - min);
  return Math.min(1, Math.max(value, 0));
}

/**
 * Round a (small) number with given decimal places
 * @param n Number to be rounded
 * @param decimals Number of decimals places
 * @returns The rounded number
 */
export function round(n: number, decimals = 1) {
  const multiplier = 10 ** decimals;
  return Math.round(multiplier * n) / multiplier;
}
