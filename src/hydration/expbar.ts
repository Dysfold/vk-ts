import { Float } from 'java.lang';
import { PlayerExpChangeEvent, PlayerJoinEvent } from 'org.bukkit.event.player';

const HYDRATION_ON_FIRST_JOIN = 0.5;

// Prevent Minecraft from changing the exp bar
registerEvent(PlayerExpChangeEvent, (event) => {
  event.amount = 0;
});

// Set players hydration level on first join
registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (!player.hasPlayedBefore) {
    player.exp = (new Float(HYDRATION_ON_FIRST_JOIN) as unknown) as number;
  }
});
