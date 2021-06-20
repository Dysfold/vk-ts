import { Bukkit } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Openable } from 'org.bukkit.block.data';
import { ItemFrame, Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { InventoryHolder } from 'org.bukkit.inventory';
import { isLockableMaterial } from './lockable-materials';

/**
 * Allow players to interact with locked blocks by clicking the item frame
 */
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (!(event.rightClicked instanceof ItemFrame)) return;
  const frame = event.rightClicked;
  const block = frame.location.block.getRelative(frame.attachedFace);
  if (!isLockableMaterial(block.type)) return;

  const interactEvent = new PlayerInteractEvent(
    event.player,
    Action.RIGHT_CLICK_BLOCK,
    event.player.inventory.itemInMainHand,
    block,
    frame.facing,
    event.hand,
  );
  Bukkit.server.pluginManager.callEvent(interactEvent);
  if (interactEvent.isCancelled()) return;

  if (block.blockData instanceof Openable) {
    openOpenable(block);
  }

  if (block.state instanceof InventoryHolder) {
    openBlockInventory(event.player, block);
  }
});

function openOpenable(block: Block) {
  const openable = block.blockData as Openable;
  openable.setOpen(!openable.isOpen());
  block.blockData = openable;
}

function openBlockInventory(player: Player, block: Block) {
  const holder = (block.state as unknown) as InventoryHolder;
  player.openInventory(holder.inventory);
}
