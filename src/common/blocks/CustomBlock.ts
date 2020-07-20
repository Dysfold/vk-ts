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

export class Blocks {
  private static data: Record<string, Record<string, any>> = {};

  private static serializeLocation({
    blockX,
    blockY,
    blockZ,
    world,
    chunk,
  }: Location) {
    const regionName = [chunk.x, chunk.z].join(';');
    return [world.name, blockX, blockY, blockZ].join(';');
  }

  static load(customBlock: CustomBlock): Record<string, any> {
    const key = this.serializeLocation(customBlock.block.location);
    const data = this.data[customBlock.constructor.name][key];
    if (!data) {
      this.data[key] = {};
    }
    return this.data[key];
  }

  private static set(data: CustomBlock) {
    const key = this.serializeLocation(data.block.location);
    this.data[key] = serialize(data);
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
