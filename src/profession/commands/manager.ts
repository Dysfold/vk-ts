import { clickEvent, color, text } from 'craftjs-plugin/chat';
import { Action } from 'net.md_5.bungee.api.chat.ClickEvent';
import { Bukkit, Location } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { errorMessage, successMessage } from '../../chat/system';
import {
  getProfession,
  isSubordinateProfession,
  Profession,
  professionInNation,
  setProfession,
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
      return errorMessage(sender, `${args[0]} ei ole juuri nyt paikalla.`);
    }

    const targetProf = nation
      ? professionInNation(nation, args[1])
      : systemProfession(args[1]);
    if (!targetProf) {
      return errorMessage(sender, `Ammattia ${args[1]} ei löydy valtiostasi.`);
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

/**
 * Profession changes pending approval from the appointed players.
 */
const pendingChanges: Map<Player, Profession> = new Map();

async function requestProfessionChange(
  nominator: CommandSender,
  target: Player,
  profession: Profession,
) {
  // Check if another profession is currently offered to target
  if (pendingChanges.has(target)) {
    errorMessage(
      nominator,
      `${target.name} ei voi juuri nyt ottaa vastaan ammattia.`,
    );
    return;
  }

  // If not, offer it to them
  successMessage(target, `${nominator.name} tarjoaa sinulle ammattia!`);
  target.sendMessage(
    text(`Ota vastaan ammatti: ${profession.name}? `),
    color('#00AA00', text('✔')),
    clickEvent(
      Action.RUN_COMMAND,
      '/nimitys hyväksy',
      color('#55FF55', text('Hyväksy ')),
    ),
    color('#AA0000', text('✘')),
    clickEvent(
      Action.RUN_COMMAND,
      '/nimitys hylkää',
      color('#FF5555', text('Hylkää')),
    ),
  );
  pendingChanges.set(target, profession);

  // Clean up pending profession change if target does nothing
  await wait(15, 'seconds');
  if (pendingChanges.has(target)) {
    errorMessage(target, 'Ammattitarjous peruttu, odotit liian pitkään.');
    pendingChanges.delete(target);
  }
}

registerCommand(
  'nimitys',
  (sender, _alias, args) => {
    if (!(sender instanceof Player)) {
      return;
    }
    const profession = pendingChanges.get(sender);
    if (!profession) {
      return;
    }
    if (args[0] == 'hyväksy') {
      successMessage(sender, 'Ammattitarjous hyväksytty!');
      changeProfession(sender, profession);
    } else if (args[0] == 'hylkää') {
      successMessage(sender, 'Ammattitarjous hylätty.');
      pendingChanges.delete(sender);
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.profession.player',
  },
);

function changeProfession(player: Player, profession: Profession) {
  pendingChanges.delete(player); // They accepted it

  // Let everyone know about this
  // TODO profession name formatting
  Bukkit.broadcast(
    color('#55FF55', text(`${player.name} on nyt ${profession.name}`)),
  );
  setProfession(player, profession); // Actually change profession
}

// TODO wait for common/helpers/locations.ts from PR 204 (shops)
function distanceBetween(a: Location, b: Location): number {
  if (a.world != b.world) {
    return Number.MAX_VALUE; // Different worlds are very far away, indeed
  }
  return a.distance(b); // Calculate distance normally
}
