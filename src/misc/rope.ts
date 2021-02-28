import { BlockSpreadEvent } from 'org.bukkit.event.block';
import { Material } from 'org.bukkit';

registerEvent(BlockSpreadEvent, async (event) => {
  if (
    event.source.type == Material.WEEPING_VINES ||
    event.source.type == Material.WEEPING_VINES_PLANT
  ) {
    event.setCancelled(true);
  }
});
