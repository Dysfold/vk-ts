import { BlockSpreadEvent, BlockPlaceEvent } from 'org.bukkit.event.block';
import { Material, Bukkit } from 'org.bukkit';
import { Ageable } from 'org.bukkit.block.data';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { VkItem } from '../common/items/VkItem';

const Plant = {
  A: { id: 1 },
  B: { id: 2 },
  C: { id: 3 },
  D: { id: 4 },
  E: { id: 5 },
  F: { id: 6 },
  G: { id: 7 },
  H: { id: 8 },
  I: { id: 9 },
};

const PLANTS = [
  Plant.A, // 0
  Plant.A, // 1
  Plant.A, // 2

  Plant.B, // 3
  Plant.B, // 4
  Plant.B, // 5

  Plant.C, // 6
  Plant.C, // 7
  Plant.C, // 8

  Plant.D, // 9
  Plant.D, // 10
  Plant.D, // 11

  Plant.E, // 12
  Plant.E, // 13
  Plant.E, // 14

  Plant.F, // 15
  Plant.F, // 16
  Plant.F, // 17

  Plant.G, // 18
  Plant.G, // 19
  Plant.G, // 20

  Plant.H, // 21
  Plant.H, // 22
  Plant.H, // 23

  Plant.I, // 24
  Plant.I, // 25
];

registerEvent(BlockSpreadEvent, (event) => {
  const block = event.source;
  if (block.type !== Material.TWISTING_VINES) return;
  event.setCancelled(true);

  const oldAgeable = block.blockData as Ageable;
  const newAgeable = event.newState.blockData as Ageable;

  const oldPlant = PLANTS[oldAgeable.age];
  const newPlant = PLANTS[newAgeable.age];

  if (oldPlant.id === newPlant.id) {
    oldAgeable.age++;
    block.blockData = oldAgeable;
  }
});

registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === Material.TWISTING_VINES) {
    event.setCancelled(true);
  }
});

registerEvent(ItemSpawnEvent, (event) => {
  if (event.entity?.itemStack?.type === Material.TWISTING_VINES)
    event.setCancelled(true);
});

registerEvent(BlockPlaceEvent, (event) => {
  if (event.itemInHand.type !== VkItem.SEED) return;
  const seed = event.itemInHand;
  if (!seed.itemMeta.hasCustomModelData()) return;
  const modelId = seed.itemMeta.customModelData;
  if (!modelId) return;
  event.block.type = Material.TWISTING_VINES;
  const ageable = event.block.blockData as Ageable;
  ageable.age = modelId - 1;
  event.block.blockData = ageable;
});
