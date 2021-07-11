import { Location } from 'org.bukkit';
import { ItemFrame } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { dataType } from '../../../common/datas/holder';
import { dataView } from '../../../common/datas/view';
import { CUSTOM_DATA_KEY } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import { isLockableMaterial } from '../blocklocks/block-lock-list';
import { createLockItem, LOCK_DATA } from '../lock-items';
const lockDataType = dataType(CUSTOM_DATA_KEY, LOCK_DATA);

/**
 * Allow players to destroy floating locks
 */
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (!(event.rightClicked instanceof ItemFrame)) return;

  /**
   * Make sure that we are actually clicking a floating lock
   */
  const item = event.rightClicked.item;
  if (!item) return;
  if (item.type !== VkItem.HIDDEN) return;
  const frame = event.rightClicked;
  const block = getAttachedBlock(frame);
  if (isLockableMaterial(block.type)) return;
  const data = dataView(lockDataType, item);
  if (data.isLocked == undefined) return;

  /**
   * Break the lock
   */
  dropLockItem(frame.location, data.code);
  frame.item.amount = 0;
  frame.remove();
});

function getAttachedBlock(itemFrame: ItemFrame) {
  const facing = itemFrame.attachedFace;
  return itemFrame.location.block.getRelative(facing);
}

function dropLockItem(location: Location, code?: number) {
  const lock = createLockItem(code);
  location.world.dropItemNaturally(location, lock);
}
