import { Bukkit, Location } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { errorMessage } from '../../chat/system';
import {
  getProfession,
  isSubordinateProfession,
  Profession,
  professionInNation,
  systemProfession,
} from '../profession';
import { getContextNation } from './core';

const NOMINATE_DISTANCE = 5;

registerCommand(
  'nimitä',
  (sender, alias, originalArgs) => {
    const [args, nation] = getContextNation(sender, originalArgs);
    if (args.length < 2) {
      return false; // Missing arguments
    }

    const player = Bukkit.getPlayer(args[0]);
    if (!player) {
      return errorMessage(sender, `${args[0]} is ole juuri nyt paikalla.`);
    }

    const targetProf = nation
      ? professionInNation(nation, args[1])
      : systemProfession(args[1]);
    if (!targetProf) {
      return errorMessage(sender, `Ammattia ${args[0]} ei löydy valtiostasi.`);
    }

    // Some sanity checks for non-admin players
    if (!sender.hasPermission('vk.profession.admin')) {
      // Sanity check, we need sender to be player for most of the checks
      if (!(sender instanceof Player)) {
        // ???
        return errorMessage(
          sender,
          'Not a player, but missing vk.profession.admin!',
        );
      }

      // Check nominator profession (they need one)
      const senderProf = getProfession(sender);
      if (!senderProf) {
        return errorMessage(sender, 'Sinulla ei ole ammattia.');
      }
      if (!isSubordinateProfession(senderProf, targetProf)) {
        return errorMessage(
          sender,
          `Sinulla ei ole oikeutta nimittää ammattiin ${targetProf.name}.`,
        );
      }

      // Check distance between players
      if (
        distanceBetween(sender.location, player.location) > NOMINATE_DISTANCE
      ) {
        return errorMessage(sender, `${player.name} on liian kaukana sinusta.`);
      }
    }

    // Send request for profession change
    requestProfessionChange(sender, player, targetProf);
  },
  {
    permission: 'vk.profession.player',
  },
);

async function requestProfessionChange(
  nominator: CommandSender,
  target: Player,
  profession: Profession,
) {
  // TODO
}

// TODO wait for common/helpers/locations.ts from PR 204 (shops)
function distanceBetween(a: Location, b: Location): number {
  if (a.world != b.world) {
    return Number.MAX_VALUE; // Different worlds are very far away, indeed
  }
  return a.distance(b); // Calculate distance normally
}
