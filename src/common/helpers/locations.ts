import { Location } from 'org.bukkit';

/**
 * Calculate distance between 2 locations. If the worlds are different, return max number
 * @param a First location
 * @param b Second location
 */
export function distanceBetween(a: Location, b: Location): number {
  if (a.world != b.world) {
    return Number.MAX_VALUE; // Different worlds are very far away, indeed
  }
  return a.distance(b); // Calculate distance normally
}
