import { translate } from 'craftjs-plugin/chat';
import { Material, GameMode } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

export const CROPS = new Map<Material, { hasDrops: boolean }>([
  [Material.WHEAT, { hasDrops: true }],
  [Material.BEETROOT, { hasDrops: true }],
  [Material.TALL_GRASS, { hasDrops: false }],
  [Material.GRASS, { hasDrops: false }],
]);

const CHANCE_WITHOUT_TOOL = 0.02;

const Sickle = new CustomItem({
  id: 1,
  name: translate('vk.sickle'),
  type: VkItem.TOOL,
});

const Scythe = new CustomItem({
  id: 2,
  name: translate('vk.scythe'),
  type: VkItem.TOOL,
});

registerEvent(BlockBreakEvent, (event) => {
  if (!CROPS.has(event.block.type)) return;
  if (event.player.gameMode === GameMode.CREATIVE) return;
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

      const crop = CROPS.get(block.type);
      if (!crop) continue;
      if (crop.hasDrops) block.breakNaturally();
      // Remove seed drops from grass
      else block.type = Material.AIR;
    }
  }
}
