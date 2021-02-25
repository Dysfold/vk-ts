import { Material } from 'org.bukkit';
import { Ageable } from 'org.bukkit.block.data';
import { BlockPlaceEvent } from 'org.bukkit.event.block';

const MIN_AGE = 3; // Value 3 gives optimal size for the cactus (range: 0-5)
const CACTUS_MATERIAL = Material.CHORUS_FLOWER;

// Set the age of planted cactus. Chorus flower will grow until their age is 5
registerEvent(BlockPlaceEvent, async (event) => {
  if (event.block.type !== CACTUS_MATERIAL) return;
  const block = event.block;
  const ageable = block.blockData as Ageable;
  ageable.age = MIN_AGE;
  block.blockData = ageable;
});
