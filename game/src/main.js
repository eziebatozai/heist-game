// The Meridian Vault — boot and the game loop. The canvas scales the fixed
// 1280x720 field to the window; the world steps at a fixed 60 Hz whatever the
// display's rate. ?shot=start|play|alarm|win stages a screenshot scene instead
// of starting the game, and the frame it leaves is the shot.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { EVENT_BUSTED, EVENT_GRAB, EVENT_SPOTTED, EVENT_WIN, createWorld, stepWorld } from './world.js';
import { SCREEN_BUSTED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, drawScreen, fitCanvas } from './render.js';
import { clearPresses, createInput, listenInput, moveAxes } from './input.js';
import { playBusted, playGrab, playSpotted, playWin, toggleMute } from './sound.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;

/** Resize the canvas to the window, keeping the field's aspect. */
function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
window.addEventListener('resize', resize);
resize();

let world = createWorld();
let screen = SCREEN_TITLE;
let input = createInput();
let accumulator = 0;
let lastTime = 0;

/** The game after a shot scene, or a fresh start: draw one frame and stop. */
function drawShotFrame() {
  const staged = stageShot(shotName, world);
  world = staged.world;
  screen = staged.screen;
  const { scale, offsetX, offsetY } = fitCanvas(canvas);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#0d0f14';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  drawScreen(context, world, screen, staged.best || best);
  document.title = `The Meridian Vault — shot ${shotName}`;
}

/** Start a new heist from the title screen. */
function startGame() {
  world = createWorld();
  screen = SCREEN_PLAY;
  accumulator = 0;
  lastTime = performance.now();
  statusLine.textContent = 'The heist is on. Grab the diamond and reach the exit.';
}

function frame(now) {
  requestAnimationFrame(frame);
  if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_BUSTED) {
    if (input.startPressed && screen === SCREEN_TITLE) startGame();
    else if (input.restartPressed) startGame();
    if (input.mutePressed) toggleMute();
    clearPresses(input);
    const { scale, offsetX, offsetY } = fitCanvas(canvas);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#0d0f14';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawScreen(context, world, screen, best);
    return;
  }

  const elapsed = Math.min(0.1, (now - lastTime) / 1000 || 0);
  lastTime = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    accumulator -= STEP;
    const axes = moveAxes(input);
    const events = stepWorld(world, STEP, { mx: axes.mx, my: axes.my, smoke: input.smokePressed });
    if (events & EVENT_GRAB) playGrab();
    if (events & EVENT_SPOTTED) playSpotted();
    if (events & EVENT_WIN) {
      screen = SCREEN_WIN;
      playWin();
      const score = world.score;
      if (score > best) localStorage.setItem(BEST_KEY, String(score));
      statusLine.textContent = `Clean getaway! Score ${score} points.`;
    } else if (events & EVENT_BUSTED) {
      screen = SCREEN_BUSTED;
      playBusted();
      statusLine.textContent = 'Busted! The alarm hit the roof.';
    }
  }
  if (input.mutePressed) toggleMute();
  if (input.restartPressed) startGame();
  clearPresses(input);

  const { scale, offsetX, offsetY } = fitCanvas(canvas);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#0d0f14';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  drawScreen(context, world, screen, best);
}

if (shotName) {
  listenInput(input);
  // Draw on the next frame (after layout settles) and again on any resize:
  // a resize resets the canvas bitmap, so a single draw at load can be wiped.
  drawShotFrame();
  requestAnimationFrame(drawShotFrame);
  window.addEventListener('resize', drawShotFrame);
} else {
  listenInput(input);
  lastTime = performance.now();
  requestAnimationFrame(frame);
}
