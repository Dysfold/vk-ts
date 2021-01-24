import { PlayerPostRespawnEvent } from 'com.destroystokyo.paper.event.player';
import { PlayerExpChangeEvent, PlayerJoinEvent } from 'org.bukkit.event.player';

const HYDRATION_ON_FIRST_JOIN = 0.5;
const HYDRATION_ON_RESPAWN = 0.5;

// Prevent Minecraft from changing the exp bar
registerEvent(PlayerExpChangeEvent, (event) => {
  event.amount = 0;
});

// Set players hydration level on first join
registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (!player.hasPlayedBefore) {
    player.exp = HYDRATION_ON_FIRST_JOIN;
  }
});

// Set players hydration level after respawn
registerEvent(PlayerPostRespawnEvent, (event) => {
  event.player.exp = HYDRATION_ON_RESPAWN;
});
