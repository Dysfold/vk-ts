import { CustomItem } from '../common/items/CustomItem';
import { Material, Bukkit } from 'org.bukkit';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';

export const Pliers = new CustomItem({
  id: 9,
  type: Material.IRON_HOE,
  modelId: 9,
  name: 'Pihdit',
});

export const PliersAndIngot = new CustomItem({
  id: 14,
  type: Material.IRON_HOE,
  modelId: 14,
  name: 'Pihdit',
});

export const PliersAndNugget = new CustomItem({
  id: 15,
  type: Material.IRON_HOE,
  modelId: 15,
  name: 'Pihdit',
});

function getPliersWithItem(item: ItemStack) {
  if (item.type === Material.IRON_INGOT) return PliersAndIngot;
  if (item.type === Material.IRON_NUGGET) return PliersAndNugget;
  return undefined;
}

Pliers.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.clickedBlock?.type !== Material.FIRE) return;
    const hand = event.hand;
    const player = event.player;
    const inventory = player.inventory;

    const itemInOtherHand =
      hand === EquipmentSlot.HAND
        ? inventory.itemInOffHand
        : inventory.itemInMainHand;

    const pliersWithItem = getPliersWithItem(itemInOtherHand);
    if (!pliersWithItem) return;
    itemInOtherHand.amount--;

    if (hand === EquipmentSlot.HAND) {
      inventory.itemInMainHand = pliersWithItem.create();
    } else {
      inventory.itemInOffHand = pliersWithItem.create();
    }
  },
);
