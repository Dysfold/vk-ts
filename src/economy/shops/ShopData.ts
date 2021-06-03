import * as yup from 'yup';
import { dataType } from '../../common/datas/holder';
import { Block, Sign } from 'org.bukkit.block';
import { dataView } from '../../common/datas/view';

export const SHOP_DATA = {
  type: yup.string().required(),
  item: yup
    .object({
      material: yup.string().required(),
      modelId: yup.number().notRequired(),
      name: yup.string().notRequired(),
      translationKey: yup.string().notRequired(),
    })
    .required(),
  price: yup.number().required(),
  currency: yup.number().required(),
  taxRate: yup.number().required(),
  taxCollector: yup.string().notRequired(),
};

export type ShopDataType = typeof SHOP_DATA;
export type ShopItemDataType = yup.TypeOf<typeof SHOP_DATA.item>;
export type ShopCurrencyType = yup.TypeOf<typeof SHOP_DATA.currency>;

export const ShopData = dataType('shop-data', SHOP_DATA);

/**
 * Get a database view of the shop
 * @param block The sign in fron of the (chest)shop
 */
export function getShop(block: Block) {
  if (!(block.state instanceof Sign)) return undefined;
  const view = dataView(ShopData, block.state);
  return view;
}
