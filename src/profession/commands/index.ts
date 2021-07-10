import { Bukkit } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { errorMessage } from '../../chat/system';
import { getContextNation, guessNation } from './core';
import { Nation } from '../nation';
import { createProfession, deleteProfession, manageProfession } from './ruler';
import {
  getProfession,
  professionsByName,
  professionsInNation,
} from '../data/profession';

registerCommand(
  'ammatti',
  (sender, _alias, originalArgs) => {
    // Figure out the nation this command is operating on
    // Admins and console can set it; for everyone else, guess it from their profession
    const [args, nation] = getContextNation(sender, originalArgs);

    if (!args[0]) {
      return false; // Print usage
    }

    switch (args[0]) {
      case 'luo':
        createProfession(sender, nation, args[1]);
        break;
      case 'poista':
        deleteProfession(sender, nation, args[1]);
        break;
      default:
        viewOrManage(sender, nation, args[0], args.slice(1));
    }
  },
  {
    permission: 'vk.profession.player',
    usage: (sender) => {
      // Different instructions depending on player permissions
      if (sender.hasPermission('vk.profession.ruler')) {
        sender.sendMessage('/ammatti <luo|poista> <nimi> - luo/poista ammatti');
        sender.sendMessage('/ammatti <ammatti> - katso/muokkaa ammattia');
        sender.sendMessage('/ammatti <pelaaja> - pelaajan ammatti');
      } else {
        sender.sendMessage('/ammatti <ammatti> - ammatin harjoittajat');
        sender.sendMessage('/ammatti <pelaaja> - pelaajan ammatti');
      }
    },
    completer: (sender, _alias, args) => {
      if (args.length == 1) {
        const names = [];
        for (const player of Bukkit.onlinePlayers) {
          names.push(player.name);
        }
        if (sender.hasPermission('vk.profession.ruler')) {
          names.push('luo');
          names.push('poista');
        }
        return names;
      } else if (args.length == 2) {
        const nation = guessNation(sender);
        if (args[0] == 'poista' && nation) {
          return professionsInNation(nation).map((prof) => prof.name);
        } else if (args[0] != 'luo') {
          return ['alaiset', 'kuvaile'];
        }
      } else if (args.length == 3) {
        if (args[1] == 'alaiset') {
          return ['lisää', 'poista', 'nollaa'];
        }
      }
      return [];
    },
  },
);

function viewOrManage(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
  opts: string[],
) {
  const professions = professionsByName(name.toLowerCase());
  if (professions.size == 0) {
    // Maybe they meant to get a profession of player?
    const player = Bukkit.getOfflinePlayerIfCached(name);
    if (player) {
      const prof = getProfession(player);
      if (prof) {
        sender.sendMessage(`${player.name} on ammatiltaan ${prof?.name}.`);
      } else {
        sender.sendMessage(
          `${player.name} ei tällä hetkellä harjoita ammattia.`,
        );
      }
    } else {
      errorMessage(sender, `Pelaajaa tai ammattia ${name} ei löydy.`);
    }
    return;
  }

  // Print list of players with the given profession
  if (opts.length == 0) {
    // TODO
    return;
  }

  // All other operations are reserved for rulers and admins
  if (!sender.hasPermission('vk.profession.ruler')) {
    return errorMessage(sender, 'Sinulla ei ole oikeutta hallita ammatteja.');
  } else if (!nation) {
    return errorMessage(sender, 'Et kuulu valtioon.');
  }

  const profession = professions.get(nation.id);
  if (!profession) {
    return errorMessage(
      sender,
      `Ammattia ${name} ei ole olemassa valtiossasi.`,
    );
  } else if (profession.type != 'player') {
    return errorMessage(
      sender,
      'Tämä ammatti ei ole muokattavissa komennoilla. Ota yhteys ylläpitoon.',
    );
  }
  manageProfession(sender, profession, opts);
}

// Non-ruler management commands
require('./manager');
