import { PlayerEggThrowEvent } from 'org.bukkit.event.player';

registerEvent(PlayerEggThrowEvent, (event) => {
  event.setHatching(false);
});
