import { List } from 'java.util';
import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';

const DriedTobacco = new CustomItem({
  id: 11,
  modelId: 11,
  type: Material.SHULKER_SHELL,
  name: 'Kuivattu tupakka',
});

export const Pipe = new CustomItem({
  id: 24,
  modelId: 24,
  type: Material.DIAMOND_HOE,
  name: 'Piippu',
});

Pipe.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const a = event.action;
    if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

    const player = event.player;
    const inventory = player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    const mainHand = inventory.itemInMainHand;
    let tobacco;

    if (DriedTobacco.check(offHand)) {
      tobacco = offHand;
    } else if (DriedTobacco.check(mainHand)) {
      tobacco = mainHand;
    } else {
      return;
    }

    const pipe = event.item;
    if (!pipe) return;

    const percentage = getTobaccoLevel(pipe);
    if (percentage >= 100) return;
    changeTobaccoLevel(pipe, 20);
    tobacco.amount--;
  },
);

// Function for hat script to check if player is trying to fill the pipe
export function canEquipPipe(player: Player) {
  const inv = player.inventory as PlayerInventory;
  if (DriedTobacco.check(inv.itemInMainHand)) return false;
  if (DriedTobacco.check(inv.itemInOffHand)) return false;
  return true;
}

function getTobaccoLevel(item: ItemStack) {
  const meta = item.itemMeta;
  const lore = meta.lore;
  if (!lore) return 0;
  // Parse the percentage from the lore
  const line = lore.get(0);
  const percentage = parseLore(line);
  return Number(percentage) || 0;
}

function changeTobaccoLevel(item: ItemStack, amount: number) {
  const meta = item.itemMeta;
  const lore = meta.lore;
  let percentage = 0;
  if (lore) {
    // Parse the percentage from the lore
    const line = lore.get(0);
    percentage = Number(parseLore(line)) || 0;
  }
  // Add the amount, but limit the number to 0-100
  percentage = Math.max(Math.min(percentage + amount, 100), 0);

  const newLore = ([createLore(percentage)] as unknown) as List<string>;
  meta.lore = newLore;
  item.itemMeta = meta;
}

function parseLore(str: string) {
  // Lore looks like this "§r§7100%", so we take the string between "7" and "%"
  return str.substring(str.indexOf('7') + 1, str.indexOf('%'));
}

function createLore(number: number) {
  return '§r§7' + number + '%';
}
