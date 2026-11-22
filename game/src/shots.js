// The Meridian Vault — the screenshot scenes behind ?shot=start|play|alarm|win.
// Each one plays the real rules forward from a fresh world for a fixed script of
// moves, so the frame is what a short game really looks like and the same script
// always gives the same frame. No state is placed by hand.

import { STEP } from './config.js';
import { EVENT_BUSTED, EVENT_WIN, createWorld, stepWorld } from './world.js';
import { SCREEN_BUSTED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** One leg of a scripted run: move (mx, my) for `seconds`, dropping smoke if set. */
function leg(seconds, mx, my, smoke = false) {
  return { seconds, mx, my, smoke };
}

/** Walk the script, one fixed step at a time, until it ends or the heist does. */
function runScript(world, script) {
  let events = 0;
  for (const move of script) {
    const steps = Math.round(move.seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      const smoke = move.smoke && i === 0;
      events |= stepWorld(world, STEP, { mx: move.mx, my: move.my, smoke });
      if (events & (EVENT_BUSTED | EVENT_WIN)) return events;
    }
  }
  return events;
}

/** From the service door to the middle of the central hall, under Marlowe's line. */
const TO_HALL = [
  leg(1.11, 0, -1), // up to the door's height
  leg(2.13, 1, 0), // through the west door, across the hall
];

/** From the hall, on through the east door to the vault's far side. The dip to
 *  y=380 threads the east door (gap 320..400) below the crate at (1000, 300). */
const TO_VAULT = [
  ...TO_HALL,
  leg(0.09, 0, 1), // dip below the vault crate's line
  leg(2.34, 1, 0), // through the east door, past Reyes's line
];

/** The whole heist: in, diamond, out through the skylight vent. The grab is
 *  done under smoke: the thief climbs to just below the pedestal, drops a bomb
 *  so the ceiling camera loses the sight line, then takes the diamond. */
const FULL_HEIST = [
  ...TO_HALL,
  leg(0.21, 1, 0), // step right, level with the pedestal's column
  leg(0.65, 0, -1), // climb toward the diamond, under Marlowe's line
  leg(0.15, 0, -1, true), // smoke, then up to the pedestal and take it
  leg(0.8, 0, 1), // back down across Marlowe's line
  leg(2.3, -1, 0), // back through the west door
  leg(1.2, 0, -1), // up the west gallery to the vent
];

/**
 * Set `world` to the named scene (start, play, alarm or win; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world = createWorld();
  if (name !== 'play' && name !== 'alarm' && name !== 'win') {
    runScript(world, [leg(3, 0, 0)]);
    return { world, screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    const events = runScript(world, FULL_HEIST);
    const screen = events & EVENT_WIN ? SCREEN_WIN : events & EVENT_BUSTED ? SCREEN_BUSTED : SCREEN_PLAY;
    return { world, screen, best: 0 };
  }
  if (name === 'alarm') {
    // Linger in the east vault under the camera until the alarm is high, then
    // vanish into smoke at the last moment.
    runScript(world, [...TO_VAULT, leg(5, 0, 0), leg(0.1, 0, 0, true), leg(0.4, 0, 0)]);
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  // Play: cross the vault and hold under the camera until the alarm is climbing.
  runScript(world, [...TO_VAULT, leg(2.5, 0, 0)]);
  return { world, screen: SCREEN_PLAY, best: 0 };
}
