import { Material } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

// Prevents farmland destroying by trampling
registerEvent(PlayerInteractEvent, (event) => {
  if (
    event.action === Action.PHYSICAL &&
    event.clickedBlock?.type === Material.FARMLAND
  ) {
    event.setCancelled(true);
  }
});
