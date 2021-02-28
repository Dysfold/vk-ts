import { DatabaseEntry } from '../common/datas/database';
import { dataType, dataHolder } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import * as yup from 'yup';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { UUID } from 'java.util';
import { isAdminAccount } from '../common/helpers/player';
import { Player } from 'org.bukkit.entity';

const playerLikesDataType = dataType('playerLikesData', {
  playerUuidList: yup.array().of(yup.string().required()),
});

const playerLikesType = dataType('playerLikes', {
  count: yup.number(),
  lastAutoRemoveDate: yup.number(),
  cooldownEnds: yup.number(),
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
function sortLikeList(array: string[]): string[] {
  return array.sort((a, b) => getLikes(Bukkit.getOfflinePlayer(UUID.fromString(b))) - getLikes(Bukkit.getOfflinePlayer(UUID.fromString(a))));
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
  return playerView.lastAutoRemoveDate;
}

/*
 * Set last time of removed like of player
 */
function setLikeRemovalTimestamp(player: OfflinePlayer): void {
  const playerView = dataView(playerLikesType, dataHolder(player));
  playerView.lastAutoRemoveDate = Date.now();
}

/*
 * Get cooldown expiration lastAutoRemoveDate of player
 */
function getCooldownTimestamp(player: OfflinePlayer): number {
  const playerView = dataView(playerLikesType, dataHolder(player));
  return playerView.cooldownEnds;
}

/*
 * Set cooldown expiration lastAutoRemoveDate of player
 */
const COOLDOWN_TIME = 24 * 60 * 60 * 1000;
function setCooldownTimestamp(player: OfflinePlayer): void {
  const playerView = dataView(playerLikesType, dataHolder(player));
  playerView.cooldownEnds = Date.now() + COOLDOWN_TIME;
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
 * Calculates milliseconds to hours and minutes
 */
function calculateTime(duration: number) {
  let minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  hours = hours < 10 ? 0 + hours : hours;
  minutes = minutes < 10 ? 0 + minutes : minutes;

  return { hours, minutes };
}

/**
 * Display player record of the server
 */
registerCommand(
  ['suosikit', 'favourites'],
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
      if (!(sender instanceof Player)) return;
      if (Date.now() < getCooldownTimestamp(sender as Player)) {
        const time = calculateTime(
          getCooldownTimestamp(sender as Player) - Date.now(),
        );
        sender.sendMessage(
          `§6Voit tykätä uudelleen ${time.hours} tunnin ja ${time.minutes} minuutin kuluttua`,
        );
        return;
      }
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
          sender.sendMessage(`§6Tykkäsit pelaajasta §e${player.name}§6!`);
          setCooldownTimestamp(sender as Player);
        });
      }
    }
  },
  {
    permission: 'vk.like',
    description: 'Tykkää pelaajasta',
    executableBy: 'players',
  },
);
