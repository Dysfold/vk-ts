import { EntityType } from 'org.bukkit.entity';
import { HangingBreakEvent } from 'org.bukkit.event.hanging';

// Remove drops from invisible item frames
// because those are used for custom features
// TODO: Maybe check for the item inside?
registerEvent(HangingBreakEvent, (event) => {
  if (event.entity.type !== EntityType.ITEM_FRAME) return;
  const frame = event.entity as any; // TODO: replace any with ItemFrame (when the type exists)
  if (frame.isVisible()) return false;

  // The entity was invisible item frame
  event.entity.remove();
});
