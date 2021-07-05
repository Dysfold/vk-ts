import { color, component } from 'craftjs-plugin/chat';
import { NamedTextColor } from 'net.kyori.adventure.text.format';
import { Bukkit } from 'org.bukkit';
import { PlayerJoinEvent, PlayerQuitEvent } from 'org.bukkit.event.player';

const MAX_PLAYERS = Bukkit.server.maxPlayers;

registerEvent(PlayerJoinEvent, (event) => {
  const name = event.player.name;
  const players = Bukkit.server.onlinePlayers.size();

  if (event.player.hasPlayedBefore()) {
    event.joinMessage(
      component(
        color(NamedTextColor.YELLOW, `${name} liittyi! Pelaajia paikalla: `),
        color(NamedTextColor.GOLD, `${players}/${MAX_PLAYERS} `),
      ),
    );
  } else {
    event.joinMessage(
      component(
        color(
          NamedTextColor.YELLOW,
          `${name} liittyi peliin ensimmäistä kertaa! Pelaajia paikalla: `,
        ),
        color(NamedTextColor.GOLD, `${players}/${MAX_PLAYERS} `),
      ),
    );
  }
});

registerEvent(PlayerQuitEvent, (event) => {
  const name = event.player.name;
  const players = Bukkit.server.onlinePlayers.size() - 1;
  event.quitMessage(
    component(
      color(NamedTextColor.YELLOW, `${name} poistui. Pelaajia paikalla: `),
      color(NamedTextColor.GOLD, `${players}/${MAX_PLAYERS} `),
    ),
  );
});
