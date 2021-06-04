import { Material } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Leaves } from 'org.bukkit.block.data.type';
import { FallingBlock } from 'org.bukkit.entity';
import { EntityChangeBlockEvent } from 'org.bukkit.event.entity';

/**
 * Falling blocks that don't break any blocks.
 */
const LIGHT_BLOCKS = [Material.SNOW];

/**
 * Breakable full blocks
 * This is does not contain slabs, torches etc
 */
function isBreakable(block: Block) {
  const data = block.blockData;
  if (data instanceof Leaves) return true;
}

/**
 * Falling blocks can break some full blocks
 * This is mostly used for falling logs to break leaves
 */
registerEvent(EntityChangeBlockEvent, (event) => {
  if (event.entity instanceof FallingBlock) {
    const oldFallingBlock = event.entity as FallingBlock;
    const blockBelow = event.block.getRelative(BlockFace.DOWN);

    if (LIGHT_BLOCKS.includes(oldFallingBlock.blockData.material)) return;

    if (isBreakable(blockBelow)) {
      blockBelow.type = Material.AIR;
      event.setCancelled(true);
      spawnSimilarFallingBlock(oldFallingBlock);
    }
  }
});

/**
 * Spawns same falling block because the old one is marked for removal
 * @param old Old falling block to respawned
 */
function spawnSimilarFallingBlock(old: FallingBlock) {
  old.remove();
  const newFallingBlock = old.world.spawnFallingBlock(
    old.location,
    old.blockData,
  );
  newFallingBlock.setHurtEntities(old.canHurtEntities());
  newFallingBlock.setDropItem(old.getDropItem());
}
