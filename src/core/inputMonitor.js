const MOUSE_FAST_THRESHOLD = 8;
const KEY_BURST_THRESHOLD  = 5;
const KEY_BURST_WINDOW     = 800;
const OVERHEAT_BURSTS      = 3;
const OVERHEAT_WINDOW      = 4000;

export function createInputMonitor(dispatch) {
  let lastMouse    = { x: 0, y: 0, t: 0 };
  let keyBurstBuf  = [];
  let burstCount   = 0;
  let burstWindow  = [];
  let huntingTimer = null;

  function onMouseMove(e) {
    const now = Date.now();
    const dx  = e.screenX - lastMouse.x;
    const dy  = e.screenY - lastMouse.y;
    const dt  = now - lastMouse.t || 1;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;

    if (speed > MOUSE_FAST_THRESHOLD) {
      dispatch('mouse_fast');
      if (huntingTimer) clearTimeout(huntingTimer);
      huntingTimer = setTimeout(() => dispatch('mouse_stop'), 1500);
    }

    lastMouse = { x: e.screenX, y: e.screenY, t: now };
  }

  function onKeyDown() {
    const now = Date.now();
    keyBurstBuf.push(now);
    keyBurstBuf = keyBurstBuf.filter(t => now - t < KEY_BURST_WINDOW);

    if (keyBurstBuf.length >= KEY_BURST_THRESHOLD) {
      dispatch('key_burst');
      burstWindow.push(now);
      burstWindow = burstWindow.filter(t => now - t < OVERHEAT_WINDOW);
      if (burstWindow.length >= OVERHEAT_BURSTS) {
        dispatch('overheat');
      }
    } else {
      dispatch('key_down');
    }
  }

  function onWheel() {
    dispatch('scroll');
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown',   onKeyDown);
  window.addEventListener('wheel',     onWheel);

  return {
    destroy() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown',   onKeyDown);
      window.removeEventListener('wheel',     onWheel);
      if (huntingTimer) clearTimeout(huntingTimer);
    }
  };
}
