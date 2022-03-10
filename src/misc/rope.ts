import { BlockSpreadEvent } from 'org.bukkit.event.block';
import { VkMaterial } from '../common/items/VkMaterial';

registerEvent(BlockSpreadEvent, async (event) => {
  if (
    event.source.type == VkMaterial.ROPE ||
    event.source.type == VkMaterial.ROPE_STEM
  ) {
    event.setCancelled(true);
  }
});
