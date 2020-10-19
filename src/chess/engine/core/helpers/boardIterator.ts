function isNotBeyondTheBorder(x: number, y: number) {
  return x >= 1 && x <= 8 && y >= 1 && y <= 8;
}

interface ICoord {
  x: number;
  y: number;
}
type vector = -1 | 0 | 1;

function* lineIterator({ x, y }: ICoord, vx: vector, vy: vector) {
  while (isNotBeyondTheBorder(x + vx, y + vy)) {
    x += vx;
    y += vy;
    yield { x, y } as ICoord;
  }
}

function* LshapeIterator({ x, y }: ICoord, vx: number, vy: number) {
  if (isNotBeyondTheBorder(x + vx, y + vy)) {
    yield {
      x: x + vx,
      y: y + vy,
    } as ICoord;
  }
}

export function boardIteratorsGenerator(x: number, y: number, mode: 'straight' | 'diagonal' | 'Lshape') {
  const iterators = [];
  if (mode === 'straight') {
    iterators.push(lineIterator({ x, y }, 0, 1));
    iterators.push(lineIterator({ x, y }, 0, -1));
    iterators.push(lineIterator({ x, y }, 1, 0));
    iterators.push(lineIterator({ x, y }, -1, 0));
  }
  if (mode === 'diagonal') {
    iterators.push(lineIterator({ x, y }, 1, 1));
    iterators.push(lineIterator({ x, y }, 1, -1));
    iterators.push(lineIterator({ x, y }, -1, 1));
    iterators.push(lineIterator({ x, y }, -1, -1));
  }
  if (mode === 'Lshape') {
    const Lvectors: Array<[number, number]> = [
      [-1, -2], // bottom - left
      [-2, -1], // left - bottom
      [+1, -2], // bottom - right
      [+2, -1], // right - bottom
      [-1, +2], // top - left
      [-2, +1], // left - top
      [+1, +2], // top - right
      [+2, +1], // right - top
    ];
    for (const [vx, vy] of Lvectors) {
      iterators.push(LshapeIterator({ x, y }, vx, vy));
    }
  }
  return iterators;
}
