import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, Item } from 'org.bukkit.entity';
import { BlockPistonExtendEvent } from 'org.bukkit.event.block';
import { MashedPotatoes } from './custom-foods';

registerEvent(BlockPistonExtendEvent, (event) => {
  if (event.direction !== BlockFace.DOWN) return;
  const loc = event.block.location.add(0.5, -1, 0.5);
  const entities = loc.world.getNearbyEntities(loc, 0.3, 0.3, 0.3);

  // Loop all entities below the piston
  for (const entity of entities) {
    if (entity.type === EntityType.DROPPED_ITEM) {
      const item = entity as Item;
      const itemStack = item.itemStack;

      // Replace potato with mashed potato
      if (itemStack.type === Material.BAKED_POTATO) {
        const amount = itemStack.amount;
        item.itemStack = MashedPotatoes.create({});
        item.itemStack.amount = amount;
      }
    }
  }
});
