import { ItemStack } from 'org.bukkit.inventory';
import { VkItem } from '../common/items/VkItem';
import { addTranslation } from '../common/localization/localization';

export const Currency = {
  CLASSIC_GOLD: 0,
  SILVER: 1,
  GREEN_PAPER: 2,
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

interface CurrencyTranslation {
  unit: string;
  unitPlural: string;
  subunit: string;
  subunitPlural: string;
}

const CURRENCY_TRANSLATIONS = new Map<Currency, CurrencyTranslation>([
  [
    Currency.CLASSIC_GOLD,
    {
      unit: 'vk.currency_a_unit',
      unitPlural: 'vk.currency_a_unit_plural',
      subunit: 'vk.currency_a_subunit',
      subunitPlural: 'vk.currency_a_subunit_plural',
    },
  ],
  [
    Currency.SILVER,
    {
      unit: 'vk.currency_b_unit',
      unitPlural: 'vk.currency_b_unit_plural',
      subunit: 'vk.currency_b_subunit',
      subunitPlural: 'vk.currency_b_subunit_plural',
    },
  ],
  [
    Currency.GREEN_PAPER,
    {
      unit: 'vk.currency_c_unit',
      unitPlural: 'vk.currency_c_unit_plural',
      subunit: 'vk.currency_c_subunit',
      subunitPlural: 'vk.currency_c_subunit_plural',
    },
  ],
]);

const FALLBACK_TRANSLATION: CurrencyTranslation = {
  unit: 'vk.currency_unknown_unit',
  unitPlural: 'vk.currency_unknown_unit_plural',
  subunit: 'vk.currency_unknown_subunit',
  subunitPlural: 'vk.currency_unknown_subunit_plural',
};

/**
 * These translation keys must be exacly the same as in respack.
 * When adding a new currency, add the translation key to
 * here and to resource pack lang
 */
addTranslation('vk.currency_a_unit', {
  fi_fi: 'Punta',
  en_us: 'Pound',
});
addTranslation('vk.currency_a_unit_plural', {
  fi_fi: 'Puntaa',
  en_us: 'Pounds',
});
addTranslation('vk.currency_a_subunit', {
  fi_fi: 'Penni',
  en_us: 'Penny',
});
addTranslation('vk.currency_a_subunit_plural', {
  fi_fi: 'Penniä',
  en_us: 'Pennies',
});

addTranslation('vk.currency_b_unit', {
  fi_fi: 'Šillinki',
  en_us: 'Shilling',
});
addTranslation('vk.currency_b_unit_plural', {
  fi_fi: 'Šillinkiä',
  en_us: 'Shillings',
});
addTranslation('vk.currency_b_subunit', {
  fi_fi: 'Sentti',
  en_us: 'Cent',
});
addTranslation('vk.currency_b_subunit_plural', {
  fi_fi: 'Senttiä',
  en_us: 'Cents',
});

addTranslation('vk.currency_c_unit', {
  fi_fi: 'Rupla',
  en_us: 'Ruble',
});
addTranslation('vk.currency_c_unit_plural', {
  fi_fi: 'Ruplaa',
  en_us: 'Rubles',
});
addTranslation('vk.currency_c_subunit', {
  fi_fi: 'Kopeekka',
  en_us: 'Kopek',
});
addTranslation('vk.currency_c_subunit_plural', {
  fi_fi: 'Kopeekkaa',
  en_us: 'Kopeks',
});

export function getCurrencyTranslation(currency: Currency) {
  const translation = CURRENCY_TRANSLATIONS.get(currency);
  if (!translation) {
    log.error('Missing currency translation for currency ' + currency);
    return FALLBACK_TRANSLATION;
  }
  return translation;
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
