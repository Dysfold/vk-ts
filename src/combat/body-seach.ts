import { EntityType, Player } from 'org.bukkit.entity';
import { InventoryCloseEvent, InventoryType } from 'org.bukkit.event.inventory';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { PotionEffectType } from 'org.bukkit.potion';
import { isHandcuffed } from './handcuffs';

const MAX_DISTANCE = 1.6;

const searchedPlayers = new Map<Player, Player>();

// Perform a body search
registerEvent(PlayerInteractEntityEvent, async (event) => {
  const clicked = event.rightClicked;
  if (!clicked) return;
  if (clicked.type !== EntityType.PLAYER) return;

  const clicker = event.player;
  const target = clicked as Player;
  if (!clicker.itemInHand.type.isEmpty()) return;
  if (!clicker.isSneaking()) return;
  if (!canBeBodySeached(target)) return;
  const distance = clicker.location.distance(target.location);
  if (distance > MAX_DISTANCE) return;

  // This is valid method but currently doesn't work without "any"
  (clicker.openInventory as any)(target.inventory);
  searchedPlayers.set(target, clicker);
  target.sendActionBar('Joku tutkii reppuasi');
});

// Remove player from the list after closing the inventory
registerEvent(InventoryCloseEvent, (event) => {
  if (event.inventory.type === InventoryType.PLAYER) {
    const holder = event.inventory.holder as Player;
    if (searchedPlayers.has(holder)) {
      if (event.reason.toString() === 'PLAYER') {
        searchedPlayers.delete(holder);
      }
    }
  }
});

// Check if closing of the inventory is needed
setInterval(() => {
  searchedPlayers.forEach((clicker, target) => {
    if (!target.isOnline() || !clicker.isOnline()) {
      searchedPlayers.delete(target);
    }

    // If players walked too far apart
    const distance = clicker.location.distance(target.location);
    if (distance > MAX_DISTANCE) {
      clicker.sendActionBar('Kohde liian kaukana');
      clicker.closeInventory();
      searchedPlayers.delete(target);
    }
  });
}, 3 * 1000);

function canBeBodySeached(target: Player) {
  if (!isHandcuffed(target)) return false; // Only handcuffed players can be seached
  if (target.isSneaking()) return true;
  if (target.hasPotionEffect(PotionEffectType.SLOW)) return true;
  return false;
}
