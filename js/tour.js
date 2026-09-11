/** Guided tour: steps through organelles on a timer. */
export class Tour {
  /**
   * @param {string[]} keys  organelle keys to visit, in order
   * @param {(key: string) => void} onVisit
   * @param {() => void} onEnd
   * @param {number} interval seconds per stop
   */
  constructor(keys, onVisit, onEnd, interval = 6.5) {
    this.keys = keys;
    this.onVisit = onVisit;
    this.onEnd = onEnd;
    this.interval = interval;
    this.running = false;
    this._acc = 0;
    this._idx = 0;
  }

  start() {
    this.running = true;
    this._idx = 0;
    this._acc = 0;
    this.onVisit(this.keys[0]);
  }

  stop(silent = false) {
    const was = this.running;
    this.running = false;
    if (was && !silent) this.onEnd?.();
    return was;
  }

  update(dt) {
    if (!this.running) return;
    this._acc += dt;
    if (this._acc < this.interval) return;
    this._acc = 0;
    this._idx += 1;
    if (this._idx >= this.keys.length) this.stop();
    else this.onVisit(this.keys[this._idx]);
  }
}
