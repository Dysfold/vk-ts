import { Block, Chest as ChestState } from 'org.bukkit.block';
import { Chest } from 'org.bukkit.block.data.type';
import { Type } from 'org.bukkit.block.data.type.Chest';
import { Player } from 'org.bukkit.entity';
import { CustomItem } from '../../../common/items/CustomItem';
import { VkItem } from '../../../common/items/VkItem';
import { LOCK_DATA } from '../lock-items';
import { BlockLock, BlockLockProps } from './BlockLock';
import { DoubleChestInventory } from 'org.bukkit.inventory';
import { Material } from 'org.bukkit';

const customItems = {
  single: new CustomItem({
    id: 26,
    type: VkItem.HIDDEN,
    data: LOCK_DATA,
  }),
  double: new CustomItem({
    id: 27,
    type: VkItem.HIDDEN,
    data: LOCK_DATA,
  }),
};

export class ChestLock extends BlockLock {
  private static customItems = customItems;
  public static materials = [Material.CHEST, Material.TRAPPED_CHEST];

  constructor(props: BlockLockProps) {
    props.lockCustomItem = ChestLock.getCustomItem(props.block);
    super(props);
  }

  public async update() {
    await wait(1, 'millis'); // Wait for the blockData update
    const customItem = ChestLock.getCustomItem(this.block);
    this.itemFrame.item = customItem.create(this.lockData);
  }

  static getCustomItem(block: Block) {
    const chest = block.blockData as Chest;
    if (chest.type == Type.SINGLE) {
      return ChestLock.customItems.single;
    }
    return ChestLock.customItems.double;
  }

  static check(block: Block) {
    return block.blockData instanceof Chest;
  }

  public useBlock(player: Player) {
    player.openInventory((this.block.state as ChestState).inventory);
  }

  public static getBlockForItemFrame(block: Block) {
    function getChestRightSide(state: ChestState) {
      if (state.inventory instanceof DoubleChestInventory) {
        if (state.inventory.rightSide) {
          const location = state.inventory.rightSide.location;
          if (location) return location.block;
        }
      }
    }

    const state = block.state as ChestState;
    const righSide = getChestRightSide(state);
    if (righSide) return righSide;
    return block;
  }
}
