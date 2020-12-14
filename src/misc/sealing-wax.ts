import { List } from 'java.util';
import { Material } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { PlayerInventory } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { CustomItem } from '../common/items/CustomItem';

const SealingWax = new CustomItem({
  name: 'Sinettivaha',
  id: 9,
  modelId: 9,
  type: Material.SHULKER_SHELL,
});

SealingWax.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    event.setCancelled(true);
    const a = event.action;
    if (a !== Action.LEFT_CLICK_AIR && a !== Action.LEFT_CLICK_BLOCK) return;

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

    bookMeta.setLore((lore as unknown) as List<string>);
    bookMeta.customModelData = 1;
    book.itemMeta = bookMeta;
    event.setCancelled(true);
    wax.amount -= book.amount;
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
  lore.add('Sinetti on murtunut.');
  meta.lore = lore;
  meta.setCustomModelData(null);
  book.itemMeta = meta;
});
