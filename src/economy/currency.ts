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

const MODEL_ID_TO_VALUE = new Map([
  [1, 0.01],
  [2, 0.1],
  [3, 1],
  [4, 10],
  [5, 100],
  [6, 1000],
]);

export function getMoneyValue(item: ItemStack) {
  if (!item.itemMeta.hasCustomModelData()) return undefined;
  return MODEL_ID_TO_VALUE.get(item.itemMeta.customModelData);
}

export function isSubunit(item: ItemStack) {
  const meta = item.itemMeta;
  if (!meta.hasCustomModelData) return false;
  const indexInCurrency = meta.customModelData % 10;
  // Subunits can be for examle 1, 2, 11, 12, 21, 22, 31, 32 etc
  if (indexInCurrency == 1 || indexInCurrency == 2) return true;
  return false;
}

export function isWholeUnit(item: ItemStack) {
  const meta = item.itemMeta;
  if (!meta.hasCustomModelData) return false;
  const indexInCurrency = meta.customModelData % 10;
  // Wholeunits can be for examle 3, 4, 5, 6, 13, 14, 15, 16, 23, 24, 25, 26 etc
  if (indexInCurrency >= 3 && indexInCurrency <= 6) return true;
  return false;
}

// export function isCurrencyModel(model: number): model is CurrencyModel {
//   return Object.values(CurrencyModel).includes(model as CurrencyModel);
// }

// export function getCurrency(
//   model: CurrencyModel | number,
//   unitPlural: string,
//   subunitPlural: string,
// ) {
//   if (!isCurrencyModel(model)) return undefined;

//   return {
//     model,
//     unit: unitPlural.slice(0, -1),
//     unitPlural,
//     subunit: subunitPlural.slice(0, -1),
//     subunitPlural,
//   } as Currency;
// }

// export function getShopCurrency(
//   currencyData: yup.TypeOf<typeof SHOP_DATA.currency>,
// ) {
//   if (!currencyData.model) return undefined;
//   if (!currencyData.unitPlural) return undefined;
//   if (!currencyData.subunitPlural) return undefined;
//   return getCurrency(
//     currencyData.model,
//     currencyData.unitPlural,
//     currencyData.subunitPlural,
//   );
// }
