// The Meridian Vault — keyboard and mouse. Movement is held keys; smoke, restart,
// start and mute are single presses, so each one fires once per key-down.

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

/** The input state a fresh game starts with. */
export function createInput() {
  return {
    keys: new Set(),
    smokePressed: false,
    restartPressed: false,
    startPressed: false,
    mutePressed: false,
    clickX: -1,
    clickY: -1,
  };
}

/** The move axes from the keys held down right now, each in -1..1. */
export function moveAxes(input) {
  let mx = 0;
  let my = 0;
  for (const key of input.keys) {
    const axis = MOVE_KEYS[key];
    if (axis) {
      mx += axis[0];
      my += axis[1];
    }
  }
  return { mx, my };
}

/** Listen on the window and feed the input state. Returns a function that stops listening. */
export function listenInput(input) {
  function onKeyDown(event) {
    if (event.code in MOVE_KEYS || ['Enter', 'KeyE', 'KeyR', 'KeyM', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyE') input.smokePressed = true;
    if (event.code === 'KeyR') input.restartPressed = true;
    if (event.code === 'Enter' || event.code === 'Space') input.startPressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
  }
  function onKeyUp(event) {
    input.keys.delete(event.code);
  }
  function onMouseDown(event) {
    input.startPressed = true;
    input.clickX = event.clientX;
    input.clickY = event.clientY;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousedown', onMouseDown);
  };
}

/** Clear the one-shot presses after the frame has read them. */
export function clearPresses(input) {
  input.smokePressed = false;
  input.restartPressed = false;
  input.startPressed = false;
  input.mutePressed = false;
  input.clickX = -1;
  input.clickY = -1;
}
