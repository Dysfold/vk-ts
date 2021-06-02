import { Location, Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import {
  addTranslation,
  getTranslator,
} from '../common/localization/localization';

registerCommand(['kompassi', 'compass'], (sender, label, args) => {
  if (!(sender instanceof Player)) return;
  const t = getTranslator(sender);

  let x, z;
  switch (args.length) {
    case 0:
      x = 0;
      z = 0;
      break;
    case 2:
      x = Number(args[0]);
      z = Number(args[1]);
      break;
    case 3:
      x = Number(args[0]);
      // y is ignored
      z = Number(args[2]);
      break;
    default:
      sender.sendMessage(t('compass.invalid_coordinates'));
      return;
  }

  if (isNaN(x) || isNaN(z)) {
    sender.sendMessage(t('compass.invalid_coordinates'));
    return;
  }

  const location = new Location(sender.world, x, 0, z);
  sender.compassTarget = location;
  sender.sendMessage(t('compass.pointing_to', `${x}`, `${z}`));
});

registerEvent(PlayerInteractEvent, (event) => {
  if (!event.item) return;
  if (event.item.type !== Material.COMPASS) return;
  const player = event.player;
  const loc = player.location;
  player.sendActionBar(
    `${loc.x.toFixed(2)} / ${loc.y.toFixed(2)} / ${loc.z.toFixed(2)}`,
  );
});

/****************
 * Translations
 ****************/

addTranslation('compass.pointing_to', {
  fi_fi: 'Kompassi osoittaa nyt koordinaatteihin x:%s z:%s',
  en_us: 'The compass is pointing towards x:%s z:%s',
});

addTranslation('compass.invalid_coordinates', {
  fi_fi: 'Virheelliset koordinaatit. /kompassi <x> <z>',
  en_us: 'Invalid coordinates. /compass <x> <z>',
});
