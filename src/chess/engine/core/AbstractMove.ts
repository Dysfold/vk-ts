import { Game } from './Game';
import { Move } from './Move';

export class AbstractMove extends Move {
  public abstractGame: Game | null = null;
  public promotion: boolean = false;
  constructor(
    public game: Game,
    public source: string,
    public target: string,
    public capture?: string,
    public castling?: Move,
  ) {
    super(source, target, capture);
    if (
      this.game.select(source)!.pieceName === 'Pawn' &&
      ['1', '8'].includes(target.charAt(1))
    ) {
      this.promotion = true;
    }
    if (game.abstract === false) {
      //this.abstractGame = new Game(this.game.toFen(), true);
      // this.abstractGame.takeMove(
      //   source,
      //   target,
      //   new AbstractMove(this.abstractGame, source, target, capture),
      // );
      // in this simulation we check whether after a certain move, enemy king will be threatened
    }
  }
}
