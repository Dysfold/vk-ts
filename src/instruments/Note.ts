export type NoteName =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Hb'
  | 'H';

const PAUSE = '-';

const NOTE_NAMES = new Set([
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Hb',
  'H',
]);

export type Accidental = '#' | 'b';

const ACCIDENTALS = new Set(['#', 'b']);

export type NoteLength = '.25' | '.5' | '1' | '2' | '3' | '4';

const MS_PER_MIN = 60 * 1000;

// Note class for future instruments
export class Note {
  name: NoteName;
  octave: number;
  length: number;
  isPause: boolean;

  /**
   * Get duration of the note in milliseconds
   * @param bpm Tempo, default 120 BPM
   */
  getMillis(bpm = 120) {
    return (this.length * MS_PER_MIN) / bpm;
  }

  constructor(str: string) {
    const isPause = str.charAt(0) === PAUSE;

    let letter = '';
    let accidental = '';
    let octave = 0;
    let noteLength = 0;

    if (!isPause) {
      this.isPause = false;
      for (const char of str) {
        // Check for notename
        if (!letter && NOTE_NAMES.has(char)) {
          letter = char as NoteName;
        }
        // Check for octave
        else if (!octave && Number.parseInt(char)) {
          octave = Number.parseInt(char);
        }
        // Check for accidental
        else if (!accidental && ACCIDENTALS.has(char)) {
          accidental = char;
        }
        // Check for note length
        else if (!noteLength && char === ':') {
          const substr = str.substring(str.indexOf(':') + 1);
          const length = Number.parseFloat(substr);
          if (!isNaN(length)) {
            noteLength = length;
          }
        }
      }
    }
    // Is pause
    else {
      this.isPause = true;

      // Parse pause length
      if (str.length > 2 && str.charAt(1) === ':') {
        const substr = str.substring(2);
        const length = Number.parseFloat(substr);
        if (!isNaN(length)) {
          noteLength = length;
        }
      }
    }

    const noteName = letter + accidental;
    this.name = (NOTE_NAMES.has(noteName) ? noteName : 'C') as NoteName;
    this.octave = octave || 1;
    this.length = noteLength || 1;
  }
}
