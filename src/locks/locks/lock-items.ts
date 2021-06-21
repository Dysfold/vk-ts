import { translate } from 'craftjs-plugin/chat';
import { Material } from 'org.bukkit';
import { Block, Chest } from 'org.bukkit.block';
import { Door, TrapDoor } from 'org.bukkit.block.data.type';
import { Hinge } from 'org.bukkit.block.data.type.Door';
import { ItemStack, DoubleChestInventory } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { CustomItem } from '../../common/items/CustomItem';
import { VkItem } from '../../common/items/VkItem';
import { ItemFrame } from 'org.bukkit.entity';
import { Data } from '../../common/datas/yup-utils';

const LOCK_DATA = {
  code: yup.number().notRequired(),
  isLocked: yup.boolean(),
  created: yup.number(),
};

export type LockDataType = Data<typeof LOCK_DATA>;

export interface LockInfo {
  customItem: typeof ClosedLeftDoorLock;
  itemStack: ItemStack;
  itemFrame: ItemFrame;
  data: LockDataType;
}

export type LockCustomItem00000 = typeof ClosedLeftDoorLock;
export type LockCustomItem = CustomItem<typeof LOCK_DATA>;

/**
 * Obtainable lock item. Used to place locks on blocks
 */
export const LockItem = new CustomItem({
  id: 3,
  type: VkItem.MISC,
  data: LOCK_DATA,
  name: translate('vk.lock'),
});

/***********************************************************
 * Locks used in ItemFrames. These should not be obtainable
 ***********************************************************/

/**
 * Doors
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

/**
 * Chests
 */
const DoubleChestLock = new CustomItem({
  id: 27,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const SingleChestLock = new CustomItem({
  id: 26,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

/**
 * Trapdoors
 */
const ClosedTrapdoorLock = new CustomItem({
  id: 24,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const OpenedTrapdoorLock = new CustomItem({
  id: 25,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const LecternLock = new CustomItem({
  id: 28,
  type: VkItem.HIDDEN,
  data: LOCK_DATA,
});

const TOGGLED_LOCK_PAIRS = new Map([
  // Doors
  [ClosedLeftDoorLock.ordinal, OpenedLeftDoorLock],
  [ClosedRightDoorLock.ordinal, OpenedRightDoorLock],
  [OpenedLeftDoorLock.ordinal, ClosedLeftDoorLock],
  [OpenedRightDoorLock.ordinal, ClosedRightDoorLock],

  // Trapdoors
  [ClosedTrapdoorLock.ordinal, OpenedTrapdoorLock],
  [OpenedTrapdoorLock.ordinal, ClosedTrapdoorLock],
]);

const ITEM_FRAME_LOCKS = [
  // Doors
  ClosedLeftDoorLock,
  ClosedRightDoorLock,
  OpenedLeftDoorLock,
  OpenedRightDoorLock,

  // Chests
  DoubleChestLock,
  SingleChestLock,

  // Trapdoors
  ClosedTrapdoorLock,
  OpenedTrapdoorLock,

  // Lectern
  LecternLock,
];

const LOCKABLE_DOORS = new Set([
  Material.OAK_DOOR,
  Material.DARK_OAK_DOOR,
  Material.BIRCH_DOOR,
  Material.JUNGLE_DOOR,
  Material.SPRUCE_DOOR,
  Material.ACACIA_DOOR,
  // TODO: Stone doors?
]);

function isLockableDoor(type: Material) {
  return LOCKABLE_DOORS.has(type);
}

/**
 * Get the lock item for a ItemFrame.
 * This item is only used in ItemFrames and can't be kept in inventory
 * @param lockedBlock Block where the lock should be attached (Door, Chest etc)
 */
export function getLockItem(lockedBlock: Block) {
  const type = lockedBlock.type;
  const blockData = lockedBlock.blockData;
  const blockState = lockedBlock.state;

  if (isLockableDoor(type)) {
    const door = blockData as Door;
    return getDoorLockItem(door);
  }

  if (blockState instanceof Chest) {
    if (blockState.inventory instanceof DoubleChestInventory) {
      return DoubleChestLock;
    }
    return SingleChestLock;
  }

  if (blockData instanceof TrapDoor) {
    if (blockData.isOpen()) return OpenedTrapdoorLock;
    return ClosedTrapdoorLock;
  }

  if (type == Material.LECTERN) {
    return LecternLock;
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

export function getLockCustomItem(item: ItemStack) {
  for (const customItem of ITEM_FRAME_LOCKS) {
    if (customItem.check(item)) {
      return customItem;
    }
  }
}

export function getToggledLock(item: LockCustomItem) {
  return TOGGLED_LOCK_PAIRS.get(item.ordinal);
}
