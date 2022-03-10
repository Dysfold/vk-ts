import { Material } from 'org.bukkit';
import { ItemFrame } from 'org.bukkit.entity';
import { BlockPlaceEvent } from 'org.bukkit.event.block';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { isHiddenEntity } from '../common/entities/hidden-entity';
import { CustomItem } from '../common/items/CustomItem';
import { VkMaterial } from '../common/items/VkMaterial';

export const Bowl = new CustomBlock({
  type: VkMaterial.BOWL,
});

const BowlItem = new CustomItem({
  id: 0,
  type: VkMaterial.BOWL,
});

Bowl.onBreak(async (event) => {
  event.block.world.dropItem(
    event.block.location.add(0.5, 0.5, 0.5),
    BowlItem.create({}),
  );
  const entities = event.block.world.getNearbyEntities(
    event.block.location.add(0.5, 0, 0.5),
    0.3,
    0.3,
    0.3,
  );
  for (const entity of entities) {
    if (isHiddenEntity(entity) && entity instanceof ItemFrame) {
      entity.remove();
    }
  }
  return true;
});

// Prevent bowls to be placed on walls
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === Material.DEAD_TUBE_CORAL_WALL_FAN)
    event.setCancelled(true);
});
