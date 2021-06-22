import { translate } from 'craftjs-plugin/chat';
import * as yup from 'yup';
import { Data } from '../../common/datas/yup-utils';
import { CustomItem } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';

export const LOCK_DATA = {
  code: yup.number().notRequired(),
  isLocked: yup.boolean(),
  created: yup.number(),
};

export type LockDataType = Data<typeof LOCK_DATA>;

export type LockCustomItem = CustomItem<typeof LOCK_DATA>;

/**
 * Obtainable lock item. Used to place locks on blocks
 */
export const LockItem = new CustomItem({
  id: 3,
  type: VkItem.MISC,
  data: {
    code: yup.number().notRequired(),
  },
  name: translate('vk.lock'),
});
