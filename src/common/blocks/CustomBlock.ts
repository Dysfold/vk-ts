import { Newable } from '../types';
import { Material, Bukkit } from 'org.bukkit';
import { Event } from 'org.bukkit.event';
import { dataHolder, DataType, dataType } from '../datas/holder';
import * as yup from 'yup';
import { dataView, saveView } from '../datas/view';
import { Block } from 'org.bukkit.block';
import { BlockData } from 'org.bukkit.block.data';
import { setBlock } from './blocks';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Action, BlockBreakEvent } from 'org.bukkit.event.block';

const CUSTOM_DATA_KEY = 'cd';

interface BlockStates {
  [state: string]: string | string[];
}

interface StateEntry {
  key: string;
  values: string[];
  current: number;
}

interface Combination {
  index: number;
  max: number;
}

function blockStateStr(states: StateEntry[]): string {
  return (
    '[' +
    states
      .map((value) => value.key + '=' + value.values[value.current])
      .join(',') +
    ']'
  );
}

/**
 * Creates and parses all possible block state combinations.
 */
function parseBlockStates(type: Material, states: BlockStates) {
  // Parse entries and remember selections
  const list: StateEntry[] = [];
  const selections: Combination[] = [];
  for (const [name, values] of Object.entries(states)) {
    list.push({
      key: name,
      values: Array.isArray(values) ? values : [values],
      current: 0,
    });
    if (Array.isArray(values)) {
      selections.push({ index: list.length - 1, max: values.length });
    }
  }

  // Skip combination generation if there are no selections
  if (selections.length == 0) {
    return [Bukkit.createBlockData(type, blockStateStr(list))];
  }

  // Generate combinations
  const blockDatas: BlockData[] = [];
  // eslint-disable-next-line no-constant-condition
  outer: while (true) {
    // Generate block state string and parse it
    blockDatas.push(Bukkit.createBlockData(type, blockStateStr(list)));

    // Prepare selections for next combination
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const state = list[selection.index];
      state.current++; // Next combination
      if (state.current == selection.max) {
        if (i == selections.length - 1) {
          break outer; // All combinations found
        } else {
          state.current = 0; // Wrap around
          continue; // Change next selection for next combination
        }
      }
      break; // Found new combination, no need to loop more
    }
  }

  return blockDatas;
}

type CustomBlockOptions<T extends {}> = {
  /**
   * The Vanilla type/material used for this block.
   */
  type: Material;

  /**
   * Block data in Vanilla string format.
   */
  state?: BlockStates;

  /**
   * Schema definition for custom data associated with this block.
   * If not present, this block does not have custom data.
   */
  data?: yup.ObjectSchemaDefinition<T>;

  /**
   * Callback for modifying this block after it has been created.
   * Unlike with items, the changes are visible in the world as soon as this
   * returns; returning a completely different block is not an option.
   * @param block Block with default changes applied.
   * @param data Custom data the block was created with.
   */
  create?: (item: Block, data: T) => void;

  /**
   * If specified, overrides the default function for checking if a block is
   * an instance of this custom block.
   * @param block Block to check.
   * @returns If given block is instance of this custom block.
   */
  check?: (block: Block) => boolean;
};

export class CustomBlock<T extends {}> {
  /**
   * Options of this block.
   */
  private options: CustomBlockOptions<T>;

  /**
   * Vanilla block states that match this block.
   */
  private blockDatas?: BlockData[];

  /**
   * Type of data associated with this block.
   */
  private dataType: DataType<T>;

  /**
   * Tick rate in milliseconds (no ticks).
   */
  private tickRate?: number;

  /**
   * Tick handler for this block.
   */
  private tickHandler?: (block: T) => Promise<boolean>;

  /**
   * Tick handler task id.
   */
  private tickerId?: number;

  constructor(options: CustomBlockOptions<T>);
  constructor(
    parent: CustomBlock<T>,
    overrides: Partial<CustomBlockOptions<T>>,
  );

