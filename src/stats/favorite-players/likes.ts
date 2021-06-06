import { Table } from 'craftjs-plugin/database';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { errorMessage } from '../../chat/system';
import { getTable } from '../../common/datas/database';
import { isAdminAccount } from '../../common/helpers/player';
import { getTranslator } from '../../common/localization/localization';
import { displayLikeSuccess } from './messages';
import { PlayerLikes } from './PlayerLikes';
import { UUID } from 'java.util';

/*********************
 * Exported functions
 *********************/

export function getTopLikeList(howMany: number): PlayerLikes[] {
  refreshLikeList();
  const sorted = getSortedLikeList();
  return sorted.slice(0, howMany);
}

export function addLikeToUsername(sender: Player, username: string) {
  const target = Bukkit.getOfflinePlayer(username);
  addLike(target);
  displayLikeSuccess(sender, target);
}

export function canLike(liker: Player, username: string) {
  const target = Bukkit.getOfflinePlayer(username);
  const tr = getTranslator(liker);

  if (!isValidPlayer(target)) {
    errorMessage(liker, tr('likes.player_not_found'));
    return false;
  }
  if (isAdminAccount(target)) {
    errorMessage(liker, tr('likes.cannot_like_admins'));
    return false;
  }
  if (target == liker) {
    errorMessage(liker, tr('likes.cannot_like_yourself'));
    return false;
  }

  return true;
}

/************************
 * Private functions
 ************************/

const likesDb: Table<UUID, number> = getTable('likes');

function getLikesOfUuid(uuid: UUID) {
  return likesDb.get(uuid) ?? 0;
}

function addLikeToUuid(uuid: UUID) {
  const likes = getLikesOfUuid(uuid);
  likesDb.set(uuid, likes + 1);
}

/**
 * Remove one like from player (uuid)
 * @param uuid Uuid of the player as string
 * @param oldLikes Likes before the removal. This is passed in for performance
 */
function removeLikesFromUuid(uuid: UUID, amount: number, oldLikes?: number) {
  const likes = oldLikes ?? getLikesOfUuid(uuid);
  const newLikes = likes - amount;
  if (newLikes <= 0) {
    likesDb.delete(uuid);
  } else {
    likesDb.set(uuid, newLikes);
  }
}

function addLike(player: OfflinePlayer) {
  const uuid = player.uniqueId;
  addLikeToUuid(uuid);
}

function decreaseAllLikes(amount: number) {
  for (const [uuid, oldLikes] of likesDb.entries()) {
    removeLikesFromUuid(uuid, amount, oldLikes);
  }
}

function refreshLikeList() {
  const daysSinceRefresh = getDaysSinceRefresh();
  if (daysSinceRefresh > 0) {
    decreaseAllLikes(daysSinceRefresh);
    setRefreshedNow();
  }
}

function getSortedLikeList(): PlayerLikes[] {
  const ontimeList = getLikeList();
  return ontimeList.sort((a, b) => b.likes - a.likes);
}

function getLikeList(): PlayerLikes[] {
  return Array.from(likesDb, (playerLikes) => {
    const [uuid, likes] = playerLikes;
    const player = Bukkit.getOfflinePlayer(uuid);
    return { player, likes };
  });
}

function isValidPlayer(player: OfflinePlayer | null) {
  if (!player) return false;
  if (player.isOnline()) return true;
  return player.hasPlayedBefore();
}

const likesRefreshedDb: Table<string, number> = getTable(
  'likes-refreshed-table',
);

function setRefreshedNow() {
  const epochDays = getDaysSinceEpoch();
  likesRefreshedDb.set('refreshed', epochDays);
}

function getDaysSinceRefresh() {
  const currentDay = getDaysSinceEpoch();
  const prevDay = likesRefreshedDb.get('refreshed');
  if (prevDay == null) {
    setRefreshedNow();
    return 0;
  }
  return currentDay - prevDay;
}

const MS_IN_DAY = 1000 * 60 * 60 * 24;
function getDaysSinceEpoch() {
  const now = new Date().getTime();
  return Math.floor(now / MS_IN_DAY);
}
