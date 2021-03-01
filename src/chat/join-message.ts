import { Bukkit } from 'org.bukkit';
import { PlayerJoinEvent, PlayerQuitEvent } from 'org.bukkit.event.player';

const MAX_PLAYERS = Bukkit.server.maxPlayers;

registerEvent(PlayerJoinEvent, (event) => {
  const name = event.player.name;
  const players = Bukkit.server.onlinePlayers.size();

  let msg;
  if (event.player.hasPlayedBefore()) {
    msg = `§e${name} liittyi. Pelaajia paikalla: §6${players}/${MAX_PLAYERS} `;
  } else {
    msg = `§e${name} liittyi peliin ensimmäistä kertaa! Pelaajia paikalla: §6${players}/${MAX_PLAYERS} `;
  }

  event.joinMessage = msg;
});

registerEvent(PlayerQuitEvent, (event) => {
  const name = event.player.name;
  const players = Bukkit.server.onlinePlayers.size() - 1;
  const msg = `§e${name} poistui. Pelaajia paikalla: §6${players}/${MAX_PLAYERS}`;
  event.quitMessage = msg;
});
