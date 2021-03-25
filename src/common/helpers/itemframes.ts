import { Block, BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { ItemStack } from 'org.bukkit.inventory';

/**
 * Spawns an invisible item frame
 * @param block The cube to which the item frame is attached
 * @param face The Blockface to which the item frame is attached
 * @param item The itemstack to be placed
 * @returns The spawned item frame.
 */
export function spawnInvisibleItemFrame(
  block: Block,
  face: BlockFace,
  item: ItemStack,
) {
  const loc = block.getRelative(face).location;
  // Use spawnEntity with a callback to prevent item frame flickering
  // Requires ugly cast to any due to https://github.com/bensku/java-ts-bind/issues/2
  let remove = false;
  const frame = block.world.spawnEntity(
    loc,
    EntityType.ITEM_FRAME,
    SpawnReason.CUSTOM,
    ((frame: ItemFrame) => {
      if (!frame.setFacingDirection(face, false)) {
        remove = true; // Remove after spawning and return null
        // Continue to make frame invisible to avoid flickering
      }

      frame.setVisible(false);
      frame.setSilent(true);
      frame.setCustomNameVisible(false);
      frame.setItem(item, false); // Spawn item without sound
    }) as any,
  ) as ItemFrame;
  if (remove) {
    frame.remove();
    return null;
  }
  return frame;
}

/**
 * Get the itemframe attached to the block
 * @param block The cube to which the item frame is attached
 * @param face The Blockface to which the item frame is attached
 * @returns The attached item frame
 */
export function getItemFrame(block: Block, face: BlockFace) {
  const loc = block.getRelative(face).location.add(0.5, 0, 0.5);
  const entities = block.world.getNearbyEntities(loc, 0.5, 0.5, 0.5);
  for (const entity of entities) {
    if (entity.type !== EntityType.ITEM_FRAME) continue;
    const frame = entity as ItemFrame;
    const hangedBlock = entity.location.block.getRelative(frame.attachedFace);
    if (hangedBlock.location.equals(block.location)) {
      return frame;
    }
  }
  return undefined;
}

// Custom itemframe is spawned by code
export function isCustomItemFrame(frame: ItemFrame) {
  return !frame.isVisible() && !frame.isCustomNameVisible();
}
