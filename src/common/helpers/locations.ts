import { UUID } from 'java.util';
import { Bukkit, Location } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import * as yup from 'yup';

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

export const YUP_LOCATION = yup
  .object({
    x: yup.number().required(),
    y: yup.number().required(),
    z: yup.number().required(),
    worldId: yup.string().required(),
  })
  .required();

// export type YupLocation = typeof YUP_LOCATION;
export type YupLocation = yup.TypeOf<typeof YUP_LOCATION>;

export function yupLocToLoc(yupLoc: YupLocation) {
  const world = Bukkit.getWorld(UUID.fromString(yupLoc.worldId || ''));
  if (!world) return undefined;
  const [x, y, z] = [yupLoc.x, yupLoc.y, yupLoc.z];

  if (x === undefined) return undefined;
  if (y === undefined) return undefined;
  if (z === undefined) return undefined;

  return new Location(world, x, y, z);
}

/**
 * Get the center location of the full block
 * @param block The block
 * @returns Center location
 */
export function centerOf(block: Block) {
  return block.location.add(0.5, 0.5, 0.5);
}
