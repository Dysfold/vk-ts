import { Location, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { BlockGrowEvent } from 'org.bukkit.event.block';

const YEAST_GROWTH_RATE = 0.05;
const YEAST_LIGHT_LEVEL = 3;

registerEvent(BlockGrowEvent, (event) => {
  const block = event.block;
  if (block.type !== Material.NETHER_WART) return;

  if (block.lightLevel > YEAST_LIGHT_LEVEL) {
    event.setCancelled(true);
    block.type = Material.DEAD_BUSH; // TODO: Maybe use different block because dead bush breaks after blockupdate?
    return;
  }
  // Slow down the growt
  if (Math.random() > YEAST_GROWTH_RATE) {
    event.setCancelled(true);
    return;
  }

  if (!hasWaterNearby(block.location)) {
    event.setCancelled(true);
    event.block.getRelative(BlockFace.DOWN).type = Material.COARSE_DIRT;
  }
});

function hasWaterNearby(location: Location) {
  const x = location.x;
  const y = location.y;
  const z = location.z;
  for (let xi = x - 2; xi <= location.x + 2; xi++) {
    for (let zi = z - 2; zi <= z + 2; zi++) {
      const material = location.world.getBlockAt(xi, y - 1, zi).type;
      if (material === Material.WATER) {
        return true;
      }
    }
  }
  return false;
}
