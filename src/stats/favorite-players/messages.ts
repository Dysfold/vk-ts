import { Player } from 'org.bukkit.entity';
import { color, text } from 'craftjs-plugin/chat';
import { OfflinePlayer } from 'org.bukkit';
import { t, addTranslation } from '../../common/localization/localization';
import { PlayerLikes } from './PlayerLikes';
import { millisecondsToDuration } from '../../common/helpers/duration';
import { sendMessages } from '../../chat/system';

const yellow = (msg: string) => color('#FFFF55', text(msg));
const gold = (msg: string) => color('#FFAA00', text(msg));
const green = (msg: string) => color('#55FF55', text(msg));
const red = (msg: string) => color('#FF5555', text(msg));

/***********************
 * Exported functions
 ***********************/

export function displayTopLikeList(to: Player, topList: PlayerLikes[]) {
  displayLikesTitle(to);
  displayTopLikeRows(to, topList);
  displayLikesFooter(to);
}

export function displayLikeCommandHelp(to: Player) {
  to.sendMessage(gold('-------------------------------'));
  to.sendMessage(yellow(`${t(to, 'likes.usage')}:`));
  to.sendMessage(gold('-------------------------------'));
}

export function displayLikeSuccess(to: Player, liked: OfflinePlayer) {
  to.sendMessage(green(`${t(to, 'likes.added_like_to', `${liked.name}`)}`));
}

export function displayLikeCooldown(to: Player, cooldownMs: number) {
  const cooldownString = cooldownToString(cooldownMs);
  to.sendMessage(red(`${t(to, 'likes.cooldown', cooldownString)}`));
}

/***********************
 * Private functions
 ***********************/

function cooldownToString(cooldownMs: number) {
  const duration = millisecondsToDuration(cooldownMs);

  const hours = duration.hours > 0 ? `${duration.hours}h ` : '';
  const minutes = duration.minutes > 0 ? `${duration.minutes}min` : '';

  return hours + minutes;
}

function displayTopLikeRows(to: Player, topList: PlayerLikes[]) {
  for (const [index, ontime] of topList.entries()) {
    const rank = index + 1;
    displayLikesRow(to, ontime, rank);
  }
}

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
  sendMessages(to, rank, name, likes);
}

function displayLikesFooter(to: Player) {
  to.sendMessage(gold('-------------------------------'));
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

addTranslation('likes.cooldown', {
  fi_fi: 'Sinun täytyy odottaa vielä %s',
  en_us: 'You have to wait for %s to do that again',
});
