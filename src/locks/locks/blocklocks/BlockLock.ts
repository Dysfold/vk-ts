/* eslint-disable @typescript-eslint/no-unused-vars */
import { Location, Material, Rotation } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { ItemFrame, Player } from 'org.bukkit.entity';
import { LockCustomItem, LockDataType, LockItem } from '../lock-items';

export interface BlockLockProps {
  itemFrame: ItemFrame;
  lockData: LockDataType;
  lockCustomItem: LockCustomItem;
  block: Block;
}

/**
 * Static methods are helper functions for that particular Lock-class and
 * those can be used globally to get related information about that Lock type.
 *
 * Those static methods can be tought as helpers to create actual instance of this particular lock type.
 * Those can be used for example get position for the itemframe, its facing direction, etc.
 *
 * Those static methods might be refactored later into a dirrerent class.
 * So ChestLock for example might be refactored into "ChestLock" and "ChestLockType"/"ChestLockUtils"/"ChestLockBuilder" etc.
 * But for now those are part of single class, to make adding new locks easier
 */

export abstract class BlockLock {
  protected itemFrame: ItemFrame;
  protected lockData: LockDataType;
  protected lockCustomItem: LockCustomItem;
  protected block: Block;

  public static materials: Material[] = [];

  protected constructor(props: BlockLockProps) {
    this.itemFrame = props.itemFrame;
    this.lockData = props.lockData;
    this.lockCustomItem = props.lockCustomItem;
    this.block = props.block;
  }

  public get location(): Location {
    return this.itemFrame.location;
  }

  public isLocked() {
    return this.lockData.isLocked === true;
  }

  public getCode() {
    return this.lockData.code;
  }

  public open() {
    this.lockData.isLocked = false;
    this.itemFrame.item = this.lockCustomItem.create(this.lockData);
  }

  public lock() {
    this.lockData.isLocked = true;
    this.itemFrame.item = this.lockCustomItem.create(this.lockData);
  }

  public destroy() {
    this.itemFrame.remove();
    const lockItem = LockItem.create({ code: this.getCode() });
    this.location.world.dropItemNaturally(this.location, lockItem);
  }

  /**
   * Update the item in the item frame, if needed
   */
  public update() {
    return;
  }

  /**
   * Check if the given block can have this lock
   * (Or is this the right class for given block type)
   *
   * This is helper to create actual instance of this Lock class
   *
   * @param _block Block to be checked
   */
  static check(_block: Block) {
    return false;
  }

  /**
   * Use the block just like it is supposed to be used. Open the inventory of
   * the chest, toggle a door, etc
   * @param _player Player who is going to interact
   */
  public useBlock(_player: Player) {
    return;
  }

  /**
   * Calculates the item frame rotation for any block in the world,
   * for this particular Lock class. This is helper to create actual instance of this Lock class.
   *
   * Get the rotation for the lock item in the item frame.
   * For most blocks this is NONE, but if the lock in top of or below the block,
   * the lock might hava a rotation. -> Trapdoors, Lecterns etc
   */
  public static getItemFrameRotation(block: Block) {
    return Rotation.NONE;
  }

  /**
   * Get facing for item frame for any block in the world,
   * for this particular Lock class.
   *
   * This is helper to create actual instance of this Lock class
   */
  public static getItemFrameFacing(block: Block) {
    const data = block.blockData;
    if (data instanceof Directional) {
      return data.facing;
    }
    return BlockFace.UP;
  }

  /**
   * Get block for the itemframe to attach to. This can be used for any block in the world,
   * for this particular Lock class. This is helper to create actual instance of this Lock class
   */
  public static getBlockForItemFrame(block: Block) {
    return block;
  }
}
