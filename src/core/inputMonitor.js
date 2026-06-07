/**
 * companion — input monitor
 * watches mouse and keyboard, fires state machine events
 * runs in the renderer process (Tauri window)
 */

const MOUSE_FAST_THRESHOLD = 8;   // px per ms
const KEY_BURST_THRESHOLD  = 5;   // keys within burst window
const KEY_BURST_WINDOW     = 800; // ms

export function createInputMonitor(dispatch) {
  let lastMouse    = { x: 0, y: 0, t: 0 };
  let keyBurstBuf  = [];
  let huntingTimer = null;
  let mouseMoving  = false;

  function onMouseMove(e) {
    const now = Date.now();
    const dx  = e.screenX - lastMouse.x;
    const dy  = e.screenY - lastMouse.y;
    const dt  = now - lastMouse.t || 1;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;

    if (speed > MOUSE_FAST_THRESHOLD) {
      dispatch('mouse_fast');
      mouseMoving = true;
      if (huntingTimer) clearTimeout(huntingTimer);
      huntingTimer = setTimeout(() => {
        mouseMoving = false;
        dispatch('mouse_stop');
      }, 1500);
    }

    lastMouse = { x: e.screenX, y: e.screenY, t: now };
  }

  function onKeyDown() {
    const now = Date.now();
    keyBurstBuf.push(now);
    // trim old entries
    keyBurstBuf = keyBurstBuf.filter(t => now - t < KEY_BURST_WINDOW);

    if (keyBurstBuf.length >= KEY_BURST_THRESHOLD) {
      dispatch('key_burst');
    } else {
      dispatch('key_down');
    }
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown',   onKeyDown);

  return {
    destroy() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown',   onKeyDown);
    }
  };
}
