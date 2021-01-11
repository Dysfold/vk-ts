import { BlockBreakEvent } from 'org.bukkit.event.block';
import { Material, Bukkit, TreeSpecies } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Vector } from 'org.bukkit.util';

const LOGS = new Map([
  [Material.OAK_LOG, TreeSpecies.GENERIC],
  [Material.OAK_WOOD, TreeSpecies.GENERIC],

  [Material.SPRUCE_LOG, TreeSpecies.REDWOOD],
  [Material.SPRUCE_WOOD, TreeSpecies.REDWOOD],

  [Material.BIRCH_LOG, TreeSpecies.BIRCH],
  [Material.BIRCH_WOOD, TreeSpecies.BIRCH],

  [Material.JUNGLE_LOG, TreeSpecies.JUNGLE],
  [Material.JUNGLE_WOOD, TreeSpecies.JUNGLE],

  [Material.DARK_OAK_LOG, TreeSpecies.DARK_OAK],
  [Material.DARK_OAK_WOOD, TreeSpecies.DARK_OAK],

  [Material.ACACIA_LOG, TreeSpecies.ACACIA],
  [Material.ACACIA_WOOD, TreeSpecies.ACACIA],
]);

// All blocks that can be part of specific tree (leaves not included)
const TREE_MATERIALS = new Map([
  [
    TreeSpecies.GENERIC,
    {
      logs: new Set([Material.OAK_LOG, Material.OAK_WOOD]),
      leaves: Material.OAK_LEAVES,
    },
  ],

  [
    TreeSpecies.REDWOOD,
    {
      logs: new Set([Material.SPRUCE_LOG, Material.SPRUCE_WOOD]),
      leaves: Material.SPRUCE_LEAVES,
    },
  ],

  [
    TreeSpecies.BIRCH,
    {
      logs: new Set([Material.BIRCH_LOG, Material.BIRCH_WOOD]),
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
      ]),
      leaves: Material.JUNGLE_LEAVES,
    },
  ],

  [
    TreeSpecies.DARK_OAK,
    {
      logs: new Set([Material.DARK_OAK_LOG, Material.DARK_OAK_WOOD]),
      leaves: Material.DARK_OAK_LEAVES,
    },
  ],

  [
    TreeSpecies.ACACIA,
    {
      logs: new Set([Material.ACACIA_LOG, Material.ACACIA_WOOD]),
      leaves: Material.ACACIA_LEAVES,
    },
  ],
]);

// prettier-ignore
const LAYER_FACES = [
  { face: BlockFace.NORTH,          distance: 1 },
  { face: BlockFace.NORTH,          distance: 2 },
  { face: BlockFace.NORTH_WEST,     distance: 1 },
  { face: BlockFace.WEST,           distance: 1 },
  { face: BlockFace.WEST,           distance: 2 },
  { face: BlockFace.SOUTH_WEST,     distance: 1 },
  { face: BlockFace.SOUTH,          distance: 1 },
  { face: BlockFace.SOUTH,          distance: 2 },
  { face: BlockFace.SOUTH_EAST,     distance: 1 },
  { face: BlockFace.EAST,           distance: 1 },
  { face: BlockFace.EAST,           distance: 2 },
  { face: BlockFace.NORTH_EAST,     distance: 1 },
  { face: BlockFace.SELF,           distance: 1 },
];

registerEvent(BlockBreakEvent, (event) => {
  const species = LOGS.get(event.block.type);
  if (!species) return;
  const blocks = getTree(event.block, species);
  if (!blocks) return;
  collapse(blocks, species);
});

// function getTree(source: Block, species: TreeSpecies) {
//   const logs = new Set<Block>();
//   const allowedBlocks = TREE_MATERIALS.get(species);
//   if (!allowedBlocks) return;
//   let hasLeaves = false;

//   let block = source;
//   // Loop 1 layer at the time
//   for (let i = 0; i < 20; i++) {
//     block = block.getRelative(BlockFace.UP);

//     const relatives = new Set<Block>([]);
//     for (const face of LAYER_FACES) {
//       relatives.add(block.getRelative(face));
//     }

//     for (const relative of relatives) {
//       if (allowedBlocks.has(relative.type)) {
//         logs.add(relative);
//       }
//       if (relative.type.toString().endsWith('_LEAVES')) hasLeaves = true;
//     }Oks mei
//   }
//   if (!hasLeaves) return;
//   return logs;
// }

function getTree(source: Block, species: TreeSpecies) {
  const logLayers: Map<string, Block>[] = [];
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return;

  // let block = source;
  let layer = new Map<string, Block>([[source.location.toString(), source]]);
  let isTree = false;

  // Loop 1 layer at the time
  for (let i = 0; i < 20; i++) {
    // block = block.getRelative(BlockFace.UP);
    // const relatives = new Set<Block>([]);
    // for (const face of LAYER_FACES) {
    //   relatives.add(block.getRelative(face));
    // }
    // for (const relative of relatives) {
    //   if (allowedBlocks.has(relative.type)) {
    //     logs.add(relative);
    //   }
    // }

    const { logs, hasLeaves } = getNextLayerLogs(layer, allowedBlocks);
    layer = logs;
    if (hasLeaves) isTree = true;
    if (layer.size === 0) break;
    logLayers.push(layer);
  }
  if (isTree) return logLayers;
}

function getNextLayerLogs(
  prevLayer: Map<string, Block>,
  allowedBlocks: { logs: Set<Material>; leaves: Material },
) {
  const logs = new Map<string, Block>();

  let hasLeaves = false;

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
      if (allowedBlocks.leaves === loopBlock.type) {
        hasLeaves = true;
      }
    }
  });

  return { logs: logs, hasLeaves: hasLeaves };
}

async function collapse(layers: Map<string, Block>[], species: TreeSpecies) {
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return;

  let isFirstLayer = true;
  for (const layer of layers) {
    for (const block of layer.values()) {
      // Only collapse logs which can fall down
      if (!isFirstLayer && !block.getRelative(BlockFace.DOWN).type.isAir())
        continue;

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
    }
    // Delay between layers
    await wait(1, 'ticks');
    isFirstLayer = false;
  }
}
