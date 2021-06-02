import { Material } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { PlayerInventory } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { Levelled } from 'org.bukkit.block.data';
import { addTranslation, t } from '../common/localization/localization';

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.FEATHER) return;
  const a = event.action;
  if (a !== Action.LEFT_CLICK_AIR && a !== Action.LEFT_CLICK_BLOCK) return;
  const inv = event.player.inventory as PlayerInventory;
  if (inv.itemInOffHand.type !== Material.WRITTEN_BOOK) return;

  const book = inv.itemInOffHand;
  const meta = book.itemMeta as BookMeta;
  const player = event.player;

  // Allow only books without custommodeldata, because custom models might be other items
  if (meta.hasCustomModelData()) return;

  //  Allow only original books (no copies)
  if (meta.generation?.toString().includes('COPY')) {
    event.player.sendActionBar(t(player, 'book.cannot_sign_copy'));
    return;
  }

  const author = meta.author;
  if (!author) return;
  if (author.includes(' & ')) return;
  if (author === event.player.name) return;

  // Add the signature
  meta.author += ' & ' + event.player.name;
  book.itemMeta = meta;
  event.player.sendActionBar(t(player, 'book.signature_added'));
});

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.WRITTEN_BOOK) return;
  if (event.action !== Action.LEFT_CLICK_BLOCK) return;

  const book = event.item;
  const meta = book.itemMeta as BookMeta;

  // Allow only books without custommodeldata, because custom models might be other items
  if (meta.hasCustomModelData()) return;
  const player = event.player;
  if (meta.author !== player.name) {
    player.sendActionBar(t(player, 'book.cannot_remove_signature'));
    return;
  }

  const block = event.clickedBlock;
  if (block?.type !== Material.CAULDRON) return;
  const cauldron = block.blockData as Levelled;
  if (!cauldron.level) return;
  cauldron.level--;
  block.blockData = cauldron;

  meta.author = t(event.player, 'book.unknown_author');
  book.itemMeta = meta;
  event.player.sendActionBar(t(event.player, 'book.signature_removed'));
});

/****************
 * Translations
 ****************/

addTranslation('book.cannot_sign_copy', {
  fi_fi: 'Et voi allekirjoittaa kopiota',
  en_us: 'You can not sign a copy',
});

addTranslation('book.signature_added', {
  fi_fi: 'Allekirjoitit kirjan',
  en_us: 'You signed the book',
});

addTranslation('book.cannot_remove_signature', {
  fi_fi: 'Et voi poistaa tätä allekirjoitusta',
  en_us: "You can't remove the signature",
});

addTranslation('book.signature_removed', {
  fi_fi: 'Allekirjoitus poistettu',
  en_us: 'Signature removed',
});

addTranslation('book.unknown_author', {
  fi_fi: 'Tuntematon',
  en_us: 'Unkown',
});
