import { Block, BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame, Player } from 'org.bukkit.entity';
import { EventPriority } from 'org.bukkit.event';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { HangingBreakEvent } from 'org.bukkit.event.hanging';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { dropVisibleItem, isHiddenItem } from '../../misc/hidden-items';
import { isHiddenEntity } from './hidden-entity';

/**
 * Spawns a hidden item frame.
 * @param block Block to attach the item frame to.
 * @param face Block face to attach it to.
 * @param item Item to place to the frame.
 * @returns The spawned item frame or null, if it cannot be placed at the
 * requested block face.
 */
export function spawnHiddenItemFrame(
  block: Block,
  face: BlockFace,
  item: ItemStack,
) {
  if (!hasSpaceForItemFrame(block, face)) return null;
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
 * Get the item frame attached to a block.
 * @param block The block to which the item frame is attached.
 * @param face The Blockface to which the item frame is attached
 * @returns The attached item frame or undefined, if no frame is attached to
 * the item frame.
 */
export function getItemFrame(block: Block, face: BlockFace) {
  const loc = block.getRelative(face).location.add(0.5, 0.5, 0.5);
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

// Bypass hidden item frames with hidden items in click events
// by triggering PlayerInteractEvents on blocks under them
registerEvent(PlayerInteractEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (!isHiddenEntity(entity)) return;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  const frame = entity as ItemFrame;
  const item = frame.item;
  if (!isHiddenItem(item)) return;

  // Hidden frame, hidden item
  event.setCancelled(true);
});

// Only allow players to break item frames
registerEvent(
  EntityDamageByEntityEvent,
  (event) => {
    const entity = event.entity;
    if (!(entity instanceof ItemFrame)) return;
    const damager = event.damager;
    if (!(damager instanceof Player)) {
      event.setCancelled(true);
      return;
    }
  },
  {
    // Run after more specific handlers (e.g. smithing) that could cancel this
    priority: EventPriority.HIGH,
  },
);

// Prevent hidden item frames from dropping
registerEvent(
  HangingBreakEvent,
  (event) => {
    const entity = event.entity;
    if (!isHiddenEntity(entity)) return;
    if (!(entity instanceof ItemFrame)) return;

    // Remove, don't drop item form of the entity
    event.setCancelled(true);
    entity.remove();

    // Drop item frame content unless it is hidden item
    dropVisibleItem(entity.item, entity.location, entity.itemDropChance);
  },
  {
    // Run after more specific handlers that could cancel this
    priority: EventPriority.HIGH,
  },
);

function hasSpaceForItemFrame(attachedTo: Block, facing: BlockFace) {
  const oldItemFrame = getItemFrame(attachedTo, facing);
  if (oldItemFrame) return false;
  const block = attachedTo.getRelative(facing);
  return block.isPassable();
}
