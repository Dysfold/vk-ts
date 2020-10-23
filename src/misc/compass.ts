import { Location, Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

registerCommand('kompassi', (sender, label, args) => {
  sender.sendMessage('123 ' + label);
  if (args.length !== 2) {
    sender.sendMessage('Virheelliset koordinaatit. /kompassi <x> <z>');
    return;
  }
  const x = Number(args[0]);
  const z = Number(args[1]);
  if (isNaN(x) || isNaN(z)) {
    sender.sendMessage('Virheelliset koordinaatit. /kompassi <x> <z>');
    return;
  }

  if (sender instanceof Player) {
    const player = sender as Player;
    const location = new Location(player.world, x, 0, z);
    player.compassTarget = location;
    player.sendMessage(`Kompassi osoittaa nyt koordinaatteihin x:${x} z:${z}`);
  }
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
