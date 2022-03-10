import { Location, Material } from 'org.bukkit';
import { ItemFrame, Player } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { BookMeta } from 'org.bukkit.inventory.meta';
import { VkMaterial } from '../common/items/VkMaterial';
import { Note } from './Note';
import { playNote } from './piano';

const SHEET_MATERIALS = new Set([
  Material.WRITTEN_BOOK,
  Material.WRITABLE_BOOK,
]);

const musicians = new Map<Player, Location>();

// Max distance to the instrument
const MAX_DISTANCE = 3;

setInterval(() => {
  musicians.forEach((loc, player) => {
    if (!player.isOnline()) {
      musicians.delete(player);
      return;
    }
    if (player.world !== loc.world) {
      musicians.delete(player);
      return;
    }
    if (player.location.distance(loc) > MAX_DISTANCE) {
      musicians.delete(player);
      player.sendActionBar('Olet liian kaukana nuoteista');
      return;
    }
  });
}, 1000);

// Play sheet music with piano
registerEvent(PlayerInteractEntityEvent, async (event) => {
  if (!(event.rightClicked instanceof ItemFrame)) return;
  const frame = event.rightClicked;
  if (!frame.item) return;
  if (frame.location.add(0, -1, 0).block.type !== VkMaterial.PIANO) return;
  const item = frame.item;
  if (!SHEET_MATERIALS.has(item.type)) return;
  event.setCancelled(true);
  const player = event.player;
  const location = frame.location.toCenterLocation();
  if (musicians.has(player)) return;
  musicians.set(player, location);
  await playNotesFromBook(location, item, player);
  musicians.delete(player);
});

async function playNotesFromBook(
  location: Location,
  book: ItemStack,
  player: Player,
) {
  const bookMeta = book.itemMeta as BookMeta;
  const pageCount = bookMeta.pageCount;
  if (pageCount < 2) return; // Book needs to have more than 1 page

  // Bpm is formatted like this:
  //
  // bpm
  // 120
  //
  // Where "120" can be any number for bpm and it has to be on the line after the "bmp" text
  const firstPage = bookMeta.getPage(1);
  const strings = firstPage.split('\n');
  const bpmIndex = strings.indexOf('bpm');
  const bpm = +strings[bpmIndex + 1];

  for (let i = 2; i <= pageCount; i++) {
    const page = bookMeta.getPage(2);
    const noteStrings = page.split(' ');
    for (const noteString of noteStrings) {
      if (noteString === '' || noteString === '\n') continue;
      const note = new Note(noteString);
      if (!note.isPause) playNote(location, note);
      // Particle may be added later if wanted
      //location.world.spawnParticle(Particle.NOTE, location, 0);
      if (!musicians.has(player)) return;
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
    playNotesFromBook(player.location, item, player);
  }
});
