import { Bukkit } from 'org.bukkit';
import { ItemFrame } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { getLock } from '../helpers/getLock';
import { isLockableMaterial } from '../blocklocks/block-lock-list';

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

  const lock = getLock(block);
  lock?.useBlock(player);
});
