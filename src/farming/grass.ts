import { Material } from 'org.bukkit';
import { BlockDropItemEvent } from 'org.bukkit.event.block';

registerEvent(BlockDropItemEvent, (event) => {
  for (const item of event.items) {
    if (item.itemStack.type === Material.WHEAT_SEEDS) {
      item.remove();
    }
  }
});
