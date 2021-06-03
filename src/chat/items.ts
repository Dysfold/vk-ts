import { text } from 'craftjs-plugin/chat';
import { Material } from 'org.bukkit';
import { CustomItem } from '../common/items/CustomItem';

/**
 * Speaker staff significantly increases local channel range.
 */
export const SpeakerStaff = new CustomItem({
  id: 1,
  type: Material.GOLDEN_HORSE_ARMOR,
  name: text('vk.speaker_stick'),
});
