import { LockItem, getLockItem } from './lock-items';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { spawnHiddenItemFrame } from '../../common/entities/item-frame';
import { Block } from 'org.bukkit.block';
import { Door } from 'org.bukkit.block.data.type';

LockItem.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const block = event.clickedBlock;
    if (!block) return;

    const frameCustomItem = getLockItem(block);
    if (!frameCustomItem) return;

    event.setCancelled(true);
    // block.world.dropItem(event.player.location, frameLock.create({}));
    const frameLock = frameCustomItem.create({});

    const frameFacing = getLockFrameFacing(block);
    if (!frameFacing) return;
    const itemframe = spawnHiddenItemFrame(block, frameFacing, frameLock);
  },
);

function getLockFrameFacing(block: Block) {
  const data = block.blockData;

  if (data instanceof Door) {
    return data.facing.oppositeFace;
  }
  return undefined;
}
