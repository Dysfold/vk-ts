import { Event } from 'org.bukkit.event';

/**
 * Returns a promise which resolves when the corresponding event
 * is triggered and the optional predicate function returns true for the said event.
 *
 * @example
 * const { player } = await event(
    PlayerInteractEvent,
    (e) => e.item?.type === Material.STICK,
  );
 * player.sendMessage('Player clicked with stick!');
 */
export function event<T extends Event>(
  event: new (...args: any[]) => T,
  predicate?: (event: T) => boolean,
) {
  let unregister: () => void;
  return new Promise<T>((resolve) => {
    unregister = registerEvent(event, (e) => {
      if (!predicate || predicate(e)) {
        resolve(e);
      }
    });
  }).finally(() => unregister());
}
