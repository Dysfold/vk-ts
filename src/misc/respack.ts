import { Player } from 'org.bukkit.entity';
import {
  PlayerJoinEvent,
  PlayerResourcePackStatusEvent,
} from 'org.bukkit.event.player';
import { Status } from 'org.bukkit.event.player.PlayerResourcePackStatusEvent';
import { addTranslation, t } from '../common/localization/localization';
import { announce as announceMessage } from './announcements';

const DOWNLOAD_URL = 'http://valtakausi.fi:5001/respack/download';
const HASH_URL = 'http://valtakausi.fi:5001/respack/hash';

let hash: string;

async function updateHash(announce = false) {
  const res = await fetch(HASH_URL);
  const data = await res.json();
  const newHash = data?.hash as string;

  if (newHash == undefined) return;

  if (announce) {
    // Check if the hash has changed, and then announce the new resource pack
    if (newHash && hash !== newHash) {
      announceMessage('respack.updated');
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
        console.warn(`${player.name} failed to download the resource pack`);
        sendWarning(player);
        failedDownloads.delete(player);
        return;
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
    player.setResourcePack(DOWNLOAD_URL, hash);
  } else {
    // This might happen if the API breaks
    console.error('Resource pack hash missing');
    player.resourcePack = DOWNLOAD_URL;
  }
}

function sendWarning(player: Player) {
  const seconds = player.isOp() ? 2 : 5;
  player.sendTitle('!!!', t(player, 'respack.missing'), 1, 20 * seconds, 1);
}

// Command to manually get the hash from the github
registerCommand('updatehash', () => {
  updateHash(true);
});

// Command to download latest resource pack
registerCommand(
  ['resurssipaketti', 'resourcepack'],
  (sender) => {
    downloadResourcePack(sender as unknown as Player);
  },
  {
    accessChecker: () => true,
    executableBy: 'players',
  },
);

// Try to get new hash every x seconds
const INTERVAL_SECONDS = 10;
setInterval(() => {
  updateHash(true);
}, INTERVAL_SECONDS * 1000);

/***************
 * Translations
 ***************/

addTranslation('respack.updated', {
  fi_fi:
    'Resurssipaketti on päivittynyt! Ota uusi resurssipaketti käyttöön liittymällä peliin uudelleen tai komennolla /resurssipaketti',
  en_us:
    'Resource pack has been updated! Apply the new resource pack by relogging or with the command "/resourcepack"',
});

addTranslation('respack.missing', {
  fi_fi: 'Resurssipaketti puuttuu',
  en_us: 'Resource pack is missing',
});
