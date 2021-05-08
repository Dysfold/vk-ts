import { Table } from 'craftjs-plugin';
import { UUID } from 'java.util';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { getTable } from '../common/datas/database';
import { Nation } from './nation';
import { addPermissionSource, updatePermissions } from './permissions';

/**
 * Serialized profession data.
 */
const professionTable: Table<string, string> = getTable('profession_defs');

/**
 * Professions by their ids.
 */
const professions: Map<string, Profession> = new Map();

/**
 * Profession names to maps of nation ids to professions.
 * Since multiple nations can have different professions with overlapping
 * names, many user-facing commands actually operate on MANY professions.
 */
const professionsByNames: Map<string, Map<string, Profession>> = new Map();

/**
 * Professions by nation ids.
 */
const professionsByNation: Map<string, PlayerProfession[]> = new Map();

/**
 * Profession ids to cached permissions of them.
 */
const permissionCache: Map<string, string[]> = new Map();

/**
 * Players mapped to their professions.
 */
const playerProfessions: Table<UUID, string> = getTable('professions');

/**
 * Players mapped to when they were appointed to a profession last time.
 */
const appointTimes: Table<UUID, number> = getTable('profession_appoint_times');

/**
 * Profession details.
 */
interface BaseProfession {
  /**
   * Type of profession.
   */
  type: string;

  /**
   * Display name of the profession.
   */
  name: string;

  /**
   * Profession description, shown on mouse hover in chat.
   */
  description: string;

  /**
   * Direct subordinates of this profession.
   */
  subordinates: string[];

  /**
   * Profession features that grant it permissions.
   */
  features: ProfessionFeature[];
}

/**
 * System professions are defined in code, belong to no nation and cannot be
 * changed (even by admins) with in-game commands.
 */
export interface SystemProfession extends BaseProfession {
  type: 'system';
}

/**
 * Player-created professions are associated with nations and managed by
 * rulers or admins.
 */
export interface PlayerProfession extends BaseProfession {
  type: 'player';

  /**
   * The nation this profession is associated with.
   */
  nation: string;

  /**
   * UUID of player who created this profession.
   */
  creator: string;
}

export type Profession = SystemProfession | PlayerProfession;

/**
 * Creates an unique id for a profession.
 * @param profession Profession data.
 * @returns Profession id.
 */
export function professionId(profession: Profession) {
  if (profession.type == 'system') {
    return 'system:' + profession.name.toLowerCase();
  } else {
    return `${profession.nation}:${profession.name.toLowerCase()}`;
  }
}

/**
 * Special profession feature that grants permissions.
 */
interface ProfessionFeature {
  /**
   * Who can add this feature to a profession.
   */
  availability: 'ruler' | 'admin';

  /**
   * Permissions this feature grants to professions.
   */
  permissions: string[];
}

/**
 * Loads non-system professions.
 */
function loadProfessions() {
  // Load professions from JSON
  for (const [id, json] of professionTable) {
    professions.set(id, JSON.parse(json));
    updateCaches(id);
  }
}

/**
 * Updates caches after a profession has been modified or loaded.
 * @param id Profession id.
 */
function updateCaches(id: string) {
  const profession = professions.get(id);
  if (!profession) {
    throw new Error(`profession ${id} does not exist`);
  }

  // Cache permissions from features
  const perms = [];
  for (const feature of profession.features) {
    perms.push(...feature.permissions);
  }
  permissionCache.set(id, perms);

  if (profession.type == 'player') {
    // Update name -> nation, profession lookup table
    const name = profession.name.toLowerCase();
    if (!professionsByNames.has(name)) {
      professionsByNames.set(name, new Map());
    }
    professionsByNames.get(name)?.set(profession.nation, profession);

    // Update nation -> profession list lookup table
    let nationProfs = professionsByNation.get(profession.nation) ?? [];
    nationProfs = nationProfs.filter((prof) => prof.name == name); // Clear previous
    nationProfs.push(profession); // Add to end
    nationProfs.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    ); // Sort by profession name
    professionsByNation.set(profession.nation, nationProfs);
  }
}

