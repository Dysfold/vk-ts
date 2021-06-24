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
   * Get the rotation for the lock item in the item frame.
   * For most blocks this is NONE, but if the lock in top of or below the block,
   * the lock might hava a rotation. -> Trapdoors, Lecterns etc
   */
  public static getItemFrameRotation(block: Block) {
    return Rotation.NONE;
  }

  public static getItemFrameFacing(block: Block) {
    const data = block.blockData;
    if (data instanceof Directional) {
      return data.facing;
    }
    return BlockFace.UP;
  }

  public static getBlockForItemFrame(block: Block) {
    return block;
  }
}
