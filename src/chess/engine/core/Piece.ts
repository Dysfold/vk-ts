import { Point } from './helpers/Point';

import { AbstractMove } from './AbstractMove';
import { Game, WBColor } from './Game';
import { Move } from './Move';

const tokenParser = {
  b: 'Bishop',
  k: 'King',
  n: 'Knight',
  p: 'Pawn',
  q: 'Queen',
  r: 'Rook',
};
type tokens = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export class Piece {
  public startingPosition: Point;
  public position: Point;
  constructor(pos: string, public color: WBColor, public token: string, public game: Game) {
    this.startingPosition = new Point(pos);
    this.position = new Point(pos);
  }
  get pieceName() {
    return tokenParser[this.token.toLowerCase() as tokens];
  }
  get pos() {
    return this.position.pos;
  }
  set pos(value) {
    this.position = new Point(value);
  }
  public move(target: string) {
    return this.game.takeMove(this.pos, target);
  }
  public getLegalMoves() {
    return this.getMoves().map((move) => {
      return new AbstractMove(this.game, move.source, move.target, move.capture);
    });
  }
  public getMoves() {
    if (this.pieceName === 'Pawn') {
      const v = this.color === 'w' ? 1 : -1;
      const isStarter = (this.color === 'w' ? 2 : 7) === this.position.y;
      const movesUp = this.game.iterator(this.pos, this.color, 'straight', isStarter ? 2 : 1).filter((move) => {
        return (
          move.x === this.position.x && // allow for only *dy* moves
          v * (move.y - this.position.y) > 0 && // allow moving only forward
          !move.capture
        ); // disable capturing
      });
      const captureMoves = this.game.iterator(this.pos, this.color, 'diagonal', 1).filter((move) => {
        return (
          v * (move.y - this.position.y) > 0 && move.capture // allow moving only forward
        ); // only capturing
      });
      const moves = [...movesUp, ...captureMoves];
      // en passant
      if (
        this.game.enpassant &&
        this.color !== this.game.enpassant.color && // abstract game protection
        Math.abs(this.position.x - this.game.enpassant.x) === 1 && // check if en passant position is diagonally to pawn position
        v * (this.game.enpassant.y - this.position.y) === 1
      ) {
        const enpassantPiece = this.game.getPiece(this.game.enpassant.x, this.position.y)!;
        moves.push(new Move(this.pos, this.game.enpassant.pos, enpassantPiece.pos));
      }
      return moves;
    }
    if (this.pieceName === 'Rook') {
      return this.game.iterator(this.pos, this.color, 'straight');
    }
    if (this.pieceName === 'Bishop') {
      return this.game.iterator(this.pos, this.color, 'diagonal');
    }
    if (this.pieceName === 'Queen') {
      return this.game.iterator(this.pos, this.color, 'line');
    }
    if (this.pieceName === 'Knight') {
      return this.game.iterator(this.pos, this.color, 'Lshape');
    }
    if (this.pieceName === 'King') {
      const moves = this.game.iterator(this.pos, this.color, 'line', 1);
      return moves;
    }
    return [];
  }
  public getPossibleMoves() {
    const moves = this.getLegalMoves();
    if (this.pieceName === 'King') {
      const isCheck = this.game.isCheck(this.color); // ?
      if (!isCheck) {
        if (this.game.possibleCastlings[this.color].kingside) {
          if (
            !(this.game.getPiece(this.position.x + 1, this.position.y) instanceof Piece) &&
            !(this.game.getPiece(this.position.x + 2, this.position.y) instanceof Piece) &&
            this.game.getPositionAttackingMoves(
              Point.getNotation(this.position.x + 1, this.position.y),
              this.game.invertColor(this.color),
            ).length === 0
          ) {
            const castlingMove = new Move(
              Point.getNotation(8, this.position.y),
              Point.getNotation(this.position.x + 1, this.position.y),
            );
            const move = new AbstractMove(
              this.game,
              this.pos,
              Point.getNotation(this.position.x + 2, this.position.y),
              undefined,
              castlingMove,
            );
            moves.push(move);
          }
        }
        if (this.game.possibleCastlings[this.color].queenside) {
          if (
            !(this.game.getPiece(this.position.x - 1, this.position.y) instanceof Piece) &&
            !(this.game.getPiece(this.position.x - 2, this.position.y) instanceof Piece) &&
            !(this.game.getPiece(this.position.x - 3, this.position.y) instanceof Piece) &&
            this.game.getPositionAttackingMoves(
              Point.getNotation(this.position.x - 1, this.position.y),
              this.game.invertColor(this.color),
            ).length === 0
          ) {
            const castlingMove = new Move(
              Point.getNotation(1, this.position.y),
              Point.getNotation(this.position.x - 1, this.position.y),
            );
            const move = new AbstractMove(
              this.game,
              this.pos,
              Point.getNotation(this.position.x - 2, this.position.y),
              undefined,
              castlingMove,
            );
            moves.push(move);
          }
        }
      }
    }
    return moves.filter((move) => {
      // in this simulation we check whether after a certain move, king (with the same color as this piece) will be threatened
      return move.abstractGame!.isCheck(this.color) === false;
    });
  }
  public destroy() {
    for (const row of this.game.board) {
      const index = row.indexOf(this);
      if (index !== -1) {
        row[index] = null;
        break;
      }
    }
    this.game.pieces.delete(this);
  }
  public setPosition(x: number, y: number) {
    // update board
    this.game.board[this.position.y - 1][this.position.x - 1] = null;
    this.game.board[y - 1][x - 1] = this;
    // update piece
    this.pos = Point.getNotation(x, y);
  }
}
