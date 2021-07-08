import { translate, text, color } from 'craftjs-plugin/chat';
import * as yup from 'yup';
import { Data } from '../../common/datas/yup-utils';
import { CustomItem, CUSTOM_DATA_KEY } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';
import { ItemStack } from 'org.bukkit.inventory';
import { dataType } from '../../common/datas/holder';
import { dataView } from '../../common/datas/view';
import { Player } from 'org.bukkit.entity';
import { removeDecorations } from '../../chat/utils';
import { TextDecoration } from 'net.kyori.adventure.text.format';
import { giveItem } from '../../common/helpers/inventory';

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

// Development only
registerCommand(
  'lock',
  (sender, _alias, args) => {
    if (!(sender instanceof Player)) return;
    let code: number | undefined = Number.parseInt(args?.[0]);
    code = isNaN(code) ? undefined : code;
    const key = createLockItem(code);
    giveItem(sender, key, sender.mainHand);
  },
  {
    executableBy: 'players',
  },
);

export function createLockItem(code?: number) {
  const item = LockItem.create({ code });
  if (code !== undefined) {
    addLockCodeToItemLore(item, code);
  }
  return item;
}

export function addLockCodeToItemLore(item: ItemStack, code: number) {
  const meta = item.itemMeta;

  const loreText = text(`${code}`);
  const loreComponent = removeDecorations(loreText, TextDecoration.ITALIC);
  const styledLore = color('#FFFFFF', loreComponent);

  meta.lore([styledLore]);
  item.itemMeta = meta;
  return item;
}
