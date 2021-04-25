import { translate } from "craftjs-plugin/chat";
import { CustomItem } from "../common/items/CustomItem";
import { VkItem } from "../common/items/VkItem";

export const Key = new CustomItem({
    id: 13,
    name: translate('vk.key'),
    type: VkItem.UNSTACKABLE,
  });