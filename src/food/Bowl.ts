import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';

export const Bowl = new CustomBlock({
  type: Material.DEAD_TUBE_CORAL_FAN,
});

const BowlItem = new CustomItem({
  id: 0,
  type: Material.DEAD_TUBE_CORAL_FAN,
});

Bowl.onBreak(async (event) => {
  event.block.world.dropItem(
    event.block.location.add(0.5, 0.5, 0.5),
    BowlItem.create(),
  );
  return true;
});

// Bowls should be place only on top of the blocks
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.item?.type === Material.DEAD_TUBE_CORAL_FAN) {
    if (event.blockFace !== BlockFace.UP) {
      event.setCancelled(true);
    }
  }
});
