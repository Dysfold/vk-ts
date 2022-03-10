import { translate } from 'craftjs-plugin/chat';
import { Bukkit, Location, Material, Particle } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Gate } from 'org.bukkit.block.data.type';
import { Player } from 'org.bukkit.entity';
import {
  Action,
  BlockBreakEvent,
  BlockPistonExtendEvent,
  BlockPistonRetractEvent,
} from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { VkMaterial } from '../common/items/VkMaterial';

export const Saw = new CustomBlock({
  type: VkMaterial.SAW_BLADE,
});

export const HandSaw = new CustomItem({
  id: 5,
  name: translate('vk.hand_saw'),
  type: VkItem.TOOL,
});

const SAW_COOLDOWN_SECONDS = 1;
const sawCooldowns = new Set<string>();
const sawingPlayers = new Set<Player>();

// prettier-ignore
const DROPS = new Map<Material, Material>([
  // Oak
  [Material.OAK_LOG,                    Material.OAK_PLANKS],
  [Material.STRIPPED_OAK_LOG ,          Material.OAK_PLANKS],
  [Material.OAK_WOOD ,                  Material.OAK_PLANKS],
  [Material.STRIPPED_OAK_WOOD,          Material.OAK_PLANKS],

  // Jungle
  [Material.JUNGLE_LOG ,                Material.JUNGLE_PLANKS],
  [Material.STRIPPED_JUNGLE_LOG,        Material.JUNGLE_PLANKS],
  [Material.JUNGLE_WOOD,                Material.JUNGLE_PLANKS],
  [Material.STRIPPED_JUNGLE_WOOD ,      Material.JUNGLE_PLANKS],

  // Dark oak
  [Material.DARK_OAK_LOG ,              Material.DARK_OAK_PLANKS],
  [Material.STRIPPED_DARK_OAK_LOG,      Material.DARK_OAK_PLANKS],
  [Material.DARK_OAK_WOOD,              Material.DARK_OAK_PLANKS],
  [Material.STRIPPED_DARK_OAK_WOOD ,    Material.DARK_OAK_PLANKS],

  // Spruce
  [Material.SPRUCE_LOG ,                Material.SPRUCE_PLANKS],
  [Material.STRIPPED_SPRUCE_LOG,        Material.SPRUCE_PLANKS],
  [Material.SPRUCE_WOOD,                Material.SPRUCE_PLANKS],
  [Material.STRIPPED_SPRUCE_WOOD ,      Material.SPRUCE_PLANKS],

  // Birch
  [Material.BIRCH_LOG,                  Material.BIRCH_PLANKS],
  [Material.STRIPPED_BIRCH_LOG ,        Material.BIRCH_PLANKS],
  [Material.BIRCH_WOOD ,                Material.BIRCH_PLANKS],
  [Material.STRIPPED_BIRCH_WOOD,        Material.BIRCH_PLANKS],

  // WILLOW
  [VkMaterial.WILLOW_LOG ,                VkMaterial.WILLOW_PLANKS],
  [VkMaterial.STRIPPED_WILLOW_LOG,        VkMaterial.WILLOW_PLANKS],
  [VkMaterial.WILLOW_WOOD,                VkMaterial.WILLOW_PLANKS],
  [VkMaterial.STRIPPED_WILLOW_WOOD ,      VkMaterial.WILLOW_PLANKS],
]);

function isWood(type: Material) {
  const str = type.toString();
  return str.includes('_LOG') || str.includes('_WOOD');
}

function rotateFace(face: BlockFace) {
  switch (face) {
    case BlockFace.WEST:
      return BlockFace.NORTH;
    case BlockFace.NORTH:
      return BlockFace.EAST;
    case BlockFace.EAST:
      return BlockFace.SOUTH;
    default:
      return BlockFace.WEST;
  }
}

Saw.event(
  BlockPistonExtendEvent,
  (event) => event.block.getRelative(BlockFace.UP),
  async (event) => {
    if (event.direction !== BlockFace.UP) return;
    const loc = event.block.location.toString();
    if (sawCooldowns.has(loc)) {
      event.setCancelled(true);
    }

    const saw = event.block.getRelative(BlockFace.UP);
    const log = saw.getRelative(BlockFace.UP);
    if (!isWood(log.type)) return;

    // Break the block
    const dropType = DROPS.get(log.type) || Material.AIR;
    const drops = new ItemStack(dropType, 4);
    log.world.dropItem(saw.location.add(0.5, 0.5, 0.5), drops);
    log.type = Material.AIR;

    // Spin the blade
    const data = saw.blockData as Gate;
    data.setOpen(true);
    saw.blockData = data;

    playSawSound(saw.location);
    playSawParticles(log, dropType);
  },
);

Saw.event(
  BlockPistonRetractEvent,
  (event) => event.block.getRelative(BlockFace.UP, 2),
  async (event) => {
    if (event.direction !== BlockFace.DOWN) return;
    const saw = event.block.getRelative(BlockFace.UP, 2);

    const data = saw.blockData as Gate;
    let face = rotateFace(data.facing);
    data.setOpen(false);
    saw.blockData = data;

    // Try other direction if there isn't any wood in the main direction
    if (!isWood(saw.getRelative(face).type)) {
      face = face.oppositeFace;
    }

    // Check if the saw has been cooled down
    const loc = event.block.location.toString();
    if (sawCooldowns.has(loc)) return;
    sawCooldowns.add(loc);

    // Move all logs
    await wait(SAW_COOLDOWN_SECONDS, 'seconds');
    moveLogs(saw, face);
    sawCooldowns.delete(loc);
  },
);

function moveLogs(saw: Block, direction: BlockFace) {
  let previous = saw;
  let current;
  for (let i = 0; i < 10; i++) {
    current = previous.getRelative(direction);
    if (!isWood(current.type)) return;
    if (previous.type !== Material.AIR) return;
    previous.blockData = current.blockData;
    current.type = Material.AIR;
    previous = current;
  }
}

function playSawSound(location: Location) {
  location.world.playSound(location, 'custom.saw', 1, 1);
}

HandSaw.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.action !== Action.LEFT_CLICK_BLOCK) return;
    const block = event.clickedBlock;
    if (!block) return;
    if (!isWood(block.type)) return;
    const player = event.player;

    if (sawingPlayers.has(player)) return;
    sawingPlayers.add(player);
    playSawSound(block.location);
    await wait(SAW_COOLDOWN_SECONDS, 'seconds');

    // Call BlockBreakEvent because other plugins or features might want to log or prevent the action
    const blockBreakEvent = new BlockBreakEvent(block, event.player);
    Bukkit.server.pluginManager.callEvent(blockBreakEvent);
    if (blockBreakEvent.isCancelled()) return;

    const dropType = DROPS.get(block.type) || Material.AIR;
    const drops = new ItemStack(dropType, 2);
    block.world.dropItem(block.location.add(0.5, 0.5, 0.5), drops);

    block.type = Material.AIR;
    sawingPlayers.delete(player);
    playSawParticles(block, dropType);
  },
);

function playSawParticles(block: Block, dropType: Material) {
  const data = dropType.createBlockData();
  const location = block.location.add(0.5, 0.5, 0.5);

  block.world.spawnParticle(Particle.BLOCK_DUST, location, 30, data);
}
