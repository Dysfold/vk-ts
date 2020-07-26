import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';
import * as s from './common/serialization';
import { ItemStack, EquipmentSlot } from 'org.bukkit.inventory';
import { Material, Particle } from 'org.bukkit';
import {
  CustomBlock,
  OnClick,
  OnRightClick,
  Tick,
  Event,
} from './common/blocks';
import { Blocks } from './common/blocks/CustomBlock';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { BlockBreakEvent, BlockPlaceEvent } from 'org.bukkit.event.block';
import { event, isRightClick } from './common/events';
import { Levelled } from 'org.bukkit.block.data';

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

  getLiquid() {
    const blockData = this.block.blockData as Levelled;
    return blockData.level > 0 ? 'WATER' : 'NONE';
  }

  isHeated() {
    return this.block.getRelative(0, -1, 0).type === Material.FIRE;
  }

  @Event(BlockPlaceEvent, (e) => e.block)
  onPlace(event: BlockPlaceEvent) {
    event.player.sendMessage('Place');
  }

  @OnRightClick()
  onClick(event: PlayerInteractEvent) {
    if (event.hand !== EquipmentSlot.HAND) {
      return;
    }
    event.player.sendActionBar(`${this.temperature} C`);
  }

  @Tick(20)
  tick(delta: number) {
    this.temperature = Math.min(
      this.isHeated() ? this.temperature + 0.5 * delta : this.temperature,
      100,
    );
    if (this.temperature > 95 && this.getLiquid() !== 'NONE') {
      const loc = this.block.location.add(0.5, 0.5, 0.5);
      loc.world.spawnParticle(Particle.SMOKE_LARGE, loc, 1, 0, 0, 0, 0.01);
    }
  }
}

registerEvent(BlockBreakEvent, (e) => {
  console.log(Blocks.get(e.block, Cauldron));
  Blocks.get(e.block, Cauldron)?.remove();
});
