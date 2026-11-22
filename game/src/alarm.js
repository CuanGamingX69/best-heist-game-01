// The alarm meter: it climbs while any guard or camera has eyes on the thief, cools down
// while nobody does, and at 100 the job is blown. A short grace after the thief slips out
// of sight keeps a single flashed cone from spiking the meter.

import { ALARM } from './config.js';

export function createAlarm() {
  const state = { value: 0, seen: false, seenBy: '', graceLeft: 0, maxed: false };

  /**
   * One fixed step. `watched` is { guard: boolean, camera: boolean } — who sees the thief
   * right now. Returns true the moment the meter hits 100.
   */
  function step(dt, watched) {
    const nowSeen = watched.guard || watched.camera;
    if (nowSeen) {
      state.graceLeft = 0;
      state.seen = true;
      state.seenBy = watched.guard ? 'guard' : 'camera';
      const rate = watched.guard ? ALARM.guardRate : ALARM.cameraRate;
      state.value = Math.min(ALARM.max, state.value + rate * dt);
    } else {
      if (state.seen) {
        state.graceLeft += dt;
        if (state.graceLeft >= 0.35) {
          state.seen = false;
          state.seenBy = '';
          state.graceLeft = 0;
        }
      }
      state.value = Math.max(0, state.value - ALARM.decayRate * dt);
    }
    if (state.value >= ALARM.max && !state.maxed) {
      state.maxed = true;
      return true;
    }
    return false;
  }

  function reset() {
    state.value = 0;
    state.seen = false;
    state.seenBy = '';
    state.graceLeft = 0;
    state.maxed = false;
  }

  return { state, step, reset };
}
