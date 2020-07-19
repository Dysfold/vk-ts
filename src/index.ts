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
}

class Cauldron extends CustomBlock<CauldronData> {
  defaultData: CauldronData = {
    temperature: 0,
  };

  getHeat() {
    return this.data.temperature * 12;
  }

  check() {
    return true;
  }
}

const b = server.getWorlds()[0].getBlockAt(0, 100, 0);

let data = Blocks.get(b, Cauldron);
data.temperature++;
console.log(JSON.stringify(data));

data = Blocks.get(b, Cauldron);
console.log(JSON.stringify(data));
