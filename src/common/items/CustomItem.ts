import { ItemStack } from 'org.bukkit.inventory';
import { Newable } from '../types';
import { Material } from 'org.bukkit';
import { Event } from 'org.bukkit.event';
import { dataHolder, DataType, getDefaultData } from '../datas/holder';
import * as yup from 'yup';
import { dataView } from '../datas/view';
import { Integer } from 'java.lang';
import * as _ from 'lodash';

const CUSTOM_TYPE_KEY = 'ct';
const CUSTOM_DATA_KEY = 'cd';

type CustomItemOptions<T extends object> = {
  /**
   * Unique integer id of this custom item.
   */
  id: number;

  /**
   * The Vanilla type/material used for this item.
   */
  type: Material;

  /**
   * Display name of this item.
   */
  name?: string;

  /**
   * CustomModelData model identifier of this item. When set, client selects a
   * model with matching id from resource pack.
   */
  modelId?: number;

  /**
   * Callback for creating this item.
   * @param item ItemStack constructed by the default creator.
   * @param data Item data given to create, or undefined if no data was given.
   * This item does not have custom data by default.
   * @returns An ItemStack that is returned from create(...). It can but does
   * not have to be the item given to this function.
   */
  create?: (item: ItemStack, data: T | undefined) => ItemStack;

  /**
   * If specified, overrides the default function for checking if an ItemStack
   * is an instance of this custom item.
   * @param item Item stack to check.
   * @returns If given stack is instance of this custom item.
   */
  check?: (item: ItemStack) => boolean;
} & (
  | {}
  | {
      /**
       * Schema for custom data associated with this item.
       */
      schema?: yup.ObjectSchema<T>;

      /**
       * Default values of the custom data used by this item.
       */
      data: T | (() => T);

      /**
       * Callback for creating this item.
       * @param item ItemStack constructed by the default creator.
       * @param data Item data (always present).
       * @returns An ItemStack that is returned from create(...). It can but does
       * not have to be the item given to this function.
       */
      create?: (item: ItemStack, data: T) => ItemStack;
    }
);

export class CustomItem<T extends {}> {
  /**
   * Options of this item.
   */
  private options: CustomItemOptions<T>;

  /**
   * Type of data associated with this item.
   */
  private dataType: DataType<T>;

  constructor(options: CustomItemOptions<T>) {
    this.options = { check: () => true, ...options };
    this.dataType = {
      name: CUSTOM_DATA_KEY,
      schema: 'schema' in this.options ? this.options.schema : undefined,
      defaultData: 'data' in options ? options.data : ({} as T),
    };
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
        return; // Not (this) custom item
      }
      callback(event, data);
    });
  }

  /**
   * Create an ItemStack representing this CustomItem instance.
   * @param data If specified, this is the data that the created item
   * will have. If not, the default data will be used.
   */
  create(data?: Partial<T>) {
    const item = new ItemStack(this.options.type);
    const meta = item.itemMeta;
    const holder = dataHolder(meta);
    // Unique identifier of this custom item
    holder.set(CUSTOM_TYPE_KEY, 'integer', this.options.id);

    // Data overrides given as parameter or non-stable defaultData
    let defaultData: T | undefined; // Created only if needed
    if (data != undefined || typeof this.dataType.defaultData == 'function') {
      defaultData = getDefaultData(this.dataType);
      const allData = data ? { ...defaultData, ...data } : defaultData;
      holder.set(CUSTOM_DATA_KEY, this.dataType, allData);
      // Data available later with dataView
    } // else: don't bother applying default data, can get it later from this.data

    // Set values to meta based on item options
    if (this.options.name != undefined) {
      meta.setDisplayName(this.options.name);
    }
    if (this.options.modelId != undefined) {
      meta.setCustomModelData(Integer.valueOf(this.options.modelId));
    }
    item.itemMeta = meta; // Set new meta to item

    // Custom create function can modify/replace item after us
    if (this.options.create) {
      // Give same default data if possible, generate if we didn't need it before
      return this.options.create(
        item,
        defaultData ?? getDefaultData(this.dataType),
      );
    }
    return item;
  }

  /**
   * Gets data of this CustomItem from given stack. If the stack is not a
   * custom item (null, undefined, Vanilla items) or is a custom item of
   * different type, undefined is returned.
   *
   * Changes to the returned data are immediately saved to the item.
   * This involves setting ItemMeta to the stack; manipulating ItemMeta
   * yourself while a view to custom data of same item is alive is
   * a BAD IDEA.
   * @param item The itemstack to fetch data from.
   * @returns Custom item data or undefined.
   */
  get(item: ItemStack | null | undefined): T | undefined {
    if (!item || !this.check(item)) {
      return undefined; // Not a custom item, or wrong custom item
    }
    return dataView(this.dataType, item);
  }

  /**
   * Adds (or overwrites) data of this custom item in given stack.
   * If the stack is not a custom item (null, undefined, Vanilla items) or
   * is a custom item of different type, nothing is done.
   * @param item Item stack to modify.
   * @param data Data to add.
   * @returns Whether data was modified or not.
   */
  set(
    item: ItemStack | null | undefined,
    data: Partial<T> | ((data: T) => Partial<T>),
  ): boolean {
    if (!item) {
      return false; // Not going to set anything to null
    }
    const holder = dataHolder(item);
    // This should be usable for fixing invalid data, so validate only on set
    // (it might also be a tiny bit faster)
    const objData =
      holder.get(CUSTOM_DATA_KEY, this.dataType, false) ??
      getDefaultData(this.dataType);

    // Overwrite with given data
    Object.assign(objData, typeof data == 'function' ? data(objData) : data);
    holder.set(CUSTOM_DATA_KEY, this.dataType, objData);
    return true;
  }

  /**
   * Checks if given stack is an instance of this custom item.
   * @param item Item stack.
   */
  check(item: ItemStack): boolean {
    const itemId = dataHolder(item.getItemMeta()).get(
      CUSTOM_TYPE_KEY,
      'integer',
    );
    return itemId == this.options.id;
  }
}
