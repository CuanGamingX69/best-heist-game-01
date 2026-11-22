// The screenshot scenes behind ?shot=start|play|loot|end. Each one plays the real rules
// forward from a fresh world, steered by a scripted route through the museum, so the frame
// is what a real game looks like and the same seed always gives the same frame. The route
// slips through the door gaps: west wing, central gallery, the vault door, the diamond,
// then the getaway exit.

import { CAMERA, GUARD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { canSee } from './sight.js';

/**
 * The thief's route to the diamond: east past the scrolls case, up the west wing, through
 * the west door gap (y 372..428), south of the north divider, through its door gap
 * (x 636..692), across the north gallery, and in through the vault door gap (y 200..256).
 */
export const ROUTE_TO_DIAMOND = [
  { x: 300, y: 628 },
  { x: 300, y: 400 },
  { x: 380, y: 400 },
  { x: 470, y: 400 },
  { x: 470, y: 340 },
  { x: 660, y: 340 },
  { x: 660, y: 240 },
  { x: 730, y: 240 },
  { x: 730, y: 130 },
  { x: 900, y: 130 },
  { x: 900, y: 228 },
  { x: 980, y: 228 },
  { x: 1150, y: 165 },
];

/**
 * After the diamond: back out of the vault, through the north divider gap again, down the
 * central gallery, east across the open floor, down the east wing, to the getaway door.
 */
export const ROUTE_TO_EXIT = [
  { x: 1000, y: 228 },
  { x: 900, y: 228 },
  { x: 660, y: 228 },
  { x: 660, y: 340 },
  { x: 700, y: 340 },
  { x: 700, y: 460 },
  { x: 1080, y: 460 },
  { x: 1150, y: 460 },
  { x: 1150, y: 620 },
  { x: 1192, y: 680 },
];

const START_SECONDS = 5;
/** The play scene catches the thief mid-gallery, the diamond still in its case. */
const PLAY_SECONDS = 4.5;
const LOOT_LIMIT_SECONDS = 75;
const END_LIMIT_SECONDS = 120;

/**
 * Which watcher would see the point (x, y) right now: 'guard', 'camera', or null
 * (smoke and EMP applied). The pilot spends the matching tool on a watched chokepoint.
 */
function positionSeen(state, x, y) {
  for (const guard of state.guards) {
    if (canSee(guard.x, guard.y, guard.angle, GUARD.coneRange, GUARD.coneHalfAngle, x, y, state.smokes)) return 'guard';
  }
  if (state.empLeftSeconds > 0) return null;
  for (const camera of state.cameras) {
    if (canSee(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, x, y, state.smokes)) return 'camera';
  }
  return null;
}

/**
 * The autopilot: it follows the route, but it is a thief, not a tourist. It waits in a
 * safe spot when the ground ahead is watched (a patrol walks on, a camera sweeps away),
 * spends a smoke only when the alarm is already climbing, fires the EMP at a watching
 * camera, and when it is seen with no tool left, runs away from the nearest watcher.
 */
export function createShotPilot(route) {
  let index = 0;
  let waitTime = 0;
  /** Seconds of committed pushing after a wait times out: the thief walks through the watched ground instead of stalling one step at a time. */
  let pushLeft = 0;

  function steerToWaypoint(state) {
    const thief = state.thief;
    while (index < route.length) {
      const target = route[index];
      if (Math.hypot(target.x - thief.x, target.y - thief.y) < 14) index += 1;
      else break;
    }
    if (index >= route.length) return { x: 0, y: 0 };
    const target = route[index];
    const dx = target.x - thief.x;
    const dy = target.y - thief.y;
    const distance = Math.hypot(dx, dy);
    return { x: dx / distance, y: dy / distance };
  }

  return function pilotStep(world) {
    const state = world.state;
    const thief = state.thief;
    const seenByGuard = state.guards.some((guard) => guard.seesThief);
    const seenByCamera = state.cameras.some((camera) => camera.seesThief);

    // Spotted and the alarm is climbing: answer the watcher — the EMP for a camera
    // (it shuts every camera down), smoke for a guard.
    if (state.alarm.seen && state.alarm.value > 30) {
      if (seenByCamera && !seenByGuard && state.empLeft > 0) world.useEmp();
      else if (state.smokeLeft > 0) world.useSmoke(thief.x, thief.y);
      else if (state.empLeft > 0) world.useEmp();
    }

    if (pushLeft > 0) pushLeft -= STEP;
    const steer = steerToWaypoint(state);
    if (!state.alarm.seen && (steer.x !== 0 || steer.y !== 0)) {
      // Look ahead: if the ground a half-second up the route is watched by a camera,
      // the EMP is the answer — a sweeping camera has no window worth waiting in
      // mid-corridor, and six dark seconds carry the thief through. If a guard
      // watches it, hold position until the patrol moves on (at most a few seconds,
      // then spend the matching tool and push on through, committed, for a while).
      const aheadX = thief.x + steer.x * 120;
      const aheadY = thief.y + steer.y * 120;
      const watcher = positionSeen(state, aheadX, aheadY);
      if (watcher === 'camera') {
        if (state.empLeft > 0) {
          world.useEmp();
          pushLeft = 1.5;
          waitTime = 0;
        } else if (pushLeft <= 0) {
          waitTime += STEP;
          if (waitTime < 2.5) return { x: 0, y: 0 };
          pushLeft = 1.5;
          waitTime = 0;
        }
      } else if (watcher === 'guard') {
        if (pushLeft <= 0) {
          waitTime += STEP;
          if (waitTime < 2.5) return { x: 0, y: 0 };
          if (state.smokeLeft > 0) world.useSmoke(thief.x, thief.y);
          pushLeft = 1.5;
          waitTime = 0;
        }
      } else {
        waitTime = 0;
      }
    }

    // Seen by a guard with no smoke left: a guard can walk up and end the job, so run
    // away from it. A camera alone cannot touch the thief: keep moving and let the
    // alarm cool down instead of fleeing back the way the thief came.
    if (state.alarm.seen && seenByGuard && state.smokeLeft === 0) {
      let nearest = null;
      let nearestDistance = Infinity;
      for (const guard of state.guards) {
        if (!guard.seesThief) continue;
        const distance = Math.hypot(thief.x - guard.x, thief.y - guard.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = guard;
        }
      }
      if (nearest !== null) {
        const dx = thief.x - nearest.x;
        const dy = thief.y - nearest.y;
        const distance = Math.hypot(dx, dy) || 1;
        return { x: dx / distance, y: dy / distance };
      }
    }
    return steer;
  };
}

/**
 * Set `world` to the named scene (start, play, loot or end; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'loot' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, { x: 0, y: 0 }, null, null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    const pilot = createShotPilot(ROUTE_TO_DIAMOND);
    for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
      if (world.state.over) break;
      world.step(STEP, pilot(world), null, null, false);
    }
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }

  const pilot = createShotPilot([...ROUTE_TO_DIAMOND, ...ROUTE_TO_EXIT]);
  const limit = name === 'end' ? END_LIMIT_SECONDS : LOOT_LIMIT_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    if (world.state.over) break;
    if (name === 'loot' && world.state.diamondTaken) break;
    world.step(STEP, pilot(world), null, null, false);
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
