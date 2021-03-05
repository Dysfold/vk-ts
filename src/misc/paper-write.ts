import { Material, Sound } from 'org.bukkit';
import { EquipmentSlot, ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Player } from 'org.bukkit.entity';
import { color, text } from 'craftjs-plugin/chat';
import { ChatColor } from 'net.md_5.bungee.api';
import { isRightClick } from '../common/helpers/click';
import { ChatMessage, GLOBAL_PIPELINE } from '../chat/pipeline';

// Max length of text.
const MAX_LENGTH = 128;

const playersWriting: Player[] = [];

/**
 * Writing on paper
 */

registerEvent(PlayerInteractEvent, async (event) => {
  if (!isRightClick(event.action)) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  if (event.item?.type !== Material.PAPER) return;
  // Check if player has feather
  const inventory = event.player.inventory as PlayerInventory;
  const offHand = inventory.itemInOffHand;
  if (offHand.type !== Material.FEATHER) return;
  if (playersWriting.includes(event.player)) return;
  // Check if the paper already has something written on it
  if (event.item.itemMeta.lore) {
    event.player.sendActionBar('§7Tälle paperille on jo kirjoitettu jotakin.');
    return;
  }
  if (!event.player.inventory.contains(Material.INK_SAC, event.item.amount)) {
    event.player.sendActionBar('§7Sinulla ei ole mustetta tarpeeksi.');
    return;
  }
  event.player.sendMessage(
    color(ChatColor.GRAY, text('Kirjoita haluamasi teksti chattiin!')),
  );
  playersWriting.push(event.player);
});

/**
 * Reading paper contents
 */
registerEvent(PlayerInteractEvent, async (event) => {
  if (!isRightClick(event.action)) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  if (event.item?.type !== Material.PAPER) return;
  // Check if player has feather
  const inventory = event.player.inventory as PlayerInventory;
  const offHand = inventory.itemInOffHand;
  if (offHand.type == Material.FEATHER) return;
  if (playersWriting.includes(event.player)) return;
  // Check if the paper already has something written on it
  if (event.item.itemMeta.lore) {
    event.player.sendMessage(text('Paperilla lukee:'));
    event.player.sendMessage(
      color(ChatColor.WHITE, text(event.item.itemMeta.lore[0])),
    );
    return;
  }
});

async function handleMessage(msg: ChatMessage) {
  playersWriting.removeValue(msg.sender);
  const inventory = msg.sender.inventory as PlayerInventory;
  const mainHand = inventory.itemInMainHand;
  const offHand = inventory.itemInOffHand;
  if (
    offHand.type !== Material.FEATHER ||
    mainHand.type !== Material.PAPER ||
    mainHand?.itemMeta?.lore
  ) {
    msg.sender.sendActionBar('§7Kirjoittaminen peruttu.');
    return;
  }
  if (!msg.sender.inventory.contains(Material.INK_SAC, mainHand.amount)) {
    msg.sender.sendActionBar('§7Sinulla ei ole mustetta tarpeeksi.');
    return;
  }
  const message = msg.content;
  if (MAX_LENGTH < message.length) {
    msg.sender.sendMessage(
      color(ChatColor.GRAY, text('Tämä teksti on liian pitkä. Käytä kirjaa!')),
    );
    return;
  }
  const itemMeta = mainHand.itemMeta;
  // Add color to lore
  itemMeta.lore = [`§7${message}`];
  mainHand.itemMeta = itemMeta;
  msg.sender.sendActionBar('§7Kirjoittaminen onnistui!');
  msg.sender.playSound(
    msg.sender.location,
    Sound.ENTITY_VILLAGER_WORK_CARTOGRAPHER,
    1,
    1,
  );
  msg.sender.inventory.removeItem(
    new ItemStack(Material.INK_SAC, mainHand.amount),
  );
}

/**
 * Alternative interface for detecting writing paper hands.
 */

export function detectWritingPaper(msg: ChatMessage) {
  if (playersWriting.includes(msg.sender)) {
    msg.discard = true;
    handleMessage(msg);
  }
}

GLOBAL_PIPELINE.addHandler('detectWritingPaper', 0, detectWritingPaper);
