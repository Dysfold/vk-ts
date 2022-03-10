import { PlayerPostRespawnEvent } from 'com.destroystokyo.paper.event.player';
import { Player } from 'org.bukkit.entity';
import { PlayerExpChangeEvent, PlayerJoinEvent } from 'org.bukkit.event.player';

const HYDRATION_ON_FIRST_JOIN = 0.5;
const HYDRATION_ON_RESPAWN = 0.5;

export function getHydration(player: Player) {
  return player.exp;
}

export function addHydration(player: Player, amount: number) {
  // Limit the exp number between 0 and 0.99 (1 will be new level)

  player.exp = Math.min(0.99, Math.max(0, player.exp + amount));
}

export function setHydration(player: Player, hydration: number) {
  player.exp = hydration;
}

// Prevent Minecraft from changing the exp bar
registerEvent(PlayerExpChangeEvent, (event) => {
  event.amount = 0;
});

// Set players hydration level on first join
registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (!player.hasPlayedBefore) {
    setHydration(player, HYDRATION_ON_FIRST_JOIN);
  }
});

// Set players hydration level after respawn
registerEvent(PlayerPostRespawnEvent, (event) => {
  setHydration(event.player, HYDRATION_ON_RESPAWN);
});
