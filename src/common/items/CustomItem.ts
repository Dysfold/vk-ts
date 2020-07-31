import { ItemStack } from 'org.bukkit.inventory';
import { NBT } from './NBT';
import { Newable } from '../types';
import { Material } from 'org.bukkit';
import { onChange } from '../onChange';
import { Damageable } from 'org.bukkit.inventory.meta';
import { Event } from 'org.bukkit.event';
const DATA_KEY = '__data';

type CustomItemOptions<T> = {
  /**
   * The type of a item
   */
  type: Material;
  /**
   * The damage of a item represented by this configuration.
   */
  damage?: number;
  /**
   * If specified, this will be called with the default created item, alongside
   * with the data associated with the item that is being created
   */
  create?: (item: ItemStack, data: T | undefined) => ItemStack;
  /**
   * If specified, this overrides the method for checking whether or not
   * a given itemstack is valid for this type of custom item
   */
  check?: (item: ItemStack) => boolean;
} & (
  | {}
  | {
      /**
       * The default data that is applied to new items when they are created
       */
      defaultData: T | (() => T);
      /**
       * If specified, this will be called with the default created item, alongside
       * with the data associated with the item that is being created
       */
      create?: (item: ItemStack, data: T) => ItemStack;
    }
);

export class CustomItem<T extends {} | undefined = undefined> {
  options: CustomItemOptions<T>;
  defaultData: T | (() => T) | undefined;

  constructor(options: CustomItemOptions<T>) {
    this.options = { check: () => true, ...options };
    this.defaultData =
      'defaultData' in options ? options.defaultData : undefined;
  }

  private createData(): T | undefined {
    if (typeof this.defaultData === 'function' && 'apply' in this.defaultData) {
      return this.defaultData();
    }
    return this.defaultData;
  }

  /**
   * Registers an event regarding this custom item. The predicate function will be called
   * to determine the item that should be checked for being valid.
   * @param event The event type of which to register
   * @param itemPredicate This function will be called to determine the wanted item in the event
   * @param callback The callback function to be called if the event is called and the item returned by the predicate
   * function is valid.
   *
   * @example
   * CustomItem.registerEvent(PlayerInteractEvent, (e) => e.item, (e) => {
   *   // This is called when the player clicks with a valid CustomItem
   *   e.player.sendMessage(`Stack size: ${e.item.amount}`);
   * });
   */
  registerEvent<E extends Event>(
    event: Newable<E>,
    itemPredicate: (event: E) => ItemStack | null | undefined,
    callback: (event: E, item: T) => void,
  ) {
    registerEvent(event, (event) => {
      const item = itemPredicate(event);
      if (!item || !this.check(item)) {
        return;
      }
      const data = this.get(item);
      if (!data) {
        return;
      }
      callback(event, data);
    });
  }

  /**
   * Create an itemstack described by this CustomItem instance.
   * @param data If specified, this is the data that the created item
   * will have. If not, the default data will be used.
   */
  create(data?: Partial<T>) {
    const item = new ItemStack(this.options.type);
    const itemData = data
      ? { ...this.createData(), ...data }
      : this.createData();
    if (itemData) {
      NBT.set(item, DATA_KEY, itemData);
    }
    const meta = item.itemMeta;
    if (this.options.damage && meta instanceof Damageable) {
      meta.damage = this.options.damage;
    }
    item.itemMeta = meta;
    if (this.options.create) {
      return this.options.create(item, this.createData());
    }
    return item;
  }

  private getProxy(item: ItemStack, data: T) {
    return onChange(data, () => {
      NBT.set(item, DATA_KEY, data);
    });
  }

  /**
   * Get the data described by this CustomItem instance from `item`.
   * @param item The itemstack to fetch data from. If this is falsy, the method will return `undefined`.
   * @returns If `item` is valid item for this CustomItem instance (i.e. `this.check(item)` returns true), the method will return it's data.
   * Otherwise `undefined` will be returned.
   */
  get(item: ItemStack | null | undefined) {
    if (!item || !this.check(item)) {
      return undefined;
    }
    const data = NBT.get(item, DATA_KEY);
    if (!data) {
      return undefined;
    }
    return this.getProxy(item, data) as T;
  }

  /**
   * Set the data of an itemstack
   * @param item The itemstack whose data will be modified
   * @param data The new data, or part of it.
   *
   * @example
   * CustomItem.set(item, { counter: 5 })
   */
  set(item: ItemStack | null | undefined, data: Partial<T>): void;
  /**
   * Set the data of an itemstack
   * @param item The itemstack whose data will be modified
   * @param setter A function that takes in the previous data as an argument and
   * returns the new data
   *
   * @example
   * CustomItem.set(item, data => ({ counter: data.counter++ }));
   */
  set(
    item: ItemStack | null | undefined,
    setter: (data: T) => Partial<T>,
  ): void;
  set(
    item: ItemStack | null | undefined,
    arg1: Partial<T> | ((data: T) => Partial<T>),
  ) {
    if (!item) {
      return;
    }
    const currentData = this.get(item);
    if (!currentData) {
      return;
    }

    const newData =
      typeof arg1 === 'function' && 'apply' in arg1 ? arg1(currentData) : arg1;
    NBT.set(item, DATA_KEY, { ...currentData, ...newData });
  }

  check(item: ItemStack) {
    const { itemMeta: meta } = item;
    const damage = meta instanceof Damageable ? meta.damage : undefined;
    const isDamageValid =
      !this.options.damage || damage === this.options.damage;
    return (
      isDamageValid &&
      item.type === this.options.type &&
      (!this.options.check || this.options.check(item))
    );
  }
}
