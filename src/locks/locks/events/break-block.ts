import { Block, BlockFace } from 'org.bukkit.block';
import { Door } from 'org.bukkit.block.data.type';
import {
  BlockBreakEvent,
  BlockPistonExtendEvent,
  BlockPistonRetractEvent,
} from 'org.bukkit.event.block';
import { isLockableMaterial } from '../blocklocks/block-lock-list';
import { getLock } from '../helpers/getLock';

registerEvent(BlockBreakEvent, (event) => {
  const block = event.block;
  if (!isLockableMaterial(block.type)) return;
  const lock = getLock(block);
  if (!lock) return;

  if (lock.isLocked()) {
    event.setCancelled(true);
    return;
  }

  lock.destroy();
});

registerEvent(BlockPistonExtendEvent, (event) => {
  preventPistonBreakLock(event);
});

registerEvent(BlockPistonRetractEvent, (event) => {
  preventPistonBreakLock(event);
});

function preventPistonBreakLock(
  event: BlockPistonExtendEvent | BlockPistonRetractEvent,
) {
  event.blocks.forEach((block) => {
    const lock = getLock(block);
    if (lock?.isLocked()) {
      event.setCancelled(true);
    }
    checkForLockedDoor(block, event);
  });
}

function checkForLockedDoor(
  block: Block,
  event: BlockPistonExtendEvent | BlockPistonRetractEvent,
) {
  const blockOnTop = block.getRelative(BlockFace.UP);
  if (blockOnTop.blockData instanceof Door) {
    const doorLock = getLock(blockOnTop);
    if (doorLock?.isLocked()) {
      event.setCancelled(true);
    }
  }
}
