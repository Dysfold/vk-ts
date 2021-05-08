import { Bukkit } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { errorMessage, successMessage } from '../chat/system';
import { Nation, nationById } from './nation';
import {
  getProfession,
  PlayerProfession,
  professionInNation,
  professionsByName,
  professionsInNation,
  removeProfession,
  updateProfession,
} from './profession';

registerCommand(
  'ammatti',
  (sender, _alias, args) => {
    // Figure out the nation this command is operating on
    // Admins and console can set it; for everyone else, guess it from their profession
    let nation: Nation | undefined;
    if (args[0] == '--valtio' && args[1]) {
      if (sender.hasPermission('vk.profession.admin')) {
        nation = nationById(args[1]);
        if (!nation) {
          errorMessage(sender, `Valtiota ${args[1]} ei ole olemassa`);
          return;
        }
        args = args.slice(2); // Skip these arguments
      } else {
        errorMessage(
          sender,
          'Sinulla ei ole oikeutta ammattien ylläpitokomentoihin.',
        );
        return;
      }
    } else {
      nation = guessNation(sender);
    }

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
        viewOrUpdate(sender, nation, args[1], args.slice(1));
    }
  },
  {
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

function guessNation(sender: CommandSender): Nation | undefined {
  if (!(sender instanceof Player)) {
    return undefined; // Console doesn't have a nation
  }
  const profession = getProfession(sender);
  if (profession?.type != 'player') {
    return undefined; // No profession or system profession (no associated nation)
  }
  return nationById(profession.nation);
}

function createProfession(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
) {
  if (!sender.hasPermission('vk.profession.ruler')) {
    errorMessage(sender, 'Sinulla ei ole oikeutta luoda ammatteja.');
    return;
  } else if (!nation) {
    errorMessage(sender, 'Et kuulu valtioon.');
    return;
  } else if (professionInNation(nation, name)) {
    errorMessage(sender, `Ammatti ${name} on jo olemassa valtiossasi.`);
    return;
  }
  const profession: PlayerProfession = {
    type: 'player',
    name: name,
    description: '', // No description yet
    nation: nation.id,
    creator: sender.name,
    features: [],
    subordinates: [],
  };
  updateProfession(profession); // Save new profession

  successMessage(sender, `Ammatti ${name} luotu.`);
  viewOrUpdate(sender, nation, profession.name, []); // Show ruler overview
}

function deleteProfession(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
) {
  if (!sender.hasPermission('vk.profession.ruler')) {
    errorMessage(sender, 'Sinulla ei ole oikeutta luoda ammatteja.');
    return;
  } else if (!nation) {
    errorMessage(sender, 'Et kuulu valtioon.');
    return;
  }
  const profession = professionInNation(nation, name);
  if (!profession) {
    errorMessage(sender, `Ammattia ${name} ei ole olemassa valtiossasi.`);
    return;
  }
  removeProfession(profession);
  successMessage(sender, `Ammatti ${name} poistettu.`);
}

function viewOrUpdate(
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
        sender.sendMessage(`${player.name} ei tällä harjoita ammattia.`);
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
    errorMessage(sender, 'Sinulla ei ole oikeutta hallita ammatteja.');
    return;
  } else if (!nation) {
    errorMessage(sender, 'Et kuulu valtioon.');
    return;
  }

  const profession = professions.get(nation.id);
  if (!profession) {
    errorMessage(sender, `Ammattia ${name} ei ole olemassa tässä valtiossa.`);
    return;
  } else if (profession.type != 'player') {
    errorMessage(
      sender,
      'Tämä ammatti ei ole muokattavissa komennoilla. Ota yhteys ylläpitoon.',
    );
    return;
  }
  switch (opts[0]) {
    case 'alaiset':
      updateSubordinates(sender, profession, opts.slice(1));
      break;
    case 'kuvaile':
      profession.description = opts.slice(1).join(' ');
      updateProfession(profession);
      break;
  }
}

function updateSubordinates(
  sender: CommandSender,
  profession: PlayerProfession,
  opts: string[],
) {
  switch (opts[0]) {
    case 'lisää':
      if (!opts[1]) {
        errorMessage(sender, 'Alaiseksi lisättävä ammatti puuttuu.');
        return;
      }
      // Remove profession from list to prevent diplicates
      profession.subordinates = profession.subordinates.filter(
        (name) => name != profession.name,
      );
      profession.subordinates.push(profession.name); // Add it to end
      profession.subordinates.sort(); // Sort alphabetically
      break;
    case 'poista':
      if (!opts[1]) {
        errorMessage(sender, 'Alaisista poistettava ammatti puuttuu.');
        return;
      }
      // Remove profession from list
      profession.subordinates = profession.subordinates.filter(
        (name) => name != profession.name,
      );
      break;
    case 'nollaa':
      profession.subordinates = []; // Clear subordinates
      break;
  }
  updateProfession(profession); // Save changes
}
