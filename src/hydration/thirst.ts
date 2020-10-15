import { Float } from 'java.lang';
import { GameMode } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';

// How often players' hydration level is decreased (seconds)
const THIRST_CYCLE_DURATION = 1;
const THIRST_CYCLE_HYDRATION = -0.01;
// If duration is 60s and hydration -0.1, the bar will last 100 mins

// How often dehydration effects are aplied (seconds)
const DEHYDRATION_CYCLE_DURATION = 10;

const DEHYDRATION_LEVEL = 0.2;
const MODERATE_DEHYDRATION_LEVEL = 0.09;
const SEVERE_DEHYDRATION_LEVEL = 0.06;

const SLOW1 = new PotionEffect(
  PotionEffectType.SLOW,
  DEHYDRATION_CYCLE_DURATION * 20 + 20,
  0,
);
const SLOW2 = new PotionEffect(
  PotionEffectType.SLOW,
  DEHYDRATION_CYCLE_DURATION * 20 + 20,
  1,
);
const SLOW3 = new PotionEffect(
  PotionEffectType.SLOW,
  DEHYDRATION_CYCLE_DURATION * 20 + 20,
  2,
);
const WEAKNESS3 = new PotionEffect(
  PotionEffectType.WEAKNESS,
  DEHYDRATION_CYCLE_DURATION * 20 + 20,
  2,
);
const BLINDNESS1 = new PotionEffect(
  PotionEffectType.BLINDNESS,
  DEHYDRATION_CYCLE_DURATION * 20 + 20,
  0,
);

const dehydratedPlayers = new Set<Player>();

// Reduce the hydration of the players
setInterval(() => {
  for (const player of server.onlinePlayers) {
    if (player.gameMode !== GameMode.SURVIVAL) return;

    const bar = limit(player.exp + THIRST_CYCLE_HYDRATION);
    player.exp = (new Float(bar) as unknown) as number;

    if (bar < DEHYDRATION_LEVEL) {
      if (!dehydratedPlayers.has(player)) {
        dehydratedPlayers.add(player);
      }

      let msg = '';
      if (bar < SEVERE_DEHYDRATION_LEVEL) {
        msg = 'Olet nääntymäisilläsi janoon';
      } else if (bar < MODERATE_DEHYDRATION_LEVEL) {
        msg = 'Tunnet olosi erittäin janoiseksi';
      } else {
        msg = 'Tunnet olosi janoiseksi';
      }
      player.sendTitle('', msg, 10, 40, 10);
    }
  }
}, THIRST_CYCLE_DURATION * 1000);

// Dehydration effects
setInterval(() => {
  // Reverse for-loop because we are deleting
  dehydratedPlayers.forEach((player) => {
    if (!player.isOnline || player.gameMode !== GameMode.SURVIVAL) {
      dehydratedPlayers.delete(player);
    }

    const bar = player.exp;
    if (bar < SEVERE_DEHYDRATION_LEVEL) {
      // Severe dehydration effects
      player.addPotionEffect(SLOW3);
      player.addPotionEffect(WEAKNESS3);
      player.addPotionEffect(BLINDNESS1);
    } else if (bar < MODERATE_DEHYDRATION_LEVEL) {
      // Moderate dehydration effects
      player.addPotionEffect(SLOW2);
      player.addPotionEffect(WEAKNESS3);
    } else if (bar < DEHYDRATION_LEVEL) {
      // Mild dehydration effects
      player.addPotionEffect(SLOW1);
    } else {
      // Player is hydrated. Remove from the list
      dehydratedPlayers.delete(player);
    }
  });
}, DEHYDRATION_CYCLE_DURATION * 1000);

function limit(x: number) {
  // Limit the exp number between 0 and 0.99 (1 will be new level)
  return Math.min(0.99, Math.max(0, x));
}
