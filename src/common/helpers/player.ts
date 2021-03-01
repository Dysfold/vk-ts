import { OfflinePlayer } from "org.bukkit";

/**
 * @param name Name of the player.
 * @returns True of false.
 */
export function isAdminAccount(player: OfflinePlayer) {
  const adminAccounts = ['Valtakausi'];
  if (!player || !player.name) return false;
  return adminAccounts.includes(player.name);
}
