import { Ageable } from 'org.bukkit.block.data';
import { BlockPlaceEvent } from 'org.bukkit.event.block';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { VkMaterial } from '../common/items/VkMaterial';

const MIN_AGE = 3; // Value 3 gives optimal size for the cactus (range: 0-5)

// Set the age of planted cactus. Chorus flower will grow until their age is 5
registerEvent(BlockPlaceEvent, async (event) => {
  if (event.block.type !== VkMaterial.CACTUS_FLOWER) return;
  const block = event.block;
  const ageable = block.blockData as Ageable;
  ageable.age = MIN_AGE;
  block.blockData = ageable;
});

// Replace the default drop with the block
registerEvent(ItemSpawnEvent, (event) => {
  if (event.entity.itemStack?.type !== VkMaterial.DESERT_CACTUS) return;
  event.entity.itemStack = new ItemStack(VkMaterial.CACTUS_FLOWER);
});
