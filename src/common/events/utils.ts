import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Action } from 'org.bukkit.event.block';

/**
 * @returns whether or not the given `PlayerInteractEvent` involved a right click
 */
export function isRightClick(event: PlayerInteractEvent) {
  return [Action.RIGHT_CLICK_AIR, Action.RIGHT_CLICK_BLOCK].includes(
    event.action,
  );
}
/**
 * @returns whether or not the given `PlayerInteractEvent` involved a left click
 */
export function isLeftClick(event: PlayerInteractEvent) {
  return [Action.LEFT_CLICK_AIR, Action.LEFT_CLICK_BLOCK].includes(
    event.action,
  );
}
