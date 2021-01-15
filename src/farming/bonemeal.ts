import { Material } from 'org.bukkit';
import { BlockState } from 'org.bukkit.block';
import { BlockFertilizeEvent } from 'org.bukkit.event.block';

const allowedBlocks = new Set([
  Material.SEAGRASS,
  Material.TALL_SEAGRASS,
  Material.GRASS,
  Material.TALL_GRASS,
]);

registerEvent(BlockFertilizeEvent, (event) => {
  const blocks = event.blocks;
  const cancel = !canBeFertilized(blocks);
  event.setCancelled(cancel);
});

function canBeFertilized(blocks: BlockState[]) {
  for (const block of blocks) {
    if (allowedBlocks.has(block.type)) return true;
  }
  // Only if none of the blocks can be grown with bonemeal
  return false;
}
