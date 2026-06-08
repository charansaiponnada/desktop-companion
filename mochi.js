/**
 * Mochi — desktop companion cat sprite renderer
 * All drawing is pure Canvas 2D — no images, no external assets
 * Drop-in replacement for the previous pixel renderer in Companion.jsx
 *
 * Usage:
 *   import { drawMochi } from './mochi.js';
 *   // in your rAF loop:
 *   drawMochi(ctx, { state, frame, eyeTarget: {x, y}, scale: 1 });
 *
 * States: idle | walk | run | sleep | think | typing | happy | excited | surprised | drag | wag
 */

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  cream:      '#F5ECD7',   // base fur
  creamDark:  '#EDD9B4',   // fur shadow
  creamDeep:  '#D4B896',   // deep shadow / inner ear
  orange:     '#E8834A',   // ear tips, tail tip, accent
  orangeLight:'#F0A070',   // warm highlight
  orangeGlow: '#FFCFA0',   // magical glow tint
  eyeWhite:   '#FEFEFE',
  eyeBlue:    '#5BB8F5',   // iris
  eyeBlueDark:'#2E86C1',   // iris shadow
  pupil:      '#1A1A2E',   // deep pupil
  pupilShine: '#FFFFFF',   // catchlight
  nose:       '#F48FB1',   // pink nose
  noseDark:   '#E57399',
  mouth:      '#C97B9A',
  whisker:    'rgba(180,160,140,0.7)',
  pawPad:     '#F48FB1',
  pawPadDark: '#E07090',
  glow:       'rgba(255,180,100,0.12)',
  glowBright: 'rgba(255,200,140,0.22)',
  shadow:     'rgba(80,50,20,0.10)',
  zzzColor:   '#B0C4E8',
  thinkBubble:'rgba(255,255,255,0.88)',
  sparkle:    '#FFE066',
  sparkle2:   '#FF9FD0',
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a, b, t) { return a + (b - a) * t; }
function sin(frame, speed=1, amp=1, offset=0) {
  return Math.sin(frame * speed + offset) * amp;
}
function cos(frame, speed=1, amp=1, offset=0) {
  return Math.cos(frame * speed + offset) * amp;
}

// ─── sub-drawers ─────────────────────────────────────────────────────────────

