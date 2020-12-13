import { Material } from 'org.bukkit';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';

// Players can re-open written books when they have a feather in offhand
registerEvent(PlayerInteractEvent, (event) => {
  if (event.hand !== EquipmentSlot.HAND) return;
  if (event.item?.type !== Material.WRITTEN_BOOK) return;

  // Check if player has feather
  const inventory = event.player.inventory as PlayerInventory;
  const offHand = inventory.itemInOffHand;
  if (offHand.type !== Material.FEATHER) return;

  const book = inventory.itemInMainHand;
  const author = (book.itemMeta as BookMeta).author;
  const username = event.player.name;
  event.setCancelled(true);

  if (author === username) {
    book.type = Material.WRITABLE_BOOK; // Keeps the content of the book
  } else {
    event.player.sendActionBar(
      'Vain alkuperäinen kirjoittaja voi muokata tätä kirjaa',
    );
  }
});
