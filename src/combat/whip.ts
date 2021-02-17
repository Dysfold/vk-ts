import { Location, Material } from 'org.bukkit';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import {
  PlayerDropItemEvent,
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
  PlayerItemHeldEvent,
  PlayerPickupItemEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const MAX_WHIP_DISTANCE = 3;

const SLOW = new PotionEffect(PotionEffectType.SLOW, 3 * 20, 2);

const whipPlayers = new Set<Player>();

export const Whip = new CustomItem({
  id: 10,
  modelId: 10,
  name: 'Ruoska',
  type: VkItem.TOOL,
});

Whip.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const player = event.player;
    if (event.hand !== EquipmentSlot.HAND) return;
    if (whipPlayers.has(player)) return;
    if (!event.item) return;
    whipPlayers.add(player);

    event.setCancelled(true);
    player.swingMainHand();
    const target = player.getTargetEntity(MAX_WHIP_DISTANCE);
    playWhipSound(player.location);
    if (target instanceof LivingEntity) {
      target.addPotionEffect(SLOW);
      target.damage(0);
    }

    // Play animation
    const meta = event.item?.itemMeta;
    meta.customModelData = 11;
    event.item.itemMeta = meta;
    await wait(10, 'ticks');
    meta.customModelData = 10;
    event.item.itemMeta = meta;

    whipPlayers.delete(player);
  },
);

Whip.event(
  EntityDamageByEntityEvent,
  (event) =>
    (((event.damager as unknown) as Player).inventory as PlayerInventory)
      .itemInMainHand,
  async (event) => {
    const player = (event.damager as unknown) as Player;
    if (whipPlayers.has(player)) return;
    whipPlayers.add(player);

    player.swingMainHand();
    const target = event.entity;
    playWhipSound(target.location);
    if (target instanceof LivingEntity) {
      target.addPotionEffect(SLOW);
    }

    // Play animation
    const item = (((event.damager as unknown) as Player)
      .inventory as PlayerInventory).itemInMainHand;
    const meta = item.itemMeta;
    meta.customModelData = 11;
    item.itemMeta = meta;
    await wait(5, 'ticks');

    // Hurt sounds
    if (event.entity.type === EntityType.PLAYER) {
      playHurtSound(event.entity.location);
    }

    await wait(5, 'ticks');

    meta.customModelData = 10;
    item.itemMeta = meta;

    whipPlayers.delete(player);
  },
);

// Stop the animation if the item is dropped
Whip.event(
  PlayerDropItemEvent,
  (event) => event.itemDrop.itemStack,
  async (event) => {
    whipPlayers.delete(event.player);
    const meta = event.itemDrop.itemStack.itemMeta;
    if (meta.customModelData === 11) {
      meta.customModelData = 10;
      event.itemDrop.itemStack.itemMeta = meta;
    }
  },
);

// Replace animated whip with normal whip when player focues it
Whip.event(
  PlayerItemHeldEvent,
  (event) => event.player.inventory.getItem(event.newSlot),
  async (event) => {
    const item = event.player.inventory.getItem(event.newSlot);
    if (!item) return;
    const meta = item?.itemMeta;
    if (meta.customModelData === 11) {
      meta.customModelData = 10;
      item.itemMeta = meta;
    }
  },
);

// Stop the animation if player picks up a whip
Whip.event(
  PlayerPickupItemEvent,
  (event) => event.item.itemStack,
  async (event) => {
    const item = event.item.itemStack;
    const meta = item.itemMeta;
    if (meta.customModelData === 11) {
      meta.customModelData = 10;
      item.itemMeta = meta;
    }
  },
);

// Stop whip animation if player clicks itemframe or armorstand
Whip.event(
  PlayerInteractAtEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInHand,
  async (event) => {
    if (
      event.rightClicked.type !== EntityType.ARMOR_STAND &&
      event.rightClicked.type !== EntityType.ITEM_FRAME
    ) {
      return;
    }
    const item = (event.player.inventory as PlayerInventory).itemInHand;
    const meta = item.itemMeta;
    if (meta.customModelData === 11) {
      meta.customModelData = 10;
      item.itemMeta = meta;
    }
  },
);

function playWhipSound(location: Location) {
  location.world.playSound(location, 'custom.whip', 1, 0.8);
}

function playHurtSound(location: Location) {
  location.world.playSound(location, 'custom.hurt', 1, 1);
}
