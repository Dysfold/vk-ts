import { Material, Sound } from 'org.bukkit';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Player } from 'org.bukkit.entity';
import { color, text } from 'craftjs-plugin/chat';
import { ChatColor } from 'net.md_5.bungee.api';
import { isRightClick } from '../common/helpers/click';
import { ChatMessage, GLOBAL_PIPELINE } from '../chat/pipeline';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import * as yup from 'yup';
import { isBuffer } from 'lodash';

// Max length of text.
const MAX_LENGTH = 128;

const playersWriting: Player[] = [];

/**
 * CustomModelData table of Paper
 * id 0: Normal paper
 * 1: Written paper
 * 2: Sealed paper
 * 3: Empty envelope
 * 4: Envelope with letter
 * 5: Closed/sealed envelope
 */

const Envelope = new CustomItem({
  id: 3,
  name: 'Kirjekuori',
  type: VkItem.PAPER,
  modelId: 3,
});

export const EnvelopeWithLetter = new CustomItem({
  id: 4,
  name: 'Kirjekuori',
  type: VkItem.PAPER,
  modelId: 4,
  data: {
    letter: yup.string().required(),
  },
});

export const EnvelopeSealed = new CustomItem({
  id: 5,
  name: 'Suljettu Kirjekuori',
  type: VkItem.PAPER,
  modelId: 5,
  data: {
    letter: yup.string().required(),
  },
});

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
  if (event.item.itemMeta.customModelData != 1) return;
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
  itemMeta.customModelData = 1;
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

/**
 * Put paper inside envelope
 */
Envelope.event(
  PlayerInteractEvent,
  (event) => event.player.inventory.itemInOffHand,
  async (event) => {
    if (!isRightClick(event.action)) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    if (event.item?.type !== Material.PAPER) return;
    // Check if player has feather
    const inventory = event.player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    if (offHand.type !== Material.PAPER) return;
    if (offHand.itemMeta.customModelData != 3) return;
    if (event.item.itemMeta.customModelData != 1) return;
    if (event.item.amount != 1) return;
    if (!event.item.itemMeta || !event.item.itemMeta.lore) return;
    event.player.sendActionBar('§7Laitoit kirjeen kirjekuoreen');

    const envelope = EnvelopeWithLetter.create({
      letter: ChatColor.stripColor(event.item.itemMeta.lore[0]),
    });
    inventory.itemInMainHand = envelope;
    inventory.itemInOffHand.amount -= 1;
  },
);

/**
 * Open envelope
 */

EnvelopeWithLetter.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (!isRightClick(event.action)) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    if (event.item?.type !== Material.PAPER) return;
    const inventory = event.player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    if (offHand.type !== Material.AIR) return;
    if (!event.player.isSneaking()) return;
    const notSealed = EnvelopeWithLetter.get(event.item);
    if (!notSealed) return;
    const letter = new ItemStack(Material.PAPER);
    const itemMeta = letter.itemMeta;
    itemMeta.customModelData = 1;
    itemMeta.lore = [`§7${notSealed.letter}`];
    letter.itemMeta = itemMeta;
    inventory.itemInOffHand = Envelope.create();
    inventory.itemInMainHand = letter;
    event.player.sendActionBar(
      '§7Otat varoivaisesti kirjeen ulos kirjekuoresta',
    );
  },
);

EnvelopeSealed.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (!isRightClick(event.action)) return;
    if (event.hand !== EquipmentSlot.HAND) return;
    if (event.item?.type !== Material.PAPER) return;
    const inventory = event.player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    if (offHand.type !== Material.AIR) return;
    if (!event.player.isSneaking()) return;
    const sealed = EnvelopeSealed.get(event.item);
    if (!sealed) return;
    const letter = new ItemStack(Material.PAPER);
    const itemMeta = letter.itemMeta;
    itemMeta.customModelData = 1;
    itemMeta.lore = [`§7${sealed.letter}`];
    letter.itemMeta = itemMeta;
    inventory.itemInMainHand = letter;
    event.player.sendActionBar('§7Rikot sinetin ja revit kirjekuoren auki');
  },
);
