import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { Event } from 'org.bukkit.event';
import { dataHolder, DataType, dataType } from '../datas/holder';
import { dataView, saveView } from '../datas/view';
import { ObjectShape } from 'yup/lib/object';
import { isEmpty } from 'lodash';
import { Data, PartialData } from '../datas/yup-utils';

const CUSTOM_TYPE_KEY = 'ct';
const CUSTOM_DATA_KEY = 'cd';

type CustomItemOptions<T extends ObjectShape> = {
  /**
   * Id of this custom item. Unique per Vanilla type/material.
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
   * Schema definition for custom data associated with this item.
   * If not present, this item does not have custom data.
   */
  data?: T;

  /**
   * Callback for creating this item.
   * @param item ItemStack constructed by the default creator.
   * @param data Custom data the item was created with.
   * @returns An ItemStack that is returned from create(...). It can but does
   * not have to be the item given to this function.
   */
  create?: (item: ItemStack, data: Data<T>) => ItemStack;

  /**
   * If specified, overrides the default function for checking if an ItemStack
   * is an instance of this custom item.
   * @param item Item stack to check.
   * @returns If given stack is instance of this custom item.
   */
  check?: (item: ItemStack) => boolean;
};

/**
 * Used for tracking already used item ids to generate errors on collisions.
 */
const usedIds: Set<string> = new Set();

function checkItemId(type: Material, id: number) {
  const hash = type + '-' + id;
  if (usedIds.has(hash)) {
    console.error(`Found item id collision with id ${id} for ${type}`);
  } else {
    usedIds.add(hash);
  }
}

export class CustomItem<T extends ObjectShape> {
  /**
   * Options of this item.
   */
  private options: CustomItemOptions<T>;

  /**
   * Type of data associated with this item.
   */
  private dataType: DataType<T>;

  constructor(options: CustomItemOptions<T>) {
    this.options = options;
    checkItemId(options.type, options.id);
    this.dataType = dataType(CUSTOM_DATA_KEY, this.options.data);
  }

  /**
   * Registers an event for this custom item. Changes made to data of the item
   * are applied once the event callback has finished (including async code).
   * If you need to save earlier, use saveView(item).
   * @param event Event type to listen for.
   * @param itemPredicate Function that retrieves an ItemStack from the event.
   * @param callback Asynchronous event handler.
   *
   * @example
   * CustomItem.event(PlayerInteractEvent, (e) => e.item, async (e) => {
   *   // This is called when the player clicks with a valid CustomItem
   *   e.player.sendMessage(`Stack size: ${e.item.amount}`);
   * });
   */
  event<E extends Event>(
    event: Newable<E>,
    itemPredicate: (event: E) => ItemStack | null | undefined,
    callback: (event: E, item: Data<T>) => Promise<void>,
  ) {
    registerEvent(event, async (event) => {
      const item = itemPredicate(event); // Get ItemStack
      if (!item || !this.check(item)) {
        return; // No item found or not this custom item
      }

      // this.get(item), but...
      // - No auto-save (saved at most once AFTER event has passed)
      // - No validation on load (because we'll probably save and validate then)
      const data = dataView(this.dataType, item, false, false, true);
      await callback(event, data);
      saveView(data); // Save if modified, AFTER event has passed
    });
  }

  /**
   * Create an ItemStack representing this CustomItem instance.
   * @param data If specified, this is the data that the created item
   * will have. If not, the default data will be used.
   * @param amount Initial size of the created item stack.
   */
  create(data: PartialData<T>, amount = 1): ItemStack {
    const item = new ItemStack(this.options.type);
    const meta = item.itemMeta;
    const holder = dataHolder(meta);
    // Unique identifier of this custom item
    holder.set(CUSTOM_TYPE_KEY, 'integer', this.options.id);

    // Data overrides given as parameter
    let defaultData: Data<T> | undefined = undefined; // Created only if needed
    if (!isEmpty(data)) {
      const allData = this.dataType.schema.validateSync(data);
      holder.set(CUSTOM_DATA_KEY, this.dataType, allData);
      defaultData = allData;
      // Data available later with dataView
    } // else: don't bother applying default data, can get it later from this.data

    // Set values to meta based on item options
    if (this.options.name != undefined) {
      meta.displayName = this.options.name;
    }
    if (this.options.modelId != undefined) {
      meta.customModelData = this.options.modelId;
    }
    item.itemMeta = meta; // Set new meta to item

    // Custom create function can modify/replace item after us
    if (this.options.create) {
      // Give same default data if possible, generate if we didn't need it before
      return this.options.create(
        item,
        defaultData ?? this.dataType.schema.validateSync(data),
      );
    }

    // Don't overwrite stack size set by create() unless necessary
    if (amount != 1) {
      item.amount = amount;
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
  get(item: ItemStack | null | undefined): Data<T> | undefined {
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
    data: Partial<Data<T>> | ((data: Data<T>) => Partial<Data<T>>),
  ): boolean {
    if (!item) {
      return false; // Not going to set anything to null
    }
    const holder = dataHolder(item);
    // This should be usable for fixing invalid data, so validate only on set
    // (it might also be a tiny bit faster)
    const objData =
      holder.get(CUSTOM_DATA_KEY, this.dataType, false) ??
      this.dataType.schema.getDefault();

    // Overwrite with given data
    Object.assign(objData, typeof data == 'function' ? data(objData) : data);
    this.dataType.schema.validateSync(objData); // Validate the new data
    holder.set(CUSTOM_DATA_KEY, this.dataType, objData);
    return true;
  }

  /**
   * Checks if given stack is an instance of this custom item.
   * @param item Item stack.
   */
  check(item: ItemStack): boolean {
    if (this.options.check) {
      return this.options.check(item);
    }
    if (!this.options.type.equals(item.type)) {
      return false; // Item id is per Vanilla material
    }
    const itemId = dataHolder(item.itemMeta).get(CUSTOM_TYPE_KEY, 'integer');
    return itemId == this.options.id;
  }
}
