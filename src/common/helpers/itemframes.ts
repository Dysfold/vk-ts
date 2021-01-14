import { Block, BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';

/**
 * Spawns an invisible item frame
 * @param block The cube to which the item frame is attached
 * @param face The Blockface to which the item frame is attached
 * @param item The itemstack to be placed
 * @returns The spawned item frame
 */
export function spawnInvisibleItemFrame(
  block: Block,
  face: BlockFace,
  item: ItemStack,
) {
  const loc = block.getRelative(face).location;
  const frame = block.world.spawnEntity(
    loc,
    EntityType.ITEM_FRAME,
  ) as ItemFrame;
  frame.setVisible(false);
  if (!frame.setFacingDirection(face, false)) {
    frame.remove();
    return null;
  }
  frame.setVisible(false);
  frame.setItem(item, false); // false = no spawning sound
  frame.setCustomNameVisible(false);
  // Silent item frames shouldn't drop an item frame when destroyed
  // This helps us to distinguish custom spawned item frames from playerspawned
  frame.setSilent(true);
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
