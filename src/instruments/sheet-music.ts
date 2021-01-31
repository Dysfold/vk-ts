import { Location, Material } from 'org.bukkit';
import { ItemFrame, Player } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { Note } from './Note';
import { PIANO, playNote } from './piano';

const SHEET_MATERIALS = new Set([
  Material.WRITTEN_BOOK,
  Material.WRITABLE_BOOK,
]);

// Play sheet music with piano
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (!(event.rightClicked instanceof ItemFrame)) return;
  const frame = event.rightClicked;
  if (!frame.item) return;
  if (frame.location.add(0, -1, 0).block.type !== PIANO) return;
  const item = frame.item;
  if (!SHEET_MATERIALS.has(item.type)) return;
  event.setCancelled(true);
  playNotesFromBook(frame.location, item);
});

async function playNotesFromBook(location: Location, book: ItemStack) {
  const bookMeta = book.itemMeta as BookMeta;
  const pageCount = bookMeta.pageCount;
  if (pageCount < 2) return; // Book needs to have more than 1 page

  const firstPage = bookMeta.getPage(1);
  const strings = firstPage.split('\n');
  const bpmIndex = strings.indexOf('bpm');
  const bpm = +strings[bpmIndex + 1];

  for (let i = 2; i <= pageCount; i++) {
    const page = bookMeta.getPage(2);
    const noteStrings = page.split(' ');
    for (const noteString of noteStrings) {
      const note = new Note(noteString);
      if (!note.isPause) playNote(location, note);
      await wait(note.getMillis(bpm), 'millis');
    }
  }
}

// Command for sound testing
registerCommand('playmusic', (sender) => {
  if (sender instanceof Player) {
    const player = sender as Player;
    const item = player.inventory.itemInMainHand;
    if (!SHEET_MATERIALS.has(item.type)) return;
    playNotesFromBook(player.location, item);
  }
});