  constructor(
    options: CustomBlock<T> | CustomBlockOptions<T>,
    overrides?: Partial<CustomBlockOptions<T>>,
  ) {
    // Get options and apply overrides if given
    this.options =
      options instanceof CustomBlock
        ? { ...options.options, ...overrides }
        : options;

    // Parse block states once only
    this.blockDatas = this.options.state
      ? parseBlockStates(this.options.type, this.options.state)
      : undefined;

    // Create dataHolder data type
    this.dataType = dataType(
      CUSTOM_DATA_KEY,
      this.options.data
        ? this.options.data
        : ({} as yup.ObjectSchemaDefinition<T>),
    );
  }

  /**
   * Registers a click event for this custom block. Changes made to data of
   * the block are applied once the event callback has finished
   * (including async code).
   * If you need to save earlier, use saveView(block).
   * @param event Event type to listen for.
   * @param blockPredicate Function that retrieves a Block from the event.
   * @param callback Asynchronous event handler.
   *
   * @example
   * CustomBlock.registerEvent(PlayerInteractEvent, (e) => e.clickedBlock, async (e) => {
   *   // This is called when the player clicks a valid CustomBlock
   *   e.player.sendMessage(`Block: ${e.clickedBlock}`);
   * });
   */
  event<E extends Event>(
    event: Newable<E>,
    blockPredicate: (event: E) => Block | null | undefined,
    callback: (event: E, block: T) => Promise<void>,
  ) {
    registerEvent(event, async (event) => {
      const block = blockPredicate(event); // Get Block
      if (!block || !this.check(block)) {
        return; // No block found or not this custom block
      }

      // this.get(block), but...
      // - No auto-save (saved at most once AFTER event has passed)
      // - No validation on load (because we'll probably save and validate then)
      if (this.dataType == undefined) {
        // TS compiler doesn't know that !this.dataType implies T == undefined
        callback(event, {} as T);
      } else {
        const data = dataView(this.dataType, block, false, false, true);
        await callback(event, data);
        saveView(data); // Save if modified, AFTER event has passed
      }
    });
  }

  /**
   * Registers a click event handler for this custom block.
   * @param type Click type.
   * @param callback Event handler.
   */
  onClick(
    type: 'right' | 'left',
    callback: (event: PlayerInteractEvent, block: T) => Promise<void>,
  ) {
    this.event(
      PlayerInteractEvent,
      (event) => event.clickedBlock,
      async (event, block) => {
        const action = event.action;
        if (type == 'right' && action == Action.RIGHT_CLICK_BLOCK) {
          await callback(event, block);
        } else if (type == 'left' && action == Action.LEFT_CLICK_BLOCK) {
          await callback(event, block);
        }
      },
    );
  }

  /**
   * Registers a block break event handler for this custom block.
   * The handler returns true/false to indicate whether or not breaking
   * the block is allowed.
   * @param callback Event handler.
   */
  onBreak(callback: (block: T) => Promise<boolean>) {
    // TODO are there ways to break blocks that do not trigger this? EXPLOSIONS?
    this.event(
      BlockBreakEvent,
      (event) => event.block,
      async (event, block) => {
        const allowBreak = await callback(block);
        if (!allowBreak) {
          event.setCancelled(true); // Don't let player break this block
        }
      },
    );
  }

  /**
   * Registers a callback to run periodically on all active instances of this
   * custom block.
   *
   * Blocks are activated when
   * * Custom event handlers for them are called
   * * Manually, by using this.activate(block)
   *
   * They stay active until their tick handler returns false. Blocks without
   * tick handlers are immediately deactivated.
   * @param interval Delay between ticks.
   * @param unit Time unit of interval.
   * @param callback Callback to run periodically. Should return true to keep
   * block active, false to stop it from being active.
   */
  tick(
    interval: number,
    unit: TimeUnit = 'ticks',
    callback: (block: T) => Promise<boolean>,
  ) {
    switch (unit) {
      case 'millis':
        this.tickRate = interval;
        break;
      case 'ticks':
        this.tickRate = interval * 50;
        break;
      case 'seconds':
        this.tickRate = interval * 1000;
        break;
      case 'minutes':
        this.tickRate = interval * 1000 * 60;
        break;
    }
    this.tickHandler = callback;
  }

