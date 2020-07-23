import { Block, TileState } from 'org.bukkit.block';
import { Location, Chunk } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';
import { onChange } from '../onChange';
import { config } from '../config';
import { Files, Path } from 'java.nio.file';
import { readJSON, writeJSON } from '../json';
import * as fnv from 'fnv-plus';

type Newable<T> = new (...args: any[]) => T;

export abstract class CustomBlock {
  block: Block;

  constructor(block: Block) {
    this.block = block;
  }

  abstract check(): boolean;
}

interface Region {
  world: string;
  x: number;
  z: number;
  hash: number;
  lastSavedHash: number;
  blocks: { [type: string]: Record<string, CustomBlock> };
}

export class Blocks {
  private static REGIONS_FOLDER = config.DATA_FOLDER.resolve('./regions');
  private static regions: Region[] = [];

  /**
   * Converts a location into a key to be used as a dictionary index
   * @param loc location to convert
   */
  private static serializeLocation({
    blockX,
    blockY,
    blockZ,
    world,
  }: Location) {
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

  /**
   * Calculates and sets the hash of a `Region`, mutating the object directly
   * @param region the `Region` to update
   */
  private static updateHash(region: Region) {
    region.hash = fnv.fast1a32(JSON.stringify(region.blocks));
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

  /**
   * Saves changed regions into the disk
   */
  static save() {
    const changedRegions = this.regions.filter((region) => {
      const hasChanged = region.hash !== region.lastSavedHash;
      region.lastSavedHash = region.hash;
      return hasChanged;
    });
    console.log(`${changedRegions.length} regions changed`);
    for (const region of changedRegions) {
      const path = this.REGIONS_FOLDER.resolve(
        `./${[region.world, region.x, region.z]}.json`,
      );
      writeJSON(path, region);
    }
  }

  /**
   * Update the data of a certain block
   * @param cb The updated `CustomBlock` object
   */
  private static set(cb: CustomBlock) {
    const key = this.serializeLocation(cb.block.location);
    const region = this.getRegion(cb.block.location);
    region.blocks[cb.constructor.name][key] = serialize(cb) as any;
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
  static forEach<T extends CustomBlock>(
    clazz: Newable<T>,
    callback: (block: T) => void,
  ) {
    const name = clazz.prototype.constructor.name;
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      if (!(name in region.blocks)) {
        continue;
      }
      const blocks = region.blocks[name];
      for (const key in blocks) {
        const block = this.deserializeLocation(key);
        if (!block) {
          continue;
        }
        setTimeout(() => {
          const cb = this.get(block, clazz);
          if (!cb) {
            return;
          }
          callback(cb);
        }, 0);
      }
    }
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
    const data = this.load(customBlock);
    for (const key in customBlock) {
      if (!data[key]) {
        continue;
      }
      customBlock[key as keyof T] = data[key];
    }
    return this.getProxy(customBlock) as T;
  }
}

Blocks.init();