import { Block } from 'org.bukkit.block';
import { dataHolder } from '../datas/holder';
import { Material } from 'org.bukkit';
import { BlockData } from 'org.bukkit.block.data';
import { BlockBreakEvent } from 'org.bukkit.event.block';

const CUSTOM_DATA_KEY = 'cd';

function purgeCustomData(block: Block) {
  dataHolder(block).delete(CUSTOM_DATA_KEY);
}

/**
 * Sets a Vanilla block. Use create() of your custom block for setting it to
 * world.
 * @param block Block to change.
 * @param type New type.
 * @param data New Vanilla block data.
 */
export function setBlock(block: Block, type: Material, data?: BlockData) {
  purgeCustomData(block); // Delete previous maybe-custom block

  // Replace Vanilla block
  block.setType(type);
  if (data) {
    block.setBlockData(data);
  }
}

// Purge custom data when players break a block
registerEvent(BlockBreakEvent, (event) => purgeCustomData(event.getBlock()));
// TODO explosions?

// TODO cleanup function for purging any leftover custom data (if/when bugs happen in prod)
