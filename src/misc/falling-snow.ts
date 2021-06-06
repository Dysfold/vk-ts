import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { BlockBreakEvent, LeavesDecayEvent } from 'org.bukkit.event.block';
import { Vector } from 'org.bukkit.util';

registerEvent(LeavesDecayEvent, (event) => {
  dropSnowAbove(event.block);
});

registerEvent(BlockBreakEvent, (event) => {
  dropSnowAbove(event.block);
});

async function dropSnowAbove(block: Block) {
  const aboveBlock = block.getRelative(0, 1, 0);
  if (aboveBlock.type !== Material.SNOW) return;
  const fallingBlock = aboveBlock.world.spawnFallingBlock(
    aboveBlock.location.add(0.5, 0, 0.5),
    aboveBlock.blockData,
  );
  aboveBlock.type = Material.AIR;
  fallingBlock.setHurtEntities(false);
  fallingBlock.setDropItem(false);
  fallingBlock.velocity = new Vector();
}
