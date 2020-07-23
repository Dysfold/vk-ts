import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';
import * as s from './common/serialization';
import { ItemStack } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';
import { CustomBlock } from './common/blocks';
import { Blocks } from './common/blocks/CustomBlock';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';

interface CauldronData {
  temperature: number;
  ingredients: string[];
}

class Cauldron extends CustomBlock {
  temperature = 0;
  ingredients: number[] = [];

  check() {
    return true;
  }
}

Blocks.forEach(Cauldron, (b) => {
  b.temperature++;
  console.log(b.temperature, b.ingredients);
});
