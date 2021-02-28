import { DatabaseEntry } from '../common/datas/database';
import { dataType, dataHolder } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import * as yup from 'yup';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { UUID } from 'java.util';
import { isAdminAccount } from '../common/helpers/player';

const playerLikesDataType = dataType('playerLikesData', {
  playerUuidList: yup.array().of(yup.string()),
});

const playerLikesType = dataType('playerLikes', {
  count: yup.number(),
  date: yup.number(),
});

const view = dataView(
  playerLikesDataType,
  new DatabaseEntry('player-likes', 'player-likes-key'),
);

if (!view.playerUuidList) view.playerUuidList = [];

/**
 * Get shape object of top 10 most liked playerUuidList
 */

function getLiked() {
  if (!view.playerUuidList || !view.playerUuidList) return [];
  return sortLikeList(view.playerUuidList);
}

/**
 * Sort the given list by likes
 */
function sortLikeList(array: any[]): string[] {
  return array.sort(function (a, b) {
    if (!a || typeof a != 'string') {
      return -1;
    }
    if (!b || typeof b != 'string') {
      return 1;
    }
    return (
      getLikes(Bukkit.getOfflinePlayer(UUID.fromString(b))) -
      getLikes(Bukkit.getOfflinePlayer(UUID.fromString(a)))
    );
  });
}

/*
 * Get likes of player
 */
function getLikes(player: OfflinePlayer): number {
  const playerView = dataView(playerLikesType, dataHolder(player));
  return playerView.count;
}

/*
 * Get last time of removed like of player
 */
function getLikeRemovalTimestamp(player: OfflinePlayer): number {
  const playerView = dataView(playerLikesType, dataHolder(player));
  return playerView.date;
}

/*
 * Set last time of removed like of player
 */
function setLikeRemovalTimestamp(player: OfflinePlayer): void {
  const playerView = dataView(playerLikesType, dataHolder(player));
  playerView.date = Date.now();
}
/*
 * Add like to player
 */
function addLike(uuid: string, callback: () => void) {
  if (!view.playerUuidList) view.playerUuidList = [];
  const player = Bukkit.getOfflinePlayer(UUID.fromString(uuid));
  const playerView = dataView(playerLikesType, dataHolder(player));
  if (!playerView.count || isNaN(playerView.count)) playerView.count = 0;
  playerView.count++;
  callback();
  if (view.playerUuidList.includes(uuid)) return;
  if (view.playerUuidList.length < 10) {
    view.playerUuidList.push(uuid);
    return;
  }
  const lastUUID = view.playerUuidList[view.playerUuidList.length - 1];
  if (lastUUID == undefined) {
    return;
  }
  const lastPlayer: OfflinePlayer = Bukkit.getOfflinePlayer(
    UUID.fromString(lastUUID),
  );
  if (playerView.count > getLikes(lastPlayer)) {
    view.playerUuidList[view.playerUuidList.length - 1] = uuid;
  }
  view.playerUuidList = sortLikeList(view.playerUuidList);
}

/*
 * Remove like from player
 */
function removeLike(uuid: string, callback: () => void) {
  if (!view.playerUuidList) view.playerUuidList = [];
  const player = Bukkit.getOfflinePlayer(UUID.fromString(uuid));
  const playerView = dataView(playerLikesType, dataHolder(player));
  if (!playerView.count || isNaN(playerView.count)) playerView.count = 0;
  if (playerView.count != 0) {
    playerView.count--;
  }
  callback();
  if (view.playerUuidList.includes(uuid)) return;
  if (view.playerUuidList.length < 10) {
    view.playerUuidList.push(uuid);
    return;
  }
  const lastUUID = view.playerUuidList[view.playerUuidList.length - 1];
  if (lastUUID == undefined) {
    return;
  }
  const lastPlayer: OfflinePlayer = Bukkit.getOfflinePlayer(
    UUID.fromString(lastUUID),
  );
  if (playerView.count > getLikes(lastPlayer)) {
    view.playerUuidList[view.playerUuidList.length - 1] = uuid;
  }
  view.playerUuidList = sortLikeList(view.playerUuidList);
}

/**
 * Has it been enough time to decrease likes
 */
const TIME_TO_DECREASE = 24 * 60 * 60 * 1000;
function hasTimePassedToDecrease(timestamp: number): boolean {
  return timestamp - (Date.now() - TIME_TO_DECREASE) <= 0;
}

/**
 * Display player record of the server
 */
registerCommand(
  ['suosikit', 'records'],
  (sender) => {
    sender.sendMessage('§6--------------------------------------');
    sender.sendMessage('§eValtakauden suosituimmat pelaajat:');
    sender.sendMessage(' ');
    let index = 0;
    for (const user of getLiked()) {
      if (!user) continue;
      index++;
      if (
        hasTimePassedToDecrease(
          getLikeRemovalTimestamp(
            Bukkit.getOfflinePlayer(UUID.fromString(user)),
          ),
        )
      ) {
        removeLike(user, () => {
          setLikeRemovalTimestamp(
            Bukkit.getOfflinePlayer(UUID.fromString(user)),
          );
          return;
        });
      }
      const name =
        Bukkit.getOfflinePlayer(UUID.fromString(user))?.name ||
        'tuntematon pelaaja';
      sender.sendMessage(
        `§eSijalla §6#${index} §eon ${name}, ${getLikes(
          Bukkit.getOfflinePlayer(UUID.fromString(user)),
        )} tykkäystä`,
      );
    }
    sender.sendMessage('§6--------------------------------------');
  },
  {
    permission: 'vk.player-record',
    description: 'Valtakauden pelaajaennätys',
  },
);

registerCommand(
  ['tykkää', 'tykkaa', 'like'],
  (sender, _label, args) => {
    if (args.length == 0) {
      sender.sendMessage('§6--------------------------------------');
      sender.sendMessage(
        '§eTykkää muista pelaajista komennolla §6/tykkää <nimi>§e!',
      );
      sender.sendMessage('§6--------------------------------------');
    } else {
      if (args[0].toLowerCase() == sender.name.toLowerCase()) {
        sender.sendMessage('§6Tiedämme jo että pidät itsestäsi!');
      } else if (isAdminAccount(args[0].toLowerCase())) {
        sender.sendMessage('§6Et voi tykätä ylläpitotileistä!');
      } else {
        const player = Bukkit.getOfflinePlayer(args[0]);
        if (!player || !player.uniqueId) {
          sender.sendMessage('§6Pelaajaa ei löydetty.');
          return;
        }
        addLike(player.uniqueId.toString(), () => {
          sender.sendMessage(`§6Tykkäys onnistui!`);
        });
      }
    }
  },
  {
    permission: 'vk.like',
    description: 'Tykkää pelaajasta',
  },
);
