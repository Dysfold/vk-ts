import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { getCoinData } from './money-mold';
import { Player } from 'org.bukkit.entity';
import { invert } from 'lodash';
import { Bukkit } from 'org.bukkit';

/**
 * Calculate total value of given currency in an inventory
 * @param inv Inventory were the balace is calculated
 * @param targetUnit Currency unit as string "Euro", "Punta" etc
 */
export function getInventoryBalance(inv: Inventory, targetUnit: string) {
  const unit = targetUnit.toLowerCase();
  const sum = inv.contents.reduce((total, item) => {
    if (!item) return total;
    const data = getCoinData(item);
    if (!data) return total;

    if (!isSameCurrency(data.unit, unit)) return total;

    const nameList = item.itemMeta.displayName.toLowerCase().split(' ');
    if (nameList.length !== 2) return total;
    const [nameAmount, nameUnit] = nameList;

    // TODO: Refactor this after CustomItems have static variables
    if (isSameCurrency(nameUnit, unit)) {
      // Is primary unit
      const value = Number.parseInt(nameAmount) || 0;

      return total + value * item.amount;
    }
    // Is sub unit
    const value = Number.parseInt(nameAmount) || 0;
    return total + 0.01 * value * item.amount;
  }, 0);

  // Round with 2 desimals
  return Math.round(sum * 100) / 100;
}

/**
 * Take money from player
 * @param player Player whom money is going to be removed
 * @param amount Amount of money to be removed
 * @param unit Currency as string
 */
export function takeMoneyFrom(player: Player, amount: number, unit: string) {
  /**
   * Map containing all coins in the players inventory.
   * Value of the coin is used as key (0.01, 0.1, 1, 10 etc)
   */
  const invCoins = new Map<number, ItemStack[]>();

  // Collect the itemstacks to the map above
  player.inventory.contents.forEach((item) => {
    if (!item?.itemMeta?.hasDisplayName()) return;
    const display = item.itemMeta.displayName;
    const names = display.split(' ');
    if (names.length !== 2) return;
    const [displayAmount, displayUnit] = names;
    const amount = Number.parseInt(displayAmount);
    if (isNaN(amount)) return;

    const data = getCoinData(item);
    if (!data) return;

    if (!isSameCurrency(data.unit, unit)) return;

    if (isSameCurrency(displayUnit, unit)) {
      // Units
      const itemStacks = invCoins.get(amount);
      Bukkit.broadcastMessage('MA ' + amount);
      if (!itemStacks) invCoins.set(amount, [item]);
      else itemStacks.push(item);
      return;
    }
    // Sub units
    const subAmount = amount / 100;
    const itemStacks = invCoins.get(subAmount);
    Bukkit.broadcastMessage('sub ' + subAmount);
    if (!itemStacks) invCoins.set(subAmount, [item]);
    else itemStacks.push(item);
    return;
  });

  const AMOUNTS = [0.01, 0.1, 1, 10, 100, 1000];

  let price = amount;
  coinloop: for (const AMOUNT of AMOUNTS) {
    const itemList = invCoins.get(AMOUNT);
    if (!itemList) continue;

    for (const itemStack of itemList) {
      const howMany = Math.ceil(price / AMOUNT);

      Bukkit.broadcastMessage(
        'How many [' + itemStack.itemMeta.displayName + '] ' + howMany,
      );
      const removeHowMany = Math.min(howMany, itemStack.amount);
      itemStack.amount -= removeHowMany;
      price -= removeHowMany * AMOUNT;
      if (price <= 0) break coinloop;
    }
  }

  Bukkit.broadcastMessage('Hintaa jäljellä ' + price);
}

export function giveMoney(player: Player, amount: number, unit: string) {}

/**
 * Compares 2 strings if they are the same unit:  "Euroa" == "euro" -> true
 */
export function isSameCurrency(unitA: string, unitB: string) {
  let a = unitA.toLowerCase();
  let b = unitB.toLowerCase();
  const minLen = Math.min(a.length, b.length);

  if (Math.abs(a.length - b.length) > 1) return false;
  a = a.substring(0, minLen);
  b = b.substring(0, minLen);
  return a == b;
}
