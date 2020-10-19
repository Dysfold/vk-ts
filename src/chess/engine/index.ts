import { Game } from './core/Game';
import { Piece } from './core/Piece';

import { boardIteratorsGenerator } from './core/helpers/boardIterator';
import { parseFen } from './core/helpers/fenParser';
import { Point } from './core/helpers/Point';

export { Point };
export { Piece };
export { Game };

export default class ChessGame extends Game {
  public static Point = Point;
  public static Piece = Piece;
  public static parseFen = parseFen;
  public static boardIteratorsGenerator = boardIteratorsGenerator;
}
