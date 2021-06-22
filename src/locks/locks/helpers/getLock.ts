import { Block } from 'org.bukkit.block';
import { dataType } from '../../../common/datas/holder';
import { dataView } from '../../../common/datas/view';
import { getItemFrame } from '../../../common/entities/item-frame';
import { CustomItem, CUSTOM_DATA_KEY } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import {
  isLockableMaterial,
  getLockClass,
} from '../blocklocks/block-lock-list';
import { BlockLock, BlockLockProps } from '../blocklocks/BlockLock';
import { LOCK_DATA } from '../lock-items';

const AbstractLock = new CustomItem({
  id: -1,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

export function getLock(block: Block): BlockLock | undefined {
  if (!isLockableMaterial(block.type)) return;

  const itemFrame = getLockItemFrame(block);
  if (!itemFrame) return;

  const itemInFrame = itemFrame.item;
  if (!itemInFrame) return;

  const type = dataType(CUSTOM_DATA_KEY, LOCK_DATA);
  const data = dataView(type, itemInFrame);
  if (!data) return;

  const props: BlockLockProps = {
    itemFrame,
    lockData: data,
    lockCustomItem: AbstractLock,
    block,
  };

  const LockClass = getLockClass(block);
  if (!LockClass) return;
  return new LockClass(props);
}

export function getLockItemFrame(block: Block) {
  const Lock = getLockClass(block);
  if (!Lock) return;
  const attachedBlock = Lock.getBlockForItemFrame(block);
  const frameFacing = Lock.getItemFrameFacing(block);
  const frameRotation = Lock.getItemFrameRotation(block);

  if (frameFacing !== undefined) {
    const frame = getItemFrame(attachedBlock, frameFacing);
    if (frame) frame.rotation = frameRotation;
    return frame;
  }
}
