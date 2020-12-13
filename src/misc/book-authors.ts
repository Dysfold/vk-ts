import { Material } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { PlayerInventory } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { Levelled } from 'org.bukkit.block.data';

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.FEATHER) return;
  const a = event.action;
  if (a !== Action.LEFT_CLICK_AIR && a !== Action.LEFT_CLICK_BLOCK) return;
  const inv = event.player.inventory as PlayerInventory;
  if (inv.itemInOffHand.type !== Material.WRITTEN_BOOK) return;
  const book = inv.itemInOffHand;

  const meta = book.itemMeta as BookMeta;

  // Allow only books without custommodeldata, because custom models might be other items
  if (meta.hasCustomModelData()) return;

  //  Allow only original books (no copies)
  if (meta.generation?.toString().includes('COPY')) {
    event.player.sendActionBar('Et voi allekirjoittaa kopiota');
    return;
  }

  const author = meta.author;
  if (!author) return;
  if (author.includes(' & ')) return;
  if (author === event.player.name) return;

  // Add the signature
  meta.author += ' & ' + event.player.name;
  book.itemMeta = meta;
  event.player.sendActionBar('Allekirjoitat kirjan');
});

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.WRITTEN_BOOK) return;
  if (event.action !== Action.LEFT_CLICK_BLOCK) return;

  const book = event.item;
  const meta = book.itemMeta as BookMeta;

  // Allow only books without custommodeldata, because custom models might be other items
  if (meta.hasCustomModelData()) return;
  if (meta.author !== event.player.name) {
    event.player.sendActionBar('Voit poistaa vain oman allekirjoituksesi');
    return;
  }

  const block = event.clickedBlock;
  if (block?.type !== Material.CAULDRON) return;
  const cauldron = block.blockData as Levelled;
  if (!cauldron.level) return;
  cauldron.level--;
  block.blockData = cauldron;

  meta.author = 'Tuntematon';
  book.itemMeta = meta;
  event.player.sendActionBar('Poistat kirjan allekirjoituksen');
});
