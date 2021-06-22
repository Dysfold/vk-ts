import { Material } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Half } from 'org.bukkit.block.data.Bisected';
import { Door } from 'org.bukkit.block.data.type';
import { Hinge } from 'org.bukkit.block.data.type.Door';
import { CustomItem } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import { LOCK_DATA } from '../lock-items';
import { BlockLock, BlockLockProps } from './BlockLock';

const customItems = {
  left: {
    opened: new CustomItem({
      id: 22,
      type: VkItem.HIDDEN,
      data: LOCK_DATA,
    }),
    closed: new CustomItem({
      id: 20,
      type: VkItem.HIDDEN,
      data: LOCK_DATA,
    }),
  },
  right: {
    opened: new CustomItem({
      id: 23,
      type: VkItem.HIDDEN,
      data: LOCK_DATA,
    }),
    closed: new CustomItem({
      id: 21,
      type: VkItem.HIDDEN,
      data: LOCK_DATA,
    }),
  },
};

export class DoorLock extends BlockLock {
  private static customItems = customItems;
  public static materials = [
    Material.OAK_DOOR,
    Material.SPRUCE_DOOR,
    Material.BIRCH_DOOR,
    Material.JUNGLE_DOOR,
    Material.ACACIA_DOOR,
    Material.DARK_OAK_DOOR,
  ];

  constructor(props: BlockLockProps) {
    props.lockCustomItem = DoorLock.getCustomItem(props.block);
    super(props);
  }

  public async update() {
    await wait(1, 'millis'); // Wait for the blockData update
    const customItem = DoorLock.getCustomItem(this.block);
    this.itemFrame.item = customItem.create(this.lockData);
  }

  static getCustomItem(block: Block) {
    const door = block.blockData as Door;
    if (door.hinge == Hinge.LEFT) {
      if (door.isOpen()) {
        return DoorLock.customItems.left.opened;
      }
      return DoorLock.customItems.left.closed;
    }
    if (door.hinge == Hinge.RIGHT) {
      if (door.isOpen()) {
        return DoorLock.customItems.right.opened;
      }
    }
    return DoorLock.customItems.right.closed;
  }

  static check(block: Block) {
    return block.blockData instanceof Door;
  }

  public useBlock() {
    const openable = this.block.blockData as Door;
    openable.setOpen(!openable.isOpen());
    this.block.blockData = openable;
  }

  public static getItemFrameFacing(block: Block) {
    const data = block.blockData as Door;
    return data.facing.oppositeFace;
  }

  public static getBlockForItemFrame(block: Block) {
    const data = block.blockData as Door;
    if (data.half == Half.BOTTOM) return block;
    return block.getRelative(BlockFace.DOWN);
  }
}
