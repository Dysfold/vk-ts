import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { CustomBlock } from '../blocks';
import { Action } from 'org.bukkit.event.block';
import { Blocks } from '../blocks/CustomBlock';

interface OnClickOptions<T extends CustomBlock> {
  block: new (...args: any) => T;
  type?: 'right' | 'left' | 'both';
  callback: (event: PlayerInteractEvent, block: T) => void;
}

export function onClick<T extends CustomBlock>({
  block,
  type = 'both',
  callback,
}: OnClickOptions<T>) {
  const actions =
    type === 'right'
      ? [Action.RIGHT_CLICK_AIR, Action.RIGHT_CLICK_BLOCK]
      : type === 'left'
      ? [Action.LEFT_CLICK_AIR, Action.LEFT_CLICK_BLOCK]
      : [
          Action.LEFT_CLICK_AIR,
          Action.RIGHT_CLICK_AIR,
          Action.LEFT_CLICK_BLOCK,
          Action.RIGHT_CLICK_BLOCK,
        ];

  return registerEvent(PlayerInteractEvent, (e) => {
    if (!actions.includes(e.action)) {
      return;
    }
    const cb = Blocks.get(e.clickedBlock, block);
    if (!cb) {
      return;
    }
    callback(e, cb);
  });
}
