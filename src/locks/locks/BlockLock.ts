import { Block } from 'org.bukkit.block';
import { ItemFrame, Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { getLockItemFrame } from './helpers';
import {
  getLockCustomItem,
  LockCustomItem,
  LockDataType,
  getToggledDoorLock,
} from './lock-items';
import { isLockableMaterial } from './lockable-materials';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

export class BlockLock {
  private itemFrame: ItemFrame;
  private lockItem: ItemStack;
  private lockData: LockDataType;
  private lockCustomItem: LockCustomItem;

  private constructor(
    itemFrame: ItemFrame,
    lockItem: ItemStack,
    lockData: LockDataType,
    lockCustomItem: LockCustomItem,
  ) {
    this.itemFrame = itemFrame;
    this.lockItem = lockItem;
    this.lockData = lockData;
    this.lockCustomItem = lockCustomItem;
  }

  static getFrom(block: Block) {
    if (!isLockableMaterial(block.type)) return;

    const frame = getLockItemFrame(block);
    if (!frame) return;

    const itemInFrame = frame.item;
    if (!itemInFrame) return;

    const customItem = getLockCustomItem(itemInFrame);
    if (!customItem) return;

    const data = customItem.get(itemInFrame);
    if (!data) return;

    return new BlockLock(frame, itemInFrame, data, customItem);
  }

  public isLocked() {
    return this.lockData.isLocked === true;
  }

  public getCode() {
    return this.lockData.code;
  }

  public open() {
    const toggledLock = getToggledDoorLock(this.lockItem);
    this.lockData.isLocked = false;
    this.itemFrame.item = toggledLock.create(this.lockData);
  }

  public lock() {
    this.lockData.isLocked = true;
    this.itemFrame.item = this.lockCustomItem.create(this.lockData);
  }

  /**
   * Iteract with opened lock. This will rotate the lock item
   * when clicking unlocked door etc
   */
  public interact() {
    const toggledLock = getToggledDoorLock(this.lockItem);
    this.itemFrame.item = toggledLock.create(this.lockData);
  }
}
