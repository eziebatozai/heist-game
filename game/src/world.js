// The Meridian Vault — the world: one fixed step of the heist. Movement and
// collision, guard patrols and chases, sweeping cameras, vision and line of
// sight, the alarm meter, loot, smoke bombs and the win and lose states.

import { ALARM, CAMERA, GUARD, LOOT, SMOKE, THIEF, WIN_BASE_POINTS } from './config.js';
import { CAMERAS, DIAMOND, EXIT, GOLD_BARS, PATROLS, SOLIDS, SPAWN } from './level.js';

/** A fresh world, ready for a new heist. */
export function createWorld() {
  return {
    time: 0,
    thief: { x: SPAWN.x, y: SPAWN.y, angle: -Math.PI / 2 },
    guards: PATROLS.map((patrol) => ({
      name: patrol.name,
      waypoints: patrol.waypoints,
      x: patrol.waypoints[0].x,
      y: patrol.waypoints[0].y,
      angle: 0,
      waypoint: 1,
      direction: 1,
      wait: 0,
      state: 'patrol',
      lastSeenX: 0,
      lastSeenY: 0,
      memory: 0,
    })),
    cameras: CAMERAS.map((camera) => ({
      x: camera.x,
      y: camera.y,
      facing: camera.facing,
      angle: camera.facing,
      sweep: 0,
    })),
    smoke: [],
    smokeCount: SMOKE.startCount,
    alarm: 0,
    diamondTaken: false,
    goldTaken: GOLD_BARS.map(() => false),
    score: 0,
    timesSpotted: 0,
    spotted: false,
    status: 'playing',
    endTime: 0,
  };
}

/** Does a circle centred at (cx, cy) with radius r touch a rectangle? */
function circleHitsRect(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

/** Does the segment from (x1, y1) to (x2, y2) cross a rectangle? Slab method. */
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [origin, delta, lo, hi] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < lo || origin > hi) return false;
    } else {
      let t1 = (lo - origin) / delta;
      let t2 = (hi - origin) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/** Does the segment from (x1, y1) to (x2, y2) cross a circle? */
function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) {
    const ox = x1 - cx;
    const oy = y1 - cy;
    return ox * ox + oy * oy <= r * r;
  }
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx - cx;
  const py = y1 + t * dy - cy;
  return px * px + py * py <= r * r;
}

/** Is the sight line from (ax, ay) to (bx, by) cut by a wall, a crate or smoke? */
export function sightBlocked(state, ax, ay, bx, by) {
  for (const solid of SOLIDS) {
    if (segmentHitsRect(ax, ay, bx, by, solid)) return true;
  }
  for (const cloud of state.smoke) {
    if (segmentHitsCircle(ax, ay, bx, by, cloud.x, cloud.y, cloud.r)) return true;
  }
  return false;
}

/** Is the target inside a vision cone (range and angle) with a clear sight line? */
function canSee(state, eyeX, eyeY, facing, range, halfAngle, targetX, targetY) {
  const dx = targetX - eyeX;
  const dy = targetY - eyeY;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  let angle = Math.atan2(dy, dx) - facing;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  if (Math.abs(angle) > halfAngle) return false;
  return !sightBlocked(state, eyeX, eyeY, targetX, targetY);
}

