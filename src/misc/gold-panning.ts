import { Chunk, Material } from 'org.bukkit';
import { Biome } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';

const GOLD_CHANCE = 0.04;

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.item?.type !== Material.BOWL) return;

  const player = event.player;

  if (player.getCooldown(Material.BOWL)) return;

  const block = event.clickedBlock;
  if (!block) return;

  const biome = block.biome;
  if (biome !== Biome.RIVER && biome !== Biome.FROZEN_RIVER) return;

  const water = block.getRelative(event.blockFace);
  if (water.type !== Material.WATER) return;

  player.setCooldown(Material.BOWL, 20);

  if (!isLuckyChunk(block.chunk)) return;
  if (Math.random() > GOLD_CHANCE) return;

  if (event.hand === EquipmentSlot.HAND) {
    player.swingMainHand();
  } else {
    player.swingOffHand();
  }

  const offset = player.location.direction;
  offset.y = 0;
  const location = player.location.add(offset);

  block.world.dropItem(location, new ItemStack(Material.GOLD_NUGGET, 1));
});

// Black magic
// Sometimes a chunk is lucky, so player should keep moving to different chunks
// Prevents AFK auto clickers
const rand = Math.floor(Math.random() * 1000);
function isLuckyChunk(chunk: Chunk) {
  const randomKey = chunk.chunkKey + rand;
  const time = new Date().getTime();
  const t = Math.floor(time / (60 * 1000)) % 10;
  const lucky = randomKey % t;
  return !lucky;
}
