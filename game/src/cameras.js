// The wall cameras: each sits on a mount and sweeps its cone back and forth on a fixed
// rhythm. An EMP shuts every camera down for a while; a disabled camera sees nothing and
// its cone goes grey.

import { CAMERA } from './config.js';
import { CAMERA_MOUNTS } from './levels.js';
import { canSee } from './sight.js';

export function createCameras() {
  const cameras = CAMERA_MOUNTS.map((mount) => ({
    name: mount.name,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    angle: mount.baseAngle,
    seesThief: false,
  }));

  /** Advance every camera one fixed step. `time` is the world's clock; `disabledLeft` is the EMP timer. */
  function step(time, thief, smokes, disabledLeft) {
    for (const camera of cameras) {
      const phase = (time / CAMERA.sweepPeriod) * 2 * Math.PI;
      camera.angle = camera.baseAngle + Math.sin(phase) * camera.sweep;
      camera.seesThief =
        disabledLeft <= 0 && canSee(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, thief.x, thief.y, smokes);
    }
  }

  function reset() {
    for (const camera of cameras) {
      camera.angle = camera.baseAngle;
      camera.seesThief = false;
    }
  }

  return { cameras, step, reset };
}