function drawGlow(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawShadow(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBody(ctx, cx, cy, scaleX=1, scaleY=1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, scaleY);

  // body glow aura
  drawGlow(ctx, 0, 0, 30, C.glow);

  // main body — rounded oval
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly highlight
  const belly = ctx.createRadialGradient(0, 4, 2, 0, 4, 16);
  belly.addColorStop(0, 'rgba(255,255,255,0.5)');
  belly.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0, 5, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // body shadow bottom
  ctx.fillStyle = C.creamDark;
  ctx.beginPath();
  ctx.ellipse(0, 8, 18, 12, 0, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();

  ctx.restore();
}

function drawEar(ctx, cx, cy, flip=1, perk=0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip, 1);

  const lift = perk * 3;

  // outer ear
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -14 - lift, 8, -18 - lift, 12, -8);
  ctx.bezierCurveTo(8, -4, 4, -2, 0, 0);
  ctx.fill();

  // inner ear
  ctx.fillStyle = C.orange;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(1, -1);
  ctx.bezierCurveTo(-1, -10 - lift, 5, -13 - lift, 9, -7);
  ctx.bezierCurveTo(7, -4, 3, -2, 1, -1);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawEyes(ctx, cx, cy, eyeTarget, blink, state, frame) {
  const eyeSpacing = 8;
  const eyes = [
    { x: cx - eyeSpacing, y: cy, side: -1 },
    { x: cx + eyeSpacing, y: cy, side: 1  },
  ];

  eyes.forEach(eye => {
    ctx.save();
    ctx.translate(eye.x, eye.y);

    const blinkH = blink > 0 ? lerp(10, 1, blink) : 10;
    const blinkW = 9;

    // eye white
    ctx.fillStyle = C.eyeWhite;
    ctx.beginPath();
    ctx.ellipse(0, 0, blinkW, blinkH, 0, 0, Math.PI * 2);
    ctx.fill();

    if (blink < 0.8) {
      // compute pupil tracking direction
      const dx = eyeTarget ? (eyeTarget.x - eye.x) : 0;
      const dy = eyeTarget ? (eyeTarget.y - eye.y) : 0;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const maxPupilOffset = 2.5;
      const px = (dx / dist) * Math.min(dist * 0.04, maxPupilOffset);
      const py = (dy / dist) * Math.min(dist * 0.04, maxPupilOffset);

      // iris
      const irisGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 6);
      irisGrad.addColorStop(0, C.eyeBlue);
      irisGrad.addColorStop(1, C.eyeBlueDark);
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, 6, Math.min(6, blinkH - 1), 0, 0, Math.PI * 2);
      ctx.fill();

      // pupil
      ctx.fillStyle = C.pupil;
      ctx.beginPath();
      ctx.ellipse(px, py, 3.5, Math.min(3.5, blinkH - 2), 0, 0, Math.PI * 2);
      ctx.fill();

      // sparkle / excited dilation
      if (state === 'excited' || state === 'happy') {
        ctx.fillStyle = C.pupil;
        ctx.beginPath();
        ctx.ellipse(px, py, 4.5, Math.min(4.5, blinkH - 1), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // catchlight
      ctx.fillStyle = C.pupilShine;
      ctx.beginPath();
      ctx.arc(px - 1.5, py - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 1.5, py + 1, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // eye sparkle ring for excited
      if (state === 'excited') {
        const sparkAlpha = (Math.sin(frame * 0.15) + 1) * 0.5;
        ctx.strokeStyle = C.sparkle;
        ctx.globalAlpha = sparkAlpha * 0.8;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, blinkW + 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // eyelid on blink
    if (blink > 0.3) {
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.ellipse(0, -blinkH * (1 - blink), blinkW, blinkH * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawNose(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);

  // nose
  ctx.fillStyle = C.nose;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // nose shine
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(-0.8, -0.6, 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMouth(ctx, cx, cy, happy=false) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.mouth;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  if (happy) {
    // happy curve
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-2, 4, 0, 4);
    ctx.quadraticCurveTo(2, 4, 4, 0);
    ctx.stroke();
  } else {
    // neutral small curve
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(0, 2.5, 3, 0);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWhiskers(ctx, cx, cy, twitch=0) {
  ctx.save();
  ctx.strokeStyle = C.whisker;
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';

  const tw = twitch * 1.5;

  // left whiskers
  [[cx-6, cy-1+tw, cx-22, cy-3+tw],
   [cx-6, cy+1,    cx-22, cy+2],
   [cx-6, cy+3-tw, cx-22, cy+6-tw]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  // right whiskers
  [[cx+6, cy-1+tw, cx+22, cy-3+tw],
   [cx+6, cy+1,    cx+22, cy+2],
   [cx+6, cy+3-tw, cx+22, cy+6-tw]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  ctx.restore();
}

function drawTail(ctx, cx, cy, angle=0, wagAmt=0) {
  ctx.save();
  ctx.translate(cx, cy);

  const wag = wagAmt;
  const cp1x = 10 + wag * 8;
  const cp1y = -8;
  const cp2x = 22 + wag * 10;
  const cp2y = -20 + angle * 10;
  const ex   = 18 + wag * 6;
  const ey   = -28 + angle * 8;

  // tail base thick → thin
  ctx.strokeStyle = C.cream;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
  ctx.stroke();

  // orange tip
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 7;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(ex - 2, ey + 2);
  ctx.bezierCurveTo(ex, ey - 2, ex + 2, ey - 6, ex, ey - 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // fluffy tip highlight
  ctx.fillStyle = C.orangeLight;
  ctx.beginPath();
  ctx.arc(ex, ey - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.orangeGlow;
  ctx.beginPath();
  ctx.arc(ex - 1, ey - 6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPaws(ctx, cx, cy, leftY=0, rightY=0, bounce=0) {
  // front paws
  const paws = [
    { x: cx - 10, y: cy + leftY + bounce },
    { x: cx + 10, y: cy + rightY + bounce },
  ];

  paws.forEach(p => {
    // paw body
    ctx.fillStyle = C.creamDark;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 1, 6.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // toe beans
    const beans = [-2.5, 0, 2.5];
    beans.forEach(bx => {
      ctx.fillStyle = C.pawPad;
      ctx.beginPath();
      ctx.arc(p.x + bx, p.y + 1.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = C.pawPad;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawThinkBubble(ctx, cx, cy, frame) {
  const t = (frame * 0.04) % 1;
  const bob = Math.sin(frame * 0.08) * 2;

  // dots trail
  [[cx+20, cy-18, 2.5],
   [cx+26, cy-26, 3.5],
   [cx+30, cy-36, 5]].forEach(([bx, by, br], i) => {
    ctx.globalAlpha = 0.5 + i * 0.15;
    ctx.fillStyle = C.thinkBubble;
    ctx.beginPath();
    ctx.arc(bx, by + bob * (i * 0.3), br, 0, Math.PI * 2);
    ctx.fill();
  });

  // bubble
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = C.thinkBubble;
  ctx.beginPath();
  ctx.arc(cx + 32, cy - 44 + bob, 12, 0, Math.PI * 2);
  ctx.fill();

  // dots inside bubble
  ctx.fillStyle = C.eyeBlueDark;
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cx + 24 + i * 5, cy - 44 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawZzz(ctx, cx, cy, frame) {
  const zs = ['z', 'z', 'Z'];
  zs.forEach((z, i) => {
    const age  = ((frame * 0.02 + i * 0.33) % 1);
    const rise = age * 20;
    const alpha = age < 0.7 ? age / 0.7 : (1 - age) / 0.3;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = C.zzzColor;
    ctx.font = `bold ${8 + i * 3}px sans-serif`;
    ctx.fillText(z, cx + 14 + i * 4 - rise * 0.3, cy - 10 - rise);
  });
  ctx.globalAlpha = 1;
}

function drawSparkles(ctx, cx, cy, frame) {
  const sparks = [
    { ox: -18, oy: -22, phase: 0     },
    { ox:  20, oy: -18, phase: 0.5   },
    { ox: -12, oy: -32, phase: 0.25  },
    { ox:  14, oy: -30, phase: 0.75  },
  ];
  sparks.forEach(s => {
    const a = (Math.sin(frame * 0.12 + s.phase * Math.PI * 2) + 1) * 0.5;
    const size = 2 + a * 3;
    ctx.globalAlpha = a * 0.9;

    // 4-point star
    ctx.fillStyle = s.phase < 0.5 ? C.sparkle : C.sparkle2;
    ctx.save();
    ctx.translate(cx + s.ox, cy + s.oy);
    ctx.rotate(frame * 0.03 + s.phase);
    ctx.beginPath();
    for (let p = 0; p < 4; p++) {
      const angle = (p / 4) * Math.PI * 2;
      const r = p % 2 === 0 ? size : size * 0.3;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

// ─── main draw function ───────────────────────────────────────────────────────

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 *   state     {string}  — animation state
 *   frame     {number}  — incrementing frame counter
 *   eyeTarget {x,y}     — canvas-space coords for eye tracking (optional)
 *   scale     {number}  — uniform scale (default 1, designed for 64x64 canvas)
 *   blink     {number}  — 0..1 blink progress (manage externally or auto)
 */
export function drawMochi(ctx, { state='idle', frame=0, eyeTarget=null, scale=1, blink=0 }) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.scale(scale, scale);

  const cx = (W / scale) / 2;
  const cy = (H / scale) / 2 + 4;

  // ── per-state motion values ──────────────────────────────────────────────
  let bodyBobY   = 0;
  let bodyBobX   = 0;
  let bodyScaleX = 1;
  let bodyScaleY = 1;
  let earPerk    = 0;
  let tailAngle  = 0;
  let tailWag    = 0;
  let leftPawY   = 0;
  let rightPawY  = 0;
  let pawBounce  = 0;
  let headTiltX  = 0;
  let headTiltY  = 0;
  let happyMouth = false;
  let whiskerTwitch = 0;

  switch (state) {
    case 'idle': {
      bodyBobY = sin(frame, 0.03, 1.5);
      tailAngle = sin(frame, 0.025, 0.4);
      tailWag   = sin(frame, 0.025, 0.3);
      earPerk   = (frame % 180 < 8) ? Math.sin((frame % 8) / 8 * Math.PI) : 0;
      break;
    }
    case 'walk': {
      bodyBobY   = Math.abs(sin(frame, 0.15, 3));
      bodyBobX   = sin(frame, 0.15, 2);
      leftPawY   = -Math.max(0, sin(frame, 0.15, 5));
      rightPawY  = -Math.max(0, sin(frame, 0.15, 5, Math.PI));
      tailWag    = sin(frame, 0.1, 0.5);
      break;
    }
    case 'run': {
      bodyBobY   = Math.abs(sin(frame, 0.25, 4));
      bodyBobX   = sin(frame, 0.25, 3);
      bodyScaleX = 1 + Math.abs(sin(frame, 0.25, 0.08));
      bodyScaleY = 1 - Math.abs(sin(frame, 0.25, 0.06));
      leftPawY   = -Math.max(0, sin(frame, 0.25, 8));
      rightPawY  = -Math.max(0, sin(frame, 0.25, 8, Math.PI));
      tailWag    = sin(frame, 0.2, 0.8);
      earPerk    = 0.8;
      break;
    }
    case 'sleep': {
      bodyBobY   = sin(frame, 0.015, 1);
      bodyScaleX = 1.05 + sin(frame, 0.015, 0.04);
      bodyScaleY = 0.92 - sin(frame, 0.015, 0.03);
      tailAngle  = -0.3;
      tailWag    = sin(frame, 0.015, 0.1);
      break;
    }
    case 'think': {
      bodyBobY    = sin(frame, 0.025, 1);
      headTiltX   = -2;
      earPerk     = 0.5 + sin(frame, 0.05, 0.3);
      tailWag     = sin(frame, 0.04, 0.3);
      whiskerTwitch = sin(frame, 0.08, 0.5);
      break;
    }
    case 'typing': {
      const t = frame % 8;
      bodyBobY   = t < 4 ? -1 : 0;
      leftPawY   = t < 4 ? -4 : 0;
      rightPawY  = t >= 4 ? -4 : 0;
      pawBounce  = 0;
      earPerk    = 0.3;
      tailWag    = sin(frame, 0.08, 0.3);
      break;
    }
    case 'happy': {
      bodyBobY   = -Math.abs(sin(frame, 0.12, 4));
      pawBounce  = -Math.abs(sin(frame, 0.12, 3));
      tailWag    = sin(frame, 0.12, 0.8);
      happyMouth = true;
      earPerk    = 0.6 + sin(frame, 0.1, 0.2);
      whiskerTwitch = sin(frame, 0.1, 0.4);
      break;
    }
    case 'excited': {
      bodyBobY   = -Math.abs(sin(frame, 0.18, 6));
      bodyScaleX = 1 + Math.abs(sin(frame, 0.18, 0.05));
      bodyScaleY = 1 - Math.abs(sin(frame, 0.18, 0.04));
      pawBounce  = -Math.abs(sin(frame, 0.18, 5));
      tailWag    = sin(frame, 0.18, 1.0);
      happyMouth = true;
      earPerk    = 1;
      break;
    }
    case 'surprised': {
      bodyBobY   = -3 + sin(frame, 0.08, 1);
      bodyScaleX = 0.92;
      bodyScaleY = 1.1;
      earPerk    = 1;
      whiskerTwitch = sin(frame, 0.2, 1);
      tailAngle  = 0.5;
      break;
    }
    case 'drag': {
      bodyScaleX = 1.08;
      bodyScaleY = 0.88;
      tailWag    = sin(frame, 0.2, 1.2);
      bodyBobY   = sin(frame, 0.15, 2);
      earPerk    = 0.7;
      break;
    }
    case 'wag': {
      tailWag    = sin(frame, 0.15, 1.5);
      tailAngle  = sin(frame, 0.15, 0.5);
      bodyBobY   = sin(frame, 0.07, 1);
      happyMouth = true;
      earPerk    = 0.4;
      break;
    }
  }

  const bx = cx + bodyBobX + headTiltX;
  const by = cy + bodyBobY + headTiltY;

  // ── draw order ────────────────────────────────────────────────────────────

  // 1. drop shadow
  drawShadow(ctx, cx, cy + 18, 18 * bodyScaleX, 5);

  // 2. tail (behind body)
  drawTail(ctx, bx - 18, by + 8, tailAngle, tailWag);

  // 3. body
  drawBody(ctx, bx, by, bodyScaleX, bodyScaleY);

  // 4. ears
  drawEar(ctx, bx - 12, by - 16, 1, earPerk);
  drawEar(ctx, bx + 12, by - 16, -1, earPerk);

  // 5. face elements
  drawEyes(ctx, bx, by - 4, eyeTarget, blink, state, frame);
  drawNose(ctx, bx, by + 4);
  drawMouth(ctx, bx, by + 8, happyMouth);
  drawWhiskers(ctx, bx, by + 5, whiskerTwitch);

  // 6. paws (in front)
  drawPaws(ctx, bx, by + 16, leftPawY, rightPawY, pawBounce);

  // 7. state overlays
  if (state === 'sleep') {
    drawZzz(ctx, bx, by - 20, frame);
  }
  if (state === 'think') {
    drawThinkBubble(ctx, bx, by - 20, frame);
  }
  if (state === 'happy' || state === 'excited') {
    drawSparkles(ctx, bx, by, frame);
  }

  ctx.restore();
}

// ─── blink manager (optional helper) ─────────────────────────────────────────
export function createBlinkManager() {
  let blinkFrame  = 0;
  let nextBlink   = 120 + Math.random() * 200;
  let blinkPhase  = 0;  // 0=open, 1=closing, 2=opening

  return function tick(frame) {
    if (frame >= nextBlink) {
      if (blinkPhase === 0) {
        blinkPhase = 1;
        blinkFrame = frame;
      }
    }
    if (blinkPhase === 1) {
      const t = (frame - blinkFrame) / 6;
      if (t >= 1) { blinkPhase = 2; blinkFrame = frame; return 1; }
      return ease(t);
    }
    if (blinkPhase === 2) {
      const t = (frame - blinkFrame) / 8;
      if (t >= 1) {
        blinkPhase = 0;
        nextBlink  = frame + 100 + Math.random() * 220;
        return 0;
      }
      return 1 - ease(t);
    }
    return 0;
  };
}