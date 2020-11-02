import { Material } from 'org.bukkit';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';

const CROPS = new Set([
  Material.WHEAT.ordinal(),
  Material.BEETROOT.ordinal(),
  Material.TALL_GRASS.ordinal(),
  Material.GRASS.ordinal(),
]);
const CHANCE_WITHOUT_CICLE = 0.02;

const Sickle = new CustomItem({
  id: 1,
  name: 'Sirppi',
  type: Material.IRON_HOE,
  modelId: 1,
});

registerEvent(BlockBreakEvent, (event) => {
  if (!CROPS.has(event.block.type.ordinal())) return;
  if (Sickle.check(event.player.itemInHand)) return;
  if (Math.random() < CHANCE_WITHOUT_CICLE) return;
  event.setCancelled(true);
});
