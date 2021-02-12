import { GameMode, Material } from 'org.bukkit';
import {
  InventoryClickEvent,
  InventoryPickupItemEvent,
} from 'org.bukkit.event.inventory';
import { PlayerAttemptPickupItemEvent } from 'org.bukkit.event.player';

/* 
Prevent players from getting heart of the sea -items 
because they are reserved for hidden or forbidden items.
*/

export const HIDDEN_MATERIAL = Material.HEART_OF_THE_SEA;

registerEvent(PlayerAttemptPickupItemEvent, (event) => {
  if (event.item.itemStack.type !== HIDDEN_MATERIAL) return;
  event.setCancelled(true);
});

// Delete the item if hopper picks it up
registerEvent(InventoryPickupItemEvent, (event) => {
  if (event.item.itemStack.type !== HIDDEN_MATERIAL) return;
  event.item.itemStack.amount = 0;
});

// Delete the item if player clicks it in inventory
registerEvent(InventoryClickEvent, (event) => {
  if (event.whoClicked.gameMode === GameMode.CREATIVE) return;
  if (event.cursor?.type === HIDDEN_MATERIAL) event.cursor = null;
  if (event.currentItem?.type === HIDDEN_MATERIAL) event.currentItem = null;
});
