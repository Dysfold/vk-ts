import { Player } from 'org.bukkit.entity';
import { getOnlinePlayerNames } from '../../common/helpers/player';
import { getLikeCooldown, startLikeCooldown } from './command-cooldown';
import { addLikeToUsername, canLike, getTopLikeList } from './likes';
import {
  displayLikeCommandHelp,
  displayLikeCooldown,
  displayTopLikeList,
} from './messages';

registerCommand(
  ['suosikit', 'favourites'],
  (sender) => {
    if (!(sender instanceof Player)) return;
    const topLikeList = getTopLikeList(10);
    displayTopLikeList(sender, topLikeList);
  },
  {
    permission: 'vk.like.toplist',
    executableBy: 'players',
    description: 'Valtakauden suosituimmat pelaajat',
  },
);

registerCommand(
  ['tykkää', 'like'],
  (sender, _label, args) => {
    if (!(sender instanceof Player)) return;

    if (args.length !== 1) {
      return displayLikeCommandHelp(sender);
    }

    const cooldown = getLikeCooldown(sender);
    if (cooldown !== undefined) {
      return displayLikeCooldown(sender, cooldown);
    }

    const username = args[0];
    if (canLike(sender, username)) {
      addLikeToUsername(sender, username);
      startLikeCooldown(sender);
    }
  },
  {
    permission: 'vk.like',
    description: 'Tykkää pelaajasta',
    executableBy: 'players',
    completer: () => getOnlinePlayerNames(),
  },
);
