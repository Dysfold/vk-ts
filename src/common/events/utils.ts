import {
  PlayerInteractEvent,
  PlayerInteractAtEntityEvent,
  PlayerInteractEntityEvent,
} from 'org.bukkit.event.player';
import { Action } from 'org.bukkit.event.block';

export function isRightClick(event: PlayerInteractEvent) {
  return [Action.RIGHT_CLICK_AIR, Action.RIGHT_CLICK_BLOCK].includes(
    event.action,
  );
}

export function isLeftClick(event: PlayerInteractEvent) {
  return [Action.LEFT_CLICK_AIR, Action.LEFT_CLICK_BLOCK].includes(
    event.action,
  );
}
