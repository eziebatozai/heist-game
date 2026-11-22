// The Meridian Vault — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  speed: 235,
  /** How long, in seconds, the thief is hidden inside their own smoke. */
  smokeTime: 4,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 95,
  chaseSpeed: 155,
  /** Seconds a guard keeps chasing after losing sight of the thief. */
  chaseMemory: 2.5,
  /** Seconds a guard waits at each patrol waypoint before moving on. */
  waitAtWaypoint: 1.1,
  /** How close, in pixels, a guard must get to catch the thief. */
  catchDistance: 26,
  /** Vision cone: how far a guard sees, and its half-angle in radians. */
  sightRange: 250,
  sightHalfAngle: 0.61,
};

export const CAMERA = {
  /** Vision cone: how far a camera sees, and its half-angle in radians. */
  sightRange: 285,
  sightHalfAngle: 0.52,
  /** Radians per second the camera sweeps. */
  sweepSpeed: 0.55,
  /** How far, in radians, the sweep turns either side of its facing. */
  sweepRange: 0.8,
};

export const ALARM = {
  /** Points per second the meter gains while a guard has eyes on the thief. */
  guardRate: 30,
  /** Points per second the meter gains while a camera has eyes on the thief. */
  cameraRate: 22,
  /** Points the meter gains the moment the diamond leaves its pedestal. */
  grabSpike: 12,
  /** Points per second the meter falls while nobody sees the thief. */
  decayRate: 8,
  max: 100,
};

export const LOOT = {
  diamondPoints: 500,
  goldPoints: 150,
  /** How close, in pixels, the thief must get to pick a piece of loot up. */
  pickupDistance: 30,
};

export const SMOKE = {
  /** Smoke bombs the thief starts with. */
  startCount: 2,
  radius: 92,
  lifetime: 4,
};

/** Points for a clean getaway, before the time bonus. */
export const WIN_BASE_POINTS = 200;

export const PALETTE = {
  backdrop: '#0d0f14',
  floor: '#1a1d27',
  floorTile: '#20242f',
  wall: '#3a4152',
  wallTop: '#4a5266',
  crate: '#6b5433',
  crateTop: '#8a6d42',
  plinth: '#2c3140',
  gold: '#f2c94c',
  diamond: '#7fe7ff',
  exit: '#58d68d',
  exitGlow: '#2ecc71',
  thief: '#e8e4d8',
  thiefCoat: '#23272f',
  guard: '#e5534b',
  guardCone: 'rgba(242, 201, 76, 0.20)',
  guardConeEdge: 'rgba(242, 201, 76, 0.55)',
  camera: '#ff6b6b',
  cameraCone: 'rgba(255, 107, 107, 0.16)',
  cameraConeEdge: 'rgba(255, 107, 107, 0.5)',
  smoke: 'rgba(200, 205, 215, 0.55)',
  panel: '#14171f',
  panelEdge: '#2c3242',
  text: '#eef1f5',
  muted: '#8b93a3',
  alarmLow: '#58d68d',
  alarmMid: '#f2c94c',
  alarmHigh: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'meridian-vault.best';
