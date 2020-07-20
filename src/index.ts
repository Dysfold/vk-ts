import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';
import * as s from './common/serialization';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { CustomBlock } from './common/blocks';
import { Blocks } from './common/blocks/CustomBlock';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

interface CauldronData {
  temperature: number;
  ingredients: string[];
}

class Cauldron extends CustomBlock {
  temperature = 0;
  ingredients: string[] = [];

  check() {
    return true;
  }
}

console.time('100');
for (let i = 0; i < 100; i++) {
  const b = server.getWorlds()[0].getBlockAt(i * 100, i * 20, 0);
  const data = Blocks.get(b, Cauldron);
  if (data) {
    data.temperature++;
  }
}
console.timeEnd('100');
