import * as _ from 'lodash';

export class Scheduler {
  static handlers: {
    handler: (deltaTime: number) => void;
    interval: number;
    ticks: number;
    lastRun: number;
  }[] = [];
  static minInterval = 1;
  private static counter = 0;

  static addHandler(func: (deltaTime: number) => void, interval: number) {
    this.handlers.push({
      handler: func,
      interval,
      ticks: 0,
      lastRun: Date.now(),
    });
    this.minInterval =
      _.minBy(this.handlers, (h) => h.interval)?.interval ?? 20;
  }

  static run() {
    for (const handler of this.handlers) {
      handler.ticks += Scheduler.minInterval;
      if (handler.ticks % handler.interval === 0) {
        const delta = Date.now() - handler.lastRun;
        console.time('promise');
        handler.handler(delta);
        console.timeEnd('promise');
        handler.lastRun = Date.now();
      }
    }

    console.log(`Next run in ${Scheduler.minInterval * 50}`);
    setTimeout(() => Scheduler.run(), Scheduler.minInterval * 50);
  }
}

Scheduler.run();
