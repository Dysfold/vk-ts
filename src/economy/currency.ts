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

export function isCurrencyModel(model: number): model is CurrencyModel {
  return Object.values(CurrencyModel).includes(model as CurrencyModel);
}

export function getCurrency(
  model: CurrencyModel | number,
  unitPlural: string,
  subunitPlural: string,
) {
  if (!isCurrencyModel(model)) return;

  return {
    model,
    unit: unitPlural.slice(0, -1),
    unitPlural,
    subunit: unitPlural.slice(0, -1),
    subunitPlural,
  } as Currency;
}
