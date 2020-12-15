import { Action } from 'org.bukkit.event.block';

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
