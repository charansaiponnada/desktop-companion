import { useEffect, useRef, useState } from 'react';
import { StateMachine } from '../core/stateMachine.js';
import { createInputMonitor } from '../core/inputMonitor.js';
import { brain, checkOllama } from '../ai/brain.js';
import { memory } from '../memory/store.js';
import catBehaviors from '../avatars/cat/behaviors.json';
import foxBehaviors from '../avatars/fox/behaviors.json';

const AVATARS = { cat: catBehaviors, fox: foxBehaviors };
const CANVAS_W = 120;
const CANVAS_H = 120;
const P = 3; // pixel scale

// ── pixel draw helpers ────────────────────────────────────────────────────────
function px(n) { return n * P; }
function r(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(px(x), px(y), px(w), px(h));
}

// ── cat renderer ─────────────────────────────────────────────────────────────
function drawCat(ctx, state, frame, eyeX, eyeY) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const bx = 12, by = 8;
  const sleeping   = state === 'sleep';
  const happy      = state === 'happy';
  const typing     = state === 'typing';
  const waving     = state === 'wave';
  const hunting    = state === 'hunting';
  const thinking   = state === 'think';

  const bodyY  = by + (typing ? (frame % 4 < 2 ? -1 : 0) : 0) + (happy ? (frame % 6 < 3 ? -2 : 0) : 0);
  const tailSw = Math.sin(frame * (hunting ? 0.5 : 0.2)) * (hunting ? 3 : 2);
  const headBob = happy ? (frame % 6 < 3 ? -1 : 0) : 0;

  // tail
  r(ctx, bx+16, bodyY+14+tailSw, 3, 8,  '#c45e2a');
  r(ctx, bx+17, bodyY+21+tailSw, 4, 3,  '#e8834a');

  // body
  r(ctx, bx+1, bodyY+8,  16, 14, '#e8834a');
  r(ctx, bx+3, bodyY+6,  12, 4,  '#e8834a');
  r(ctx, bx+4, bodyY+10, 10, 8,  '#f5c89a');
  r(ctx, bx+2, bodyY+9,  2,  6,  '#c45e2a');
  r(ctx, bx+14,bodyY+9,  2,  6,  '#c45e2a');

  // head
  r(ctx, bx+2, bodyY-6+headBob, 14, 12, '#e8834a');
  r(ctx, bx+4, bodyY-8+headBob, 10, 4,  '#e8834a');

  // ears
  r(ctx, bx+2,  bodyY-11+headBob, 4, 5, '#e8834a');
  r(ctx, bx+12, bodyY-11+headBob, 4, 5, '#e8834a');
  r(ctx, bx+3,  bodyY-10+headBob, 2, 3, '#f5c89a');
  r(ctx, bx+13, bodyY-10+headBob, 2, 3, '#f5c89a');

  // muzzle
  r(ctx, bx+5, bodyY-1+headBob, 8, 5, '#f5c89a');
  r(ctx, bx+8, bodyY+1+headBob, 2, 2, '#c45e2a');

  // eyes
  if (sleeping) {
    r(ctx, bx+5,  bodyY-4+headBob, 4, 1, '#1a1008');
    r(ctx, bx+9,  bodyY-4+headBob, 4, 1, '#1a1008');
  } else if (happy) {
    r(ctx, bx+5,  bodyY-4+headBob, 4, 2, '#1a1008');
    r(ctx, bx+9,  bodyY-4+headBob, 4, 2, '#1a1008');
  } else {
    const ex1 = bx+5, ey1 = bodyY-4;
    const ex2 = bx+9, ey2 = bodyY-4;
    r(ctx, ex1, ey1+headBob, 4, 4, '#f5c89a');
    r(ctx, ex2, ey2+headBob, 4, 4, '#f5c89a');
    const dx = Math.max(-1, Math.min(1, Math.round((eyeX - px(ex1+2)) / px(8))));
    const dy = Math.max(-1, Math.min(1, Math.round((eyeY - px(ey1+2)) / px(8))));
    r(ctx, ex1+1+dx, ey1+1+dy+headBob, 2, 2, '#1a1008');
    r(ctx, ex2+1+dx, ey2+1+dy+headBob, 2, 2, '#1a1008');
  }

  // legs
  const la = typing ? (frame%4 < 2 ? 1 : 0) : 0;
  const lb = typing ? (frame%4 >= 2 ? 1 : 0) : 0;
  r(ctx, bx+2,  bodyY+21+la, 4, 5, '#e8834a');
  r(ctx, bx+12, bodyY+21+lb, 4, 5, '#e8834a');
  r(ctx, bx+2,  bodyY+25,    5, 2, '#c45e2a');
  r(ctx, bx+12, bodyY+25,    5, 2, '#c45e2a');

  // wave arm
  if (waving) {
    const wa = Math.sin(frame * 0.4) * 3;
    r(ctx, bx+16, bodyY+10+wa, 4, 3, '#e8834a');
    r(ctx, bx+19, bodyY+7+wa,  3, 3, '#f5c89a');
  }

  // think bubble
  if (thinking) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const bx2 = px(bx+18), by2 = px(bodyY-10+headBob);
    ctx.beginPath(); ctx.arc(bx2,    by2,    px(1), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx2+5,  by2-5,  px(1.5), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx2+12, by2-13, px(3), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx2+20, by2-14, px(3), 0, Math.PI*2); ctx.fill();
  }
}

