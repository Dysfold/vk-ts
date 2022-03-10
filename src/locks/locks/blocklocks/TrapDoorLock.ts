import { Material, Rotation } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import { TrapDoor } from 'org.bukkit.block.data.type';
import { CustomItem } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import { VkMaterial } from '../../../common/items/VkMaterial';
import { LOCK_DATA } from '../lock-items';
import { BlockLock, BlockLockProps } from './BlockLock';

const customItems = {
  closed: new CustomItem({
    id: 24,
    type: VkItem.HIDDEN,
    data: LOCK_DATA,
  }),
  opened: new CustomItem({
    id: 25,
    type: VkItem.HIDDEN,
    data: LOCK_DATA,
  }),
};

export class TrapDoorLock extends BlockLock {
  private static customItems = customItems;
  public static materials = [
    Material.OAK_TRAPDOOR,
    Material.SPRUCE_TRAPDOOR,
    Material.BIRCH_TRAPDOOR,
    Material.JUNGLE_TRAPDOOR,
    VkMaterial.WILLOW_TRAPDOOR,
    Material.DARK_OAK_TRAPDOOR,
  ];

  constructor(props: BlockLockProps) {
    props.lockCustomItem = TrapDoorLock.getCustomItem(props.block);
    super(props);
  }

  public async update() {
    await wait(1, 'millis'); // Wait for the blockData update
    const customItem = TrapDoorLock.getCustomItem(this.block);
    this.itemFrame.item = customItem.create(this.lockData);
  }

  static getCustomItem(block: Block) {
    const trapDoor = block.blockData as TrapDoor;
    if (trapDoor.isOpen()) {
      return TrapDoorLock.customItems.opened;
    }
    return TrapDoorLock.customItems.closed;
  }

  static check(block: Block) {
    return block.blockData instanceof TrapDoor;
  }

  public useBlock() {
    const openable = this.block.blockData as TrapDoor;
    openable.setOpen(!openable.isOpen());
    this.block.blockData = openable;
  }

  public static getItemFrameRotation(block: Block) {
    const data = block.blockData as TrapDoor;
    if (data.half == Half.TOP) {
      return TOP_TRAPDOOR_FACING_TO_ROTATION.get(data.facing) ?? Rotation.NONE;
    }
    return BOTTOM_TRAPDOOR_FACING_TO_ROTATION.get(data.facing) ?? Rotation.NONE;
  }

  public static getItemFrameFacing(block: Block) {
    const data = block.blockData as TrapDoor;
    if (data.half == Half.TOP) return BlockFace.UP;
    return BlockFace.DOWN;
  }
}

const TOP_TRAPDOOR_FACING_TO_ROTATION = new Map([
  [BlockFace.SOUTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.NORTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);

const BOTTOM_TRAPDOOR_FACING_TO_ROTATION = new Map([
  [BlockFace.NORTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.SOUTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);
