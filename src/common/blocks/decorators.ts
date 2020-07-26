import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Blocks } from './CustomBlock';
import { isRightClick, isLeftClick } from '../events';
import { Scheduler } from './scheduler';

export function OnClick(
  predicate?: (event: PlayerInteractEvent) => boolean,
): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const func = Reflect.get(target, propertyKey);

    registerEvent(PlayerInteractEvent, (e) => {
      if ((predicate && !predicate(e)) || !e.clickedBlock) {
        return;
      }
      const block = Blocks.get(e.clickedBlock, target.constructor as any);
      if (!block) {
        return;
      }
      func(e, block);
    });
  };
}

export const OnRightClick = () => OnClick((e) => isRightClick(e));
export const OnLeftClick = () => OnClick((e) => isLeftClick(e));

export function Tick(interval?: number): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const func = Reflect.get(target, propertyKey);
    Scheduler.addHandler((delta) => {
      Blocks.forEach(target.constructor as any, (block) =>
        func(block, delta / 1000),
      );
    }, interval ?? 1);
  };
}
