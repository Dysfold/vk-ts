import { DatabaseEntry } from '../common/datas/database';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import * as yup from 'yup';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { UUID } from 'java.util';
import { isAdminAccount } from '../common/helpers/player';
import { Player } from 'org.bukkit.entity';
import { CommandSender } from 'org.bukkit.command';

const LikedPlayers = dataType('likedPlayers', {
  playerUuidList: yup.array().of(yup.string().required()),
});

const PlayerLikes = dataType('playerLikes', {
  count: yup.number().default(0),
  lastAutoRemoveDate: yup.number(),
  cooldownEnds: yup.number(),
});

const topPlayers = dataView(
  LikedPlayers,
  new DatabaseEntry('player-likes', 'player-likes-key'),
);

if (!topPlayers.playerUuidList) topPlayers.playerUuidList = [];

/**
 * Get shape object of top 10 most liked playerUuidList
 */

function getLiked() {
  if (!topPlayers.playerUuidList || !topPlayers.playerUuidList) return [];
  return sortLikeList(topPlayers.playerUuidList);
}

/**
 * Sort the given list by likes
 */
function sortLikeList(array: string[]): string[] {
  return array.sort(
    (a, b) =>
      getLikes(uuidToOfflinePlayer(b)) - getLikes(uuidToOfflinePlayer(a)),
  );
}

/*
 * Get likes of player
 */
function getLikes(player: OfflinePlayer): number {
  const playerView = dataView(PlayerLikes, player);
  return playerView.count;
}

/*
 * Get last time of removed like of player
 */
function getLikeRemovalTimestamp(player: OfflinePlayer): number {
  const playerView = dataView(PlayerLikes, player);
  return playerView.lastAutoRemoveDate ?? -1;
}

/*
 * Set last time of removed like of player
 */
function setLikeRemovalTimestamp(player: OfflinePlayer): void {
  const playerView = dataView(PlayerLikes, player);
  playerView.lastAutoRemoveDate = Date.now();
}

/*
 * Get cooldown expiration lastAutoRemoveDate of player
 */
function getCooldownTimestamp(player: OfflinePlayer): number {
  const playerView = dataView(PlayerLikes, player);
  return playerView.cooldownEnds ?? -1;
}

/*
 * Set cooldown expiration lastAutoRemoveDate of player
 */
const COOLDOWN_TIME = 24 * 60 * 60 * 1000;
function setCooldownTimestamp(player: OfflinePlayer): void {
  const playerView = dataView(PlayerLikes, player);
  playerView.cooldownEnds = Date.now() + COOLDOWN_TIME;
}

/*
 * Add like to player
 */
function addLike(sender: CommandSender, uuid: string) {
  if (!topPlayers.playerUuidList) topPlayers.playerUuidList = [];
  const player = uuidToOfflinePlayer(uuid);
  const playerView = dataView(PlayerLikes, player);
  if (!playerView.count) playerView.count = 0;
  playerView.count++;
  sender.sendMessage(`§6Tykkäsit pelaajasta §e${player.name}§6!`);
  if (topPlayers.playerUuidList.includes(uuid)) return;
  if (topPlayers.playerUuidList.length < 10) {
    topPlayers.playerUuidList.push(uuid);
    return;
  }
  const lastUUID =
    topPlayers.playerUuidList[topPlayers.playerUuidList.length - 1];
  const lastPlayer: OfflinePlayer = Bukkit.getOfflinePlayer(
    UUID.fromString(lastUUID),
  );
  if (playerView.count > getLikes(lastPlayer)) {
    topPlayers.playerUuidList[topPlayers.playerUuidList.length - 1] = uuid;
  }
  topPlayers.playerUuidList = sortLikeList(topPlayers.playerUuidList);
}

/*
 * Remove like from player
 */
function removeLike(uuid: string) {
  if (!topPlayers.playerUuidList) topPlayers.playerUuidList = [];
  const player = uuidToOfflinePlayer(uuid);
  const playerView = dataView(PlayerLikes, player);
  if (!playerView.count) playerView.count = 0;
  if (playerView.count != 0) {
    playerView.count--;
  }
  if (playerView.count == 0) {
    topPlayers.playerUuidList.removeValue(uuid);
  }
  topPlayers.playerUuidList = sortLikeList(topPlayers.playerUuidList);
}

/**
 * Has it been enough time to decrease likes
 * @param timestamp The timestamp, if its 24h ago or more return true
 */
const TIME_TO_DECREASE = 24 * 60 * 60 * 1000;
function hasTimePassedToDecrease(timestamp: number): boolean {
  return timestamp - (Date.now() - TIME_TO_DECREASE) <= 0;
}

/**
 * Calculates milliseconds to hours and minutes
 * @param duration Milliseconds to be converted
 */
function calculateTime(duration: number) {
  const minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  return { hours, minutes };
}

/**
 * UUID-string to offlineplayer
 * @param uuid String UUID
 */
function uuidToOfflinePlayer(uuid: string): OfflinePlayer {
  return Bukkit.getOfflinePlayer(UUID.fromString(uuid));
}
/**
 * Refresh likes/remove one like once a day
 * @param user String UUID of the liked player
 */
function refreshLikesOf(user: string): void {
  if (
    hasTimePassedToDecrease(getLikeRemovalTimestamp(uuidToOfflinePlayer(user)))
  ) {
    removeLike(user);
    setLikeRemovalTimestamp(uuidToOfflinePlayer(user));
  }
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
    for (const uuid of getLiked()) {
      if (!uuid) continue;
      const player = uuidToOfflinePlayer(uuid);
      index++;
      refreshLikesOf(uuid);
      const name = player.name || 'tuntematon pelaaja';
      sender.sendMessage(
        `§eSijalla §6#${index} §eon ${name}, ${getLikes(player)} tykkäystä`,
      );
    }
    sender.sendMessage('§6--------------------------------------');
  },
  {
    permission: 'vk.like.toplist',
    description: 'Valtakauden suosituimmat pelaajat',
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
      const senderPlayer = sender as Player;
      if (Date.now() < getCooldownTimestamp(senderPlayer)) {
        const time = calculateTime(
          getCooldownTimestamp(senderPlayer) - Date.now(),
        );
        sender.sendMessage(
          `§6Voit tykätä uudelleen ${time.hours} tunnin ja ${time.minutes} minuutin kuluttua`,
        );
        return;
      }
      const player = Bukkit.getOfflinePlayer(args[0]);
      if (sender.name.toLowerCase() === args[0].toLowerCase()) {
        sender.sendMessage('§6Tiedämme jo että pidät itsestäsi!');
      } else if (isAdminAccount(player)) {
        sender.sendMessage('§6Et voi tykätä ylläpitotileistä!');
      } else {
        if (!player || !player.uniqueId || !player.hasPlayedBefore()) {
          sender.sendMessage('§6Pelaajaa ei löydetty.');
          return;
        }
        addLike(sender, player.uniqueId.toString());
        setCooldownTimestamp(sender);
      }
    }
  },
  {
    permission: 'vk.like',
    description: 'Tykkää pelaajasta',
    executableBy: 'players',
  },
);
