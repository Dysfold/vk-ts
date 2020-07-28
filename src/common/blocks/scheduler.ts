import * as _ from 'lodash';
import { CustomBlock, Blocks, Region } from './CustomBlock';

export class Scheduler {
  static handlers: {
    handler: (deltaTime: number, block: CustomBlock) => void;
    clazz: typeof CustomBlock;
    interval: number;
    ticks: number;
    lastRun: number;
  }[] = [];
  static minInterval = 1;
  private static counter = 0;
  private static regions: Region[] = [];
  private static chunkedRegions: Region[][] = [];
  private static regionIndex = 0;

  static CHUNK_REGIONS = false;

  static addHandler<T extends CustomBlock>(
    clazz: new (...args: any[]) => T,
    func: (deltaTime: number, block: CustomBlock) => void,
    interval: number,
  ) {
    this.handlers.push({
      handler: func,
      interval,
      clazz,
      ticks: 0,
      lastRun: Date.now(),
    });
    this.minInterval =
      _.minBy(this.handlers, (h) => h.interval)?.interval ?? 20;
  }

  static runHandler(
    handler: typeof Scheduler['handlers'][0],
    regions: Region[],
  ) {
    const delta = this.CHUNK_REGIONS
      ? (Date.now() - handler.lastRun) * this.chunkedRegions.length
      : Date.now() - handler.lastRun;
    Blocks.forEach(
      handler.clazz as any,
      (block) => {
        handler.handler(delta, block);
      },
      regions,
    );
    handler.lastRun = Date.now();
  }

  private static getRegionsHash() {
    return this.regions.map((r) => `${r.world},${r.x},${r.z}`).join(';');
  }

  static updateRegions() {
    const hash = this.getRegionsHash();
    this.regions = Blocks.getLoadedRegions();
    this.chunkedRegions = this.CHUNK_REGIONS
      ? _.chunk(this.regions, Math.ceil(this.regions.length / 10))
      : [];
    if (this.getRegionsHash() !== hash) {
      console.log('Regions amount changed');
      this.regionIndex = 0;
    }
  }

  static run() {
    this.updateRegions();
    const currentRegions = this.CHUNK_REGIONS
      ? this.chunkedRegions[this.regionIndex]
      : this.regions;

    for (const handler of this.handlers) {
      handler.ticks += Scheduler.minInterval;
      if (handler.ticks % handler.interval === 0) {
        this.runHandler(handler, currentRegions);
      }
    }
    this.regionIndex++;
    if (this.regionIndex >= this.chunkedRegions.length) {
      this.regionIndex = 0;
    }

    const delay = this.CHUNK_REGIONS
      ? Math.max(
          Math.ceil(Scheduler.minInterval / this.chunkedRegions.length),
          1,
        )
      : Scheduler.minInterval;
    setTimeout(() => Scheduler.run(), delay * 50);
  }
}
