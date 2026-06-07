/**
 * companion — pomodoro timer
 * fires state machine events at focus/break transitions
 * persists session count to memory
 */

import { memory } from '../memory/store.js';

const DEFAULT_FOCUS_MINS  = 25;
const DEFAULT_BREAK_MINS  = 5;
const DEFAULT_LONG_BREAK  = 15;
const SESSIONS_BEFORE_LONG = 4;

export class PomodoroTimer {
  constructor(dispatch) {
    this.dispatch  = dispatch;
    this.timer     = null;
    this.phase     = 'idle';   // 'focus' | 'break' | 'idle'
    this.session   = 0;
    this.remaining = 0;
    this.listeners = [];

    memory.getPref('pomodoro', DEFAULT_FOCUS_MINS).then(m => {
      this.focusMins = Number(m);
    });
  }

  on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; }
  emit(ev) { this.listeners.forEach(fn => fn(ev)); }

  start() {
    if (this.phase !== 'idle') return;
    this.phase     = 'focus';
    this.remaining = (this.focusMins || DEFAULT_FOCUS_MINS) * 60;
    this.dispatch('ai_thinking');  // pet enters "think" — working together
    this._tick();
    this.emit({ type: 'start', remaining: this.remaining });
    memory.log('pomodoro', 'focus_start');
  }

  pause() {
    clearTimeout(this.timer);
    this.emit({ type: 'pause', remaining: this.remaining });
  }

  resume() {
    this._tick();
    this.emit({ type: 'resume', remaining: this.remaining });
  }

  stop() {
    clearTimeout(this.timer);
    this.phase = 'idle';
    this.dispatch('ai_done');
    this.emit({ type: 'stop' });
    memory.log('pomodoro', 'stopped');
  }

  _tick() {
    this.timer = setTimeout(() => {
      this.remaining--;
      this.emit({ type: 'tick', remaining: this.remaining });

      if (this.remaining <= 0) {
        this._onPhaseEnd();
      } else {
        this._tick();
      }
    }, 1000);
  }

  _onPhaseEnd() {
    if (this.phase === 'focus') {
      this.session++;
      this.dispatch('pomodoro_end');
      memory.log('pomodoro', `focus_complete_session_${this.session}`);

      const isLong  = this.session % SESSIONS_BEFORE_LONG === 0;
      const breakM  = isLong ? DEFAULT_LONG_BREAK : DEFAULT_BREAK_MINS;
      this.phase     = 'break';
      this.remaining = breakM * 60;
      this.emit({ type: 'break_start', long: isLong, remaining: this.remaining });
      this._tick();

    } else if (this.phase === 'break') {
      this.phase = 'idle';
      this.dispatch('wake');
      this.emit({ type: 'focus_ready' });
      memory.log('pomodoro', 'break_complete');
    }
  }

  formatRemaining() {
    const m = String(Math.floor(this.remaining / 60)).padStart(2, '0');
    const s = String(this.remaining % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
}
