import { Block } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

/**
 * @param action Action of the click event.
 * @returns True of false.
 */
export function isLeftClick(action: Action) {
  return action === Action.LEFT_CLICK_AIR || action === Action.LEFT_CLICK_BLOCK;
}

/**
 * @param action Action of the click event.
 * @returns True of false.
 */
export function isRightClick(action: Action) {
  return (
    action === Action.RIGHT_CLICK_AIR || action === Action.RIGHT_CLICK_BLOCK
  );
}

export function isRightClickBlock(
  event: PlayerInteractEvent,
): event is PlayerInteractEvent & { clickedBlock: Block } {
  return event.action == Action.RIGHT_CLICK_BLOCK;
}

export function isLeftClickBlock(
  event: PlayerInteractEvent,
): event is PlayerInteractEvent & { clickedBlock: Block } {
  return event.action == Action.LEFT_CLICK_BLOCK;
}
