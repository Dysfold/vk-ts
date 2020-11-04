import { GameMode, Material } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import {
  EntityDamageByEntityEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';
import { InventoryClickEvent, InventoryType } from 'org.bukkit.event.inventory';
import {
  PlayerDropItemEvent,
  PlayerInteractAtEntityEvent,
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
  PlayerItemHeldEvent,
  PlayerSwapHandItemsEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import * as yup from 'yup';
import { CustomItem } from '../common/items/CustomItem';

const draggedPlayers = new Map<Player, Player>();

const Handcuffs = new CustomItem({
  id: 2,
  name: 'Käsiraudat',
  type: Material.SHULKER_SHELL,
  modelId: 2,
});
const HandcuffsItem = Handcuffs.create();

export const LockedHandcuffs = new CustomItem({
  id: 3,
  name: 'Lukitut käsiraudat',
  type: Material.SHULKER_SHELL,
  modelId: 3,
  data: {
    key: yup.string(),
  },
});

const Key = new CustomItem({
  id: 4,
  name: 'Avain',
  type: Material.SHULKER_SHELL,
  modelId: 4,
});

const MAX_CAPTURE_DISTANCE = 2;
const CAPTURE_HEALTH_TRESHOLD = 4;

// Handcuff a player
Handcuffs.event(
  PlayerInteractEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInHand,
  async (event) => {
    const entity = event.rightClicked;
    if (entity.type !== EntityType.PLAYER) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    const captive = entity as Player;
    const captor = event.player;
    const captiveInventory = captive.inventory as PlayerInventory;
    const captorInventory = captor.inventory as PlayerInventory;
    const handcuffs = captorInventory.itemInHand;

    // Empty both hands
    const offHandItem = captiveInventory.itemInOffHand;
    const mainHandItem = captiveInventory.itemInMainHand;
    if (LockedHandcuffs.check(offHandItem)) return;
    if (!canCapturePlayer(captor, captive)) {
      captor.sendActionBar('Et onnistu kahlitsemaan pelaajaa');
      captive.sendActionBar('Sinua yritettiin kahlita');
      return;
    }
    // Add locked handcuffs to both hands
    handcuffs.amount -= 1;
    const keycode = handcuffs.itemMeta.displayName;
    captiveInventory.itemInOffHand = LockedHandcuffs.create({ key: keycode });
    captiveInventory.itemInMainHand = LockedHandcuffs.create(); // Mainhand handcuffs are only for visuals

    // Give player back the previous items from hands
    giveItem(captive, mainHandItem);
    giveItem(captive, offHandItem);

    captive.sendActionBar('Sinut on kahlittu');
    captor.sendActionBar('Kahlitset pelaajan');
  },
);

function canCapturePlayer(captor: Player, captive: Player) {
  const distance = captive.location.distance(captor.location);
  if (distance > MAX_CAPTURE_DISTANCE) return false;
  if (captive.isSneaking()) return true;
  if (captive.hasPotionEffect(PotionEffectType.SLOW)) return true;
  if (captive.health <= CAPTURE_HEALTH_TRESHOLD) return true;
  return false;
}

// Remove handcuffs from a player
Key.event(
  PlayerInteractEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInHand,
  async (event) => {
    const entity = event.rightClicked;
    if (entity.type !== EntityType.PLAYER) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    const handcuffed = entity as Player;
    const player = event.player;

    if (removeHandcuffs(handcuffed, player)) {
      handcuffed.sendActionBar('Kahleesi avattiin');
      player.sendActionBar('Avaat kahleet');
    }
  },
);

function removeHandcuffs(from: Player, to: Player) {
  const itemInOffHand = (from.inventory as PlayerInventory).itemInOffHand;
  const handcuffs = LockedHandcuffs.get(itemInOffHand);
  if (!handcuffs) return false;

  const inventory = to.inventory as PlayerInventory;
  const key = inventory.itemInHand;
  const keycode = key.itemMeta.displayName;

  if (!(handcuffs?.key === keycode)) return false;

  // Remove Handcuffs
  const openedHandcuffs = Handcuffs.create();
  const meta = openedHandcuffs.itemMeta;
  // TODO: Make used handcuffs stackable with new ones
  //   Data:
  //      display: {Name: '{"extra":[{"text":"Käsiraudat"}],"text":""}'}}
  //      display: {Name: '{"text":"Käsiraudat"}'}
  meta.displayName = keycode;
  openedHandcuffs.itemMeta = meta;
  giveItem(to, openedHandcuffs);
  (from.inventory as PlayerInventory).itemInOffHand.amount = 0;
  (from.inventory as PlayerInventory).itemInMainHand.amount = 0;
  return true;
}

// Drop unnamed handcuffs when handcuffed player dies
registerEvent(PlayerDeathEvent, (event) => {
  if (event.entity.type !== EntityType.PLAYER) return;
  const player = event.entity as Player;
  const offHandItem = (player.inventory as PlayerInventory).itemInOffHand;
  const mainHandItem = (player.inventory as PlayerInventory).itemInMainHand;
  // If the player was dragged
  draggedPlayers.delete(player);

  if (LockedHandcuffs.check(offHandItem)) {
    if (event.drops.remove(offHandItem)) {
      player.world.dropItem(player.location, HandcuffsItem);
    }
  }
  if (LockedHandcuffs.check(mainHandItem)) {
    event.drops.remove(mainHandItem);
  }
});

// Lock handcuffs in the inventory
LockedHandcuffs.event(
  InventoryClickEvent,
  (event) => event.currentItem,
  async (event) => {
    const inv = event.inventory;
    if (inv.type !== InventoryType.CRAFTING) return;
    if (event.whoClicked.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Lock handcuffs in the inventory ("F"-key)
LockedHandcuffs.event(
  PlayerSwapHandItemsEvent,
  (event) => event.mainHandItem,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Lock handcuffs in the inventory (dropping)
LockedHandcuffs.event(
  PlayerDropItemEvent,
  (event) => event.itemDrop.itemStack,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Lock handcuffs in the mainhand
LockedHandcuffs.event(
  PlayerItemHeldEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking
LockedHandcuffs.event(
  PlayerInteractEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from attacking
LockedHandcuffs.event(
  EntityDamageByEntityEvent,
  (event) =>
    ((event.damager as Player).inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    (event.damager as Player).sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking armorstands
LockedHandcuffs.event(
  PlayerInteractAtEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking entities
LockedHandcuffs.event(
  PlayerInteractEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

function giveItem(player: Player, item: ItemStack) {
  if (item.type === Material.AIR) return;
  const leftOver = player.inventory.addItem(item);
  if (leftOver.size()) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}

// Drag handcuffed player
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (event.hand !== EquipmentSlot.HAND) return;
  if (event.rightClicked.type !== EntityType.PLAYER) return;
  const dragged = event.rightClicked as Player;
  const player = event.player;

  if (player.itemInHand.type !== Material.AIR) return;
  const offHandItem = (dragged.inventory as PlayerInventory).itemInOffHand;
  if (!LockedHandcuffs.check(offHandItem)) return;
  if (player.location.distance(dragged.location) > 2) return;
  if (draggedPlayers.has(dragged)) {
    // Stop dragging
    const dragger = draggedPlayers.get(dragged);
    if (dragger) {
      draggedPlayers.delete(dragged);
      player.sendActionBar('Lopetat pelaajan raahaamisen');
      dragged.sendActionBar('Sinua ei enää raahata');
    }
    return;
  }
  // Start dragging
  draggedPlayers.set(dragged, player);

  player.sendActionBar('Alat raahaamaan pelaajaa');
  dragged.sendActionBar('Sinua raahataan');
  event.setCancelled(true);
});

// Move dragged players
const JUMP = new PotionEffect(PotionEffectType.JUMP, 60, 200);
setInterval(() => {
  for (const pair of draggedPlayers) {
    const dragged = pair[0];
    const dragger = pair[1];
    if (!dragged.isOnline()) {
      draggedPlayers.delete(dragged);
    }
    const draggerLoc = dragger.location;
    const draggedLoc = dragged.location;
    const distanceSquared = draggerLoc.distanceSquared(draggedLoc); // Squared is more lightweight
    if (distanceSquared < 1.5 * 1.5) return;

    if (distanceSquared < 10 * 10) {
      // Teleport player to same height, (if the dragger goes up)
      const yDifference = draggerLoc.y - draggedLoc.y;
      if (yDifference > 0) {
        draggedLoc.y += yDifference;
        dragged.teleport(draggedLoc);
      }

      // Push player to towards the dragger
      const push = dragger.location
        .toVector()
        .subtract(draggedLoc.toVector())
        .multiply(0.4);
      dragged.velocity = push;
    } else {
      // Players were too far apart -> free the player
      draggedPlayers.delete(dragged);
      dragged.sendActionBar('Irtoat raahauksesta');
      dragger.sendActionBar('Menetät otteesi raahatusta pelaajasta');
      return;
    }
    dragged.addPotionEffect(JUMP);
  }
}, 600);
