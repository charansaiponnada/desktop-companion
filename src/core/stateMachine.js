/**
 * companion — state machine
 * maps system events → animation states
 * avatars inject behavior configs to modify transition weights/timing
 */

export const STATES = {
  IDLE:      'idle',
  SLEEP:     'sleep',
  TYPING:    'typing',
  HUNTING:   'hunting',
  HAPPY:     'happy',
  SURPRISED: 'surprised',
  DRAG:      'drag',
  WAVE:      'wave',
  THINK:     'think',
  STRETCH:   'stretch',
  OVERHEAT:  'overheat',
  JUMP:      'jump',
  PURR:      'purr',
  PAPER:     'paper',
};

export const EVENTS = {
  MOUSE_FAST:    'mouse_fast',
  MOUSE_STOP:    'mouse_stop',
  KEY_DOWN:      'key_down',
  KEY_BURST:     'key_burst',
  IDLE_TIMEOUT:  'idle_timeout',
  WAKE:          'wake',
  DRAG_START:    'drag_start',
  DRAG_END:      'drag_end',
  TASK_COMPLETE: 'task_complete',
  AI_THINKING:   'ai_thinking',
  AI_DONE:       'ai_done',
  POMODORO_END:  'pomodoro_end',
  PET:           'pet',
  SCROLL:        'scroll',
  OVERHEAT:      'overheat',
  COOLDOWN:      'cooldown',
};

const DEFAULT_TRANSITIONS = {
  mouse_fast:    { from: ['idle', 'sleep'],   to: 'hunting',  duration: 3000 },
  key_down:      { from: ['idle', 'hunting'], to: 'typing',   duration: 500  },
  key_burst:     { from: ['typing'],          to: 'typing',   duration: 800  },
  idle_timeout:  { from: '*',                 to: 'sleep',    duration: null },
  wake:          { from: ['sleep'],           to: 'idle',     duration: 1000 },
  drag_start:    { from: '*',                 to: 'drag',     duration: null },
  drag_end:      { from: ['drag'],            to: 'idle',     duration: 1000 },
  task_complete: { from: '*',                 to: 'jump',     duration: 2000 },
  ai_thinking:   { from: '*',                 to: 'think',    duration: null },
  ai_done:       { from: ['think'],           to: 'jump',     duration: 2000 },
  pet:           { from: '*',                 to: 'purr',     duration: 3000 },
  pomodoro_end:  { from: '*',                 to: 'stretch',  duration: 4000 },
  scroll:        { from: '*',                 to: 'paper',    duration: 1500 },
  overheat:      { from: ['typing'],          to: 'overheat', duration: 2500 },
  cooldown:      { from: ['overheat'],        to: 'idle',     duration: 1000 },
};

export class StateMachine {
  constructor(behaviorConfig = {}) {
    this.current = 'idle';
    this.transitions = { ...DEFAULT_TRANSITIONS, ...behaviorConfig.overrides };
    this.listeners = [];
    this.timer = null;
    this.idleThreshold = (behaviorConfig.idleThresholdMins ?? 5) * 60 * 1000;
    this.lastActivity = Date.now();
  }

  on(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  emit(newState) {
    const prev = this.current;
    this.current = newState;
    this.listeners.forEach(fn => fn({ state: newState, prev, ts: Date.now() }));
  }

  dispatch(event) {
    const t = this.transitions[event];
    if (!t) return;
    const canTransition = t.from === '*' || t.from.includes(this.current);
    if (!canTransition) return;
    if (this.timer) clearTimeout(this.timer);
    this.emit(t.to);
    if (t.duration) {
      this.timer = setTimeout(() => this.emit('idle'), t.duration);
    }
    if (event !== 'idle_timeout') this.lastActivity = Date.now();
  }

  startIdleWatch() {
    return setInterval(() => {
      if (Date.now() - this.lastActivity > this.idleThreshold) {
        if (this.current !== 'sleep') this.dispatch('idle_timeout');
      }
    }, 10000);
  }
}
