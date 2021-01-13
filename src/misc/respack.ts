import { Player } from 'org.bukkit.entity';
import {
  PlayerJoinEvent,
  PlayerResourcePackStatusEvent,
} from 'org.bukkit.event.player';

const URL =
  'https://github.com/Laetta/respack/releases/download/latest/vk-respack.zip';

let hash: string;

async function updateHash() {
  const res = await fetch(
    'https://api.github.com/repos/Laetta/respack/releases/latest',
  );
  const data = await res.json();
  hash = data.body;
}

updateHash();

registerEvent(PlayerJoinEvent, (event) => {
  downloadResourcePack(event.player);
});

registerEvent(PlayerResourcePackStatusEvent, (event) => {
  if (event.status.toString() === 'DECLINED') {
    sendWarning(event.player);
  }
});

function downloadResourcePack(player: Player) {
  if (hash) player.setResourcePack(URL, hash);
  else player.resourcePack = URL;
}

function sendWarning(player: Player) {
  player.sendTitle('HUOMIO!', 'Resurssipaketti puuttuu', 1, 40, 1);
}

registerCommand('updatehash', (sender) => {
  if (!sender.isOp()) return;
  updateHash();
});
