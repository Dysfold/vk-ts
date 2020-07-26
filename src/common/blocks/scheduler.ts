import * as _ from 'lodash';

export class Scheduler {
  static handlers: {
    handler: (deltaTime: number) => void;
    interval: number;
    ticks: number;
    lastRun: number;
  }[] = [];
  private static maxInterval = 1;
  private static counter = 0;

  static addHandler(func: (deltaTime: number) => void, interval: number) {
    this.handlers.push({
      handler: func,
      interval,
      ticks: 0,
      lastRun: Date.now(),
    });
    this.maxInterval = _.maxBy(this.handlers, (h) => h.interval)?.interval ?? 1;
  }

  static run() {
    for (const handler of this.handlers) {
      handler.ticks++;
      if (handler.ticks % handler.interval === 0) {
        const delta = Date.now() - handler.lastRun;
        handler.handler(delta);
        handler.lastRun = Date.now();
      }
    }
  }
}

setInterval(() => Scheduler.run(), 1000 / 20);
