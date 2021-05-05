import * as yup from 'yup';
import { dataType } from '../../common/datas/holder';
import { Block, Sign } from 'org.bukkit.block';
import { dataView } from '../../common/datas/view';

export const SHOP_DATA = {
  type: yup.string().required(),
  item: yup.object({
    material: yup.string().required(),
    modelId: yup.number().notRequired(),
    name: yup.string().notRequired(),
    translationKey: yup.string().notRequired(),
  }),
  price: yup.number().required(),
  currency: yup.object({
    model: yup.number().required(),
    unitPlural: yup.string().required(),
    subunitPlural: yup.string().required(),
  }),
  tax: yup.number().required(),
  taxCollector: yup.string().notRequired(),
};

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
