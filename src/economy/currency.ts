import * as yup from 'yup';
import { SHOP_DATA } from './shops/ShopData';

export const CurrencyModel = {
  GOLDEN: 0,
  SILVER: 1,
  PAPER: 2,
} as const;
export type CurrencyModel = typeof CurrencyModel[keyof typeof CurrencyModel];

// Infromation about the name of the currency
export interface Currency {
  model: CurrencyModel;
  unit: string;
  unitPlural: string;
  subunit: string;
  subunitPlural: string;
}

export const YUP_CURRENCY = yup.object({
  model: yup.number().required(),
  unitPlural: yup.string().required(),
  subunitPlural: yup.string().required(),
});

export function isCurrencyModel(model: number): model is CurrencyModel {
  return Object.values(CurrencyModel).includes(model as CurrencyModel);
}

export function getCurrency(
  model: CurrencyModel | number,
  unitPlural: string,
  subunitPlural: string,
) {
  if (!isCurrencyModel(model)) return undefined;

  return {
    model,
    unit: unitPlural.slice(0, -1),
    unitPlural,
    subunit: subunitPlural.slice(0, -1),
    subunitPlural,
  } as Currency;
}

export function getShopCurrency(
  currencyData: yup.TypeOf<typeof SHOP_DATA.currency>,
) {
  if (!currencyData.model) return undefined;
  if (!currencyData.unitPlural) return undefined;
  if (!currencyData.subunitPlural) return undefined;
  return getCurrency(
    currencyData.model,
    currencyData.unitPlural,
    currencyData.subunitPlural,
  );
}
