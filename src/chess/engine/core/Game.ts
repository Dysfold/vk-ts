import { AbstractMove } from './AbstractMove';
import { Move } from './Move';
import { Piece } from './Piece';

import { boardIteratorsGenerator } from './helpers/boardIterator';
import { EventEmitter } from './helpers/EventEmitter';
import { parseFen } from './helpers/fenParser';
import { Point } from './helpers/Point';

export type WBColor = 'w' | 'b';
export interface ICastlings {
  w: {
    kingside: boolean;
    queenside: boolean;
  };
  b: {
    kingside: boolean;
    queenside: boolean;
  };
}

export class Game extends EventEmitter {
  public possibleCastlings: ICastlings = {
    b: { kingside: false, queenside: false },
    w: { kingside: false, queenside: false },
  };
  public turn: 'w' | 'b' = 'w';
  public lastCatchNumber: number = Infinity;
  public moveNumber: number = 0;
  public enpassant: Point | null = null;
  public board: Array<Array<Piece | null>> = [];
  public pieces: Set<Piece> = new Set();
  constructor(
    fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    public abstract = false,
  ) {
    super();
    this.reset();
    this.parseFen(fen);
    this.emit('start');
  }
  public reset() {
    this.board = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => null),
    );
    this.pieces = new Set();
  }
  public getPiece(x: number, y: number) {
    if (x < 1 || x > 8) {
      throw new Error('X out of range');
    }
    if (y < 1 || y > 8) {
      throw new Error('Y out of range');
    }
    return this.board[y - 1][x - 1];
  }
  public invertColor(color: WBColor): WBColor {
    if (color === 'b') {
      return 'w';
    }
    return 'b';
  }
  public select(pos: string) {
    const { x, y } = new Point(pos);
    return this.getPiece(x, y);
  }
  /**
   * @param pos Position to check, eg. `a5`
   * @param color Color of the pieces that can attack
   */
  public getPositionAttackingMoves(pos: string, color: WBColor) {
    const pieces = [...this.pieces].filter((piece) => piece.color === color);
    const attackMoves = pieces
      .map((piece) => piece.getLegalMoves())
      .reduce((prev, now) => prev.concat(now), []);
    return attackMoves.filter((move) => {
      return pos === move.target;
    });
  }
  public getKingAttackingMoves(color: WBColor) {
    const kingsPos = [...this.pieces]
      .filter((piece) => piece.pieceName === 'King' && piece.color === color)
      .map((king) => king.pos);
    return kingsPos
      .map((pos) => {
        return this.getPositionAttackingMoves(pos, this.invertColor(color));
      })
      .reduce((prev, now) => prev.concat(now), []);
  }
  public isCheck(color = this.turn) {
    return this.getKingAttackingMoves(color).length > 0;
  }
  public isDraw() {
    return (
      !this.isCheck(this.turn) &&
      [...this.pieces]
        .filter((piece) => piece.color === this.turn)
        .every((piece) => piece.getPossibleMoves().length === 0)
    );
  }
  public isGameOver() {
    return (
      this.isCheck(this.turn) &&
      [...this.pieces]
        .filter((piece) => piece.color === this.turn)
        .every((piece) => piece.getPossibleMoves().length === 0)
    );
  }
  public takeMove(source: string, target: string, abstractMove?: AbstractMove) {
    const { x, y } = new Point(target);
    const piece = this.select(source);
    if (!(piece instanceof Piece)) {
      throw new Error('Invalid move');
    }
    let move: AbstractMove | undefined;
    if (abstractMove instanceof AbstractMove) {
      move = abstractMove;
    } else {
      move = piece.getPossibleMoves().find((m) => m.x === x && m.y === y);
      if (!(move instanceof AbstractMove)) {
        throw new Error(`Cannot move to ${target}`);
      }
    }
    if (
      piece.pieceName === 'Pawn' &&
      Math.abs(move.y - piece.position.y) === 2
    ) {
      // enpassant
      const enPassantPos = Point.getNotation(
        piece.position.x,
        (piece.position.y + move.y) / 2,
      );
      this.enpassant = new Point(enPassantPos, this.turn);
    } else {
      this.enpassant = null;
    }
    if (move.capture) {
      const captured = this.select(move.capture)!;
      captured.destroy();
      this.lastCatchNumber = -1;
    }
    if (move.promotion) {
      piece.token = 'q'[piece.color === 'w' ? 'toUpperCase' : 'toLowerCase']();
    }
    if (piece.pieceName === 'King') {
      this.possibleCastlings[piece.color].queenside = false;
      this.possibleCastlings[piece.color].kingside = false;
    }
    if (piece.pieceName === 'Rook') {
      if (piece.color === 'w') {
        if (piece.startingPosition.pos === 'a1') {
          this.possibleCastlings.w.queenside = false;
        }
        if (piece.startingPosition.pos === 'h1') {
          this.possibleCastlings.w.kingside = false;
        }
      }
      if (piece.color === 'b') {
        if (piece.startingPosition.pos === 'a8') {
          this.possibleCastlings.w.queenside = false;
        }
        if (piece.startingPosition.pos === 'h8') {
          this.possibleCastlings.w.kingside = false;
        }
      }
    }
    const castlingPiece =
      move.castling instanceof Move ? this.select(move.castling.source) : null;
    piece.setPosition(x, y);
    if (castlingPiece instanceof Piece) {
      castlingPiece.setPosition(
        move.castling!.targetPosition.x,
        move.castling!.targetPosition.y,
      );
    }
    // update game
    this.lastCatchNumber += 1;
    this.moveNumber += 1;
    this.turn = this.turn === 'w' ? 'b' : 'w';
    if (!this.abstract) {
      this.emitMove(move);
    }
    return move;
  }
  public emitMove(move: AbstractMove) {
    if (move.capture) {
      this.emit('capture', move.capture);
    }
    if (move.promotion) {
      this.emit('promotion', move.target);
    }
    if (this.isCheck()) {
      this.emit('check', this.turn);
    }
    if (this.isGameOver()) {
      this.emit('checkMate', this.turn === 'w' ? 'b' : 'w');
    }
    if (this.isDraw()) {
      this.emit('staleMate');
    }
  }
  public parseFen(fen: string) {
    this.reset();
    const {
      pieces,
      possibleCastlings,
      turn,
      enpassant,
      lastCatchNumber,
      moveNumber,
    } = parseFen(fen);
    this.possibleCastlings = possibleCastlings;
    this.turn = turn;
    this.lastCatchNumber = lastCatchNumber;
    this.moveNumber = moveNumber;
    pieces.forEach((piece) => {
      const pos = Point.getNotation(piece.x, piece.y);
      const p = new Piece(pos, piece.color, piece.token, this);
      this.board[piece.y - 1][piece.x - 1] = p;
      this.pieces.add(p);
    });
    // en passant
    if (enpassant === '-') {
      this.enpassant = null;
    } else {
      const position = new Point(enpassant, this.turn === 'w' ? 'b' : 'w');
      const { x, y } = position;
      if (this.getPiece(x, y) !== null) {
        throw new Error('Invalid FEN - en passant');
      }
      this.enpassant = position;
    }
  }
  public toFen() {
    let fen = this.board
      .map((row) =>
        row
          .map((piece) => (piece === null ? '#' : piece.token))
          .join('')
          .replace(/#+/g, (match) => match.length.toString()),
      )
      .reverse()
      .join('/');
    fen += ' ' + this.turn + ' ';
    const castling =
      Object.entries(this.possibleCastlings.w)
        .filter(([_, value]) => value)
        .map(([key]) => key.charAt(0).toUpperCase())
        .join('') +
      Object.entries(this.possibleCastlings.b)
        .filter(([_, value]) => value)
        .map(([key]) => key.charAt(0).toLowerCase())
        .join('');
    fen += castling.length ? castling : '-';
    fen += ' ' + (this.enpassant ? this.enpassant.getNotation() : '-');
    fen += ' ' + this.lastCatchNumber + ' ' + this.moveNumber;
    return fen;
  }
  public iterator(
    pos: string,
    color: 'w' | 'b',
    mode: 'straight' | 'diagonal' | 'Lshape' | 'line',
    limit = Infinity,
  ) {
    const { x, y } = new Point(pos);
    const iterators = [];
    if (mode !== 'line') {
      iterators.push(...boardIteratorsGenerator(x, y, mode));
    } else {
      iterators.push(...boardIteratorsGenerator(x, y, 'straight'));
      iterators.push(...boardIteratorsGenerator(x, y, 'diagonal'));
    }
    const moves: Move[] = [];
    for (const iterator of iterators) {
      // tslint:disable-next-line
      for (const [i, { x, y }] of [...iterator].entries()) {
        if (i >= limit) {
          break;
        }
        const square = this.getPiece(x, y);
        if (square instanceof Piece) {
          if (square.color !== color) {
            moves.push(new Move(pos, Point.getNotation(x, y), square.pos));
          }
          break;
        } else {
          moves.push(new Move(pos, Point.getNotation(x, y)));
        }
      }
    }
    return moves;
  }
}
