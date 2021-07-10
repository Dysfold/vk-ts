import { Table } from 'craftjs-plugin';
import { UUID } from 'java.util';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { getTable } from '../../common/datas/database';
import { updatePermissions } from '../permissions';
import { Profession, professionId } from '../profession';

/**
 * Players mapped to their professions.
 */
const playerProfessions: Table<UUID, string> = getTable('professions');

/**
 * Players mapped to when they were appointed to a profession last time.
 */
const appointTimes: Table<UUID, number> = getTable('profession_appoint_times');

/**
 * Gets profession id of a player. See getProfession() in profession.ts.
 * @param player Player.
 * @returns Profession id or null.
 */
export function getProfessionId(player: OfflinePlayer): string | null {
  return playerProfessions.get(player.uniqueId);
}

/**
 * Sets profession of a player.
 * @param player Player.
 * @param profession Profession to give.
 */
export function setProfession(
  player: OfflinePlayer,
  profession: Profession,
): void {
  playerProfessions.set(player.uniqueId, professionId(profession));
  appointTimes.set(player.uniqueId, Date.now());

  // Ensure that profession permissions work immediately
  const online = player.player;
  if (online) {
    updatePermissions(online);
  }
}

/**
 * Clears profession of a player, if they have one.
 * @param player Player.
 */
export function clearProfession(player: OfflinePlayer): void {
  playerProfessions.delete(player.uniqueId);

  // Ensure that profession permissions are removed immediately
  const online = player.player;
  if (online) {
    updatePermissions(online);
  }
}

/**
 * Gets when player was last appointed to a profession.
 * @param player Player.
 * @returns Milliseconds since UNIX epoch.
 */
export function getAppointTime(player: OfflinePlayer): number {
  return appointTimes.get(player.uniqueId) ?? 0;
}

export function clearAppointTime(player: OfflinePlayer): void {
  appointTimes.delete(player.uniqueId);
}

/**
 * Filters out professions from players.
 * @param callback Function that is called with UUID of each player with
 * profession and that profession. Players without professions are ignored.
 * If the function returns false, the profession is removed.
 */
export function filterProfessions(
  callback: (uuid: UUID, id: string) => boolean,
): void {
  const removeQueue = [];
  for (const [uuid, id] of playerProfessions) {
    if (!callback(uuid, id)) {
      removeQueue.push(uuid);
    }
  }

  // Clear professions after iteration (probably should not modify table during it)
  for (const uuid of removeQueue) {
    clearProfession(Bukkit.getOfflinePlayer(uuid));
  }
}
