import { ChatColor, Material } from 'org.bukkit';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';

// A mob can be named only once
registerEvent(PlayerInteractEntityEvent, (event) => {
  const inv = event.player.inventory;
  if (
    inv.itemInMainHand?.type !== Material.NAME_TAG &&
    inv.itemInOffHand?.type !== Material.NAME_TAG
  )
    return;
  if (event.rightClicked.customName()) {
    event.setCancelled(true);
    event.player.sendActionBar(ChatColor.RED + 'Et voi nimetä tätä uudelleen');
  }
});
