import { UUID } from 'java.util';
import { Bukkit } from 'org.bukkit';
import { PlayerJoinEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { DatabaseEntry } from '../common/datas/database';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';

const playerRecordData = dataType('playerRecordData', {
  playerUUID: yup.string().required(),
  count: yup.number().required().default(0),
  time: yup.number().required().default(0),
});
const view = dataView(
  playerRecordData,
  new DatabaseEntry('player-record', 'player-record-key'),
);

/**
 * Display player record of the server
 */
registerCommand(
  ['playerrecord', 'pelaajaennätys'],
  (sender) => {
    sender.sendMessage('§6--------------------------------------');
    sender.sendMessage(`§eValtakauden pelaajaennätys on ${view.count}`);
    const name =
      Bukkit.getOfflinePlayer(UUID.fromString(view?.playerUUID))?.name ||
      'tuntematon pelaaja';
    sender.sendMessage(
      `§eEnnätyksen rikkoi ${name} ${getDateString(view.time)}`,
    );
    sender.sendMessage('§6--------------------------------------');
  },
  {
    permission: 'vk.player-record',
    description: 'Valtakauden pelaajaennätys',
  },
);

/**
 * Format the time to HH.MM.YYYY
 * @param time Time value in milliseconds
 */
function getDateString(time: number) {
  const date = new Date(time);
  return (
    date.getDate().toString().padStart(2, '0') +
    '.' +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    '.' +
    date.getFullYear()
  );
}

registerEvent(PlayerJoinEvent, async (event) => {
  const playerCount = Bukkit.server.onlinePlayers.size();
  if (playerCount > view.count) {
    // Update old record
    view.count = playerCount;
    view.playerUUID = event.player.uniqueId.toString();
    view.time = new Date().getTime();

    // Wait for joining messages to be displayed, then announce the message
    await wait(1, 'millis');
    Bukkit.broadcastMessage(
      '§eValtakauden pelaajaennätys on rikottu! /pelaajaennätys',
    );
  }
});
