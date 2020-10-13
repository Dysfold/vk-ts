import { PortalCreateEvent } from 'org.bukkit.event.world';

registerEvent(PortalCreateEvent, (event) => {
  event.setCancelled(true);
});
