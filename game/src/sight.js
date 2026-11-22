// Vision geometry: what a watcher with a facing angle and a cone can see, and whether a
// wall stands between two points. Walls block sight; low display cases do not (a thief
// crouched behind a case is still visible, only walls and smoke hide them).

import { WALLS } from './levels.js';

/** True when point (px, py) lies inside a wall rectangle. */
export function pointInWall(px, py) {
  for (let index = 0; index < WALLS.length; index += 1) {
    const wall = WALLS[index];
    if (px >= wall.x && px < wall.x + wall.width && py >= wall.y && py < wall.y + wall.height) return true;
  }
  return false;
}

/**
 * How far a ray from (x, y) along `angle` travels before it hits a wall, at most
 * `maxRange`. The renderer uses it to clip vision cones at walls.
 */
export function raycastWall(x, y, angle, maxRange) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let travelled = 0;
  let px = x;
  let py = y;
  while (travelled < maxRange) {
    px += dx;
    py += dy;
    travelled += step;
    if (pointInWall(px, py)) return Math.max(0, travelled - step);
  }
  return maxRange;
}

/** True when the straight line from (x1, y1) to (x2, y2) crosses any wall. */
export function losBlocked(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 7));
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    if (pointInWall(x1 + dx * t, y1 + dy * t)) return true;
  }
  return false;
}

/**
 * True when a watcher at (wx, wy) facing `angle` with `range` and `halfAngle` can see the
 * point (px, py): inside the cone, in range, with a clear line of sight, and not hidden
 * inside any smoke cloud in `smokes` (each {x, y, radius}).
 */
export function canSee(wx, wy, angle, range, halfAngle, px, py, smokes) {
  const dx = px - wx;
  const dy = py - wy;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance > 1) {
    const target = Math.atan2(dy, dx);
    let diff = target - angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > halfAngle) return false;
  }
  if (losBlocked(wx, wy, px, py)) return false;
  for (let index = 0; index < smokes.length; index += 1) {
    const smoke = smokes[index];
    if (segmentHitsCircle(wx, wy, px, py, smoke.x, smoke.y, smoke.radius)) return false;
  }
  return true;
}

/** True when the segment from (x1, y1) to (x2, y2) passes through the circle. */
function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = 0;
  if (lengthSq > 0) t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lengthSq));
  const closestX = x1 + dx * t;
  const closestY = y1 + dy * t;
  const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
  return distSq < radius * radius;
}
