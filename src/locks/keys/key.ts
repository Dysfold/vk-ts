import { translate, color, text } from 'craftjs-plugin/chat';
import { CustomItem } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';
import * as yup from 'yup';
import { Player } from 'org.bukkit.entity';
import { giveItem } from '../../common/helpers/inventory';

const KEY_DATA = {
  code: yup.number().notRequired(),
};

export const Key = new CustomItem({
  id: 13,
  name: translate('vk.key'),
  type: VkItem.UNSTACKABLE,
  data: KEY_DATA,
});

// Development only
registerCommand(
  'key',
  (sender, _alias, args) => {
    if (!(sender instanceof Player)) return;
    let code: number | undefined = Number.parseInt(args?.[0]);
    code = isNaN(code) ? undefined : code;
    const key = createKey(code);
    giveItem(sender, key, sender.mainHand);
  },
  {
    executableBy: 'players',
  },
);

export function createKey(code?: number) {
  const item = Key.create({ code });
  if (code !== undefined) {
    const meta = item.itemMeta;
    const codeString = color('#FFFFFF', text(`${code}`));
    codeString.italic = false;
    meta.loreComponents = [[codeString]];
    item.itemMeta = meta;
  }
  return item;
}
