import { Block, TileState } from 'org.bukkit.block';
import { Location, Chunk } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';
import { onChange } from '../onChange';
import { config } from '../config';
import { Files, Path } from 'java.nio.file';
import { readJSON, writeJSON } from '../json';

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
  blocks: { [type: string]: { [location: string]: any } };
}

export class Blocks {
  private static REGIONS_FOLDER = config.DATA_FOLDER.resolve('./regions');
  private static regions: Region[] = [];

  private static serializeLocation({
    blockX,
    blockY,
    blockZ,
    world,
  }: Location) {
    return [world.name, blockX, blockY, blockZ].join(';');
  }

  private static getRegionCoordinates(location: Location) {
    const { x, z } = location.chunk;
    const [regX, regZ] = [Math.floor(x / 32), Math.floor(z / 32)];
    return { x: regX, z: regZ };
  }

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

  private static updateHash(region: Region) {
    region.hash = (JSON.stringify(region.blocks) as any).hashCode();
  }

  static init() {
    if (!Files.exists(this.REGIONS_FOLDER)) {
      Files.createDirectories(this.REGIONS_FOLDER);
    }
    const regionFiles = Files.list(this.REGIONS_FOLDER).toArray() as JArray<
      Path
    >;
    for (const file of regionFiles) {
      const region = readJSON(file);
      this.regions.push(region);
    }

    addUnloadHandler(() => this.save());

    setTimeout(() => {
      console.time('save');
      this.save();
      console.timeEnd('save');
    }, 1000);
  }

  static load(customBlock: CustomBlock): Record<string, any> {
    const key = this.serializeLocation(customBlock.block.location);
    const region = this.getRegion(customBlock.block.location);
    const blockName = customBlock.constructor.name;
    if (!(blockName in region.blocks)) {
      region.blocks[blockName] = {};
    }
    const dict = region.blocks[blockName];
    const data = dict[key];
    if (!data) {
      dict[key] = {};
    }
    return dict[key];
  }

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

  private static set(data: CustomBlock) {
    const key = this.serializeLocation(data.block.location);
    const region = this.getRegion(data.block.location);
    region.blocks[data.constructor.name][key] = serialize(data);
    this.updateHash(region);
  }

  static get<T extends CustomBlock>(
    block: Block,
    type: Newable<T>,
  ): T | undefined;
  static get<T extends CustomBlock>(
    loc: Location,
    type: Newable<T>,
  ): T | undefined;
  static get<T extends CustomBlock>(arg0: Block | Location, Clazz: Newable<T>) {
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
    return onChange(customBlock, () => {
      this.set(customBlock);
    }) as T;
  }
}

Blocks.init();
