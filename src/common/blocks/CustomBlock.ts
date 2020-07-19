import { Block, TileState } from 'org.bukkit.block';
import { Location } from 'org.bukkit';
import { serialize } from '../serialization';
import { applyDefault } from '../data';

type Newable<T> = new (...args: any[]) => T;

export abstract class CustomBlock<T> {
  block: Block;
  data: T;

  abstract defaultData: T;

  constructor(block: Block, data: T) {
    this.block = block;
    this.data = data;
    this.init(data);
  }

  private init(data: T) {
    this.data = applyDefault(data, this.defaultData);
  }

  get(key: keyof T) {
    return this.data[key];
  }

  set<Key extends keyof T>(key: Key, accessor: (prev: T[Key]) => T[Key]) {
    const newValue = accessor(this.data[key]);
    this.data[key] = newValue;
    return this.data[key];
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

  static get<T extends CustomBlock<any>>(block: Block, type: Newable<T>): T;
  static get<T extends CustomBlock<any>>(loc: Location, type: Newable<T>): T;
  static get<T extends CustomBlock<any>>(
    arg0: Block | Location,
    Clazz: Newable<T>,
  ) {
    const block = arg0 instanceof Block ? arg0 : arg0.getBlock();
    const data = this.load(block.location);
    return new Clazz(block, data);
  }
}
