import { Block, TileState } from 'org.bukkit.block';
import { Location } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';
import { onChange } from '../onChange';

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
  blocks: { [type: string]: { [location: string]: any } };
}

export class Blocks {
  private static regions: Region[] = [];

  private static serializeLocation({
    blockX,
    blockY,
    blockZ,
    world,
    chunk,
  }: Location) {
    return [world.name, blockX, blockY, blockZ].join(';');
  }

  private static getRegionCoordinates(location: Location) {
    const { x, z } = location.chunk;
    const [regX, regZ] = [Math.floor(x / 32), Math.floor(z / 32)];
    return { x: regX, z: regZ };
  }

  private static getRegion(location: Location) {
    const { x, z } = this.getRegionCoordinates(location);
    const region = this.regions.find(
      (r) => r.x === x && r.z === z && r.world === location.world.name,
    );
    if (!region) {
      const newRegion = {
        world: location.world.name,
        x,
        z,
        blocks: {},
      } as Region;
      this.regions.push(newRegion);
      return newRegion;
    }
    return region;
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

  private static set(data: CustomBlock) {
    const key = this.serializeLocation(data.block.location);
    const region = this.getRegion(data.block.location);
    region.blocks[data.constructor.name][key] = serialize(data);
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
