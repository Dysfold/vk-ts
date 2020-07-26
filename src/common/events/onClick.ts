import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { CustomBlock } from '../blocks';
import { Action } from 'org.bukkit.event.block';
import { Blocks } from '../blocks/CustomBlock';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';

interface OnClickOptions<T extends CustomBlock> {
  block: new (...args: any) => T;
  type?: 'right' | 'left' | 'both';
  hand?: 'main' | 'off' | 'both';
}

const RIGHT_CLICK_ACTIONS = [Action.RIGHT_CLICK_AIR, Action.RIGHT_CLICK_BLOCK];
const LEFT_CLICK_ACTION = [Action.LEFT_CLICK_AIR, Action.LEFT_CLICK_BLOCK];

export function onClick<T extends CustomBlock>(
  { block, type = 'both', hand = 'both' }: OnClickOptions<T>,
  callback: (event: PlayerInteractEvent, block: T) => void,
) {
  const actions =
    type === 'right'
      ? RIGHT_CLICK_ACTIONS
      : type === 'left'
      ? LEFT_CLICK_ACTION
      : [...RIGHT_CLICK_ACTIONS, ...LEFT_CLICK_ACTION];

  const equipmentSlot =
    hand === 'main'
      ? EquipmentSlot.HAND
      : hand === 'off'
      ? EquipmentSlot.OFF_HAND
      : undefined;

  return registerEvent(PlayerInteractEvent, (e) => {
    if (
      !actions.includes(e.action) ||
      (equipmentSlot && e.hand !== equipmentSlot)
    ) {
      return;
    }

    const cb = Blocks.get(e.clickedBlock, block);
    if (!cb) {
      return;
    }
    callback(e, cb);
  });
}
