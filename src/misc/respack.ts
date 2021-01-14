import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import {
  PlayerJoinEvent,
  PlayerResourcePackStatusEvent,
} from 'org.bukkit.event.player';

const URL =
  'https://github.com/Laetta/respack/releases/download/latest/vk-respack.zip';

let hash: string;

async function updateHash(announce = false) {
  const res = await fetch(
    'https://api.github.com/repos/Laetta/respack/releases/latest',
  );
  const data = await res.json();
  const newHash = data.body as string;

  if (announce) {
    if (newHash && hash !== newHash) {
      Bukkit.server.broadcastMessage(
        '[Ilmoitus] Resurssipaketti on päivittynyt! Ota uusi resurssipaketti käyttöön komennolla /resurssipaketti',
      );
    }
  }
  hash = newHash || hash;
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
  else {
    console.error('Resource pack hash ei löytynyt');
    player.resourcePack = URL;
  }
}

function sendWarning(player: Player) {
  player.sendTitle('HUOMIO!', 'Resurssipaketti puuttuu', 1, 40, 1);
}

registerCommand('updatehash', () => {
  updateHash(true);
});

registerCommand(
  'resurssipaketti',
  (sender) => {
    downloadResourcePack((sender as unknown) as Player);
  },
  {
    accessChecker: () => true,
    executableBy: 'players',
  },
);

setInterval(() => {
  updateHash(true);
}, 2 * 60 * 1000);
