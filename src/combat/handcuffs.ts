import { translate } from 'craftjs-plugin/chat';
import { GameMode, Material } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import {
  EntityDamageByEntityEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';
import { InventoryClickEvent } from 'org.bukkit.event.inventory';
import {
  PlayerDropItemEvent,
  PlayerInteractAtEntityEvent,
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
  PlayerItemHeldEvent,
  PlayerSwapHandItemsEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import * as yup from 'yup';
import { equippedItem, giveItem } from '../common/helpers/inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { Key } from '../locks/key';

const draggedPlayers = new Map<
  Player /* Who is being dragged */,
  Player /* Who is dragging */
>();

/**
 * @param dragged Player who is currently being dragged
 */
export function stopDragging(dragged: Player) {
  draggedPlayers.delete(dragged);
}

export const Handcuffs = new CustomItem({
  id: 11,
  name: translate('vk.handcuffs'),
  type: VkItem.UNSTACKABLE,
});
const HandcuffsItem = Handcuffs.create({});

export const LockedHandcuffs = new CustomItem({
  id: 12,
  name: translate('vk.handcuffs_locked'),
  type: VkItem.UNSTACKABLE,
  data: {
    key: yup.string(),
  },
});

const MAX_CAPTURE_DISTANCE = 2;
const CAPTURE_HEALTH_TRESHOLD = 4;

export function isHandcuffed(player: Player) {
  return LockedHandcuffs.check(player.inventory.itemInOffHand);
}

// Handcuff a player
Handcuffs.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInHand,
  async (event) => {
    const entity = event.rightClicked;
    if (entity.type !== EntityType.PLAYER) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    const captive = (entity as unknown) as Player;
    if (isHandcuffed(captive)) return;
    const captor = event.player;
    const captiveInventory = captive.inventory;
    const captorInventory = captor.inventory;
    const handcuffs = captorInventory.itemInHand;

    // Empty both hands
    const offHandItem = captiveInventory.itemInOffHand;
    const mainHandItem = captiveInventory.itemInMainHand;
    if (!canCapturePlayer(captor, captive)) {
      captor.sendActionBar('Et onnistu kahlitsemaan pelaajaa');
      captive.sendActionBar('Sinua yritettiin kahlita');
      return;
    }
    // Add locked handcuffs to both hands
    const keycode = handcuffs.itemMeta.displayName;
    captiveInventory.itemInOffHand = LockedHandcuffs.create({ key: keycode });
    captiveInventory.itemInMainHand = LockedHandcuffs.create({}); // Mainhand handcuffs are only for visuals
    handcuffs.amount -= 1;

    // Give player back the previous items from hands
    giveItem(captive, mainHandItem);
    giveItem(captive, offHandItem);

    captive.sendActionBar('Sinut on kahlittu');
    captor.sendActionBar('Kahlitset pelaajan');
    captive.world.playSound(captive.location, 'custom.lock', 1, 1);
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
  (event) => event.player.inventory.itemInHand,
  async (event) => {
    const entity = event.rightClicked;
    if (entity.type !== EntityType.PLAYER) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    const handcuffed = (entity as unknown) as Player;
    const player = event.player;

    if (removeHandcuffs(handcuffed, player)) {
      handcuffed.sendActionBar('Kahleesi avattiin');
      player.sendActionBar('Avaat kahleet');
      handcuffed.world.playSound(handcuffed.location, 'custom.lock', 1, 1);
    }
  },
);

function removeHandcuffs(from: Player, to: Player) {
  const itemInOffHand = from.inventory.itemInOffHand;
  const handcuffs = LockedHandcuffs.get(itemInOffHand);
  if (!handcuffs) return false;

  const inventory = to.inventory;
  const key = inventory.itemInHand;
  const keycode = key.itemMeta.displayName;

  if (!(handcuffs?.key === keycode)) return false;

  // Remove Handcuffs
  const openedHandcuffs = Handcuffs.create({});
  const meta = openedHandcuffs.itemMeta;
  // TODO: Make used handcuffs stackable with new ones
  //   Data:
  //      display: {Name: '{"extra":[{"text":"Käsiraudat"}],"text":""}'}}
  //      display: {Name: '{"text":"Käsiraudat"}'}
  meta.displayName = keycode;
  openedHandcuffs.itemMeta = meta;
  giveItem(to, openedHandcuffs);
  from.inventory.itemInOffHand.amount = 0;
  from.inventory.itemInMainHand.amount = 0;
  return true;
}

// Drop unnamed handcuffs when handcuffed player dies
registerEvent(PlayerDeathEvent, (event) => {
  if (event.entity.type !== EntityType.PLAYER) return;
  const player = event.entity as Player;
  const offHandItem = player.inventory.itemInOffHand;
  const mainHandItem = player.inventory.itemInMainHand;
  // If the player was dragged
  draggedPlayers.delete(player);

  if (LockedHandcuffs.check(offHandItem)) {
    if (event.drops.removeValue(offHandItem)) {
      const drop = player.world.dropItem(player.location, HandcuffsItem);
      drop.setInvulnerable(true);
    }
  }
  if (LockedHandcuffs.check(mainHandItem)) {
    event.drops.removeValue(mainHandItem);
  }
});

// This should prevent all inventory click actions
LockedHandcuffs.event(
  InventoryClickEvent,
  (event) => event.whoClicked.inventory.itemInOffHand,
  async (event) => {
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
  (event) => event.player.inventory.itemInOffHand,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking
LockedHandcuffs.event(
  PlayerInteractEvent,
  (event) => event.player.inventory.itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from attacking
LockedHandcuffs.event(
  EntityDamageByEntityEvent,
  (event) => equippedItem(event.damager, EquipmentSlot.OFF_HAND),
  async (event) => {
    ((event.damager as unknown) as Player).sendActionBar(
      'Et voi tehdä näin kahlittuna',
    );
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking armorstands
LockedHandcuffs.event(
  PlayerInteractAtEntityEvent,
  (event) => event.player.inventory.itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from clicking entities
LockedHandcuffs.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Drag handcuffed player
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (event.hand !== EquipmentSlot.HAND) return;
  if (event.rightClicked.type !== EntityType.PLAYER) return;
  const dragged = (event.rightClicked as unknown) as Player;
  const player = event.player;

  // If player is sneaking, he is trying to open the inventory of the target
  if (player.isSneaking()) return;

  if (player.itemInHand.type !== Material.AIR) return;
  if (!isHandcuffed(dragged)) return;
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
      continue;
    }
    if (!isHandcuffed(dragged)) {
      draggedPlayers.delete(dragged);
      continue;
    }

    const draggerLoc = dragger.location;
    const draggedLoc = dragged.location;
    const distanceSquared = draggerLoc.distanceSquared(draggedLoc); // Squared is more lightweight
    if (distanceSquared < 1.5 * 1.5) continue;

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
      continue;
    }
    dragged.addPotionEffect(JUMP);
  }
}, 400);
