import { color, text } from 'craftjs-plugin/chat';
import { Table } from 'craftjs-plugin/database';
import { UUID } from 'java.util';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { errorMessage } from '../chat/system';
import { getTable } from '../common/datas/database';
import { isAdminAccount } from '../common/helpers/player';
import {
  addTranslation,
  getTranslator,
  t,
} from '../common/localization/localization';

const likesDb: Table<string, number> = getTable('likes-table');

interface PlayerLikes {
  player: OfflinePlayer;
  likes: number;
}

function getLikesOfUuid(uuid: string) {
  return likesDb.get(uuid) ?? 0;
}

function addLikeToUuid(uuid: string) {
  const likes = getLikesOfUuid(uuid);
  likesDb.set(uuid, likes + 1);
}

/**
 * Remove one like from player (uuid)
 * @param uuid Uuid of the player as string
 * @param oldLikes Likes before the removal. This is passed in for performance
 */
function removeLikesFromUuid(uuid: string, amount: number, oldLikes?: number) {
  const likes = oldLikes ?? getLikesOfUuid(uuid);
  const newLikes = likes - amount;
  if (newLikes <= 0) {
    likesDb.delete(uuid);
  } else {
    likesDb.set(uuid, newLikes);
  }
}

function addLike(player: OfflinePlayer) {
  const uuid = player.uniqueId.toString();
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

function getTopLikeList(howMany: number): PlayerLikes[] {
  refreshLikeList();
  const sorted = getSortedLikeList();
  return sorted.slice(0, howMany);
}

function getSortedLikeList(): PlayerLikes[] {
  const ontimeList = getLikeList();
  return ontimeList.sort((a, b) => b.likes - a.likes);
}

function getLikeList(): PlayerLikes[] {
  return Array.from(likesDb, (playerLikes) => {
    const [uuid, likes] = playerLikes;
    const player = Bukkit.getOfflinePlayer(UUID.fromString(uuid));
    return { player, likes };
  });
}

/**
 * Display player record of the server
 */
registerCommand(
  ['suosikit', 'favourites'],
  (sender) => {
    if (!(sender instanceof Player)) return;
    displayTopLikeList(sender, 10);
  },
  {
    permission: 'vk.like.toplist',
    executableBy: 'players',
    description: 'Valtakauden suosituimmat pelaajat',
  },
);

function addLikeToUsername(sender: Player, username: string) {
  const target = Bukkit.getOfflinePlayer(username);
  addLike(target);
  sendSuccessMessage(sender, target);
}

function isValidPlayer(player: OfflinePlayer | null) {
  if (!player) return false;
  if (player.isOnline()) return true;
  return player.hasPlayedBefore();
}

function canLike(liker: Player, username: string) {
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

registerCommand(
  ['tykkää', 'tykkaa', 'like'],
  (sender, _label, args) => {
    if (!(sender instanceof Player)) return;

    if (args.length !== 1) {
      return sendCommandHelp(sender);
    }

    const username = args[0];
    if (canLike(sender, username)) {
      addLikeToUsername(sender, username);
    }
  },
  {
    permission: 'vk.like',
    description: 'Tykkää pelaajasta',
    executableBy: 'players',
  },
);

function displayTopLikeList(to: Player, howMany: number) {
  displayLikesTitle(to);

  const ontimeTop = getTopLikeList(howMany);
  for (const [index, ontime] of ontimeTop.entries()) {
    const rank = index + 1;
    displayLikesRow(to, ontime, rank);
  }

  displayLikesFooter(to);
}

const yellow = (msg: string) => color('#FFFF55', text(msg));
const gold = (msg: string) => color('#FFAA00', text(msg));
const green = (msg: string) => color('#55FF55', text(msg));

function displayLikesTitle(to: Player) {
  to.sendMessage(gold('-------------------------------'));
  to.sendMessage(yellow(`   ${t(to, 'likes.title')}:`));
  to.sendMessage(gold('-------------------------------'));
}

function displayLikesRow(
  to: Player,
  playerLikes: PlayerLikes,
  ranking?: number,
) {
  const rank = ranking ? gold(`${ranking}: `) : text('');
  const name = yellow(`${playerLikes.player.name}: `);
  const likes = green(`${playerLikes.likes} ${t(to, 'likes.likes')}`);
  to.sendMessage(rank, name, likes);
}

function displayLikesFooter(to: Player) {
  to.sendMessage(gold('-------------------------------'));
}

function sendCommandHelp(to: Player) {
  to.sendMessage(gold('-------------------------------'));
  to.sendMessage(yellow(`${t(to, 'likes.usage')}:`));
  to.sendMessage(gold('-------------------------------'));
}

function sendSuccessMessage(to: Player, liked: OfflinePlayer) {
  to.sendMessage(green(`${t(to, 'likes.added_like_to', `${liked.name}`)}`));
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

addTranslation('likes.title', {
  fi_fi: 'Suosituimmat pelaajat',
  en_us: 'Favorite players',
});

addTranslation('likes.player_not_found', {
  fi_fi: 'Pelaajaa ei löydy',
  en_us: 'Player is not found',
});

addTranslation('likes.cannot_like_yourself', {
  fi_fi: 'Tiedämme jo että pidät itsestäsi!',
  en_us: 'We already know you like yourself!',
});

addTranslation('likes.cannot_like_admins', {
  fi_fi: 'Tiedämme jo että pidät ylläpidosta!',
  en_us: 'We already know you like admins!',
});

addTranslation('likes.usage', {
  fi_fi: 'Tykkää muista pelaajista komennolla: /tykkää <nimi>',
  en_us: 'You can like other players with: /like <player>',
});

addTranslation('likes.added_like_to', {
  fi_fi: 'Tykkäsit pelajasta %s!',
  en_us: 'You liked player %s!',
});

addTranslation('likes.likes', {
  fi_fi: 'tykkäystä',
  en_us: 'likes',
});
