import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Blocks } from './CustomBlock';
import { isRightClick, isLeftClick } from '../events';
import { Scheduler } from './scheduler';
import { Event as JEvent } from 'org.bukkit.event';
import { Block } from 'org.bukkit.block';

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
      func.apply(block, [e, block]);
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
        func.apply(block, [delta / 1000, block]),
      );
    }, interval ?? 1);
  };
}

export function Event<T extends JEvent>(
  event: new (...args: any[]) => T,
  predicate: (event: T) => Block | undefined | null,
): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const func = Reflect.get(target, propertyKey) as Function;
    registerEvent(event, (e) => {
      const block = predicate(e);
      if (!block) {
        return;
      }
      const cb = Blocks.get(block, target.constructor as any);
      func.apply(cb, [e, cb]);
    });
  };
}
