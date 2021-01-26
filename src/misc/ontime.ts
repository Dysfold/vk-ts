import { Bukkit, Statistic } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { PlayerQuitEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { DatabaseEntry } from '../common/datas/database';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';

const OntimeDatabaseEntry = new DatabaseEntry('ontime', 'ontime-key');
const OntimeData = dataType('ontimeData', {
  list: yup
    .array(
      yup
        .object({
          uuid: yup.string().required(),
          name: yup.string().required(),
          ticks: yup.number().required(),
        })
        .required(),
    )
    .required()
    .default([]),
});
const view = dataView(OntimeData, OntimeDatabaseEntry);

registerCommand(
  ['ontime'],
  (sender, _label, args) => {
    // Get your own ontime
    if (args.length === 0) {
      if (!(sender instanceof Player)) return;
      var ticks = getTicks(sender);
      sender.sendMessage('§e-------------------------------');
      displayOntime(sender, sender.name, ticks);
      sender.sendMessage('§e-------------------------------');
      return;
    }

    // Get ontime top list
    if (args[0] !== 'top') return;
    let top = 10;
    if (args.length > 1) top = Number.parseInt(args[1]) || 10;
    top = Math.min(top, 100);
    displayOntimeTop(sender, top);
  },
  {
    completer: (_sender, _alias, args) => {
      return args.length === 1 ? ['top'] : [];
    },
    executableBy: 'both',
    accessChecker: () => true,
  },
);

// We cant update ontime for offline players,
// so we need to get it on PlayerQuitEvent
registerEvent(PlayerQuitEvent, (event) => {
  updateOntime(event.player);
});

/**
 * Get how many ticks the player has been online
 */
function getTicks(player: Player) {
  return player.getStatistic(Statistic.PLAY_ONE_MINUTE);
}

/**
 * Display players ontime information in one line
 * @param to The player to whom the time is displayed
 * @param username Username of the player whos ontime is displayed
 * @param ticks How many ticks the player has played
 * @param ranking Ranking of the player if displayed in a list
 */
function displayOntime(
  to: CommandSender,
  username: string,
  ticks: number,
  ranking?: number,
) {
  const time = ticksToString(ticks);
  if (ranking) to.sendMessage(`§e${ranking}: §r${username}: §a${time}`);
  else to.sendMessage(`§r${username}: §a${time}`);
}

/**
 * Display ontime top list
 * @param to The player to whom the list is displayed
 * @param top The number of displayed players
 */
function displayOntimeTop(to: CommandSender, top: number) {
  // Update ontime of every player
  view.list.forEach((player) => {
    const onlinePlayer = Bukkit.server.getPlayer(player.uuid);
    if (onlinePlayer) {
      player.ticks = getTicks(onlinePlayer);
    }
  });

  // Sort the list with most active player first
  view.list.sort((a, b) => b.ticks - a.ticks);

  // Size of the displayed list
  const size = Math.min(view.list.length, top);

  to.sendMessage('§e-------------------------------');
  to.sendMessage('§e  Valtakauden aktiivisimmat pelaajat:');
  to.sendMessage('§e-------------------------------');
  for (let i = 0; i < size; i++) {
    const player = view.list[i];
    displayOntime(to, player.name, player.ticks, i + 1);
  }
  to.sendMessage('§e-------------------------------');
}

const MINUTE = 60 * 20;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/**
 * Return formatted string with days, hours and minutes
 * @param ticks Played ticks
 */
function ticksToString(ticks: number) {
  if (ticks < 1) return '';
  const days = Math.floor(ticks / DAY);
  const hours = Math.floor((ticks % DAY) / HOUR);
  const minutes = Math.floor((ticks % HOUR) / MINUTE);

  const daysStr = days > 0 ? `${days}d ` : '';
  const hoursStr = hours > 0 ? `${hours}h ` : '';
  const minutesStr = minutes > 0 ? `${minutes}min ` : '';

  return daysStr + hoursStr + minutesStr;
}

/**
 * Update ontime of an online player
 * @param player Online player to be updated
 */
function updateOntime(player: Player) {
  const elem = {
    name: player.name,
    uuid: player.uniqueId.toString(),
    ticks: getTicks(player),
  };
  const index = view.list.findIndex(
    (p) => p.uuid === player.uniqueId.toString(),
  );
  if (index === -1) {
    view.list.push(elem);
  } else {
    view.list[index] = elem;
  }
}
