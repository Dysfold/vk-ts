import { Material } from 'org.bukkit';
import { LeavesDecayEvent } from 'org.bukkit.event.block';
import { Banana } from './custom-foods';

const BANANA_CHANCE = 0.005;

registerEvent(LeavesDecayEvent, (event) => {
  const type = event.block?.type;
  if (type !== Material.JUNGLE_LEAVES) return;
  if (Math.random() > BANANA_CHANCE) return;

  const item = Banana.create({});
  const block = event.block;

  block.world.dropItem(block.location.add(0.5, 0.5, 0.5), item);
});
