import { Bukkit, GameMode } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { addHydration, getHydration } from './expbar';

/**
 * How often players' hydration level is decreased (seconds)
 * If duration is 60s and hydration -0.01, the bar will last 100 mins
 */
const THIRST_CYCLE_DURATION = 3;
const THIRST_CYCLE_HYDRATION = -0.01;

/**
 * How often dehydration effects are aplied (seconds)
 */
const DEHYDRATION_CYCLE_DURATION = 10;

const DehydrationLevel = {
  MILD: 0.2,
  MODERATE: 0.09,
  SEVERE: 0.06,
};

const dehydratedPlayers = new Set<Player>();

// Reduce the hydration of the players
setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    reduceHydrationOf(player);
  }
}, THIRST_CYCLE_DURATION * 1000);

function reduceHydrationOf(player: Player) {
  if (player.gameMode !== GameMode.SURVIVAL) return;

  addHydration(player, THIRST_CYCLE_HYDRATION);
  const hydration = getHydration(player);

  if (hydration < DehydrationLevel.MILD) {
    becomeDehydrated(player, hydration);
  }
}

function becomeDehydrated(player: Player, hydration: number) {
  dehydratedPlayers.add(player);

  const msg = getDehydrationMessage(hydration);
  player.sendTitle('', msg, 10, 40, 10);
}

function getDehydrationMessage(hydration: number) {
  if (hydration < DehydrationLevel.SEVERE)
    return 'Olet nääntymäisilläsi janoon';

  if (hydration < DehydrationLevel.MODERATE)
    return 'Tunnet olosi erittäin janoiseksi';

  return 'Tunnet olosi janoiseksi';
}

// Dehydration effects
setInterval(() => {
  dehydratedPlayers.forEach((player) => {
    addDehydrationEffects(player);
  });
}, DEHYDRATION_CYCLE_DURATION * 1000);

function addDehydrationEffects(player: Player) {
  if (!isDehydrated(player)) return;

  const hydration = getHydration(player);

  if (hydration < DehydrationLevel.SEVERE) {
    return addSevereDehydrationEffects(player);
  }
  if (hydration < DehydrationLevel.MODERATE) {
    return addModerateDehydrationEffect(player);
  }
  if (hydration < DehydrationLevel.MILD) {
    return addMildDehydrationEffect(player);
  }
}

function isDehydrated(player: Player) {
  if (!player.isOnline()) return false;
  if (player.gameMode == GameMode.CREATIVE) return false;
  if (player.gameMode == GameMode.SPECTATOR) return false;
  if (getHydration(player) > DehydrationLevel.MILD) return false;
  return true;
}

/**********************
 * Dehydration effects
 **********************/

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

function addMildDehydrationEffect(player: Player) {
  player.addPotionEffect(SLOW1);
}

function addModerateDehydrationEffect(player: Player) {
  player.addPotionEffect(SLOW2);
  player.addPotionEffect(WEAKNESS3);
}

function addSevereDehydrationEffects(player: Player) {
  player.addPotionEffect(SLOW3);
  player.addPotionEffect(WEAKNESS3);
  player.addPotionEffect(BLINDNESS1);
}
