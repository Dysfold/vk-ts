import { UUID } from 'java.util';
import { Bukkit, Location } from 'org.bukkit';

export function locationToObj(loc: Location) {
  return {
    x: loc.x,
    y: loc.y,
    z: loc.z,
    worldId: loc.world.uID.toString(),
  };
}

export function objToLocation(obj: {
  x: number;
  y: number;
  z: number;
  worldId: string;
}) {
  const world =
    Bukkit.server.getWorld(UUID.fromString(obj.worldId)) ??
    Bukkit.server.worlds[0];
  return new Location(world, obj.x, obj.y, obj.z);
}
