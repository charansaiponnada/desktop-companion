/**
 * companion — water reminder
 * fires at configurable intervals, pet says something
 * respects sleep state (doesn't remind during long idle)
 */

import { memory } from '../memory/store.js';

const DEFAULT_INTERVAL_MINS = 60;

export class WaterReminder {
  constructor(dispatch, onMessage) {
    this.dispatch  = dispatch;
    this.onMessage = onMessage;
    this.timer     = null;
    this.active    = false;
  }

  async start() {
    const mins = await memory.getPref('waterMins', DEFAULT_INTERVAL_MINS);
    this.intervalMs = Number(mins) * 60 * 1000;
    this.active = true;
    this._schedule();
  }

  stop() {
    this.active = false;
    clearTimeout(this.timer);
  }

  _schedule() {
    if (!this.active) return;
    this.timer = setTimeout(() => this._fire(), this.intervalMs);
  }

  async _fire() {
    await memory.log('reminder', 'water');
    this.dispatch('pet');
    this.onMessage('water');
    this._schedule();
  }
}
