/**
 * @param name Name of the player.
 * @returns True of false.
 */
export function isAdminAccount(name: string) {
  const adminAccounts = ['valtakausi'];
  return adminAccounts.includes(name.toLowerCase());
}
