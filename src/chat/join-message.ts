import { PlayerJoinEvent, PlayerQuitEvent } from 'org.bukkit.event.player';

const MAX_PLAYERS = server.maxPlayers;

registerEvent(PlayerJoinEvent, (event) => {
  const name = event.player.displayName;
  const players = server.onlinePlayers.length;

  let msg;
  if (event.player.hasPlayedBefore()) {
    msg = `§e${name} liittyi. Pelaajia paikalla: §6${players}/${MAX_PLAYERS} `;
  } else {
    msg = `§e${name} liittyi peliin ensimmäistä kertaa! Pelaajia paikalla: §6${players}/${MAX_PLAYERS} `;
  }

  event.setJoinMessage(msg);
});

registerEvent(PlayerQuitEvent, (event) => {
  const name = event.player.displayName;
  const players = server.onlinePlayers.length - 1;
  const msg = `§e${name} poistui. Pelaajia paikalla: §6${players}/${MAX_PLAYERS}`;
  event.setQuitMessage(msg);
});
