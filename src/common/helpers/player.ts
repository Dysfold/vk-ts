import { OfflinePlayer, Bukkit } from 'org.bukkit';

/**
 * @param player Player to be checked.
 * @returns True of false.
 */
export function isAdminAccount(player: OfflinePlayer) {
  const adminAccounts = ['Valtakausi'];
  if (!player || !player.name) return false;
  return adminAccounts.includes(player.name);
}

/**
 * Get usernames of onlineplayers as string[]
 * This is usefull for command completors
 */
export function getOnlinePlayerNames() {
  return Array.from(Bukkit.onlinePlayers).map((player) => player.name);
}
