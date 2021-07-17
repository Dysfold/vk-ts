import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { BlockData } from 'org.bukkit.block.data';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { dataHolder } from '../datas/holder';

const CUSTOM_DATA_KEY = 'cd';

export function purgeCustomData(block: Block) {
  dataHolder(block).delete(CUSTOM_DATA_KEY);
}

/**
 * Sets a Vanilla block. Use create() of your custom block for setting it to
 * world.
 * @param block Block to change.
 * @param type New type.
 * @param data New Vanilla block state/data.
 */
export function setBlock(
  block: Block,
  type: Material,
  data?: BlockData | BlockData[],
) {
  purgeCustomData(block); // Delete previous maybe-custom block

  // Replace Vanilla block
  block.type = type;
  if (data) {
    if (Array.isArray(data)) {
      const index = Math.floor(Math.random() * data.length); // Select used block state randomly
      block.blockData = data[index];
    } else {
      block.blockData = data;
    }
  }
}

// Purge custom data when players break a block
registerEvent(BlockBreakEvent, (event) => {
  if (event.isCancelled()) return;
  purgeCustomData(event.block);
});
// TODO explosions?

// TODO cleanup function for purging any leftover custom data (if/when bugs happen in prod)
