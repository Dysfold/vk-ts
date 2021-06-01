import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import {
  PlayerJoinEvent,
  PlayerResourcePackStatusEvent,
} from 'org.bukkit.event.player';
import { Status } from 'org.bukkit.event.player.PlayerResourcePackStatusEvent';

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
    // Check if the hash has changed, and then announce the new resource pack
    if (newHash && hash !== newHash) {
      Bukkit.server.broadcastMessage(
        '[Ilmoitus] Resurssipaketti on päivittynyt! Ota uusi resurssipaketti käyttöön liittymällä peliin uudelleen tai komennolla /resurssipaketti',
      );
    }
  }
  hash = newHash || hash;
}

updateHash();

registerEvent(PlayerJoinEvent, (event) => {
  downloadResourcePack(event.player);
});

const failedDownloads = new Set<Player>();

registerEvent(PlayerResourcePackStatusEvent, async (event) => {
  const player = event.player;

  // Player declined the resource pack download
  switch (event.status) {
    case Status.DECLINED:
      sendWarning(player);
      break;

    // Something went wrong while downloading. Try once more
    case Status.FAILED_DOWNLOAD:
      if (failedDownloads.has(player)) {
        // Second time player failed to download
        console.warn('Pelaajan ' + player.name + ' respack lataus epäonnistui');
        sendWarning(player);
        failedDownloads.delete(player);
      }
      // Try to download once more
      // For some reason, when the resource pack (repo / hash) is updated, the first download fails
      // This is the fallback and will download the resource pack
      downloadResourcePack(player);
      failedDownloads.add(player);
      break;

    case Status.SUCCESSFULLY_LOADED:
      failedDownloads.delete(player);
      break;
  }
});

function downloadResourcePack(player: Player) {
  if (hash) {
    player.setResourcePack(URL, hash);
  } else {
    // This might happen if the API breaks
    console.error('Resource pack hash ei löytynyt');
    player.resourcePack = URL;
  }
}

function sendWarning(player: Player) {
  const seconds = player.isOp() ? 2 : 5;
  player.sendTitle('HUOMIO!', 'Resurssipaketti puuttuu', 1, 20 * seconds, 1);
}

// Command to manually get the hash from the github
registerCommand('updatehash', () => {
  updateHash(true);
});

// Command to download latest resource pack
registerCommand(
  ['resurssipaketti', 'resourcepack'],
  (sender) => {
    downloadResourcePack((sender as unknown) as Player);
  },
  {
    accessChecker: () => true,
    executableBy: 'players',
  },
);

// Try to get new hash every x minutes.
// Github API will only allow 60 requests per hour
const INTERVAL_MINUTES = 1.5;
setInterval(() => {
  updateHash(true);
}, INTERVAL_MINUTES * 60 * 1000);
