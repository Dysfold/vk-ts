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
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { onClick } from './common/events';

interface CauldronData {
  temperature: number;
  ingredients: string[];
}

class Cauldron extends CustomBlock {
  temperature = 0;
  ingredients: number[] = [];

  check() {
    return this.block.type === Material.CAULDRON;
  }
}

const b = server.worlds[0].getBlockAt(50, 100, 50);
b.type = Material.CAULDRON;
const c = Blocks.get(b, Cauldron);
if (c) {
  c.temperature = 15;
}
c?.remove();
console.log(JSON.stringify(Blocks.get(b, Cauldron)?.temperature));

onClick({
  block: Cauldron,
  type: 'right',
  callback: (e, b) => {
    b.temperature++;
    e.player.sendMessage(`${b.temperature}`);
  },
});

registerEvent(BlockBreakEvent, (e) => {
  console.log(Blocks.get(e.block, Cauldron));
  Blocks.get(e.block, Cauldron)?.remove();
});
