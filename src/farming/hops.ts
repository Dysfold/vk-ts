import { Material } from 'org.bukkit';
import { Ageable } from 'org.bukkit.block.data';
import { BlockPlaceEvent, BlockSpreadEvent } from 'org.bukkit.event.block';

const HEIGHTS = [2, 2, 2, 3, 3, 4];

const VINES_MAX_AGE = 25; // Minecraft constant
const MIN_AGE = VINES_MAX_AGE - Math.max(...HEIGHTS);

function randomHeight() {
  return HEIGHTS[Math.floor(Math.random() * HEIGHTS.length)];
}

// Set the age of planted plant. Twisting vines will grow until their age is 25
// So we set the age = max - height
registerEvent(BlockPlaceEvent, async (event) => {
  if (event.block.type !== Material.TWISTING_VINES) return;
  const block = event.block;
  const ageable = block.blockData as Ageable;
  ageable.age = VINES_MAX_AGE - randomHeight();
  block.blockData = ageable;
});

// TODO: Prevent vines from forming with ages lower than 21 (MIN_AGE) ?
// If player breaks the block from the middle of the plant, the new head will have random age (0-25)
// Note: We can't just listen block break event, because pistons etc can also break the plant

// If the vines try to grow with too small age -> change the age to max
// This prevents the plant from growing too tall, if it is borken at the middle first (changes the age)
registerEvent(BlockSpreadEvent, (event) => {
  const block = event.source;
  if (block.type !== Material.TWISTING_VINES) return;
  const data = block.blockData as Ageable;
  const age = data.age;
  if (age < MIN_AGE) {
    data.age = VINES_MAX_AGE;
    block.blockData = data;
    event.setCancelled(true);
  }
});