// ── fox renderer ─────────────────────────────────────────────────────────────
function drawFox(ctx, state, frame, eyeX, eyeY) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const bx = 10, by = 8;
  const sleeping   = state === 'sleep';
  const happy      = state === 'happy';
  const typing     = state === 'typing';
  const waving     = state === 'wave';
  const surprised  = state === 'surprised';
  const thinking   = state === 'think';

  const bodyY  = by + (typing ? (frame%4<2 ? -1 : 0) : 0) + (happy ? (frame%6<3 ? -2 : 0) : 0);
  const tailSw = Math.sin(frame * 0.25) * 2.5;
  const headBob = happy ? (frame%6<3 ? -1 : 0) : 0;
  const earPerk = surprised ? -2 : 0;

  // tail
  r(ctx, bx+15, bodyY+12+tailSw, 5, 10, '#d4522a');
  r(ctx, bx+16, bodyY+14+tailSw, 5, 8,  '#d4522a');
  r(ctx, bx+17, bodyY+20+tailSw, 5, 4,  '#f0c080');
  r(ctx, bx+15, bodyY+22+tailSw, 3, 3,  '#f5f0e8');

  // body
  r(ctx, bx+1, bodyY+7,  15, 15, '#d4522a');
  r(ctx, bx+3, bodyY+5,  11, 5,  '#d4522a');
  r(ctx, bx+4, bodyY+9,  9,  9,  '#f0c080');
  r(ctx, bx+5, bodyY+12, 7,  5,  '#f5f0e8');

  // head
  r(ctx, bx+2, bodyY-7+headBob, 14, 11, '#d4522a');
  r(ctx, bx+4, bodyY-9+headBob, 10, 4,  '#d4522a');
  r(ctx, bx+2, bodyY-3+headBob, 4,  4,  '#f5f0e8');
  r(ctx, bx+12,bodyY-3+headBob, 4,  4,  '#f5f0e8');

  // ears
  r(ctx, bx+2,  bodyY-14+headBob+earPerk, 3, 6, '#d4522a');
  r(ctx, bx+13, bodyY-14+headBob+earPerk, 3, 6, '#d4522a');
  r(ctx, bx+3,  bodyY-13+headBob+earPerk, 1, 4, '#f0c080');
  r(ctx, bx+14, bodyY-13+headBob+earPerk, 1, 4, '#f0c080');

  // muzzle
  r(ctx, bx+5, bodyY-1+headBob, 8, 4, '#f0c080');
  r(ctx, bx+6, bodyY-3+headBob, 6, 4, '#f0c080');
  r(ctx, bx+8, bodyY+1+headBob, 2, 2, '#8a2a10');
  r(ctx, bx+8, bodyY-4+headBob, 2, 2, '#8a2a10');

  // eyes
  if (sleeping) {
    r(ctx, bx+5,  bodyY-6+headBob, 3, 1, '#1a1008');
    r(ctx, bx+10, bodyY-6+headBob, 3, 1, '#1a1008');
  } else if (happy || surprised) {
    r(ctx, bx+5,  bodyY-6+headBob, 3, 2, '#1a1008');
    r(ctx, bx+10, bodyY-6+headBob, 3, 2, '#1a1008');
  } else {
    const ex1 = bx+5, ey1 = bodyY-7;
    const ex2 = bx+10, ey2 = bodyY-7;
    r(ctx, ex1, ey1+headBob, 3, 4, '#f5f0e8');
    r(ctx, ex2, ey2+headBob, 3, 4, '#f5f0e8');
    const dx = Math.max(-1, Math.min(1, Math.round((eyeX - px(ex1+1)) / px(8))));
    const dy = Math.max(-1, Math.min(1, Math.round((eyeY - px(ey1+2)) / px(8))));
    r(ctx, ex1+dx, ey1+1+dy+headBob, 2, 2, '#1a1008');
    r(ctx, ex2+dx, ey2+1+dy+headBob, 2, 2, '#1a1008');
  }

  // legs
  const la = typing ? (frame%4<2 ? 1 : 0) : 0;
  const lb = typing ? (frame%4>=2 ? 1 : 0) : 0;
  r(ctx, bx+2,  bodyY+21+la, 4, 5, '#d4522a');
  r(ctx, bx+11, bodyY+21+lb, 4, 5, '#d4522a');
  r(ctx, bx+2,  bodyY+25,    5, 2, '#8a2a10');
  r(ctx, bx+11, bodyY+25,    5, 2, '#8a2a10');

  if (waving) {
    const wa = Math.sin(frame * 0.4) * 3;
    r(ctx, bx+15, bodyY+9+wa,  4, 3, '#d4522a');
    r(ctx, bx+18, bodyY+6+wa,  3, 4, '#f0c080');
  }

  if (thinking) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const bx2 = px(bx+18), by2 = px(bodyY-10+headBob);
    ctx.beginPath(); ctx.arc(bx2,    by2,    px(1),   0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx2+5,  by2-5,  px(1.5), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx2+12, by2-13, px(3),   0, Math.PI*2); ctx.fill();
  }
}

