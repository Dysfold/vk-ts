import { text } from 'craftjs-plugin/chat';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

/**
 * Speaker staff significantly increases local channel range.
 */
export const SpeakerStaff = new CustomItem({
  id: 1,
  type: VkItem.UNSTACKABLE,
  name: text('vk.speaker_stick'),
});
