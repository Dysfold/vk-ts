import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { giveItem } from '../common/helpers/inventory';
import { Currency } from './currency';
import { CURRENCY_ITEMS, getCoinData, getCoinDisplayName } from './money-mold';

/**
 * Calculate total value of given currency in an inventory
 * @param inv Inventory were the balace is calculated
 * @param currency Currency unit
 */
export function getInventoryBalance(inv: Inventory, currency: Currency) {
  const unit = currency.unit.toLowerCase();
  const sum = inv.contents.reduce((total, item) => {
    if (!item) return total;
    const data = getCoinData(item);
    if (!data?.unit) return total;

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
export function takeMoneyFrom(
  player: Player,
  amount: number,
  currency: Currency,
) {
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
    if (!data?.unit) return;

    if (!isSameCurrency(data.unit, currency.unit)) return;

    if (isSameCurrency(displayUnit, currency.unit)) {
      // Units
      const itemStacks = invCoins.get(amount);
      if (!itemStacks) invCoins.set(amount, [item]);
      else itemStacks.push(item);
      return;
    }
    // Sub units
    const subAmount = amount / 100;
    const itemStacks = invCoins.get(subAmount);
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

      const removeHowMany = Math.min(howMany, itemStack.amount);
      itemStack.amount -= removeHowMany;
      price -= removeHowMany * AMOUNT;
      if (price <= 0) break coinloop;
    }
  }

  Bukkit.broadcastMessage('Hintaa jäljellä ' + price);
  // If the price goes negative, player has payed too much -> return change coins
  if (price < 0) {
    giveMoney(player, -price, currency);
  }
}

export function giveMoney(
  player: Player,
  totalAmount: number,
  currency: Currency,
) {
  const coins = CURRENCY_ITEMS.get(currency.model);
  if (!coins) return;

  let amount = totalAmount;
  const VALUES = [1000, 100, 10, 1, 0.1, 0.01];
  for (const VALUE of VALUES) {
    if (VALUE > amount) continue;
    const howMany = Math.floor(amount / VALUE);
    amount -= howMany * VALUE;
    Bukkit.broadcastMessage('Palautetaan ' + howMany + ' ' + VALUE);
    const coin = coins.find((c) => c.value == VALUE);
    if (!coin) return;
    const customItem = coin.item;
    if (!customItem) return;
    const item = customItem.create(
      {
        unit: currency.unitPlural,
        subUnit: currency.subunitPlural,
      },
      howMany,
    );
    const meta = item.itemMeta;
    meta.displayName = getCoinDisplayName(coin, currency);
    item.itemMeta = meta;

    giveItem(player, item);
  }
}

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
