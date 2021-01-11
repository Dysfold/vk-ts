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
// prettier-ignore
const TREE_MATERIALS = new Map([
  [TreeSpecies.GENERIC, 
    new Set([
      Material.OAK_LOG, 
      Material.OAK_WOOD
    ])],

  [TreeSpecies.REDWOOD, 
    new Set([
      Material.SPRUCE_LOG, 
      Material.SPRUCE_WOOD
    ])],

  [TreeSpecies.BIRCH, 
    new Set([
      Material.BIRCH_LOG, 
      Material.BIRCH_WOOD
    ])],

  [TreeSpecies.JUNGLE, 
    new Set([
      Material.JUNGLE_LOG, 
      Material.JUNGLE_WOOD,
      Material.COCOA_BEANS
    ])],

  [TreeSpecies.DARK_OAK, 
    new Set([
      Material.DARK_OAK_LOG, 
      Material.DARK_OAK_WOOD
    ])],

  [TreeSpecies.ACACIA, 
    new Set([
      Material.ACACIA_LOG, 
      Material.ACACIA_WOOD
    ])],
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
  Bukkit.server.broadcastMessage('Layers: ' + blocks?.length + '...');
  if (!blocks) return;
  collapse(blocks);
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
  const logLayers: Set<Block>[] = [];
  const allowedBlocks = TREE_MATERIALS.get(species);
  if (!allowedBlocks) return;

  // let block = source;
  let layer = new Set<Block>([source]);
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

    layer = getNextLayerLogs(layer, allowedBlocks);
    if (layer.size === 0) break;
    logLayers.push(layer);
  }
  return logLayers;
}

function getNextLayerLogs(prevLayer: Set<Block>, allowedBlocks: Set<Material>) {
  const logs = new Set<Block>();

  prevLayer.forEach((prevBlock) => {
    const centerBlock = prevBlock.getRelative(BlockFace.UP);
    for (const layerFace of LAYER_FACES) {
      const loopBlock = centerBlock.getRelative(
        layerFace.face,
        layerFace.distance,
      );
      if (allowedBlocks.has(loopBlock.type)) {
        logs.add(loopBlock);
      }
    }
  });

  Bukkit.server.broadcastMessage('KERROKSEN KOKO: ' + logs.size);
  return logs;
}

async function collapse(layers: Set<Block>[]) {
  let n = 0;
  for (const layer of layers) {
    for (const block of layer) {
      n++;
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
    await wait(3, 'ticks');
  }
  Bukkit.server.broadcastMessage(n + ' puuta');
}
