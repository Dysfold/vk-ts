import { translate } from 'craftjs-plugin/chat';
import * as yup from 'yup';
import { Data } from '../../common/datas/yup-utils';
import { CustomItem, CUSTOM_DATA_KEY } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';
import { ItemStack } from 'org.bukkit.inventory';
import { dataType } from '../../common/datas/holder';
import { dataView } from '../../common/datas/view';

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

export function isLockItem(item: ItemStack) {
  if (!item || item.type.isAir()) return false;
  const type = dataType(CUSTOM_DATA_KEY, LOCK_DATA);
  const data = dataView(type, item);

  return 'code' in data && 'isLocked' in data && 'created' in data;
}
