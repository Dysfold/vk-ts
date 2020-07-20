import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';
import * as s from './common/serialization';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { CustomBlock } from './common/blocks';
import { Blocks } from './common/blocks/CustomBlock';

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

const b = server.getWorlds()[0].getBlockAt(100, 100, 0);

const data = Blocks.get(b, Cauldron);
if (data) {
  data.temperature++;
  //data.ingredients = [];
}

console.log(JSON.stringify(Blocks.get(b, Cauldron)));
