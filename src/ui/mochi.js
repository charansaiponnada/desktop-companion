const C = {
  cream:      '#F5ECD7',
  creamDark:  '#EDD9B4',
  creamDeep:  '#D4B896',
  orange:     '#E8834A',
  orangeLight:'#F0A070',
  orangeGlow: '#FFCFA0',
  eyeWhite:   '#FEFEFE',
  eyeBlue:    '#5BB8F5',
  eyeBlueDark:'#2E86C1',
  pupil:      '#1A1A2E',
  pupilShine: '#FFFFFF',
  nose:       '#F48FB1',
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
  steam:      'rgba(220,230,255,0.35)',
  steamBright:'rgba(240,245,255,0.5)',
  heart:      '#FF6B8A',
  heartLight: '#FF9FB5',
  paper:      '#F5F0E8',
  paperLine:  '#D0C8B8',
};

function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a, b, t) { return a + (b - a) * t; }
function sin(f, s=1, a=1, o=0) { return Math.sin(f*s+o)*a; }

function drawGlow(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, r*.2, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
}

function drawShadow(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.fillStyle = C.shadow;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBody(ctx, cx, cy, sx=1, sy=1, colors) {
  const c = { ...C, ...colors };
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
  drawGlow(ctx, 0, 0, 30, c.glow);
  ctx.fillStyle = c.cream;
  ctx.beginPath(); ctx.ellipse(0, 2, 22, 20, 0, 0, Math.PI*2); ctx.fill();
  const belly = ctx.createRadialGradient(0, 4, 2, 0, 4, 16);
  belly.addColorStop(0, 'rgba(255,255,255,0.5)');
  belly.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = belly;
  ctx.beginPath(); ctx.ellipse(0, 5, 14, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = c.creamDark;
  ctx.beginPath(); ctx.ellipse(0, 8, 18, 12, 0, Math.PI*.1, Math.PI*.9); ctx.fill();
  ctx.restore();
}

function drawEar(ctx, cx, cy, flip=1, perk=0, colors) {
  const c = { ...C, ...colors };
  ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
  const lift = perk * 3;
  ctx.fillStyle = c.cream;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -14-lift, 8, -18-lift, 12, -8);
  ctx.bezierCurveTo(8, -4, 4, -2, 0, 0); ctx.fill();
  ctx.fillStyle = c.orange; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(1, -1);
  ctx.bezierCurveTo(-1, -10-lift, 5, -13-lift, 9, -7);
  ctx.bezierCurveTo(7, -4, 3, -2, 1, -1); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawEyes(ctx, cx, cy, et, blink, state, frame, colors) {
  const c = { ...C, ...colors };
  [{x:cx-8,y:cy},{x:cx+8,y:cy}].forEach(eye=>{
    ctx.save(); ctx.translate(eye.x, eye.y);
    const bH = blink > 0 ? lerp(10, 1, blink) : 10;
    ctx.fillStyle = c.eyeWhite;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, bH, 0, 0, Math.PI*2); ctx.fill();
    if (blink < 0.8) {
      const dx = et ? (et.x - eye.x) : 0, dy = et ? (et.y - eye.y) : 0;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const px = (dx/dist) * Math.min(dist*.04, 2.5), py = (dy/dist) * Math.min(dist*.04, 2.5);
      const ig = ctx.createRadialGradient(px-1, py-1, .5, px, py, 6);
      ig.addColorStop(0, c.eyeBlue); ig.addColorStop(1, c.eyeBlueDark);
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.ellipse(px, py, 6, Math.min(6, bH-1), 0, 0, Math.PI*2); ctx.fill();
      const pupilR = (state==='excited'||state==='happy') ? 4.5 : 3.5;
      ctx.fillStyle = c.pupil;
      ctx.beginPath(); ctx.ellipse(px, py, pupilR, Math.min(pupilR, bH-2), 0, 0, Math.PI*2); ctx.fill();
      if (state === 'excited') {
        const sa = (Math.sin(frame*.15)+1)*.5;
        ctx.strokeStyle = c.sparkle; ctx.globalAlpha = sa*.8; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = c.pupilShine;
      ctx.beginPath(); ctx.arc(px-1.5, py-2, 1.8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px+1.5, py+1, .8, 0, Math.PI*2); ctx.fill();
    }
    if (blink > 0.3) {
      ctx.fillStyle = c.cream;
      ctx.beginPath(); ctx.ellipse(0, -bH*(1-blink), 9, bH*blink, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  });
}

function drawNose(ctx, cx, cy) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = C.nose;
  ctx.beginPath(); ctx.ellipse(0, 0, 3, 2.2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(-.8, -.6, .9, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawMouth(ctx, cx, cy, happy=false) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = C.mouth; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  if (happy) {
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-2, 4, 0, 4);
    ctx.quadraticCurveTo(2, 4, 4, 0); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(0, 2.5, 3, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawWhiskers(ctx, cx, cy, twitch=0) {
  ctx.save(); ctx.strokeStyle = C.whisker; ctx.lineWidth = .8; ctx.lineCap = 'round';
  const tw = twitch * 1.5;
  [[cx-6, cy-1+tw, cx-22, cy-3+tw],[cx-6, cy+1, cx-22, cy+2],[cx-6, cy+3-tw, cx-22, cy+6-tw],
   [cx+6, cy-1+tw, cx+22, cy-3+tw],[cx+6, cy+1, cx+22, cy+2],[cx+6, cy+3-tw, cx+22, cy+6-tw]]
  .forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  ctx.restore();
}

function drawTail(ctx, cx, cy, angle=0, wag=0, colors) {
  const c = { ...C, ...colors };
  ctx.save(); ctx.translate(cx, cy);
  const cp1x = 10+wag*8, cp1y = -8, cp2x = 22+wag*10, cp2y = -20+angle*10, ex = 18+wag*6, ey = -28+angle*8;
  ctx.strokeStyle = c.cream; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey); ctx.stroke();
  ctx.strokeStyle = c.orange; ctx.lineWidth = 7; ctx.globalAlpha = .9;
  ctx.beginPath(); ctx.moveTo(ex-2, ey+2); ctx.bezierCurveTo(ex, ey-2, ex+2, ey-6, ex, ey-8); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.orangeLight;
  ctx.beginPath(); ctx.arc(ex, ey-5, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = c.orangeGlow;
  ctx.beginPath(); ctx.arc(ex-1, ey-6, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPaws(ctx, cx, cy, ly=0, ry=0, bounce=0) {
  [{x:cx-10,y:cy+ly+bounce},{x:cx+10,y:cy+ry+bounce}].forEach(p=>{
    ctx.fillStyle = C.creamDark;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(p.x, p.y-1, 6.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
    [-2.5,0,2.5].forEach(bx=>{
      ctx.fillStyle = C.pawPad;
      ctx.beginPath(); ctx.arc(p.x+bx, p.y+1.5, 1.3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = C.pawPad;
    ctx.beginPath(); ctx.arc(p.x, p.y-.5, 2, 0, Math.PI*2); ctx.fill();
  });
}

function drawZzz(ctx, cx, cy, frame) {
  ['z','z','Z'].forEach((z,i)=>{
    const age = ((frame*.02+i*.33)%1), rise = age*20, alpha = age<.7 ? age/.7 : (1-age)/.3;
    ctx.globalAlpha = alpha*.8; ctx.fillStyle = C.zzzColor;
    ctx.font = `bold ${8+i*3}px sans-serif`;
    ctx.fillText(z, cx+14+i*4-rise*.3, cy-10-rise);
  }); ctx.globalAlpha = 1;
}

function drawThinkBubble(ctx, cx, cy, frame) {
  const bob = Math.sin(frame*.08)*2;
  [[cx+20,cy-18,2.5],[cx+26,cy-26,3.5],[cx+30,cy-36,5]].forEach(([bx,by,br],i)=>{
    ctx.globalAlpha = .5+i*.15; ctx.fillStyle = C.thinkBubble;
    ctx.beginPath(); ctx.arc(bx, by+bob*(i*.3), br, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = .9; ctx.fillStyle = C.thinkBubble;
  ctx.beginPath(); ctx.arc(cx+32, cy-44+bob, 12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = C.eyeBlueDark; ctx.globalAlpha = .6+Math.sin(frame*.1)*.2;
  for (let i=0;i<3;i++){ctx.beginPath();ctx.arc(cx+24+i*5,cy-44+bob,1.8,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha = 1;
}

function drawSparkles(ctx, cx, cy, frame) {
  [{ox:-18,oy:-22,phase:0},{ox:20,oy:-18,phase:.5},{ox:-12,oy:-32,phase:.25},{ox:14,oy:-30,phase:.75}]
  .forEach(s=>{
    const a = (Math.sin(frame*.12+s.phase*Math.PI*2)+1)*.5, size = 2+a*3;
    ctx.globalAlpha = a*.9; ctx.fillStyle = s.phase<.5 ? C.sparkle : C.sparkle2;
    ctx.save(); ctx.translate(cx+s.ox, cy+s.oy); ctx.rotate(frame*.03+s.phase);
    ctx.beginPath();
    for (let p=0;p<4;p++){const angle=(p/4)*Math.PI*2,r=p%2===0?size:size*.3;ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);}
    ctx.closePath(); ctx.fill(); ctx.restore();
  }); ctx.globalAlpha = 1;
}

function drawSteam(ctx, cx, cy, frame) {
  for (let i = 0; i < 5; i++) {
    const age = ((frame * 0.03 + i * 0.2) % 1);
    const rise = age * 28;
    const drift = Math.sin(age * Math.PI * 2 + i) * 6;
    const alpha = age < 0.6 ? age / 0.6 : (1 - age) / 0.4;
    const r = 4 + age * 6;
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = C.steam;
    ctx.beginPath();
    ctx.arc(cx + drift, cy - 14 - rise, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHearts(ctx, cx, cy, frame) {
  for (let i = 0; i < 3; i++) {
    const age = ((frame * 0.02 + i * 0.33) % 1);
    const rise = age * 18;
    const drift = Math.sin(age * Math.PI * 2 + i * 1.5) * 5;
    const alpha = age < 0.5 ? age / 0.5 : (1 - age) / 0.5;
    const s = 2 + age * 3;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = i % 2 === 0 ? C.heart : C.heartLight;
    ctx.save();
    ctx.translate(cx - 14 + drift + i * 3, cy - 10 - rise);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
    ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawPaper(ctx, cx, cy, frame) {
  const progress = Math.min((frame % 120) / 120, 1);
  const unroll = progress * 30;
  ctx.save();
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.roundRect(cx - 14, cy + 12, 28, 4 + unroll, 2);
  ctx.fill();
  ctx.strokeStyle = C.paperLine;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    const ly = cy + 14 + i * ((4 + unroll) / 3);
    ctx.beginPath();
    ctx.moveTo(cx - 10, ly);
    ctx.lineTo(cx + 10, ly);
    ctx.stroke();
  }
  ctx.fillStyle = C.creamDark;
  ctx.beginPath();
  ctx.ellipse(cx - 14, cy + 14 + unroll, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 14, cy + 14 + unroll, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBodyStretched(ctx, cx, cy, frame) {
  const t = (frame % 90) / 90;
  let sy;
  if (t < 0.3) sy = lerp(1, 1.35, t / 0.3);
  else if (t < 0.6) sy = lerp(1.35, 1.4, (t - 0.3) / 0.3);
  else sy = lerp(1.4, 1, (t - 0.6) / 0.4);
  const earLift = (sy - 1) * 15;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.95, sy);
  drawGlow(ctx, 0, 0, 30, C.glow);
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.ellipse(0, 2 + (sy - 1) * 5, 22, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  const belly = ctx.createRadialGradient(0, 4, 2, 0, 4, 16);
  belly.addColorStop(0, 'rgba(255,255,255,0.5)');
  belly.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0, 5 + (sy - 1) * 4, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx - 12, cy - 16 - earLift);
  const lift = earLift * 0.3;
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -14 - lift, 8, -18 - lift, 12, -8);
  ctx.bezierCurveTo(8, -4, 4, -2, 0, 0);
  ctx.fill();
  ctx.fillStyle = C.orange; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(1, -1);
  ctx.bezierCurveTo(-1, -10 - lift, 5, -13 - lift, 9, -7);
  ctx.bezierCurveTo(7, -4, 3, -2, 1, -1);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  ctx.translate(cx + 12, cy - 16 - earLift);
  ctx.scale(-1, 1);
  const lift2 = earLift * 0.3;
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -14 - lift2, 8, -18 - lift2, 12, -8);
  ctx.bezierCurveTo(8, -4, 4, -2, 0, 0);
  ctx.fill();
  ctx.fillStyle = C.orange; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(1, -1);
  ctx.bezierCurveTo(-1, -10 - lift2, 5, -13 - lift2, 9, -7);
  ctx.bezierCurveTo(7, -4, 3, -2, 1, -1);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPawsUp(ctx, cx, cy, frame) {
  const t = (frame % 90) / 90;
  let pawY;
  if (t < 0.3) pawY = lerp(10, -8, t / 0.3);
  else if (t < 0.6) pawY = lerp(-8, -12, (t - 0.3) / 0.3);
  else pawY = lerp(-12, 10, (t - 0.6) / 0.4);
  [{x:cx-10,y:cy+pawY},{x:cx+10,y:cy+pawY}].forEach(p=>{
    ctx.fillStyle = C.creamDark;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(p.x, p.y-1, 6.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
    [-2.5,0,2.5].forEach(bx=>{
      ctx.fillStyle = C.pawPad;
      ctx.beginPath(); ctx.arc(p.x+bx, p.y+1.5, 1.3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = C.pawPad;
    ctx.beginPath(); ctx.arc(p.x, p.y-.5, 2, 0, Math.PI*2); ctx.fill();
  });
}

export function drawMochi(ctx, { state='idle', frame=0, eyeTarget=null, scale=1, blink=0, colors }) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.scale(scale, scale);

  const pal = { ...C, ...colors };
  const cx = (W / scale) / 2;
  const cy = (H / scale) / 2 + 4;

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
  let useStretchBody = false;
  let usePawsUp = false;

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
    case 'stretch': {
      useStretchBody = true;
      usePawsUp = true;
      tailAngle = -0.2;
      tailWag = sin(frame, 0.05, 0.2);
      earPerk = 1;
      break;
    }
    case 'overheat': {
      bodyBobY = Math.abs(sin(frame, 0.2, 2));
      headTiltX = sin(frame, 0.15, 1);
      earPerk = 0.8;
      tailWag = sin(frame, 0.15, 0.6);
      happyMouth = false;
      whiskerTwitch = 1;
      bodyScaleX = 1.02;
      bodyScaleY = 0.98;
      break;
    }
    case 'jump': {
      const t = (frame % 50) / 50;
      if (t < 0.15) {
        bodyBobY = lerp(0, -15, t / 0.15);
        bodyScaleY = lerp(1, 0.85, t / 0.15);
      } else if (t < 0.5) {
        bodyBobY = lerp(-15, -22, (t - 0.15) / 0.35);
        bodyScaleY = lerp(0.85, 1.1, (t - 0.15) / 0.35);
      } else if (t < 0.8) {
        bodyBobY = lerp(-22, -5, (t - 0.5) / 0.3);
        bodyScaleY = lerp(1.1, 1, (t - 0.5) / 0.3);
      } else {
        bodyBobY = lerp(-5, 0, (t - 0.8) / 0.2);
      }
      pawBounce = bodyBobY * 0.3;
      earPerk = 1;
      happyMouth = true;
      tailWag = 1;
      tailAngle = 0.3;
      break;
    }
    case 'purr': {
      bodyBobY = sin(frame, 0.4, 0.5);
      bodyBobX = sin(frame, 0.35, 0.3);
      earPerk = 0.6 + sin(frame, 0.3, 0.15);
      tailWag = sin(frame, 0.3, 0.4);
      happyMouth = true;
      break;
    }
    case 'paper': {
      bodyBobY = sin(frame, 0.04, 1);
      earPerk = 0.5;
      tailWag = sin(frame, 0.06, 0.3);
      headTiltX = -3;
      break;
    }
  }

  const bx = cx + bodyBobX + headTiltX;
  const by = cy + bodyBobY + headTiltY;

  drawShadow(ctx, cx, cy + 18, 18 * bodyScaleX, 5);

  drawTail(ctx, bx - 18, by + 8, tailAngle, tailWag, pal);

  if (useStretchBody) {
    drawBodyStretched(ctx, bx, by, frame);
  } else {
    drawBody(ctx, bx, by, bodyScaleX, bodyScaleY, pal);
  }

  if (!useStretchBody) {
    drawEar(ctx, bx - 12, by - 16, 1, earPerk, pal);
    drawEar(ctx, bx + 12, by - 16, -1, earPerk, pal);
  }

  drawEyes(ctx, bx, by - 4, eyeTarget, blink, state, frame, pal);
  drawNose(ctx, bx, by + 4);
  drawMouth(ctx, bx, by + 8, happyMouth);
  drawWhiskers(ctx, bx, by + 5, whiskerTwitch);

  if (usePawsUp) {
    drawPawsUp(ctx, bx, by + 16, frame);
  } else {
    drawPaws(ctx, bx, by + 16, leftPawY, rightPawY, pawBounce);
  }

  if (state === 'sleep') drawZzz(ctx, bx, by - 20, frame);
  if (state === 'think') drawThinkBubble(ctx, bx, by - 20, frame);
  if (state === 'happy' || state === 'excited') drawSparkles(ctx, bx, by, frame);
  if (state === 'overheat') drawSteam(ctx, bx, by, frame);
  if (state === 'purr') drawHearts(ctx, bx, by, frame);
  if (state === 'paper') drawPaper(ctx, bx, by, frame);

  ctx.restore();
}

export function createBlinkManager() {
  let blinkFrame  = 0;
  let nextBlink   = 120 + Math.random() * 200;
  let blinkPhase  = 0;

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
