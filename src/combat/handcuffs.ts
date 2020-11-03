import { GameMode, Material } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import { InventoryClickEvent, InventoryType } from 'org.bukkit.event.inventory';
import {
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
import { CustomItem } from '../common/items/CustomItem';
import * as yup from 'yup';
import {
  EntityDamageByEntityEvent,
  ItemSpawnEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';

const Handcuffs = new CustomItem({
  id: 2,
  name: 'Käsiraudat',
  type: Material.SHULKER_SHELL,
  modelId: 2,
});
const HandcuffsItem = Handcuffs.create();

const LockedHandcuffs = new CustomItem({
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

    // Add locked handcuffs to both hands
    handcuffs.amount -= 1;
    const keycode = handcuffs.itemMeta.displayName;
    captiveInventory.itemInOffHand = LockedHandcuffs.create({ key: keycode });
    captiveInventory.itemInMainHand = LockedHandcuffs.create(); // Mainhand handcuffs are only for visuals

    // Give player back the previous items from hands
    giveItem(captive, offHandItem);
    giveItem(captive, mainHandItem);

    captive.sendActionBar('Sinut on kahlittu');
    captor.sendActionBar('Kahlitset pelaajan');
  },
);

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

  if (LockedHandcuffs.check(offHandItem)) {
    if (event.drops.remove(offHandItem)) {
      player.world.dropItem(player.location, HandcuffsItem);
    }
  }
  if (LockedHandcuffs.check(mainHandItem)) {
    event.drops.remove(mainHandItem);
  }
});

// Lock Handcuffs in the inventory
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

// Lock Handcuffs in the inventory ("F"-key)
LockedHandcuffs.event(
  PlayerSwapHandItemsEvent,
  (event) => event.mainHandItem,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Lock Handcuffs in the inventory ("F"-key)
LockedHandcuffs.event(
  PlayerSwapHandItemsEvent,
  (event) => event.mainHandItem,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Lock Handcuffs in the inventory ("F"-key)
LockedHandcuffs.event(
  PlayerItemHeldEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    if (event.player.gameMode === GameMode.CREATIVE) return;
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from interacting
LockedHandcuffs.event(
  PlayerInteractEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    event.player.sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

// Prevent handcuffed player from interacting
LockedHandcuffs.event(
  EntityDamageByEntityEvent,
  (event) =>
    ((event.damager as Player).inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    (event.damager as Player).sendActionBar('Et voi tehdä näin kahlittuna');
    event.setCancelled(true);
  },
);

function giveItem(player: Player, item: ItemStack) {
  const leftOver = player.inventory.addItem(item);
  if (leftOver.size()) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}
