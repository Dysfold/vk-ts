import { Block, TileState } from 'org.bukkit.block';
import { Location, Chunk } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';
import { onChange } from '../onChange';
import { config } from '../config';
import { Files, Path } from 'java.nio.file';
import { readJSON, writeJSON } from '../json';
import * as fnv from 'fnv-plus';
import * as yup from 'yup';
import * as _ from 'lodash';
import { runTask } from '../scheduling';

type Newable<T> = new (...args: any[]) => T;

export abstract class CustomBlock {
  block: Block;
  /**
   * Schema to use for validating this block's data.
   * Invalid entries will be replaced with default ones
   */
  schema: yup.Schema<any> = yup.object();
  location: Location;

  constructor(block: Block) {
    this.block = block;
    this.location = block.location.clone() as Location;
  }

  /**
   * Removes this block's data
   */
  remove() {
    Blocks.remove(this);
  }

  /**
   * Check whether or not a given block is a valid instance of this
   * custom block
   */
  abstract check(): boolean;
}

export interface Region {
  world: string;
  x: number;
  z: number;
  hash: number;
  lastSavedHash: number;
  blocks: { [type: string]: Record<string, CustomBlock | {}> };
}

export class Blocks {
  private static REGIONS_FOLDER = config.DATA_FOLDER.resolve('./regions');
  private static regions: Region[] = [];

  /**
   * Converts a location into a key to be used as a dictionary index
   * @param loc location to convert
   */
  private static serializeLocation(loc: Location) {
    const { blockX, blockY, blockZ, world } = loc.clone() as Location;
    return [world.name, blockX, blockY, blockZ].join(';');
  }

  /**
   * Converts a key serialized by `this.serializeLocation` into the original location
   * @param serialized the serialized key as a string
   */
  private static deserializeLocation(serialized: string) {
    const [worldName, x, y, z] = serialized.split(';');
    const world = server.getWorld(worldName);
    return world?.getBlockAt(Number(x), Number(y), Number(z));
  }

  /**
   * Get the coordinates of the region at `location`
   * @param location
   */
  private static getRegionCoordinates(location: Location) {
    const { x, z } = location.chunk;
    const [regX, regZ] = [Math.floor(x / 32), Math.floor(z / 32)];
    return { x: regX, z: regZ };
  }

  /**
   * Get the `Region`-object at `location`
   * @param location Either a `Location` or a `Chunk`
   */
  private static getRegion(location: Location | Chunk) {
    const { x, z } = this.getRegionCoordinates(
      location instanceof Chunk
        ? new Location(location.world, location.x * 16, 0, location.z * 16)
        : location,
    );
    const region = this.regions.find(
      (r) => r.x === x && r.z === z && r.world === location.world.name,
    );
    if (!region) {
      const newRegion = {
        world: location.world.name,
        x,
        z,
        hash: 0,
        lastSavedHash: -1,
        blocks: {},
      } as Region;
      this.updateHash(newRegion);
      this.regions.push(newRegion);
      return newRegion;
    }
    return region;
  }

  static getLoadedRegions() {
    const loadedChunks = [...server.worlds]
      .map((w) => w.loadedChunks)
      .reduce((arr, cur) => [...arr, ...cur], []) as Chunk[];
    const regions = loadedChunks.map((c) => this.getRegion(c));
    return _.uniqBy(regions, (r) => `${r.world};${r.x};${r.z}`);
  }

  /**
   * Calculates and sets the hash of a `Region`, mutating the object directly
   * @param region the `Region` to update
   */
  private static updateHash(region: Region) {
    region.hash = fnv.fast1a32utf(JSON.stringify(region.blocks));
  }

  /**
   * Initializes the `Blocks`-singleton. Should only be called once.
   */
  static init() {
    if (!Files.exists(this.REGIONS_FOLDER)) {
      Files.createDirectories(this.REGIONS_FOLDER);
    }
    const regionFiles = Files.list(this.REGIONS_FOLDER).toArray() as JArray<
      Path
    >;
    console.time('files');
    for (const file of regionFiles) {
      const region = readJSON(file);
      this.regions.push(region);
    }
    console.timeEnd('files');

    addUnloadHandler(() => this.save());

    setTimeout(() => {
      console.time('save');
      this.save();
      console.timeEnd('save');
    }, 1000);
  }

  /**
   * Load the data for a `CustomBlock`
   * @param customBlock the block of which the data should be loaded for
   */
  private static load(customBlock: CustomBlock): Record<string, any> {
    const key = this.serializeLocation(customBlock.block.location);
    const region = this.getRegion(customBlock.block.location);
    const blockName = customBlock.constructor.name;
    if (!(blockName in region.blocks)) {
      region.blocks[blockName] = {};
    }
    const dict = region.blocks[blockName];
    const data = dict[key];
    if (!data) {
      dict[key] = {} as any;
    }
    return dict[key];
  }

