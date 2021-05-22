import { BlockFace } from 'org.bukkit.block';
import { Vector } from 'org.bukkit.util';

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

export function degToRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

/**
 * Rotates the BlockFace around Y-axis
 * @param face BlockFace to be rotated around Y
 * @param degrees Rotation amount in degrees
 * @returns Result BlockFace
 */
export function rotateFace(face: BlockFace, degrees: number) {
  const radians = degToRad(degrees);
  const rotatedVec = face.direction.rotateAroundY(radians);
  return toCardinalDirection(rotatedVec);
}

/**
 * Calculates closest cardinal direction for given vector.
 * @returns North, east, south or west
 */
export function toCardinalDirection(vector: Vector) {
  const cardinalDirections = [
    BlockFace.NORTH,
    BlockFace.EAST,
    BlockFace.SOUTH,
    BlockFace.WEST,
  ];
  const sortedFaces = cardinalDirections.sort((a, b) => {
    return (
      a.direction.subtract(vector).lengthSquared() -
      b.direction.subtract(vector).lengthSquared()
    );
  });
  return sortedFaces[0];
}
