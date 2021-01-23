import { Bukkit, Sound } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../common/datas/holder';
import { dataView, deleteView } from '../common/datas/view';
import { DeathData } from './DeathData';
import { objToLocation } from './helpers';
import { getNearestSpawnBlock } from './spawnblocks';

// This function will be called after the Tuonela timer has expired
export async function respawnPlayer(player: Player) {
  const view = dataView(DeathData, dataHolder(player));
  const location = objToLocation(view.deathLocation);
  let respawnLocation = undefined;

  // If the player died in prison, respawn there
  if (view.isPrisoner) {
    player.sendTitle('', 'Heräät sellin sängystä', 20, 40, 20);
    respawnLocation = location;
  }

  // Secondary respawn location is the bed
  else if (player.bedSpawnLocation) {
    respawnLocation = player.bedSpawnLocation;
  }

  // Respawn the player to the nearest respawnblock
  const spawnBlock = getNearestSpawnBlock(location);
  if (!respawnLocation && spawnBlock) {
    respawnLocation = spawnBlock.location.add(0.5, 1, 0.5);
  }

  // If no other spawn is valid
  if (!respawnLocation) {
    log.warn(
      `${player.name} spawnasi ja yhtään spawnkuutiota ei löytynyt. Virhe?`,
    );
    respawnLocation = location.world.spawnLocation;
  }

  player.teleport(respawnLocation);

  // Clear data
  deleteView(DeathData, player);

  player.playSound(player.location, Sound.ITEM_ARMOR_EQUIP_LEATHER, 1, 1);
}

registerCommand('respawn', (sender, _label, args) => {
  if (!args.length) {
    if (sender instanceof Player) {
      respawnPlayer(sender);
      return;
    }
  }
  const player = Bukkit.server.getPlayer(args[0]);
  if (player) {
    sender.sendMessage('Pelaaja herätetty kuolleista');
    respawnPlayer(player);
  }
});
