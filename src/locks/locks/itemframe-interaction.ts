import { Bukkit } from 'org.bukkit';
import { Block, Chest, Lectern } from 'org.bukkit.block';
import { Openable } from 'org.bukkit.block.data';
import { ItemFrame } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { LecternInventory } from 'org.bukkit.inventory';
import { isLockableMaterial } from './lockable-materials';

/**
 * Allow players to interact with locked blocks by clicking the item frame
 */
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (!(event.rightClicked instanceof ItemFrame)) return;
  const frame = event.rightClicked;
  const block = frame.location.block.getRelative(frame.attachedFace);
  const player = event.player;
  if (!isLockableMaterial(block.type)) return;

  const interactEvent = new PlayerInteractEvent(
    player,
    Action.RIGHT_CLICK_BLOCK,
    player.inventory.itemInMainHand,
    block,
    frame.facing,
    event.hand,
  );
  Bukkit.server.pluginManager.callEvent(interactEvent);
  if (interactEvent.isCancelled()) return;

  if (block.blockData instanceof Openable) {
    toggleOpenable(block);
  }

  if (block.state instanceof Chest) {
    player.openInventory(block.state.inventory);
  }

  if (block.state instanceof Lectern) {
    if (hasBookInLectern(block.state)) {
      player.openInventory(block.state.inventory);
    }
  }
});

function toggleOpenable(block: Block) {
  const openable = block.blockData as Openable;
  openable.setOpen(!openable.isOpen());
  block.blockData = openable;
}

function hasBookInLectern(lectern: Lectern) {
  return (lectern.inventory as LecternInventory).book !== null;
}
