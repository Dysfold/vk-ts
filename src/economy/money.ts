import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { addItemTo } from '../common/helpers/inventory';
import { Currency, getCurrency, getMoneyValue } from './currency';
import { CURRENCY_ITEMS, getCoinDisplayName } from './money-mold';

/**
 * Calculate total value of given currency in an inventory
 * @param inv Inventory were the balace is calculated
 * @param currency Currency unit
 */
export function getInventoryBalance(inv: Inventory, currency: Currency) {
  const contents = inv.contents ?? [];
  const sum = contents.reduce((total, item) => {
    if (!item) return total;

    if (currency !== getCurrency(item)) return total;

    const value = getMoneyValue(item);

    if (value === undefined) return total;

    return total + value * item.amount;
  }, 0);

  return sum;
}

/**
 * Take money from player
 * @param inventory Inventory where money is going to be removed
 * @param amount Amount of money to be removed
 * @param unit Currency as string
 */
export function takeMoneyFrom(
  inventory: Inventory,
  amount: number,
  currency: Currency,
) {
  /**
   * Map containing all coins in the players inventory.
   * Value of the coin is used as key (0.01, 0.1, 1, 10 etc)
   */
  const invCoins = new Map<number, ItemStack[]>();

  // Collect the itemstacks to the map above
  inventory.contents?.forEach((item) => {
    // Check if the item is the wanted currency
    if (currency !== getCurrency(item)) return;

    const value = getMoneyValue(item);
    if (value === undefined) return;

    // Save the itemstack to the Map
    const itemStacks = invCoins.get(value);
    if (!itemStacks) invCoins.set(value, [item]);
    else itemStacks.push(item);
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

  // If the inventory does not have enought money. This should never be true, but just in case
  if (price > 0) {
    log.error(
      `Player did not have enought money (${price})! This message should never be shown. `,
    );
    inventory.viewers.forEach((viewer) => {
      viewer.sendMessage(
        'Rahan ottaminen epäonnistui. Ota tästä viestistä kuva ja ota yhteyttä ylläpitäjiin tai kehittäjiin',
      );
    });
    // Give the money back to the inventory
    giveMoney(inventory, amount - price, currency);
    return false;
  }
  // If the price goes negative, player has payed too much -> return change coins
  if (price < 0) {
    giveMoney(inventory, -price, currency);
  }
  return true;
}

export function giveMoney(
  inventory: Inventory,
  totalAmount: number,
  currency: Currency,
) {
  const coins = CURRENCY_ITEMS.get(currency);
  if (!coins) return;

  let amount = totalAmount;
  const VALUES = [1000, 100, 10, 1, 0.1, 0.01];
  for (const VALUE of VALUES) {
    if (VALUE > amount) continue;
    const howMany = Math.floor(amount / VALUE);
    amount -= howMany * VALUE;
    const coin = coins.find((c) => c.value == VALUE);
    if (!coin) return;
    const customItem = coin.item;
    if (!customItem) return;
    const item = customItem.create({}, howMany);
    const meta = item.itemMeta;
    meta.displayNameComponent = getCoinDisplayName(coin, currency);
    item.itemMeta = meta;

    addItemTo(inventory, item);
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
