// Keyboard and pointer input. Held keys give a steering vector; one-shot presses (start,
// restart, pause, tools) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice. A mouse click throws a smoke
// bomb toward the click point; a right-click fires the EMP.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;
export const ACTION_EMP = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const SMOKE = new Set(['KeyQ']);
const EMP = new Set(['KeyE']);

export function createInput(target) {
  const keys = { up: false, down: false, left: false, right: false };
  let actions = 0;
  let click = null;

  function clearKeys() {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) keys.up = true;
    else if (DOWN.has(event.code)) keys.down = true;
    else if (LEFT.has(event.code)) keys.left = true;
    else if (RIGHT.has(event.code)) keys.right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (SMOKE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else if (EMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_EMP;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) keys.up = false;
    else if (DOWN.has(event.code)) keys.down = false;
    else if (LEFT.has(event.code)) keys.left = false;
    else if (RIGHT.has(event.code)) keys.right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', clearKeys);

  // Left click: confirm on a menu screen, otherwise throw a smoke bomb toward the point.
  target.addEventListener('pointerdown', (event) => {
    if (event.button === 0) {
      const rect = target.getBoundingClientRect();
      click = { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
      actions |= ACTION_CONFIRM | ACTION_SMOKE;
    }
  });
  // Right click: EMP. The context menu is suppressed on the canvas.
  target.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    actions |= ACTION_EMP;
  });

  return {
    /** Normalised steering vector {x, y}, each component -1, 0 or 1. */
    steer() {
      const x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      const y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        return { x: x * inv, y: y * inv };
      }
      return { x, y };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click's canvas point (and the canvas size then), consumed on read. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
