import { Material } from 'org.bukkit';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { PlayerInventory } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { isLeftClick } from '../common/helpers/click';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import {
  EnvelopeWithLetter,
  EnvelopeSealed,
  PaperWritten,
  PaperSealed,
} from './paper-write';

const SealingWax = new CustomItem({
  name: 'Sinettivaha',
  id: 9,
  modelId: 9,
  type: VkItem.MISC,
});

/**
 * Use sealing wax on a book
 */
SealingWax.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    event.setCancelled(true);
    const a = event.action;
    if (isLeftClick(a)) return;

    const inventory = event.player.inventory as PlayerInventory;
    const wax = event.item;
    if (!wax) return;

    const book = inventory.itemInOffHand;

    if (book.type !== Material.WRITTEN_BOOK) return;
    const bookMeta = book.itemMeta as BookMeta;
    if (bookMeta.hasCustomModelData()) return;

    if (book.amount > wax.amount) {
      event.player.sendActionBar(`Ei tarpeeksi sinettivahaa (${book.amount})`);
      return;
    }

    // Symbol of the seal is the first character of the wax
    const symbol = wax.itemMeta.hasDisplayName()
      ? wax.itemMeta.displayName.charAt(0)
      : '';

    const lore: string[] = [];
    lore.push('Kirjan kantta koristaa sinetti, ');

    if (symbol) lore.push(`johon on painettu symboli "${symbol}". `);
    else lore.push('jossa ei ole mitään merkintää. ');

    bookMeta.lore = lore;
    bookMeta.customModelData = 1;
    book.itemMeta = bookMeta;
    event.setCancelled(true);
    wax.amount -= book.amount;
  },
);

/**
 * Use sealing wax on a piece of paper
 */
SealingWax.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    event.setCancelled(true);
    const a = event.action;
    if (isLeftClick(a)) return;

    const inventory = event.player.inventory as PlayerInventory;
    const wax = event.item;
    if (!wax) return;

    const paper = inventory.itemInOffHand;
    const letter = PaperWritten.get(paper);
    if (!letter) return;
    const itemMeta = paper.itemMeta;
    if (!itemMeta.lore) return;
    if (paper.amount > wax.amount) {
      event.player.sendActionBar(`Ei tarpeeksi sinettivahaa (${paper.amount})`);
      return;
    }

    // Symbol of the seal is the first character of the wax
    const symbol = wax.itemMeta.hasDisplayName()
      ? wax.itemMeta.displayName.charAt(0)
      : '';

    const lore: string[] = itemMeta.lore;
    lore.push('Paperia koristaa sinetti, ');

    if (symbol) lore.push(`johon on painettu symboli "${symbol}". `);
    else lore.push('jossa ei ole mitään merkintää. ');

    const sealedLetter = PaperSealed.create({});
    sealedLetter.amount = paper.amount;
    const sealedLetterItemMeta = sealedLetter.itemMeta;
    sealedLetterItemMeta.lore = lore;
    sealedLetter.itemMeta = sealedLetterItemMeta;
    inventory.itemInOffHand = sealedLetter;
    event.setCancelled(true);
    wax.amount -= paper.amount;
  },
);

/**
 * Use sealing wax on a envelope
 */
SealingWax.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    event.setCancelled(true);
    const a = event.action;
    if (isLeftClick(a)) return;

    const inventory = event.player.inventory as PlayerInventory;
    const wax = event.item;
    if (!wax) return;

    const envelopeItem = inventory.itemInOffHand;
    const envelope = EnvelopeWithLetter.get(envelopeItem);
    if (!envelope) return;
    if (envelopeItem.amount > wax.amount) {
      event.player.sendActionBar(
        `Ei tarpeeksi sinettivahaa (${envelopeItem.amount})`,
      );
      return;
    }

    const newEnvelope = EnvelopeSealed.create({
      letter: envelope.letter,
      wax: envelope.wax,
    });
    const itemMeta = newEnvelope.itemMeta;
    // Symbol of the seal is the first character of the wax
    const symbol = wax.itemMeta.hasDisplayName()
      ? wax.itemMeta.displayName.charAt(0)
      : '';

    const lore: string[] = [];
    lore.push('Kirjekuorta koristaa sinetti, ');

    if (symbol) lore.push(`johon on painettu symboli "${symbol}". `);
    else lore.push('jossa ei ole mitään merkintää. ');

    itemMeta.lore = lore;
    newEnvelope.itemMeta = itemMeta;
    newEnvelope.amount = inventory.itemInOffHand.amount;
    inventory.itemInOffHand = newEnvelope;
    event.setCancelled(true);
    wax.amount -= envelopeItem.amount;
  },
);

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.WRITTEN_BOOK) return;
  const book = event.item;
  const meta = book.itemMeta as BookMeta;
  if (!meta.hasCustomModelData()) return;
  if (meta.customModelData !== 1) return;

  event.player.sendActionBar('Avaat sinetöidyn kirjan');
  const lore = meta.lore;
  if (!lore) return;
  lore.push('Sinetti on murtunut.');
  meta.lore = lore;
  // Type bug: getter is not nullable, setter is
  meta.customModelData = (null as unknown) as number;
  book.itemMeta = meta;
});
