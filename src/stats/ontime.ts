import { Table } from 'craftjs-plugin/database';
import { OfflinePlayer, Statistic, Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { getTable } from '../common/datas/database';
import { UUID } from 'java.util';
import { addTranslation, t } from '../common/localization/localization';
import { color, text } from 'craftjs-plugin/chat';
import { errorMessage, sendMessages } from '../chat/system';
import { PlayerQuitEvent } from 'org.bukkit.event.player';
import { ticksToDuration } from '../common/helpers/duration';
import { getOnlinePlayerNames } from '../common/helpers/player';

const TOP_LIST_DEFAULT = 10;
const TOP_LIST_MAX = 100;

const ontimesDb: Table<UUID, number> = getTable('ontimes');

interface PlayerOntime {
  player: OfflinePlayer;
  time: number;
}

function getOntime(player: OfflinePlayer) {
  if (isOnline(player)) {
    return getOnlinePlayerOntime(player);
  }
  return getOfflinePlayerOntime(player);
}

function getOnlinePlayerOntime(player: Player) {
  const time = player.getStatistic(Statistic.PLAY_ONE_MINUTE);
  return { player, time };
}

function getOfflinePlayerOntime(player: OfflinePlayer) {
  const uuid = player.uniqueId;
  const time = ontimesDb.get(uuid) || 0;
  return { player, time };
}

function isOnline(player: OfflinePlayer): player is Player {
  return player.isOnline();
}

function updateOntime(player: Player) {
  const ontime = getOnlinePlayerOntime(player);
  setOntime(player, ontime.time);
}

function setOntime(player: Player, time: number) {
  const uuid = player.uniqueId;
  ontimesDb.set(uuid, time); // Persistent
}

/**
 * Update the ontime for every online player
 */
function updateOntimeList() {
  for (const player of Bukkit.onlinePlayers) {
    updateOntime(player);
  }
}

function getOntimeTop(howMany: number): PlayerOntime[] {
  updateOntimeList();
  const sorted = getSortedOntimes();
  return sorted.slice(0, howMany);
}

function getSortedOntimes(): PlayerOntime[] {
  const ontimeList = getOntimeList();
  return ontimeList.sort((a, b) => b.time - a.time);
}

function getOntimeList(): PlayerOntime[] {
  return Array.from(ontimesDb, (ontime) => {
    const [uuid, time] = ontime;
    const player = Bukkit.getOfflinePlayer(uuid);
    return { player, time };
  });
}

function displayOntimeTop(to: Player, howMany: number) {
  displayOntimeTitle(to);

  const ontimeTop = getOntimeTop(howMany);
  for (const [index, ontime] of ontimeTop.entries()) {
    const rank = index + 1;
    displayOntimeRow(to, ontime, rank);
  }

  displayOntimeFooter(to);
}

const yellow = (msg: string) => color('#FFFF55', text(msg));
const gold = (msg: string) => color('#FFAA00', text(msg));
const green = (msg: string) => color('#55FF55', text(msg));

function displayOntimeTitle(to: Player) {
  to.sendMessage(gold('-------------------------------'));
  to.sendMessage(yellow(`   ${t(to, 'ontime.title')}:`));
  to.sendMessage(gold('-------------------------------'));
}

function displayOntimeRow(to: Player, ontime: PlayerOntime, ranking?: number) {
  const rank = ranking ? gold(`${ranking}: `) : text('');
  const name = yellow(`${ontime.player.name}: `);
  const time = green(ticksToString(ontime.time));
  sendMessages(to, rank, name, time);
}

function displayOntimeFooter(to: Player) {
  to.sendMessage(gold('-------------------------------'));
}

function displayOntime(to: Player, player: OfflinePlayer) {
  const ontime = getOntime(player);
  to.sendMessage(gold('-------------------------------'));
  displayOntimeRow(to, ontime);
  to.sendMessage(gold('-------------------------------'));
}

function displayOwnOntime(player: Player) {
  const ontime = getOntime(player);
  player.sendMessage(gold('-------------------------------'));
  displayOntimeRow(player, ontime);
  player.sendMessage(gold('-------------------------------'));
}

function displayOntimeByName(to: Player, name: string) {
  const player = Bukkit.getOfflinePlayer(name);
  if (!isValidPlayer(player)) {
    return errorMessage(to, t(to, 'ontime.player_not_found'));
  }
  displayOntime(to, player);
}

function isValidPlayer(player: OfflinePlayer | null) {
  if (!player) return false;
  return getOntime(player).time > 0;
}

registerCommand(
  ['ontime'],
  (sender, _label, args) => {
    if (!(sender instanceof Player)) return;

    if (args.length == 0) {
      return displayOwnOntime(sender);
    }

    if (args[0] == 'top' && args.length == 1) {
      return displayOntimeTop(sender, TOP_LIST_DEFAULT);
    }

    if (args.length == 1) {
      return displayOntimeByName(sender, args[0]);
    }

    if (args[0] !== 'top') {
      return errorMessage(sender, t(sender, 'ontime.incorrect_command'));
    }

    const howMany = parseTopNumber(args[1]);
    displayOntimeTop(sender, howMany);
  },
  {
    completer: (_sender, _alias, args) => {
      return commandCompleter(args);
    },
    executableBy: 'players',
    accessChecker: () => true,
    usage: '/ontime, /ontime top, /ontime top <n>',
  },
);

function commandCompleter(args: string[]): string[] {
  if (args.length == 1) {
    const suggestions = getOnlinePlayerNames();
    suggestions.push('top');
    return suggestions;
  }
  return ['10', '20', '30', '40', '60', '70', '80', '90', '100'];
}

/**
 * Return formatted string with days, hours and minutes
 * @param ticks Played ticks
 */
function ticksToString(ticks: number) {
  const time = ticksToDuration(ticks);

  const days = time.days > 0 ? `${time.days}d ` : '';
  const hours = time.hours > 0 ? `${time.hours}h ` : '';
  const minutes = time.minutes > 0 ? `${time.minutes}min ` : '';

  return days + hours + minutes;
}

function parseTopNumber(str: string) {
  const howMany = Number.parseInt(str) || TOP_LIST_DEFAULT;
  return Math.min(howMany, TOP_LIST_MAX);
}

registerEvent(PlayerQuitEvent, (event) => {
  updateOntime(event.player);
});

addTranslation('ontime.title', {
  fi_fi: 'Valtakauden aktiivisimmat pelaajat',
  en_us: 'Ontime Leaderboards',
});

addTranslation('ontime.player_not_found', {
  fi_fi: 'Pelaajaa ei löydy',
  en_us: 'Player is not found',
});

addTranslation('ontime.incorrect_command', {
  fi_fi: 'Väärä argumentti komennossa. /ontime top <n>',
  en_us: 'Incorrect argument for command. /ontime top <n>',
});
