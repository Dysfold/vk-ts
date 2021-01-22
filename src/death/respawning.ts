import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../common/datas/holder';
import { dataView, deleteView } from '../common/datas/view';
import { deathData } from './deathData';
import { objToLocation } from './helpers';

// This function will be called after the Tuonela timer has expired
export async function respawnPlayer(player: Player) {
  const view = dataView(deathData, dataHolder(player));
  const location = objToLocation(view.deathLocation);

  // If the player died in prison, respawn there
  // if () {
  //    ...
  //    return;
  // }

  // Secondary respawn location is the bed
  if (player.bedSpawnLocation) {
    player.teleport(player.bedSpawnLocation);
    return;
  }

  // Respawn the player to the nearest respawnblock
  player.teleport(location);

  // Clear data
  deleteView(deathData, player);
}
