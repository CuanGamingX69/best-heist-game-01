// The museum guards: each walks a loop of waypoints, waits at each one and looks around,
// and watches a vision cone in the direction they face. A guard who spots the thief
// raises the alarm; a guard who reaches the thief ends the job on the spot.

import { GUARD } from './config.js';
import { GUARD_ROUTES } from './levels.js';
import { canSee } from './sight.js';

export function createGuards() {
  const guards = GUARD_ROUTES.map((route) => ({
    name: route.name,
    waypoints: route.waypoints,
    waypointIndex: 1,
    x: route.waypoints[0].x,
    y: route.waypoints[0].y,
    angle: 0,
    pauseLeft: 0,
    /** How far around the guard is looking while paused at a waypoint. */
    scan: 0,
    seesThief: false,
  }));
  for (const guard of guards) {
    const next = guard.waypoints[guard.waypointIndex];
    guard.angle = Math.atan2(next.y - guard.y, next.x - guard.x);
  }

  /** Advance every guard one fixed step. Returns true when any guard touches the thief. */
  function step(dt, thief, smokes) {
    let caught = false;
    for (const guard of guards) {
      if (guard.pauseLeft > 0) {
        // Paused: sweep the head slowly, watching the room.
        guard.pauseLeft -= dt;
        guard.scan += dt * 1.1;
        guard.angle += Math.sin(guard.scan) * 0.55 * dt;
        if (guard.pauseLeft <= 0) {
          const next = guard.waypoints[guard.waypointIndex];
          guard.angle = Math.atan2(next.y - guard.y, next.x - guard.x);
        }
      } else {
        const target = guard.waypoints[guard.waypointIndex];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const distance = Math.hypot(dx, dy);
        const move = GUARD.speed * dt;
        if (distance <= move) {
          guard.x = target.x;
          guard.y = target.y;
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.pauseLeft = GUARD.pause;
          guard.scan = 0;
        } else {
          guard.x += (dx / distance) * move;
          guard.y += (dy / distance) * move;
          guard.angle = Math.atan2(dy, dx);
        }
      }
      guard.seesThief = canSee(guard.x, guard.y, guard.angle, GUARD.coneRange, GUARD.coneHalfAngle, thief.x, thief.y, smokes);
      const touch = Math.hypot(thief.x - guard.x, thief.y - guard.y);
      if (touch < GUARD.radius + 12) caught = true;
    }
    return caught;
  }

  function reset() {
    for (let index = 0; index < guards.length; index += 1) {
      const guard = guards[index];
      const route = GUARD_ROUTES[index];
      guard.waypointIndex = 1;
      guard.x = route.waypoints[0].x;
      guard.y = route.waypoints[0].y;
      guard.pauseLeft = 0;
      guard.scan = 0;
      guard.seesThief = false;
      const next = route.waypoints[1];
      guard.angle = Math.atan2(next.y - guard.y, next.x - guard.x);
    }
  }

  return { guards, step, reset };
}
