type callable = (...args: any[]) => any;
interface IDictionary<T> {
  [key: string]: T;
}
export class EventEmitter {
  // tslint:disable-next-line
  private _events: IDictionary<callable[]> = {};
  public on(key: string, listener: callable) {
    if (!this._events[key]) {
      this._events[key] = [];
    }
    this._events[key].push(listener);
    return this;
  }
  public off(key: string, listener: callable) {
    if (this._events[key]) {
      if (listener instanceof Function) {
        const idx = this._events[key].indexOf(listener);
        if (idx !== -1) {
          this._events[key].splice(idx, 1);
        }
      } else {
        delete this._events[key];
      }
    }
    return this;
  }
  public emit(key: string, ...args: any[]) {
    if (this._events[key]) {
      const listeners = this._events[key].slice();
      for (const listener of listeners) {
        listener.apply(this, args);
      }
    }
    return this;
  }
  public once(key: string, listener: callable) {
    const self = this;
    this.on(key, function x(...args) {
      self.off(key, x);
      const ret = listener.apply(self, args);
      if (ret === true) {
        self.once(key, listener);
      }
    });
    return this;
  }
}
