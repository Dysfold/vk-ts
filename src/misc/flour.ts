import { Material, Particle } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPlaceEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';

const GRINDER_MATERIAL = Material.DARK_PRISMARINE_SLAB;
const TOOL_MATERIAL = Material.STICK;
const FLOUR_ITEM = new ItemStack(Material.PHANTOM_MEMBRANE, 1);
const SEEDS_PER_FLOUR = 3;
const DELAY = 1.5; // seconds

const flourPlayers = new Set<Player>();

// Click flour grinder with stick
// while holding 3 or more seeds in offhand
registerEvent(PlayerInteractEvent, async (event) => {
  const player = event.player;
  const block = event.clickedBlock;

  if (!block) return;
  if (block.type !== GRINDER_MATERIAL) return;
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;

  const inventory = player.inventory as PlayerInventory;
  const offHand = inventory.getItemInOffHand();
  const mainHand = inventory.getItemInMainHand();
  if (mainHand.type !== TOOL_MATERIAL) return;
  if (offHand.type !== Material.WHEAT_SEEDS) return;
  if (offHand.amount < SEEDS_PER_FLOUR) return;

  if (flourPlayers.has(player)) return;

  // Start flour grinding
  event.setCancelled(true);

  playEffects(block);

  flourPlayers.add(player);
  offHand.setAmount(offHand.amount - SEEDS_PER_FLOUR);
  const flour = block.world.dropItem(
    block.location.add(0.5, 1, 0.5),
    FLOUR_ITEM,
  );
  flour.setVelocity(new Vector()); // Stationary item

  await wait(DELAY, 'seconds');
  flourPlayers.delete(player);
});

function playEffects(block: Block) {
  block.world.spawnParticle(Particle.CLOUD, block.location.add(0.5, 1, 0.5), 0);
}

// Prevent player from placing two flour grinders at one block
// -> No double slab flour grinders
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type !== GRINDER_MATERIAL) return;
  if (event.blockReplacedState.type !== GRINDER_MATERIAL) return;
  event.setCancelled(true);
});
