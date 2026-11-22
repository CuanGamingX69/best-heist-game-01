// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
// The top 56 pixels are the HUD strip; the museum floor runs from y = 56 to y = 720.

export const FIELD = { width: 1280, height: 720, hudHeight: 56 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  speed: 265,
  /** Seconds of grace after being caught out of a cone before the alarm starts falling. */
  seenGrace: 0.35,
};

export const GUARD = {
  radius: 14,
  speed: 78,
  /** How long a guard waits at each waypoint, looking around, in seconds. */
  pause: 1.6,
  coneRange: 235,
  /** Half-angle of a guard's vision cone, in radians. */
  coneHalfAngle: 0.62,
};

export const CAMERA = {
  coneRange: 220,
  coneHalfAngle: 0.42,
  /** Seconds for one full sweep out and back. */
  sweepPeriod: 5.2,
};

export const ALARM = {
  /** Points per second while a guard has eyes on the thief. */
  guardRate: 46,
  /** Points per second while a camera has eyes on the thief. */
  cameraRate: 34,
  /** Points per second the alarm cools down while nobody sees the thief. */
  decayRate: 9,
  max: 100,
};

export const TOOLS = {
  smokeCharges: 2,
  empCharges: 1,
  smokeRadius: 95,
  smokeDuration: 4.5,
  empDuration: 6,
  /** How far from the thief a mouse-clicked smoke bomb may land. */
  throwRange: 190,
  cooldown: 0.6,
};

export const LOOT_VALUES = { diamond: 5000, painting: 800, goldBar: 500 };

export const SCORE = {
  /** Time bonus per second left under the par time on a clean getaway. */
  parSeconds: 300,
  timeBonusPerSecond: 10,
  /** Bonus per alarm point left unraised on a clean getaway. */
  alarmBonusPerPoint: 5,
};

export const PALETTE = {
  backdrop: '#0b0e14',
  floor: '#171b26',
  floorTile: '#1b202e',
  carpet: '#232838',
  wall: '#3a4157',
  wallTop: '#4d5878',
  cover: '#2c3348',
  coverTop: '#3d4763',
  hud: '#10131c',
  hudLine: '#2a3040',
  text: '#eef1f5',
  muted: '#8b93a3',
  thief: '#e8b23a',
  thiefDark: '#8a6a1d',
  guard: '#e5534b',
  guardDark: '#7e2a24',
  camera: '#ff7a59',
  coneGuard: 'rgba(229, 83, 75, 0.20)',
  coneGuardEdge: 'rgba(229, 83, 75, 0.55)',
  coneCamera: 'rgba(255, 122, 89, 0.16)',
  coneCameraEdge: 'rgba(255, 122, 89, 0.5)',
  coneDead: 'rgba(120, 128, 150, 0.10)',
  loot: '#f2c94c',
  lootGlow: 'rgba(242, 201, 76, 0.35)',
  diamond: '#9fe8ff',
  exit: '#4ade80',
  exitLocked: '#e5534b',
  smoke: 'rgba(180, 190, 210, 0.55)',
  alarmLow: '#4ade80',
  alarmMid: '#f2c94c',
  alarmHigh: '#e5534b',
  spotted: '#ff3b30',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'midnight-vault.best';
