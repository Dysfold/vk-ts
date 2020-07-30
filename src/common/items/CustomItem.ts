import { ItemStack } from 'org.bukkit.inventory';
import { NBT } from './NBT';
import { Newable } from '../types';
import { Material } from 'org.bukkit';
const DATA_KEY = '__data';

type CustomItemOptions<T> = {
  type: Material;
  create?: (data: T | undefined) => ItemStack;
  check?: (item: ItemStack) => boolean;
  descriptor?: T;
} & ({} | { defaultData: T; create?: (data: T) => ItemStack });

class CustomItem<T = undefined> {
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

  get(item: ItemStack | null | undefined) {
    if (!item || !this.check(item)) {
      return undefined;
    }
    const data = NBT.get(item, DATA_KEY);
    return data as T;
  }

  check(item: ItemStack) {
    return (
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

export class Items {
  static get<T extends CustomItem<any>>(
    clazz: Newable<CustomItem<T>>,
    item: ItemStack,
  ) {
    const data = NBT.get(item, DATA_KEY);
    const customItem = new clazz(item, data);
    return customItem;
  }

  static create<T>(clazz: Newable<CustomItem<T>>) {}
}

const item = TestItem.create();
TestItem.get(item)?.counter++;
