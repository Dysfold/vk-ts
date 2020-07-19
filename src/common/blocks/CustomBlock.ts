import { Block, TileState } from 'org.bukkit.block';
import { Location } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';
import { onChange } from '../utils/onChange';

type Newable<T> = new (...args: any[]) => T;

export abstract class CustomBlock {
  block: Block;

  constructor(block: Block) {
    this.block = block;
  }

  abstract check(): boolean;
}

export class Blocks {
  private static data: Record<string, any> = {};

  private static serializeLocation({
    blockX,
    blockY,
    blockZ,
    world,
  }: Location) {
    return [world.name, blockX, blockY, blockZ].join(';');
  }

  static load(location: Location): Record<string, any> {
    const key = this.serializeLocation(location);
    const data = this.data[key];
    if (!data) {
      this.data[key] = {};
    }
    return this.data[key];
  }

  private static save(data: CustomBlock) {
    const key = this.serializeLocation(data.block.location);
    this.data[key] = data;
  }

  static get<T extends CustomBlock>(block: Block, type: Newable<T>): T;
  static get<T extends CustomBlock>(loc: Location, type: Newable<T>): T;
  static get<T extends CustomBlock>(arg0: Block | Location, Clazz: Newable<T>) {
    const block = arg0 instanceof Block ? arg0 : arg0.getBlock();
    const data = this.load(block.location);
    const customBlock = new Clazz(block);
    for (const key in data) {
      customBlock[key as keyof T] = data[key];
    }
    return onChange(customBlock, () => {
      this.save(customBlock);
    });
  }
}
