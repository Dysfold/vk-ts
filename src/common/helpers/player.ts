import { OfflinePlayer } from 'org.bukkit';

/**
 * @param player Player to be checked.
 * @returns True of false.
 */
export function isAdminAccount(player: OfflinePlayer) {
  const adminAccounts = ['Valtakausi'];
  if (!player || !player.name) return false;
  return adminAccounts.includes(player.name);
}
