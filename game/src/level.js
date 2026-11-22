// The Meridian Vault — the museum's floor plan: walls, cover, patrol routes,
// cameras, loot, the exit and the thief's way in. One room is crossed at a time;
// every wall and crate blocks both movement and sight.

/** The outer walls and the two room dividers. A wall is { x, y, w, h }. */
export const WALLS = [
  // Outer shell, 24 thick.
  { x: 0, y: 0, w: 1280, h: 24 },
  { x: 0, y: 696, w: 1280, h: 24 },
  { x: 0, y: 0, w: 24, h: 720 },
  { x: 1256, y: 0, w: 24, h: 720 },
  // Divider between the west gallery and the central hall, with a door gap.
  { x: 420, y: 24, w: 16, h: 296 },
  { x: 420, y: 400, w: 16, h: 296 },
  // Divider between the central hall and the east vault, with a door gap.
  { x: 860, y: 24, w: 16, h: 296 },
  { x: 860, y: 400, w: 16, h: 296 },
];

/** Crates and plinths: solid cover the thief hides behind. A crate is { x, y, w, h }. */
export const CRATES = [
  // West gallery.
  { x: 200, y: 280, w: 64, h: 64 },
  { x: 300, y: 540, w: 56, h: 56 },
  // Central hall, around the diamond.
  { x: 500, y: 150, w: 64, h: 64 },
  { x: 740, y: 140, w: 56, h: 56 },
  { x: 520, y: 520, w: 56, h: 56 },
  { x: 750, y: 520, w: 64, h: 64 },
  // East vault.
  { x: 1000, y: 300, w: 64, h: 64 },
  { x: 1120, y: 480, w: 56, h: 56 },
];

/** Every solid rectangle in the level: walls and crates together. */
export const SOLIDS = [...WALLS, ...CRATES];

/** The thief slips in through the service door at the bottom of the west gallery. */
export const SPAWN = { x: 100, y: 620 };

/** The exit: the skylight vent in the west gallery's top corner. It opens only
 *  once the diamond is taken. */
export const EXIT = { x: 78, y: 78, radius: 30 };

/** The Meridian Diamond, on its pedestal in the central hall — just above
 *  Marlowe's patrol line, so taking it means crossing his beat. */
export const DIAMOND = { x: 648, y: 170, radius: 16 };

/** Gold bars tucked into the east vault, worth a detour. */
export const GOLD_BARS = [
  { x: 1160, y: 120, radius: 13 },
  { x: 1160, y: 600, radius: 13 },
  { x: 960, y: 120, radius: 13 },
];

/** A guard patrol: a name and the waypoints it walks, back and forth. */
export const PATROLS = [
  {
    name: 'Marlowe',
    waypoints: [
      { x: 480, y: 280 },
      { x: 800, y: 280 },
    ],
  },
  {
    name: 'Okafor',
    waypoints: [
      { x: 250, y: 150 },
      { x: 250, y: 560 },
    ],
  },
  {
    name: 'Reyes',
    waypoints: [
      { x: 1050, y: 150 },
      { x: 1050, y: 560 },
    ],
  },
];

/** A wall camera: where it hangs, which way it faces at rest, and how far it sweeps. */
export const CAMERAS = [
  // Above the diamond, sweeping the central hall.
  { x: 648, y: 40, facing: Math.PI / 2, mount: 'ceiling' },
  // On the east wall of the vault, sweeping across it.
  { x: 1240, y: 360, facing: Math.PI, mount: 'wall' },
];
