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

onClick(
  {
    block: Cauldron,
    type: 'right',
    hand: 'main',
  },
  (e, b) => {
    b.temperature++;
    e.player.sendMessage(`${b.temperature}`);
  },
);

Blocks.forEach(Cauldron, (b) => {
  //
});

registerEvent(BlockBreakEvent, (e) => {
  console.log(Blocks.get(e.block, Cauldron));
  Blocks.get(e.block, Cauldron)?.remove();
});
