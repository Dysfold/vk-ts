import { GameMode, Material, TreeSpecies } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { Vector } from 'org.bukkit.util';
import { VkMaterial } from '../common/items/VkMaterial';

// All blocks that can be part of specific tree (leaves not included)
const TREE_MATERIALS = new Map([
  [
    TreeSpecies.GENERIC,
    {
      logs: new Set([Material.OAK_LOG, Material.OAK_WOOD, VkMaterial.OAK_BEAM]),
      leaves: Material.OAK_LEAVES,
    },
  ],

  [
    TreeSpecies.REDWOOD,
    {
      logs: new Set([
        Material.SPRUCE_LOG,
        Material.SPRUCE_WOOD,
        VkMaterial.SPRUCE_BEAM,
      ]),
      leaves: Material.SPRUCE_LEAVES,
    },
  ],

  [
    TreeSpecies.BIRCH,
    {
      logs: new Set([
        Material.BIRCH_LOG,
        Material.BIRCH_WOOD,
        VkMaterial.BIRCH_BEAM,
      ]),
      leaves: Material.BIRCH_LEAVES,
    },
  ],

  [
    TreeSpecies.JUNGLE,
    {
      logs: new Set([
        Material.JUNGLE_LOG,
        Material.JUNGLE_WOOD,
        Material.COCOA_BEANS,
        VkMaterial.JUNGLE_BEAM,
      ]),
      leaves: Material.JUNGLE_LEAVES,
    },
  ],

  [
    TreeSpecies.DARK_OAK,
    {
      logs: new Set([
        Material.DARK_OAK_LOG,
        Material.DARK_OAK_WOOD,
        VkMaterial.DARK_OAK_BEAM,
      ]),
      leaves: Material.DARK_OAK_LEAVES,
    },
  ],

  [
    TreeSpecies.ACACIA,
    {
      logs: new Set([
        Material.ACACIA_LOG,
        Material.ACACIA_WOOD,
        VkMaterial.WILLOW_BEAM,
      ]),
      leaves: Material.ACACIA_LEAVES,
    },
  ],
]);

/**
 * Map all log materials to corresponding tree species
 */
const LOGS = new Map<Material, TreeSpecies>();
TREE_MATERIALS.forEach((materials, species) => {
  materials.logs.forEach((logType) => {
    LOGS.set(logType, species);
  });
});

// prettier-ignore
const LAYER_FACES = [
  { face: BlockFace.NORTH,          distance: 1 },
  { face: BlockFace.WEST,           distance: 1 },
  { face: BlockFace.SOUTH,          distance: 1 },
  { face: BlockFace.EAST,           distance: 1 },

  { face: BlockFace.NORTH,          distance: 2 },
  { face: BlockFace.WEST,           distance: 2 },
  { face: BlockFace.SOUTH,          distance: 2 },
  { face: BlockFace.EAST,           distance: 2 },

  { face: BlockFace.NORTH_WEST,     distance: 1 },
  { face: BlockFace.SOUTH_WEST,     distance: 1 },
  { face: BlockFace.SOUTH_EAST,     distance: 1 },
  { face: BlockFace.NORTH_EAST,     distance: 1 },

  { face: BlockFace.NORTH_WEST,     distance: 2 },
  { face: BlockFace.SOUTH_WEST,     distance: 2 },
  { face: BlockFace.NORTH_EAST,     distance: 2 },
  { face: BlockFace.SOUTH_EAST,     distance: 2 },

  { face: BlockFace.NORTH_NORTH_EAST,     distance: 1 },
  { face: BlockFace.NORTH_NORTH_WEST,     distance: 1 },
  { face: BlockFace.SOUTH_SOUTH_EAST,     distance: 1 },
  { face: BlockFace.SOUTH_SOUTH_WEST,     distance: 1 },
  { face: BlockFace.EAST_SOUTH_EAST,     distance: 1 },
  { face: BlockFace.EAST_NORTH_EAST,     distance: 1 },
  { face: BlockFace.WEST_NORTH_WEST,     distance: 1 },
  { face: BlockFace.WEST_SOUTH_WEST,     distance: 1 },

  { face: BlockFace.SELF,           distance: 1 },
];

const MAX_TREE_HEIGHT = 30;

registerEvent(BlockBreakEvent, (event) => {
  if (event.player.gameMode === GameMode.CREATIVE) return;
  const species = LOGS.get(event.block.type);
  if (!species) return;
  if (!isNaturalTree(event.block, species)) return;
  const blocks = getTree(event.block, species);
  if (!blocks) return;
  collapse(blocks, species);
});

function getTree(source: Block, species: TreeSpecies) {
  const logLayers: Map<string, Block>[] = [];
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return;

  // let block = source;
  let layer = new Map<string, Block>([[source.location.toString(), source]]);

  // Loop 1 layer at the time
  for (let i = 0; i < MAX_TREE_HEIGHT; i++) {
    layer = getNextLayerLogs(layer, allowedBlocks);
    if (layer.size === 0) break;
    logLayers.push(layer);
  }
  return logLayers;
}

function getNextLayerLogs(
  prevLayer: Map<string, Block>,
  allowedBlocks: { logs: Set<Material>; leaves: Material },
) {
  const logs = new Map<string, Block>();

  prevLayer.forEach((prevBlock) => {
    const centerBlock = prevBlock.getRelative(BlockFace.UP);
    for (const layerFace of LAYER_FACES) {
      const loopBlock = centerBlock.getRelative(
        layerFace.face,
        layerFace.distance,
      );
      if (allowedBlocks.logs.has(loopBlock.type)) {
        logs.set(loopBlock.location.toString(), loopBlock);
      }
    }
  });

  return logs;
}

function isNaturalTree(source: Block, species: TreeSpecies) {
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return false;

  for (let i = 1; i < MAX_TREE_HEIGHT; i++) {
    const type = source.getRelative(BlockFace.UP, i).type;
    if (type === allowedBlocks.leaves) {
      return true;
    }
  }
  return false;
}

async function collapse(layers: Map<string, Block>[], species: TreeSpecies) {
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return;

  await wait(1, 'ticks');
  for (const layer of layers) {
    for (const block of layer.values()) {
      // Only collapse logs which can fall down
      const blockBelow = block.getRelative(BlockFace.DOWN);
      if (blockBelow.type === allowedBlocks.leaves) {
        blockBelow.type = Material.AIR;
      } else if (!blockBelow.isPassable()) {
        // Skip this layer because the block can't fall
        continue;
      }

      // Prevent other blocks from falling
      if (!allowedBlocks.logs.has(block.type)) continue;

      const data = block.blockData;
      block.type = Material.AIR;
      const fallingBlock = block.world.spawnFallingBlock(
        block.location.add(0.5, 0, 0.5),
        data,
      );
      fallingBlock.setHurtEntities(true);
      fallingBlock.setDropItem(false);
      fallingBlock.velocity = new Vector();

      // Falling blocks will break leaves (misc/falling-blocks.ts)
    }
    // Delay between layers
    await wait(1, 'ticks');
  }
}