/**
 * Gets a profession by its id.
 * @param id Profession id.
 * @returns A profession, or undefined if no profession with given id exists.
 */
export function professionById(id: string): Profession | undefined {
  return professions.get(id);
}

/**
 * Gets all professions that share the given name.
 * @param name Profession name (case doesn't matter).
 * @returns Professions by nation ids, or empty map if no profession with given
 * name exists.
 */
export function professionsByName(name: string): Map<string, Profession> {
  return professionsByNames.get(name.toLowerCase()) ?? new Map();
}

/**
 * Gets a profession by id in given nation.
 * @param nation Nation data.
 * @param name Profession name.
 * @returns Profession data, or undefined if the profession does not exist in
 * given nation.
 */
export function professionInNation(
  nation: Nation,
  name: string,
): PlayerProfession | undefined {
  // All professions in nations are player-created
  return professionById(
    nation.id + ':' + name.toLowerCase(),
  ) as PlayerProfession;
}

export function professionsInNation(nation: Nation): PlayerProfession[] {
  return professionsByNation.get(nation.id) ?? [];
}

/**
 * Gets permissions granted by a profession.
 * @param profession Profession data.
 * @returns List of permissions granted by the profession.
 */
export function getProfessionPermissions(profession: Profession): string[] {
  return permissionCache.get(professionId(profession)) ?? [];
}

/**
 * Adds a new system profession.
 * @param profession Profession data.
 */
export function addSystemProfession(profession: SystemProfession): void {
  const id = professionId(profession);
  professions.set(id, profession);
  updateCaches(id);
}

/**
 * Updates or adds a new player-created profession.
 * @param profession Profession data.
 */
export function updateProfession(profession: PlayerProfession) {
  const id = professionId(profession);
  professions.set(id, profession); // Update in-memory
  professionTable.set(id, JSON.stringify(profession)); // And to database
  updateCaches(id); // Cached things might have changed

  // Refresh permissions of online players with this profession
  for (const player of Bukkit.onlinePlayers) {
    if (getProfession(player) == profession) {
      updatePermissions(player);
    }
  }
}

/**
 * Deletes a player-created profession.
 * @param profession Profession data.
 * @returns The players who had this profession before it was deleted.
 */
export function removeProfession(
  profession: PlayerProfession,
): OfflinePlayer[] {
  const id = professionId(profession);

  // Remove profession from all players
  const players: OfflinePlayer[] = [];
  filterProfessions((uuid, name) => {
    if (name == id) {
      players.push(Bukkit.getOfflinePlayer(uuid));
      return false;
    }
    return true;
  });

  // Delete the profession
  professions.delete(id);
  professionTable.delete(id);
  return players;
}

/**
 * Gets profession of a player.
 * @param player Player.
 * @returns A profession, or undefined if they currently lack one.
 */
export function getProfession(player: OfflinePlayer): Profession | undefined {
  const id = playerProfessions.get(player.uniqueId);
  return id ? professionById(id) : undefined;
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

/**
 * Filters out professions from players.
 * @param callback Function that is called with UUID of each player with
 * profession and that profession. Players without professions are ignored.
 * If the function returns false, the profession is removed.
 */
export function filterProfessions(
  callback: (uuid: UUID, name: string) => boolean,
) {
  const removeQueue = [];
  for (const [uuid, name] of playerProfessions) {
    if (!callback(uuid, name)) {
      removeQueue.push(uuid);
    }
  }

  // Clear professions after iteration (probably should not modify table during it)
  for (const uuid of removeQueue) {
    clearProfession(Bukkit.getOfflinePlayer(uuid));
  }
}

// Plug in player profession to permission system
addPermissionSource((player) => {
  const profession = getProfession(player);
  if (profession) {
    return getProfessionPermissions(profession);
  }
  return [];
});

loadProfessions(); // Load non-system professions from database
