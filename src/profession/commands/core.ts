import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { errorMessage } from '../../chat/system';
import { Nation, nationById } from '../nation';
import { getProfession } from '../profession';

/**
 * Gets the nation that a command should be operating on.
 * For most players, it is the nation of their profession. Admins can
 * (and probably have to) explicitly set the nation by --valtio argument.
 * @param sender Command sender.
 * @param args Initial command arguments.
 * @returns Arguments with nation argument removed, the nation or undefined if
 * no nation could be determined.
 */
export function getContextNation(
  sender: CommandSender,
  args: string[],
): [string[], Nation | undefined] {
  let nation: Nation | undefined;
  if (args[0] == '--valtio' && args[1]) {
    if (sender.hasPermission('vk.profession.admin')) {
      nation = nationById(args[1]);
      if (!nation) {
        errorMessage(sender, `Valtiota ${args[1]} ei ole olemassa`);
        return [args, undefined];
      }
      args = args.slice(2); // Skip these arguments
    } else {
      // Overriding nation is admin-only feature
      errorMessage(
        sender,
        'Sinulla ei ole oikeutta ammattien ylläpitokomentoihin.',
      );
      return [args, undefined];
    }
  } else {
    // Nation not provided as argument, try to get it from player
    nation = guessNation(sender);
  }
  return [args, nation];
}

export function guessNation(sender: CommandSender): Nation | undefined {
  if (!(sender instanceof Player)) {
    return undefined; // Console doesn't have a nation
  }
  const profession = getProfession(sender);
  if (profession?.type != 'player') {
    return undefined; // No profession or system profession (no associated nation)
  }
  return nationById(profession.nation);
}
