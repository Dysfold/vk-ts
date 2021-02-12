import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { CustomItem } from '../common/items/CustomItem';

/**
 * Speaker staff significantly increases local channel range.
 */
export const SpeakerStaff = new CustomItem({
  id: 1,
  type: Material.GOLDEN_HORSE_ARMOR,
  name: 'Puhujankeppi',
  modelId: 1,
});

registerCommand('speakerstaff', (sender) => {
  if (sender instanceof Player) {
    sender.inventory.addItem(SpeakerStaff.create());
  }
});
