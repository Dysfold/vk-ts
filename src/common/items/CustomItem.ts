import { ItemStack } from 'org.bukkit.inventory';
import { NBT } from './NBT';
import { Newable } from '../types';
import { Material } from 'org.bukkit';
import { onChange } from '../onChange';
import { Damageable } from 'org.bukkit.inventory.meta';
const DATA_KEY = '__data';

type CustomItemOptions<T> = {
  type: Material;
  damage?: number;
  create?: (data: T | undefined) => ItemStack;
  check?: (item: ItemStack) => boolean;
  descriptor?: T;
} & ({} | { defaultData: T; create?: (data: T) => ItemStack });

export class CustomItem<T extends {} | undefined = undefined> {
  options: CustomItemOptions<T>;
  defaultData: T | undefined;

  constructor(options: CustomItemOptions<T>) {
    this.options = { check: () => true, ...options };
    this.defaultData =
      'defaultData' in options ? options.defaultData : undefined;
  }

  create() {
    if (this.options.create) {
      return this.options.create(this.defaultData);
    }
    const item = new ItemStack(this.options.type);
    if (this.defaultData) {
      NBT.set(item, DATA_KEY, this.defaultData);
    }
    return item;
  }

  private getProxy(item: ItemStack, data: T) {
    return onChange(data, () => {
      NBT.set(item, DATA_KEY, data);
    });
  }

  get(item: ItemStack | null | undefined) {
    if (!item || !this.check(item)) {
      return undefined;
    }
    const data = NBT.get(item, DATA_KEY);
    if (!data) {
      return undefined;
    }
    return this.getProxy(item, data) as T;
  }

  set(item: ItemStack | null | undefined, data: T): void;
  set(item: ItemStack | null | undefined, setter: (data: T) => void): void;
  set(item: ItemStack | null | undefined, arg1: T | ((data: T) => void)) {
    if (!item) {
      return;
    }
    const currentData = this.get(item);
    if (!currentData) {
      return;
    }
    if (typeof arg1 === 'function' && 'call' in arg1) {
      arg1(currentData);
      NBT.set(item, DATA_KEY, currentData);
    } else {
      NBT.set(item, DATA_KEY, arg1);
    }
  }

  check(item: ItemStack) {
    const { itemMeta: meta } = item;
    const damage = meta instanceof Damageable ? meta.damage : undefined;
    const isDamageValid =
      !this.options.damage || damage === this.options.damage;
    return (
      isDamageValid &&
      item.type === this.options.type &&
      (!this.options.check || this.options.check(item))
    );
  }
}

const TestItem = new CustomItem({
  type: Material.STICK,
  defaultData: {
    counter: 0,
  },
});

const item = TestItem.create();
TestItem.set(item, (data) => data.counter++);
