import { Player } from 'org.bukkit.entity';
import {
  displayTopLikeList,
  displayLikeCommandHelp,
  displayLikeCooldown,
} from './messages';
import { addLikeToUsername, getTopLikeList, canLike } from './likes';
import { getLikeCooldown, startLikeCooldown } from './command-cooldown';
import { getOnlinePlayerNames } from '../../common/helpers/player';

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
  ['tykkää', 'tykkaa', 'like'],
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
