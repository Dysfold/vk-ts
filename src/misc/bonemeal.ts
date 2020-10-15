import { List } from 'java.util';
import { Material } from 'org.bukkit';
import { BlockState } from 'org.bukkit.block';
import { BlockFertilizeEvent } from 'org.bukkit.event.block';

registerEvent(BlockFertilizeEvent, (event) => {
  const blocks = event.blocks;
  const cancel = !canBeFertilized(blocks);
  event.setCancelled(cancel);
});

function canBeFertilized(blocks: List<BlockState>) {
  for (const block of blocks) {
    switch (block.type) {
      case Material.SEAGRASS:
      case Material.TALL_SEAGRASS:
      case Material.GRASS:
      case Material.TALL_GRASS:
        // If the list contains any of the plants above
        return true;
    }
  }
  // Only if none of the blocks can be grown with bonemeal
  return false;
}