  private static getRegionFile(region: Region) {
    return this.REGIONS_FOLDER.resolve(
      `./${[region.world, region.x, region.z]}.json`,
    );
  }

  /**
   * Saves changed regions into the disk
   */
  static save() {
    // This entire function could be optimized to a single loop

    const emptyRegions: Region[] = [];
    this.regions = this.regions.filter((r) => {
      const isEmpty = Object.keys(r.blocks).length === 0;
      if (isEmpty) {
        emptyRegions.push(r);
      }
      return !isEmpty;
    });

    const changedRegions = this.regions.filter((region) => {
      const hasChanged = region.hash !== region.lastSavedHash;
      region.lastSavedHash = region.hash;
      return hasChanged;
    });
    console.log(
      `${changedRegions.length} regions changed, ${emptyRegions.length} empty regions will be deleted`,
    );

    for (const region of emptyRegions) {
      const f = this.getRegionFile(region);
      Files.deleteIfExists(f);
      this.regions = this.regions.filter((r) => r !== region);
    }
    for (const region of changedRegions) {
      writeJSON(this.getRegionFile(region), region);
    }
  }

  /**
   * Update the data of a certain block
   * @param cb The updated `CustomBlock` object
   */
  private static set(cb: CustomBlock) {
    const key = this.serializeLocation(cb.location.clone() as Location);
    const region = this.getRegion(cb.location.clone() as Location);
    region.blocks[cb.constructor.name][key] = {
      ...serialize({
        ...cb,
        schema: undefined,
        block: undefined,
        location: undefined,
      }),
    } as any;
    this.updateHash(region);
  }

  /**
   * Get a proxy for `block` that calls `this.set` when the object changes
   * @param block The `CustomBlock` to watch
   */
  private static getProxy(block: CustomBlock) {
    return onChange(block, () => {
      this.set(block);
    });
  }

  /**
   * Loop all blocks of a type. Note that the `callback` is called asynchronously.
   * @param clazz The class of the `CustomBlock` of which to loop
   * @param callback The callback function to call on each block
   */
  static async forEach<T extends CustomBlock>(
    clazz: Newable<T>,
    callback: (block: T) => void,
    regions?: Region[],
  ) {
    const promises: Promise<void>[] = [];
    const name = clazz.prototype.constructor.name;
    const loadedRegions = regions ?? this.getLoadedRegions();
    let totalAmount = 0;
    for (let i = 0; i < loadedRegions.length; i++) {
      const region = loadedRegions[i];
      if (!(name in region.blocks)) {
        continue;
      }
      const blocks = region.blocks[name];
      const keys = Object.keys(blocks);
      totalAmount += keys.length;

      const chunkedKeys = _.chunk(keys, 5);

      for (const chunk of chunkedKeys) {
        const promise = runTask(() => {
          for (let j = 0; j < chunk.length; j++) {
            const key = chunk[j];
            const block = this.deserializeLocation(key);
            if (!block) {
              continue;
            }
            const cb = this.get(block, clazz);
            if (!cb) {
              continue;
            }
            callback(cb);
          }
        });
        await promise;
        promises.push(promise);
      }
    }
    //await Promise.all(promises);
  }
  /**
   * Get the custom block data of type `type` at the specified block, or undefined if the
   * `block` does not satisfy the requirements of the custom block
   * @param block The block to check. If falsy, function will return undefined
   * @param type The custom block to use to check the block and get the data
   */
  static get<T extends CustomBlock>(
    block: Block | null | undefined,
    type: Newable<T>,
  ): T | undefined;
  /**
   * Get the custom block data of type `type` at the specified block, or undefined if the
   * block at `loc` does not satisfy the requirements of the custom block
   * @param loc The location to check
   * @param type The custom block to use to check the block and get the data
   */
  static get<T extends CustomBlock>(
    loc: Location,
    type: Newable<T>,
  ): T | undefined;
  static get<T extends CustomBlock>(
    arg0: Block | null | undefined | Location,
    Clazz: Newable<T>,
  ) {
    if (!arg0) {
      return undefined;
    }
    const block = arg0 instanceof Block ? arg0 : arg0.getBlock();
    const customBlock = new Clazz(block);
    if (!customBlock.check()) {
      return undefined;
    }
    const schema = customBlock.schema;
    const data = applyDefault(this.load(customBlock), customBlock, schema);
    for (const key in customBlock) {
      if (!data[key]) {
        continue;
      }
      customBlock[key as keyof T] = data[key];
    }
    return this.getProxy(customBlock) as T;
  }

  static remove(cb: CustomBlock) {
    const location = cb.location.clone() as Location;
    const key = this.serializeLocation(location);
    const name = cb.constructor.name;
    const region = this.getRegion(location);
    if (!region.blocks[name]) {
      return;
    }
    region.blocks[name][key] = {};
    this.updateHash(region);
  }
}

Blocks.init();
