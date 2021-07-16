import { text } from 'craftjs-plugin/chat';
import { Component } from 'net.kyori.adventure.text';
import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import {
  InventoryClickEvent,
  InventoryCloseEvent,
  InventoryType,
} from 'org.bukkit.event.inventory';
import { PlayerSwapHandItemsEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';

// FIXME: (Warning) This will be cleared on refresh
const openGUIs = new Set<Player>();

export function createGUI(
  player: Player,
  items: Map<number, ItemStack>,
  type?: InventoryType,
) {
  const inv = createInventory(text(' '), type);
  items.forEach((item, index) => {
    inv.setItem(index, item);
  });
  player.openInventory(inv);
  openGUIs.add(player);
}

function createInventory(title: Component, type?: InventoryType) {
  const DEFAULT_GUI_SIZE = 3 * 9;
  return type
    ? Bukkit.createInventory(null, type, title)
    : Bukkit.createInventory(null, DEFAULT_GUI_SIZE, title);
}

registerEvent(InventoryCloseEvent, (event) => {
  if (event.player instanceof Player) {
    openGUIs.delete(event.player);
  }
});

/**
 * Prevent all inventory actions when player has shop GUI open
 */
registerEvent(InventoryClickEvent, (event) => {
  if (!(event.whoClicked instanceof Player)) return;
  if (openGUIs.has(event.whoClicked)) event.setCancelled(true);
});
registerEvent(PlayerSwapHandItemsEvent, (event) => {
  if (openGUIs.has(event.player)) {
    // This will look buggy on the client, but still prevents the action
    // In creative mode this will actually "dupe" the item
    event.setCancelled(true);
    event.player.updateInventory();
  }
});
