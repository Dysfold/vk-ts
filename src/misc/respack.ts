import { Player } from 'org.bukkit.entity';
import {
  PlayerJoinEvent,
  PlayerResourcePackStatusEvent,
} from 'org.bukkit.event.player';

const URL =
  'https://github.com/Laetta/respack/releases/download/latest/vk-respack.zip';

registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  player.setResourcePack(URL);
});

registerEvent(PlayerResourcePackStatusEvent, (event) => {
  if (event.status.toString() === 'DECLINED') {
    sendWarning(event.player);
  }
});

function sendWarning(player: Player) {
  player.sendTitle('HUOMIO!', 'Resurssipaketti puuttuu', 1, 100, 1);
}
