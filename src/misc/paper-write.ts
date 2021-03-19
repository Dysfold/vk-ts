import { Material, SoundCategory } from 'org.bukkit';
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

/**
 * Max length of text.
 */
const MAX_LENGTH = 128;

const playersWriting: Set<Player> = new Set<Player>();

/**
 * CustomModelData table of Paper
 * id 0: Normal paper
 * 1: Written paper
 * 2: Sealed paper
 * 3: Empty envelope
 * 4: Envelope with letter
 * 5: Closed/sealed envelope
 */

export const PaperWritten = new CustomItem({
  id: 1,
  name: 'Paperi',
  type: VkItem.PAPER,
  modelId: 1,
});

export const PaperSealed = new CustomItem({
  id: 2,
  name: 'Paperi',
  type: VkItem.PAPER,
  modelId: 2,
});

export const Envelope = new CustomItem({
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
    wax: yup.array().of(yup.string().required()).required(),
  },
});

export const EnvelopeSealed = new CustomItem({
  id: 5,
  name: 'Kirjekuori',
  type: VkItem.PAPER,
  modelId: 5,
  data: {
    letter: yup.string().required(),
    wax: yup.array().of(yup.string().required()).required(),
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
  if (playersWriting.has(event.player)) return;
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
  playersWriting.add(event.player);
});

/**
 * Reading paper contents
 */
PaperWritten.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (!event.item) return;
    const inventory = event.player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    if (offHand.type == Material.FEATHER) return;
    if (playersWriting.has(event.player)) return;
    // Check if the paper already has something written on it
    if (event.item.itemMeta.lore) {
      event.player.sendMessage(text('Paperilla lukee:'));
      event.player.sendMessage(
        color(ChatColor.WHITE, text(event.item.itemMeta.lore[0])),
      );
    }
  },
);

PaperSealed.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (!event.item) return;
    const inventory = event.player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    if (offHand.type == Material.FEATHER) return;
    if (playersWriting.has(event.player)) return;
    // Check if the paper already has something written on it
    if (event.item.itemMeta.lore) {
      event.player.sendMessage(text('Paperilla lukee:'));
      event.player.sendMessage(
        color(ChatColor.WHITE, text(event.item.itemMeta.lore[0])),
      );
      event.player.sendMessage(
        color(
          ChatColor.RED,
          text(event.item.itemMeta.lore[1] + '' + event.item.itemMeta.lore[2]),
        ),
      );
    }
  },
);

function handleMessage(msg: ChatMessage) {
  playersWriting.delete(msg.sender);
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
  const letter = PaperWritten.create({});
  letter.amount = mainHand.amount;
  const itemMeta = letter.itemMeta;
  // Add color to lore
  itemMeta.lore = [`§7${message}`];
  letter.itemMeta = itemMeta;
  inventory.itemInMainHand = letter;
  msg.sender.sendActionBar('§7Kirjoittaminen onnistui!');
  msg.sender.playSound(
    msg.sender.location,
    'entity.villager.work_cartographer',
    SoundCategory.PLAYERS,
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

function detectWritingPaper(msg: ChatMessage) {
  if (playersWriting.has(msg.sender)) {
    msg.discard = true;
    handleMessage(msg);
  }
}

GLOBAL_PIPELINE.addHandler('detectWritingPaper', -1, detectWritingPaper);

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
    const paperWritten = PaperWritten.get(event.item);
    const paperSealed = PaperSealed.get(event.item);
    if (paperWritten) {
      if (event.item.amount > offHand.amount) {
        event.player.sendActionBar(
          `Ei tarpeeksi kirjekuoria (${event.item.amount})`,
        );
        return;
      }
      if (!event.item.itemMeta || !event.item.itemMeta.lore) return;
      event.player.sendActionBar('§7Laitoit kirjeen kirjekuoreen');
      const envelope = EnvelopeWithLetter.create({
        letter: ChatColor.stripColor(event.item.itemMeta.lore[0]),
        wax: [],
      });
      envelope.amount = event.item.amount;
      inventory.itemInMainHand = envelope;
      inventory.itemInOffHand.amount -= event.item.amount;
    } else if (paperSealed) {
      if (event.item.amount > offHand.amount) {
        event.player.sendActionBar(
          `Ei tarpeeksi kirjekuoria (${event.item.amount})`,
        );
        return;
      }
      if (
        !event.item.itemMeta ||
        !event.item.itemMeta.lore ||
        event.item.itemMeta.lore.length != 3
      )
        return;
      event.player.sendActionBar('§7Laitoit kirjeen kirjekuoreen');
      const envelope = EnvelopeWithLetter.create({
        letter: ChatColor.stripColor(event.item.itemMeta.lore[0]),
        wax: [event.item.itemMeta.lore[1], event.item.itemMeta.lore[2]],
      });
      envelope.amount = event.item.amount;
      inventory.itemInMainHand = envelope;
      inventory.itemInOffHand.amount -= event.item.amount;
    }
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
    if (!event.player.isSneaking()) {
      event.player.sendActionBar(
        `§7Avaa kirjekuori oikeaklikkaamalla sitä kyykyssä!`,
      );
      return;
    }
    if (offHand.type !== Material.AIR) {
      event.player.sendActionBar(`§7Toinen kätesi ei ole tyhjä.`);
      return;
    }
    const notSealed = EnvelopeWithLetter.get(event.item);
    if (!notSealed) return;
    const letter =
      notSealed.wax.length == 0
        ? PaperWritten.create({})
        : PaperSealed.create({});
    const itemMeta = letter.itemMeta;
    if (notSealed.wax.length == 2) {
      itemMeta.lore = [
        `§7${notSealed.letter}`,
        notSealed.wax[0],
        notSealed.wax[1],
      ];
    } else {
      itemMeta.lore = [`§7${notSealed.letter}`];
    }
    letter.itemMeta = itemMeta;
    letter.amount = event.item.amount;
    const envelope = Envelope.create({});
    envelope.amount = event.item.amount;
    inventory.itemInOffHand = envelope;
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
    if (!event.player.isSneaking()) {
      event.player.sendActionBar(
        `§7Avaa kirjekuori oikeaklikkaamalla sitä kyykyssä!`,
      );
      return;
    }
    const sealed = EnvelopeSealed.get(event.item);
    if (!sealed) return;
    const letter =
      sealed.wax.length == 0 ? PaperWritten.create({}) : PaperSealed.create({});
    letter.amount = event.item.amount;
    const itemMeta = letter.itemMeta;
    if (sealed.wax.length == 2) {
      itemMeta.lore = [`§7${sealed.letter}`, sealed.wax[0], sealed.wax[1]];
    } else {
      itemMeta.lore = [`§7${sealed.letter}`];
    }
    letter.itemMeta = itemMeta;
    inventory.itemInMainHand = letter;
    event.player.sendActionBar('§7Rikot sinetin ja revit kirjekuoren auki');
  },
);
