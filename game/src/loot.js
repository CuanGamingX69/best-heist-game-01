// The loot: the diamond is the job itself, the rest is bonus worth the detour. A piece is
// picked up by walking over it; the diamond unlocks the getaway exit.

import { LOOT_SPOTS } from './levels.js';
import { LOOT_VALUES } from './config.js';

export function createLoot() {
  const items = LOOT_SPOTS.map((spot) => ({
    kind: spot.kind,
    name: spot.name,
    x: spot.x,
    y: spot.y,
    value: LOOT_VALUES[spot.kind],
    taken: false,
  }));

  /** Pick up every piece the thief stands on. Returns the pieces taken this step. */
  function collect(thief) {
    const taken = [];
    for (const item of items) {
      if (item.taken) continue;
      if (Math.hypot(thief.x - item.x, thief.y - item.y) < 30) {
        item.taken = true;
        taken.push(item);
      }
    }
    return taken;
  }

  function reset() {
    for (const item of items) item.taken = false;
  }

  return { items, collect, reset };
}
