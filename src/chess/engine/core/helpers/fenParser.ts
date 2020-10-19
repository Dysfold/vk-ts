interface ISimplePiece {
  x: number;
  y: number;
  color: 'w' | 'b';
  token: string;
}

export function parseFen(fen: string) {
  const possibleCastlings = {
    b: {
      kingside: false,
      queenside: false,
    },
    w: {
      kingside: false,
      queenside: false,
    },
  };
  const splitted = fen.split(' ');
  if (splitted.length !== 6) {
    throw new Error('Invalid FEN structure');
  }
  const [pos, nturn, castling, enpassant, lastCatchNumber, moveNumber] = splitted;
  if (!/^[prnbqk12345678]{1,8}(\/[prnbqk12345678]{1,8}){7}$/i.test(pos)) {
    throw new Error('Invalid FEN position structure');
  }
  if (!/^[wb]$/i.test(nturn)) {
    throw new Error('Invalid FEN turn');
  }
  if (castling !== '-' && !/^[kq]{1,4}$/i.test(castling)) {
    throw new Error('Invalid FEN possible castling');
  }
  if (enpassant !== '-' && !/^[abcdefgh][12345678]$/i.test(enpassant)) {
    throw new Error('Invalid FEN possible en passant');
  }
  if (!/^\d+$/i.test(lastCatchNumber)) {
    throw new Error('Invalid FEN number of moves since last catch');
  }
  if (!/^\d+$/i.test(moveNumber)) {
    throw new Error('Invalid FEN move number');
  }
  const pieces: ISimplePiece[] = [];

  pos
    .split('/')
    .reverse()
    .forEach((row, y) => {
      const splittedRow = row.split('');
      const amount = splittedRow.reduce((prev, current) => prev + (parseInt(current, 10) || 1), 0);
      if (amount > 8) {
        throw new Error('Invalid FEN position - too many pieces');
      }
      let x = 0;
      for (const token of splittedRow) {
        if (/^[12345678]$/.test(token)) {
          x += parseInt(token, 10);
        } else {
          pieces.push({
            color: token.toLowerCase() === token ? 'b' : 'w',
            token,
            x: x + 1,
            y: y + 1,
          });
          x += 1;
        }
      }
    });
  const usedCastlingTokens: string[] = [];
  for (const token of castling.split('')) {
    if (usedCastlingTokens.includes(token)) {
      throw new Error('Invalid FEN castling - duplicate keys');
    }
    switch (token) {
      case 'K':
        possibleCastlings.w.kingside = true;
        break;
      case 'Q':
        possibleCastlings.w.queenside = true;
        break;
      case 'k':
        possibleCastlings.b.kingside = true;
        break;
      case 'q':
        possibleCastlings.b.queenside = true;
        break;
    }
  }
  const turn = nturn as 'w' | 'b';
  return {
    enpassant,
    lastCatchNumber: parseInt(lastCatchNumber, 10),
    moveNumber: parseInt(moveNumber, 10),
    pieces,
    possibleCastlings,
    turn,
  };
}
