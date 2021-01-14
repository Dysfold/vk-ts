import { Bukkit, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { HangingBreakEvent } from 'org.bukkit.event.hanging';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { PlayerInventory } from 'org.bukkit.inventory';

// Remove drop from invisible item frames
// and remove the item, if it was hidden item (heart of the sea)
registerEvent(HangingBreakEvent, (event) => {
  if (event.entity.type !== EntityType.ITEM_FRAME) return;
  const frame = event.entity as ItemFrame;
  if (frame.isVisible()) return;

  const item = frame.item;
  if (item && item.type !== Material.HEART_OF_THE_SEA) {
    // Drop the item, if it wasn't a hidden item (Heart of the sea)
    event.entity.world.dropItem(event.entity.location, item);
  }

  // The entity was invisible item frame
  event.entity.remove();
});

registerEvent(PlayerInteractEntityEvent, (event) => {
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  const frame = entity as ItemFrame;
  if (frame.isVisible()) return;

  // The entity was invisible item frame

  const item = frame.item;
  if (item && item.type !== Material.HEART_OF_THE_SEA) return;

  // The item was hidden item (heart of the sea)
  event.setCancelled(true);

  // Call a click event for the block behind the itemframe
  const attachedFace = frame.attachedFace as BlockFace;
  const who = event.player;
  const action = Action.RIGHT_CLICK_BLOCK;
  const itemInHand = (event.player.inventory as PlayerInventory).itemInMainHand;
  const clickedBlock = entity.location.block.getRelative(attachedFace);
  const clickedFace = attachedFace.oppositeFace;
  const playerInteractEvent = new PlayerInteractEvent(
    who,
    action,
    itemInHand,
    clickedBlock,
    clickedFace,
  );
  Bukkit.server.pluginManager.callEvent(playerInteractEvent);
});

// Only allow players to break itemframe items
registerEvent(EntityDamageByEntityEvent, (event) => {
  const entity = event.entity;
  if (entity.type !== EntityType.ITEM_FRAME) return;
  if (event.damager.type === EntityType.PLAYER) return;
  event.setCancelled(true);
});
