import { CustomItem } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';
import { Block } from 'org.bukkit.block';
import { Material } from 'org.bukkit';
import { Door } from 'org.bukkit.block.data.type';
import { Hinge } from 'org.bukkit.block.data.type.Door';
import * as yup from 'yup';
import { translate } from 'craftjs-plugin/chat';

const LOCK_DATA = {
  code: yup.number().notRequired(),
};

/**
 * Obtainable lock item. Used to place locks on blocks
 */
export const LockItem = new CustomItem({
  id: 3,
  type: VkItem.MISC,
  data: LOCK_DATA,
  name: translate('vk.lock'),
});

/**
 * Locks used in ItemFrames. These should not be obtainable
 */

const ClosedLeftDoorLock = new CustomItem({
  id: 20,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const ClosedRightDoorLock = new CustomItem({
  id: 21,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const OpenedLeftDoorLock = new CustomItem({
  id: 22,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const OpenedRightDoorLock = new CustomItem({
  id: 23,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const DOORS = new Set([
  Material.OAK_DOOR,
  Material.DARK_OAK_DOOR,
  Material.BIRCH_DOOR,
  Material.JUNGLE_DOOR,
  Material.SPRUCE_DOOR,
  Material.ACACIA_DOOR,
  // TODO: Stone doors?
]);
function isDoor(type: Material) {
  return DOORS.has(type);
}

/**
 * Get the lock item for a ItemFrame.
 * This item is only used in ItemFrames and can't be kept in inventory
 * @param lockedBlock Block where the lock should be attached (Door, Chest etc)
 */
export function getLockItem(lockedBlock: Block) {
  const type = lockedBlock.type;

  if (isDoor(type)) {
    const door = lockedBlock.blockData as Door;
    return getDoorLockItem(door);
  }
  return undefined;
}

function getDoorLockItem(door: Door) {
  // Door with hinge on left
  if (door.hinge == Hinge.LEFT) {
    if (door.isOpen()) {
      return OpenedLeftDoorLock;
    } else {
      return ClosedLeftDoorLock;
    }
  }
  if (door.hinge == Hinge.RIGHT) {
    if (door.isOpen()) {
      return OpenedRightDoorLock;
    } else {
      return ClosedRightDoorLock;
    }
  }
}