/** Move a circle through the level one axis at a time, sliding along walls. */
function moveCircle(body, dx, dy, radius) {
  const nextX = body.x + dx;
  if (!SOLIDS.some((solid) => circleHitsRect(nextX, body.y, radius, solid))) body.x = nextX;
  const nextY = body.y + dy;
  if (!SOLIDS.some((solid) => circleHitsRect(body.x, nextY, radius, solid))) body.y = nextY;
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function stepGuard(state, guard, dt) {
  const thief = state.thief;
  const sees = canSee(state, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightHalfAngle, thief.x, thief.y);
  if (sees) {
    guard.state = 'chase';
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
    guard.memory = GUARD.chaseMemory;
    guard.angle = angleTo(guard.x, guard.y, thief.x, thief.y);
  } else if (guard.state === 'chase') {
    guard.memory -= dt;
    if (guard.memory <= 0) guard.state = 'return';
  }

  if (guard.state === 'chase') {
    const targetX = guard.lastSeenX;
    const targetY = guard.lastSeenY;
    const distance = Math.hypot(targetX - guard.x, targetY - guard.y);
    if (distance > 4) {
      const speed = GUARD.chaseSpeed * dt;
      const stepX = ((targetX - guard.x) / distance) * speed;
      const stepY = ((targetY - guard.y) / distance) * speed;
      const beforeX = guard.x;
      const beforeY = guard.y;
      moveCircle(guard, stepX, stepY, GUARD.radius);
      if (guard.x !== beforeX || guard.y !== beforeY) {
        guard.angle = angleTo(beforeX, beforeY, guard.x, guard.y);
      }
    }
    return;
  }

  if (guard.state === 'return') {
    let nearest = 0;
    let nearestDistance = Infinity;
    for (let i = 0; i < guard.waypoints.length; i += 1) {
      const d = Math.hypot(guard.waypoints[i].x - guard.x, guard.waypoints[i].y - guard.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = i;
      }
    }
    guard.waypoint = nearest;
    guard.direction = 1;
    guard.state = 'patrol';
  }

  // Patrol: walk to the current waypoint, wait there, then turn around.
  if (guard.wait > 0) {
    guard.wait -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypoint];
  const distance = Math.hypot(target.x - guard.x, target.y - guard.y);
  const speed = GUARD.patrolSpeed * dt;
  if (distance <= speed) {
    guard.x = target.x;
    guard.y = target.y;
    guard.wait = GUARD.waitAtWaypoint;
    guard.waypoint += guard.direction;
    if (guard.waypoint >= guard.waypoints.length) {
      guard.waypoint = guard.waypoints.length - 2;
      guard.direction = -1;
    } else if (guard.waypoint < 0) {
      guard.waypoint = 1;
      guard.direction = 1;
    }
    return;
  }
  const stepX = ((target.x - guard.x) / distance) * speed;
  const stepY = ((target.y - guard.y) / distance) * speed;
  moveCircle(guard, stepX, stepY, GUARD.radius);
  guard.angle = angleTo(guard.x, guard.y, target.x, target.y);
}

function stepCamera(camera, dt) {
  camera.sweep += dt * CAMERA.sweepSpeed;
  camera.angle = camera.facing + Math.sin(camera.sweep) * CAMERA.sweepRange;
}

/**
 * One fixed step of the heist. `input` is { mx, my, smoke } where mx/my are the
 * move axes (-1..1) and smoke is true on the step the player drops a bomb.
 * Returns a bitmask of events: EVENT_WIN, EVENT_BUSTED, EVENT_GRAB, EVENT_SPOTTED.
 */
export const EVENT_WIN = 1;
export const EVENT_BUSTED = 2;
export const EVENT_GRAB = 4;
export const EVENT_SPOTTED = 8;

export function stepWorld(state, dt, input) {
  if (state.status !== 'playing') return 0;
  state.time += dt;
  let events = 0;

  // The thief moves; a diagonal is no faster than a straight line.
  const length = Math.hypot(input.mx, input.my);
  if (length > 0.01) {
    const nx = input.mx / Math.max(1, length);
    const ny = input.my / Math.max(1, length);
    moveCircle(state.thief, nx * THIEF.speed * dt, ny * THIEF.speed * dt, THIEF.radius);
    state.thief.angle = Math.atan2(ny, nx);
  }

  // A smoke bomb: a cloud that swallows every sight line through it.
  if (input.smoke && state.smokeCount > 0) {
    state.smokeCount -= 1;
    state.smoke.push({ x: state.thief.x, y: state.thief.y, r: SMOKE.radius, t: SMOKE.lifetime });
  }
  for (let i = state.smoke.length - 1; i >= 0; i -= 1) {
    state.smoke[i].t -= dt;
    if (state.smoke[i].t <= 0) state.smoke.splice(i, 1);
  }

  for (const guard of state.guards) stepGuard(state, guard, dt);
  for (const camera of state.cameras) stepCamera(camera, dt);

  // Who has eyes on the thief right now?
  const guardSees = state.guards.some((guard) =>
    canSee(state, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightHalfAngle, state.thief.x, state.thief.y),
  );
  const cameraSees = state.cameras.some((camera) =>
    canSee(state, camera.x, camera.y, camera.angle, CAMERA.sightRange, CAMERA.sightHalfAngle, state.thief.x, state.thief.y),
  );
  state.spotted = guardSees || cameraSees;
  if (state.spotted && !state.wasSpotted) {
    state.timesSpotted += 1;
    events |= EVENT_SPOTTED;
  }
  state.wasSpotted = state.spotted;

  // The alarm climbs while the thief is seen, and falls while hidden.
  if (guardSees) state.alarm += ALARM.guardRate * dt;
  else if (cameraSees) state.alarm += ALARM.cameraRate * dt;
  else state.alarm -= ALARM.decayRate * dt;
  state.alarm = Math.max(0, Math.min(ALARM.max, state.alarm));

  // The diamond: the case alarm chirps as it leaves the pedestal.
  if (!state.diamondTaken && Math.hypot(state.thief.x - DIAMOND.x, state.thief.y - DIAMOND.y) < LOOT.pickupDistance) {
    state.diamondTaken = true;
    state.score += LOOT.diamondPoints;
    state.alarm = Math.min(ALARM.max, state.alarm + ALARM.grabSpike);
    events |= EVENT_GRAB;
  }
  for (let i = 0; i < GOLD_BARS.length; i += 1) {
    if (!state.goldTaken[i] && Math.hypot(state.thief.x - GOLD_BARS[i].x, state.thief.y - GOLD_BARS[i].y) < LOOT.pickupDistance) {
      state.goldTaken[i] = true;
      state.score += LOOT.goldPoints;
      events |= EVENT_GRAB;
    }
  }

  // A guard close enough to grab the thief ends the heist.
  const caught = state.guards.some(
    (guard) => Math.hypot(guard.x - state.thief.x, guard.y - state.thief.y) < GUARD.catchDistance,
  );
  if (caught || state.alarm >= ALARM.max) {
    state.status = 'busted';
    state.endTime = state.time;
    return events | EVENT_BUSTED;
  }

  // Diamond in hand, reach the skylight vent and the getaway is clean.
  if (state.diamondTaken && Math.hypot(state.thief.x - EXIT.x, state.thief.y - EXIT.y) < EXIT.radius + THIEF.radius) {
    state.status = 'won';
    state.endTime = state.time;
    state.score += WIN_BASE_POINTS + Math.max(0, 600 - Math.floor(state.time) * 5);
    return events | EVENT_WIN;
  }

  return events;
}

/** How many gold bars the thief has pocketed. */
export function goldCount(state) {
  return state.goldTaken.filter(Boolean).length;
}
