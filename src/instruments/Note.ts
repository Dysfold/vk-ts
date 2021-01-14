export type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'H';

// Note class for future instruments
export class Note {
  name: NoteName;
  octave: number;
  length: number;

  constructor(name: NoteName, octave: number, length: number) {
    this.name = name;
    this.octave = octave;
    this.length = length;
  }
}