  /**
   * Activates a block if it is a custom block of this type.
   * @param block Block to activate.
   */
  activate(block: Block) {
    if (this.tickerId) {
      return; // Already active
    } else if (!this.check(block)) {
      return;
    }
    const handler = this.tickHandler;
    if (handler) {
      this.tickerId = setInterval(async () => {
        // Refetch data each time we tick, it might have changed
        // TODO consider disabling auto save like with events
        const data = this.get(block);
        if (!data) {
          // No custom block there anymore, it seems
          clearInterval(this.tickerId);
          this.tickerId = undefined;
          return;
        }

        // Trigger tick handler
        if (!(await handler(data))) {
          // Deactivating this block
          clearInterval(this.tickerId);
          this.tickerId = undefined;
        }
      }, this.tickRate);
    }
  }

  /**
   * Makes given block an instance of this custom block.
   * @param location Location of block.
   * @param data If specified, overrides parts of the default custom data.
   */
  create(block: Block, data?: Partial<T>) {
    setBlock(block, this.options.type, this.blockDatas); // Set Vanilla block

    const holder = dataHolder(block);

    // Data overrides given as parameter
    let defaultData: T | undefined; // Created only if needed
    if (data) {
      defaultData = this.dataType.schema.default();
      const allData = data ? { ...defaultData, ...data } : defaultData;
      holder.set(CUSTOM_DATA_KEY, this.dataType, allData);
      // Data available later with dataView
    } // else: don't bother applying default data, can get it later from this.data

    // Custom create function can modify/replace block after us
    if (this.options.create) {
      // Give same default data if possible, generate if we didn't need it before
      return this.options.create(
        block,
        defaultData ?? this.dataType.schema.default(),
      );
    }
    return block;
  }

  /**
   * Gets data of this CustomBlock from given block. If the stack is not a
   * custom block (null, undefined, Vanilla blocks) or is a custom block of
   * different type, undefined is returned.
   *
   * Changes to the returned data are immediately saved to the block.
   * @param block The block to fetch data from.
   * @returns Custom block data or undefined.
   */
  get(block: Block | null | undefined): T | undefined {
    if (!block || !this.check(block)) {
      return undefined; // Not a custom block, or wrong custom block
    }
    return dataView(this.dataType, block);
  }

  /**
   * Adds (or overwrites) data of this custom block in world.
   * If the stack is not a custom block (null, undefined, Vanilla block) or
   * is a custom block of different type, nothing is done.
   * @param block Block in world to modify.
   * @param data Data to add.
   * @returns Whether data was modified or not.
   */
  set(
    block: Block | null | undefined,
    data: Partial<T> | ((data: T) => Partial<T>),
  ): boolean {
    if (!block) {
      return false; // Not going to set anything to null
    }
    const holder = dataHolder(block);
    // This should be usable for fixing invalid data, so validate only on set
    // (it might also be a tiny bit faster)
    const objData =
      holder.get(CUSTOM_DATA_KEY, this.dataType, false) ??
      this.dataType.schema.default();

    // Overwrite with given data
    Object.assign(objData, typeof data == 'function' ? data(objData) : data);
    holder.set(CUSTOM_DATA_KEY, this.dataType, objData);
    return true;
  }

  /**
   * Checks if given block is an instance of this custom block.
   * @param block Block to check.
   */
  check(block: Block): boolean {
    if (this.options.type != block.type) {
      return false;
    } else if (this.blockDatas) {
      for (const candidate of this.blockDatas) {
        if (candidate.matches(block.blockData)) {
          return true; // Found matching block data
        }
      }
      return false; // None of the block states matched
    } else {
      return true;
    }
  }
}
