import { Material, Particle } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPlaceEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import { CustomBlock } from '../common/blocks/CustomBlock';

const TOOL_MATERIAL = Material.STICK;
const FLOUR_ITEM = new ItemStack(Material.PHANTOM_MEMBRANE, 1);
const SEEDS_PER_FLOUR = 3;
const DELAY = 1.5; // seconds

const flourPlayers = new Set<Player>();

const Grinder = new CustomBlock({
  type: Material.DARK_PRISMARINE_SLAB,
});

// Click flour grinder with stick
// while holding 3 or more seeds in offhand
Grinder.event(
  PlayerInteractEvent,
  (event) => event.clickedBlock,
  async (event) => {
    const block = event.clickedBlock;
    if (!block) return;
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    const player = event.player;

    const inventory = player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    const mainHand = inventory.itemInMainHand;
    if (mainHand.type !== TOOL_MATERIAL) return;
    if (offHand.type !== Material.WHEAT_SEEDS) return;
    if (offHand.amount < SEEDS_PER_FLOUR) return;

    if (flourPlayers.has(player)) return;

    // Start flour grinding
    event.setCancelled(true);

    playEffects(block);

    flourPlayers.add(player);
    offHand.amount = offHand.amount - SEEDS_PER_FLOUR;
    const flour = block.world.dropItem(
      block.location.add(0.5, 1, 0.5),
      FLOUR_ITEM,
    );
    flour.velocity = new Vector();

    await wait(DELAY, 'seconds');
    flourPlayers.delete(player);
  },
);

function playEffects(block: Block) {
  block.world.spawnParticle(Particle.CLOUD, block.location.add(0.5, 1, 0.5), 0);
}

// Prevent player from placing two flour grinders at one block
// -> No double slab flour grinders
Grinder.event(
  BlockPlaceEvent,
  (event) => event.block,
  async (event) => {
    if (event.blockReplacedState.type === event.block.type) {
      event.setCancelled(true);
    }
  },
);
