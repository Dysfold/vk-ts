import { ItemStack } from 'org.bukkit.inventory';
import { VkItem } from '../common/items/VkItem';

export const Currency = {
  CLASSIC_GOLD: 0,
  SILVER: 1,
  GREEN_PAPER: 2,
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

interface CurrencyName {
  unit: string;
  unitPlural: string;
  subunit: string;
  subunitPlural: string;
}

interface CurrencyNames {
  translations: CurrencyName;
  plainText: CurrencyName;
}

const currencyNames = new Map<Currency, CurrencyNames>([
  [
    Currency.CLASSIC_GOLD,
    {
      translations: {
        unit: 'vk.currency_a_unit',
        unitPlural: 'vk.currency_a_unit_plural',
        subunit: 'vk.currency_a_subunit',
        subunitPlural: 'vk.currency_a_subunit_plural',
      },
      plainText: {
        unit: 'Punta',
        unitPlural: 'Puntaa',
        subunit: 'Penni',
        subunitPlural: 'Penniä',
      },
    },
  ],
  [
    Currency.SILVER,
    {
      translations: {
        unit: 'vk.currency_b_unit',
        unitPlural: 'vk.currency_b_unit_plural',
        subunit: 'vk.currency_b_subunit',
        subunitPlural: 'vk.currency_b_subunit_plural',
      },
      plainText: {
        unit: 'Sillinki',
        unitPlural: 'Sillinkiä',
        subunit: 'Sentti',
        subunitPlural: 'Senttiä',
      },
    },
  ],
  [
    Currency.GREEN_PAPER,
    {
      translations: {
        unit: 'vk.currency_c_unit',
        unitPlural: 'vk.currency_c_unit_plural',
        subunit: 'vk.currency_c_subunit',
        subunitPlural: 'vk.currency_c_subunit_plural',
      },
      plainText: {
        unit: 'Rupla',
        unitPlural: 'Ruplaa',
        subunit: 'Kopeekka',
        subunitPlural: 'Kopeekkaa',
      },
    },
  ],
]);

export function getCurrencyNames(currency: Currency) {
  return currencyNames.get(currency);
}

export function getCurrency(item: ItemStack): Currency | undefined {
  if (!isMoney(item)) return undefined;

  const modelId = item.itemMeta.customModelData;
  // Every currency is 10*n + index, so we can get currency with dividing by 10
  const indexInCurrency = modelId % 10;
  if (indexInCurrency < 1 || indexInCurrency > 6) return undefined;
  return Math.floor(modelId / 10) as Currency;
}

function isMoney(item: ItemStack) {
  if (item?.type !== VkItem.MONEY) return false;
  if (!item.itemMeta.hasCustomModelData()) return false;
  return true;
}

/**
 * Coin model ids are 10*n + offset
 * For example currency X might be
 * 31, 32, 33, 34, 35 and 36
 * and currency Y might be
 * 61, 62, 63, 64, 65 and 36
 */
const MODEL_OFFSET_TO_VALUE = new Map([
  [1, 0.01],
  [2, 0.1],
  [3, 1],
  [4, 10],
  [5, 100],
  [6, 1000],
]);

export function getMoneyValue(item: ItemStack) {
  const modelOffset = getModelOffset(item);
  if (modelOffset == undefined) return undefined;
  return MODEL_OFFSET_TO_VALUE.get(modelOffset);
}

function getModelOffset(item: ItemStack) {
  if (!item.itemMeta.hasCustomModelData()) return undefined;
  return item.itemMeta.customModelData % 10;
}
