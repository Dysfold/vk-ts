import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';

export const CROPS = new Set([
  Material.WHEAT.ordinal(),
  Material.BEETROOT.ordinal(),
  Material.TALL_GRASS.ordinal(),
  Material.GRASS.ordinal(),
]);

export const DROPS_REMOVED = new Set([
  Material.TALL_GRASS.ordinal(),
  Material.GRASS.ordinal(),
]);

const CHANCE_WITHOUT_TOOL = 0.02;

const Sickle = new CustomItem({
  id: 1,
  name: 'Sirppi',
  type: Material.IRON_HOE,
  modelId: 1,
});

const Scythe = new CustomItem({
  id: 2,
  name: 'Viitake',
  type: Material.IRON_HOE,
  modelId: 2,
});

registerEvent(BlockBreakEvent, (event) => {
  if (!CROPS.has(event.block.type.ordinal())) return;
  if (Sickle.check(event.player.itemInHand)) return;
  if (Scythe.check(event.player.itemInHand)) {
    useScythe(event.block);
    return;
  }
  if (Math.random() < CHANCE_WITHOUT_TOOL) return;
  event.setCancelled(true);
});

// Destroy crops and weeds on 3x3 area around the block
function useScythe(orig: Block) {
  const location = orig.location;
  const x = location.x;
  const z = location.z;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue; // Both are 0 -> same block
      const block = orig.world.getBlockAt(x + dx, location.y, z + dz);
      if (!CROPS.has(block.type.ordinal())) continue;

      // Remove seed drops from grass
      if (DROPS_REMOVED.has(block.type.ordinal())) block.type = Material.AIR;
      else block.breakNaturally();
    }
  }
}
