// The game's rules and state, with no drawing and no browser in it: the thief, the guards,
// the cameras, the loot, the smoke and the EMP, the alarm and the getaway. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react without the
// world knowing about screens or sound.

import { ALARM, FIELD, SCORE, THIEF, TOOLS } from './config.js';
import { EXIT as EXIT_SPOT, SOLIDS, THIEF_START } from './levels.js';
import { createGuards } from './guards.js';
import { createCameras } from './cameras.js';
import { createLoot } from './loot.js';
import { createAlarm } from './alarm.js';

export const EVENT_LOOT = 1;
export const EVENT_DIAMOND = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_SPOTTED = 16;
export const EVENT_TOOL = 32;

function circleHitsSolids(x, y, radius) {
  for (let index = 0; index < SOLIDS.length; index += 1) {
    const solid = SOLIDS[index];
    const nearestX = Math.max(solid.x, Math.min(x, solid.x + solid.width));
    const nearestY = Math.max(solid.y, Math.min(y, solid.y + solid.height));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

export function createWorld(random) {
  const thief = { x: THIEF_START.x, y: THIEF_START.y, radius: THIEF.radius, moving: false };
  const guards = createGuards();
  const cameras = createCameras();
  const loot = createLoot();
  const alarm = createAlarm();
  const smokes = [];
  const state = {
    thief,
    guards: guards.guards,
    cameras: cameras.cameras,
    loot: loot.items,
    smokes,
    alarm: alarm.state,
    score: 0,
    elapsed: 0,
    time: 0,
    diamondTaken: false,
    exitOpen: false,
    smokeLeft: TOOLS.smokeCharges,
    empLeft: TOOLS.empCharges,
    empLeftSeconds: 0,
    cooldownLeft: 0,
    over: false,
    won: false,
  };

  function reset() {
    thief.x = THIEF_START.x;
    thief.y = THIEF_START.y;
    thief.moving = false;
    guards.reset();
    cameras.reset();
    loot.reset();
    alarm.reset();
    smokes.length = 0;
    state.score = 0;
    state.elapsed = 0;
    state.time = 0;
    state.diamondTaken = false;
    state.exitOpen = false;
    state.smokeLeft = TOOLS.smokeCharges;
    state.empLeft = TOOLS.empCharges;
    state.empLeftSeconds = 0;
    state.cooldownLeft = 0;
    state.over = false;
    state.won = false;
  }

  /** Drop a smoke bomb at (x, y) when a charge and the cooldown allow it. */
  function useSmoke(x, y) {
    if (state.smokeLeft <= 0 || state.cooldownLeft > 0 || state.over) return false;
    const dx = x - thief.x;
    const dy = y - thief.y;
    const distance = Math.hypot(dx, dy);
    const targetX = distance > TOOLS.throwRange ? thief.x + (dx / distance) * TOOLS.throwRange : x;
    const targetY = distance > TOOLS.throwRange ? thief.y + (dy / distance) * TOOLS.throwRange : y;
    smokes.push({ x: targetX, y: targetY, radius: TOOLS.smokeRadius, left: TOOLS.smokeDuration });
    state.smokeLeft -= 1;
    state.cooldownLeft = TOOLS.cooldown;
    return true;
  }

  /** Fire the EMP: every camera goes dark for a while. */
  function useEmp() {
    if (state.empLeft <= 0 || state.cooldownLeft > 0 || state.over) return false;
    state.empLeft -= 1;
    state.empLeftSeconds = TOOLS.empDuration;
    state.cooldownLeft = TOOLS.cooldown;
    return true;
  }

  function moveThief(dt, steer) {
    const nextX = thief.x + steer.x * THIEF.speed * dt;
    const nextY = thief.y + steer.y * THIEF.speed * dt;
    thief.moving = steer.x !== 0 || steer.y !== 0;
    if (!circleHitsSolids(nextX, thief.y, thief.radius)) thief.x = nextX;
    if (!circleHitsSolids(thief.x, nextY, thief.radius)) thief.y = nextY;
    thief.x = Math.max(thief.radius, Math.min(FIELD.width - thief.radius, thief.x));
    thief.y = Math.max(FIELD.hudHeight + thief.radius, Math.min(FIELD.height - thief.radius, thief.y));
  }

  /**
   * One fixed step. `steer` is the normalised movement vector, `tool` is 'smoke' | 'emp' |
   * null, and `smokeTarget` the point a clicked smoke bomb is thrown at. With `harmless`
   * set (the title screen's backdrop) the patrols move but nothing is seen, taken or lost.
   */
  function step(dt, steer, tool, smokeTarget, harmless) {
    let events = 0;
    if (state.over) return events;
    state.time += dt;
    if (!harmless) state.elapsed += dt;
    if (state.cooldownLeft > 0) state.cooldownLeft -= dt;
    if (state.empLeftSeconds > 0) state.empLeftSeconds -= dt;

    moveThief(dt, steer);

    for (let index = smokes.length - 1; index >= 0; index -= 1) {
      smokes[index].left -= dt;
      if (smokes[index].left <= 0) smokes.splice(index, 1);
    }

    if (tool === 'smoke' && useSmoke(smokeTarget.x, smokeTarget.y)) events |= EVENT_TOOL;
    else if (tool === 'emp' && useEmp()) events |= EVENT_TOOL;

    const touched = guards.step(dt, thief, smokes);
    cameras.step(state.time, thief, smokes, state.empLeftSeconds);

    if (!harmless) {
      const watched = {
        guard: guards.guards.some((guard) => guard.seesThief),
        camera: cameras.cameras.some((camera) => camera.seesThief),
      };
      if ((watched.guard || watched.camera) && !alarm.state.seen) events |= EVENT_SPOTTED;
      if (alarm.step(dt, watched)) {
        state.over = true;
        events |= EVENT_CAUGHT;
        return events;
      }
      if (touched) {
        state.alarm.value = ALARM.max;
        state.over = true;
        events |= EVENT_CAUGHT;
        return events;
      }

      const taken = loot.collect(thief);
      for (const item of taken) {
        state.score += item.value;
        events |= EVENT_LOOT;
        if (item.kind === 'diamond') {
          state.diamondTaken = true;
          state.exitOpen = true;
          events |= EVENT_DIAMOND;
        }
      }

      if (state.exitOpen) {
        const exit = EXIT_SPOT;
        if (thief.x > exit.x - 6 && thief.x < exit.x + exit.width + 6 && thief.y + thief.radius >= exit.y - 4) {
          const timeBonus = Math.max(0, Math.round((SCORE.parSeconds - state.elapsed) * SCORE.timeBonusPerSecond));
          const alarmBonus = Math.round((ALARM.max - state.alarm.value) * SCORE.alarmBonusPerPoint);
          state.score += timeBonus + alarmBonus;
          state.over = true;
          state.won = true;
          events |= EVENT_WIN;
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, useSmoke, useEmp };
}
