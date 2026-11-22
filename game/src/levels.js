// The museum's floor plan: walls, display cases to hide behind, guard patrol routes,
// camera mounts, loot and the getaway exit. Everything is a rectangle or a waypoint list,
// so the world can test collisions and line of sight against plain data.
//
// Layout (play area y = 56..720, x = 0..1280):
//   west wing (entry) | central gallery | east wing, with the vault room top-right.
//   The thief enters bottom-left, the diamond sits in the vault, the exit is bottom-right.

export const WALLS = [
  // Outer walls (16 thick).
  { x: 0, y: 56, width: 1280, height: 16 },
  { x: 0, y: 704, width: 1280, height: 16 },
  { x: 0, y: 56, width: 16, height: 664 },
  { x: 1264, y: 56, width: 16, height: 664 },
  // West / central divider, with a door gap in the middle.
  { x: 420, y: 72, width: 16, height: 300 },
  { x: 420, y: 428, width: 16, height: 276 },
  // North gallery divider, with a door gap near the centre.
  { x: 436, y: 300, width: 200, height: 16 },
  { x: 692, y: 300, width: 220, height: 16 },
  // Vault room (top-right): left wall with a door gap, bottom wall.
  { x: 944, y: 72, width: 16, height: 128 },
  { x: 944, y: 256, width: 16, height: 44 },
  { x: 944, y: 284, width: 320, height: 16 },
  // A stub wall jutting from the east wall, making the vault approach a corridor.
  { x: 1120, y: 420, width: 144, height: 16 },
];

/** Low display cases: solid cover the thief and guards walk around, but not sight-blocking. */
export const CASES = [
  { x: 560, y: 420, width: 96, height: 52, label: 'urns' },
  { x: 760, y: 480, width: 96, height: 52, label: 'coins' },
  { x: 600, y: 160, width: 96, height: 52, label: 'masks' },
  { x: 180, y: 180, width: 96, height: 52, label: 'vases' },
  { x: 180, y: 520, width: 96, height: 52, label: 'scrolls' },
  { x: 1020, y: 520, width: 96, height: 52, label: 'gems' },
];

/** All solid rectangles: walls plus cases, for movement collision. */
export const SOLIDS = [...WALLS, ...CASES];

/** Guard patrols: a name, a loop of waypoints and a walking speed multiplier. */
export const GUARD_ROUTES = [
  {
    name: 'Rook',
    waypoints: [
      { x: 500, y: 190 },
      { x: 860, y: 190 },
      { x: 860, y: 520 },
      { x: 500, y: 520 },
    ],
  },
  {
    name: 'Bishop',
    waypoints: [
      { x: 150, y: 140 },
      { x: 340, y: 140 },
      { x: 340, y: 560 },
      { x: 150, y: 560 },
    ],
  },
  {
    name: 'Knight',
    waypoints: [
      { x: 1000, y: 380 },
      { x: 1200, y: 380 },
      { x: 1200, y: 620 },
      { x: 1000, y: 620 },
    ],
  },
];

/** Security cameras: a wall mount, a base facing angle and how far it sweeps each way. */
export const CAMERA_MOUNTS = [
  { x: 700, y: 72, baseAngle: Math.PI / 2, sweep: 1.0, name: 'CAM-1' },
  { x: 1264, y: 470, baseAngle: Math.PI, sweep: 0.85, name: 'CAM-2' },
  { x: 1110, y: 72, baseAngle: Math.PI / 2, sweep: 0.7, name: 'CAM-3' },
];

/** Loot on the floor: the diamond is the job; the rest is bonus worth the risk. */
export const LOOT_SPOTS = [
  { kind: 'diamond', x: 1150, y: 165, name: 'The Star of Midnight' },
  { kind: 'painting', x: 856, y: 140, name: 'Portrait of a Lady' },
  { kind: 'goldBar', x: 608, y: 510, name: 'Gold bar' },
  { kind: 'goldBar', x: 228, y: 616, name: 'Gold bar' },
];

export const THIEF_START = { x: 82, y: 628 };

/** The getaway door in the bottom wall; it opens once the diamond is taken. */
export const EXIT = { x: 1150, y: 672, width: 84, height: 32 };
