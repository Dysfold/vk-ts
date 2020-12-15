import { Location } from 'org.bukkit';
import { Float } from 'java.lang';
import { Player } from 'org.bukkit.entity';

//const test = '180 C4 C4 C4 E4 D4 D4 D4 F4 E4 E4 D4 D4 C4';
const test =
  '400 \
C4 1 C4 C4 1 C4 C4 1 \
A#3 1 G3 1 A#3 1 \
C4 1 C4 1 C4 C4 1 C4 C4 1 \
D4 1 D4 D4 1 D4 D4 1 \
\
C4 1 C4 C4 1 C4 C4 1 \
A#3 1 G3 1 A#3 1 \
C4 1 C4 1 C4 C4 1 C4 C4 1 \
D4 1 D4 D4 1 D4 D4 1 \
\
C4 1 C4 C4 1 C4 C4 1 \
A#3 1 G3 1 A#3 1 \
C4 1 C4 1 C4 C4 1 C4 C4 1 \
D4 1 D4 D4 1 D4 D4 1 \
\
C5 1 C5 C5 1 C5 C5 1 \
A#4 1 G4 1 A#4 1 \
C5 1 C5 1 C5 C5 1 C5 C5 1 \
D5 1 D5 D5 1 D5 D5 1 \
\
C5 1 C5 C5 1 C5 C5 1 \
A#4 1 G4 1 A#4 1 \
C5 1 C5 1 C5 C5 1 C5 C5 1 \
D5 1 D5 D5 1 D5 D5 1 \
\
C4 1 C4 C4 1 C4 C4 1 \
A#3 1 G3 1 A#3 1 \
C4 1 C4 1 C4 C4 1 C4 C4 1 \
D4 1 D4 D4 1 D4 D4 1 \
\
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 C5 1\
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 G5 1\
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 C5 1\
C5 G4 D5 D#5 C5 3 \
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 C5 1\
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 G5 1\
C5 G4 D5 D#5 C5 3 C5 D5 D#5 D5 1 C5 1\
C5 G4 D5 D#5 C5 3 \
';

// C4 1 C4 C4 1 C4 C4 1 \
// A#3 1 G3 1 A#3 1 \
// C4 1 C4 1 C4 C4 1 C4 C4 1 \
// D4 1 D4 D4 1 D4 D4 1 \
// \
// C4 1 C4 C4 1 C4 C4 1 \
// A#3 1 G3 1 A#3 1 \
// C4 1 C4 1 C4 C4 1 C4 C4 1 \
// D4 1 D4 D4 1 D4 D4 1 \
// \
// C4 1 C4 C4 1 C4 C4 1 \
// A#3 1 G3 1 A#3 1 \
// C4 1 C4 1 C4 C4 1 C4 C4 1 \
// D4 1 D4 D4 1 D4 D4 1 \
// \
// C5 1 C5 C5 1 C5 C5 1 \
// A#4 1 G4 1 A#4 1 \
// C5 1 C5 1 C5 C5 1 C5 C5 1 \
// D5 1 D5 D5 1 D5 D5 1 \
// \
// C5 1 C5 C5 1 C5 C5 1 \
// A#4 1 G4 1 A#4 1 \
// C5 1 C5 1 C5 C5 1 C5 C5 1 \
// D5 1 D5 D5 1 D5 D5 1 \
async function parseNotes(str: string, player: Player) {
  const notes = str.split(' ');
  server.broadcastMessage(notes.toString());

  await wait(2, 'seconds');
  const bpm = Number(notes.shift()) || 60;
  const interval = 60 / bpm;
  for (const notation of notes) {
    // Pause the music
    const pause = Number(notation);
    if (pause) {
      await wait(pause * interval, 'seconds');
    }
    // Play the note
    else {
      const octave = Number(notation.slice(-1));
      const note = notation.slice(0, -1);
      const noteNumber = Number(KEYS.get(note));
      playNoteNumber(player.location, octave * 12 + noteNumber);
      await wait(interval, 'seconds');
    }
  }
}

const KEYS = new Map<string, number>([
  ['C', 6],
  ['C#', 7],
  ['D', 8],
  ['D#', 9],
  ['E', 10],
  ['F', 11],
  ['F#', 12],
  ['G', 13],
  ['G#', 14],
  ['A', 15],
  ['A#', 16],
  ['H', 17],
]);

function playNoteNumber(location: Location, note: number) {
  const octave = Math.min(4, Math.floor(note / 12));

  if (isNaN(octave)) {
    return;
  }

  const pitch = 0.5 * 2 ** ((note - octave * 12) / 12);

  location.world.playSound(
    location,
    `custom.piano${octave}`,
    2,
    (new Float(pitch) as unknown) as number,
  );
}

registerCommand('piano', (sender, label, args) => {
    if (!sender.isOp()) return;
  
    if (sender instanceof Player) {
      const player = sender as Player;
        parseNotes(test, player);

    }
}