const RENDERERS = { cat: drawCat, fox: drawFox };

// ── component ─────────────────────────────────────────────────────────────────
export default function Companion({ avatarId = 'cat' }) {
  const canvasRef   = useRef(null);
  const frameRef    = useRef(0);
  const eyeRef      = useRef({ x: 60, y: 60 });
  const smRef       = useRef(null);
  const [state, setState]     = useState('idle');
  const [message, setMessage] = useState(null);
  const [name, setName]       = useState('you');

  const behaviors = AVATARS[avatarId] ?? AVATARS.cat;
  const render    = RENDERERS[avatarId] ?? RENDERERS.cat;

  useEffect(() => {
    memory.getPref('name', 'you').then(n => setName(n));
    checkOllama();
  }, []);

  useEffect(() => {
    const sm = new StateMachine(behaviors);
    smRef.current = sm;

    sm.on(({ state: s }) => {
      setState(s);
      maybeSpeak(s, behaviors, name);
    });

    sm.startIdleWatch();
    const monitor = createInputMonitor(e => sm.dispatch(e));

    return () => monitor.destroy();
  }, [avatarId, name]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      eyeRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    canvas.addEventListener('click', () => smRef.current?.dispatch('pet'));
  }, []);

  useEffect(() => {
    let raf;
    const loop = () => {
      frameRef.current++;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) render(ctx, state, frameRef.current, eyeRef.current.x, eyeRef.current.y);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, render]);

  async function maybeSpeak(s, cfg, petName) {
    if (Math.random() < (cfg.silenceChance ?? 0.3)) return;
    const localTemplates = cfg.personality?.[s];
    if (!localTemplates && !brain.isAvailable()) return;

    let msg;
    if (localTemplates) {
      msg = localTemplates[Math.floor(Math.random() * localTemplates.length)]
        .replace('{name}', petName);
    } else {
      const summaries = await memory.getRecentSummaries(3);
      msg = await brain.say(s, { name: petName, recentSummaries: summaries });
    }

    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
    await memory.log('speech', msg);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      {message && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,14,23,0.92)',
          color: '#f0ede8',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          marginBottom: 4,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {message}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ imageRendering: 'pixelated', cursor: 'pointer' }}
      />
    </div>
  );
}
