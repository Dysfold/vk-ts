import {
  Bukkit,
  EntityEffect,
  GameMode,
  Sound,
  SoundCategory,
} from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerJoinEvent } from 'org.bukkit.event.player';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { dataHolder } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import { DeathData } from './DeathData';
import { respawnPlayer } from './respawning';

// Replace this with the actual Tuonela-world
export const TUONELA_WORLD =
  Bukkit.server.getWorld('tuonela') || // In the production server, there should be world named "tuonela"
  Bukkit.server.getWorld('world_the_nether') || // Default fallback for development servers (nether)
  Bukkit.server.worlds[1] || // This is usually nether
  Bukkit.server.worlds[0]; // The server has only 1 world??

export async function startTuonela(player: Player) {
  player.teleport(TUONELA_WORLD.spawnLocation);
  addPlayerToTuonelaPlayers(player);
  await wait(0.1, 'seconds');
  playTuonelaJoinEffects(player);
  await wait(0.7, 'seconds');
  player.sendTitle('', 'Olet kuollut', 40, 40, 30);
}

// TODO: Multiple spawnpoints in the Tuonela
export function getTuonelaSpawnLocation(player: Player) {
  return TUONELA_WORLD.spawnLocation;
}

registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (player.world === TUONELA_WORLD) {
    addPlayerToTuonelaPlayers(player);
  } else {
    tuonelaPlayers.delete(player);
  }
});

// All players in the Tuonela
// Used to display the countdown and to respawn
const tuonelaPlayers = new Map<Player, number>();

for (const player of Bukkit.server.onlinePlayers) {
  if (player.world === TUONELA_WORLD) {
    addPlayerToTuonelaPlayers(player);
  }
}

function addPlayerToTuonelaPlayers(player: Player) {
  const view = dataView(DeathData, dataHolder(player));
  tuonelaPlayers.set(player, view.respawnTime);
}

// Display countdown and check if it is over
setInterval(() => {
  const now = new Date().getTime();
  tuonelaPlayers.forEach((time, player) => {
    if (!player.isOnline()) {
      tuonelaPlayers.delete(player);
      return;
    }
    if (player.world !== TUONELA_WORLD) {
      tuonelaPlayers.delete(player);
      return;
    }
    if (player.gameMode === GameMode.CREATIVE) return;
    if (player.gameMode === GameMode.SPECTATOR) return;

    if (time < now) {
      respawnPlayer(player);
      tuonelaPlayers.delete(player);
      return;
    }
    // Player is still in the Tuonela
    const durationString = getCountdownString(time);
    player.sendActionBar(durationString);
  });
}, 1000);

// Get the countdown string for the action bar
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
function getCountdownString(time: number) {
  const now = new Date().getTime();
  const diff = time - now;

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);
  const seconds = Math.floor((diff % MINUTE) / SECOND);

  const daysStr = days > 0 ? `${days}d ` : '';
  const hoursStr = hours > 0 ? `${hours}h ` : '';
  const minutesStr = minutes > 0 ? `${minutes}min ` : '';
  const secondsStr = seconds > 0 ? `${seconds}s ` : '';

  return daysStr + hoursStr + minutesStr + secondsStr;
}

function playTuonelaJoinEffects(player: Player) {
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.BLINDNESS, 50, 1, false, false, false),
  );
  player.playEffect(EntityEffect.TOTEM_RESURRECT);
  player.playSound(
    player.location,
    Sound.BLOCK_END_PORTAL_SPAWN,
    SoundCategory.NEUTRAL,
    1,
    1,
  );
}
