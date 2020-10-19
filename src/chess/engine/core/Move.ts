import { Point } from './helpers/Point';

export class Move {
  public sourcePosition: Point;
  public targetPosition: Point;
  constructor(public source: string, public target: string, public capture?: string) {
    this.sourcePosition = new Point(source);
    this.targetPosition = new Point(target);
  }
  get x() {
    return this.targetPosition.x;
  }
  get y() {
    return this.targetPosition.y;
  }
}
