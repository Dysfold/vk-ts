import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Blocks } from './CustomBlock';
import { isRightClick, isLeftClick } from '../events';
import { Scheduler } from './scheduler';
import { Event as JEvent } from 'org.bukkit.event';
import { Block } from 'org.bukkit.block';
import { BlockEvent } from 'org.bukkit.event.block';

/**
 * Shorthand decorator for registering click events for classes extending `CustomBlock`.
 * @param predicate Optional predicate that determines whether the subseding method should be called
 */
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

/**
 * Registers a method to be called on all of this block's currently loaded instances.
 * The method will receive the time since the last call in seconds as an argument.
 * @param interval Optional interval between which this method should be run. Note that
 * this is not guaranteed, and for optimization reasons the actual time may differ.
 */
export function Tick(interval = 20): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const func = Reflect.get(target, propertyKey);
    Scheduler.addHandler(
      target.constructor as any,
      (delta, block) => {
        func.apply(block, [delta / 1000, block]);
      },
      interval,
    );
  };
}

/**
 * A decorator to be used inside a class extending `CustomBlock`.
 * Registers the decorated method as a event
 * @param event The type of event to register
 * @param predicate A function to extract the block from the event, defaults to `(e) => e.block`
 */
export function Event<T extends BlockEvent>(
  event: new (...args: any[]) => T,
  predicate?: (event: T) => Block | undefined | null,
): MethodDecorator;
export function Event<T extends JEvent>(
  event: new (...args: any[]) => T,
  predicate: (event: T) => Block | undefined | null,
): MethodDecorator;
export function Event<T extends JEvent>(
  event: new (...args: any[]) => T,
  predicate: (event: T) => Block | undefined | null = (e) =>
    e instanceof BlockEvent ? e.block : undefined,
): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const func = Reflect.get(target, propertyKey) as Function;
    registerEvent(event, (e) => {
      const block = predicate(e);
      if (!block) {
        return;
      }
      const cb = Blocks.get(block, target.constructor as any);
      if (!cb) {
        return;
      }
      func.apply(cb, [e, cb]);
    });
  };
}
