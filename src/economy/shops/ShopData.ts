import * as yup from 'yup';
import { dataType } from '../../common/datas/holder';

export const ShopData = dataType('shop-data', {
  type: yup.string().required(),
  item: yup.object({
    material: yup.string().required(),
    modelId: yup.number().notRequired(),
    name: yup.string().notRequired(),
  }),
  price: yup.number().required(),
  currency: yup.object({
    model: yup.number().required(),
    unitPlural: yup.string().required(),
    subunitPlural: yup.string().required(),
  }),
  tax: yup.number().required(),
  taxCollector: yup.string().notRequired(),
});
