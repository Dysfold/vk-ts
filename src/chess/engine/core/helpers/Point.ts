export class Point {
  public static getNotation(x: number, y: number) {
    return 'abcdefgh'.split('')[x - 1] + y;
  }
  public static validate(position: string) {
    return /^[abcdefgh][12345678]$/i.test(position);
  }
  public pos: string;
  public x: number;
  public y: number;
  constructor(position: string, public color?: string) {
    if (!Point.validate(position)) {
      throw new Error('Invalid point notation');
    }
    this.pos = position;
    this.x = 'abcdefgh'.split('').indexOf(position[0]) + 1;
    this.y = parseInt(position[1], 10);
  }
  public getNotation() {
    return Point.getNotation(this.x, this.y);
  }
}
