import { Material, Rotation } from 'org.bukkit';
import { Block, BlockFace, Lectern as LecternState } from 'org.bukkit.block';
import { Lectern } from 'org.bukkit.block.data.type';
import { Player } from 'org.bukkit.entity';
import { LecternInventory } from 'org.bukkit.inventory';
import { CustomItem } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import { LOCK_DATA } from '../lock-items';
import { BlockLock, BlockLockProps } from './BlockLock';

const customItems = {
  default: new CustomItem({
    id: 28,
    type: VkItem.HIDDEN,
    data: LOCK_DATA,
  }),
};

export class LecternLock extends BlockLock {
  private static customItems = customItems;
  public static materials = [Material.LECTERN];

  constructor(props: BlockLockProps) {
    props.lockCustomItem = LecternLock.getCustomItem();
    super(props);
  }

  static getCustomItem() {
    return LecternLock.customItems.default;
  }

  static check(block: Block) {
    return block.blockData instanceof Lectern;
  }

  public useBlock(player: Player) {
    const lectern = this.block.state as LecternState;
    const inventory = lectern.inventory as LecternInventory;
    if (inventory.book) {
      player.openInventory(inventory);
    }
  }

  public static getItemFrameRotation(block: Block) {
    const lectern = block.blockData as Lectern;
    return LECTERN_FACING_TO_ROTATION.get(lectern.facing) ?? Rotation.NONE;
  }

  public static getItemFrameFacing() {
    return BlockFace.UP;
  }
}

const LECTERN_FACING_TO_ROTATION = new Map([
  [BlockFace.SOUTH, Rotation.NONE],
  [BlockFace.WEST, Rotation.CLOCKWISE],
  [BlockFace.NORTH, Rotation.FLIPPED],
  [BlockFace.EAST, Rotation.COUNTER_CLOCKWISE],
]);
