// Everything the player sees: the museum floor, the walls and display cases, the guards
// and their vision cones, the sweeping cameras, the thief, the loot, the getaway door and
// the HUD with its alarm meter. The logical field is 1280x720 and is scaled to the window.

import { CAMERA, FIELD, FONT, GUARD, PALETTE, TOOLS } from './config.js';
import { CASES, EXIT, WALLS } from './levels.js';
import { raycastWall } from './sight.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

/**
 * A vision cone clipped by the walls: each ray stops at the first wall it meets, so the
 * painted cone is exactly the ground its watcher can see — never a wedge through a wall.
 */
function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let index = 0; index <= rays; index += 1) {
    const rayAngle = angle - halfAngle + ((2 * halfAngle) * index) / rays;
    const distance = raycastWall(x, y, rayAngle, range);
    ctx.lineTo(x + Math.cos(rayAngle) * distance, y + Math.sin(rayAngle) * distance);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(1, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const scale = Math.min(canvas.clientWidth / FIELD.width, canvas.clientHeight / FIELD.height);
    const width = Math.max(1, Math.floor(FIELD.width * scale));
    const height = Math.max(1, Math.floor(FIELD.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, FIELD.hudHeight, FIELD.width, FIELD.height - FIELD.hudHeight);
    // Checker tiles, faint, so the room reads at a glance.
    ctx.fillStyle = PALETTE.floorTile;
    const tile = 64;
    for (let y = FIELD.hudHeight; y < FIELD.height; y += tile) {
      for (let x = 0; x < FIELD.width; x += tile) {
        if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) ctx.fillRect(x, y, tile, tile);
      }
    }
    // The gallery carpet.
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(452, 332, 460, 240);
    ctx.strokeStyle = 'rgba(242, 201, 76, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(452, 332, 460, 240);
  }

  function drawWalls() {
    for (const wall of WALLS) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(wall.x, wall.y, wall.width, 3);
    }
    for (const box of CASES) {
      ctx.fillStyle = PALETTE.cover;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = PALETTE.coverTop;
      ctx.fillRect(box.x, box.y, box.width, 4);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.label.toUpperCase(), box.x + box.width / 2, box.y + box.height / 2 + 8);
    }
  }

  function drawExit(state) {
    const open = state.exitOpen;
    ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    ctx.fillRect(EXIT.x, EXIT.y, EXIT.width, EXIT.height);
    ctx.fillStyle = '#0b0e14';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT — GO!' : 'EXIT · LOCKED', EXIT.x + EXIT.width / 2, EXIT.y + EXIT.height / 2);
    if (open) {
      ctx.strokeStyle = PALETTE.exit;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(EXIT.x + EXIT.width / 2, EXIT.y - 8);
      ctx.lineTo(EXIT.x + EXIT.width / 2, EXIT.y - 26);
      ctx.moveTo(EXIT.x + EXIT.width / 2 - 6, EXIT.y - 20);
      ctx.lineTo(EXIT.x + EXIT.width / 2, EXIT.y - 28);
      ctx.lineTo(EXIT.x + EXIT.width / 2 + 6, EXIT.y - 20);
      ctx.stroke();
    }
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.taken) continue;
      if (item.kind === 'diamond') {
        // A pulsing glow around the job itself.
        const pulse = 0.25 + 0.12 * Math.sin(state.time * 3);
        ctx.fillStyle = `rgba(159, 232, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = PALETTE.diamond;
        ctx.fillRect(-13, -13, 26, 26);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(-13, -13, 26, 8);
        ctx.restore();
        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('THE STAR OF MIDNIGHT', item.x, item.y + 48);
      } else if (item.kind === 'painting') {
        ctx.fillStyle = '#6b4a1f';
        ctx.fillRect(item.x - 22, item.y - 16, 44, 32);
        ctx.fillStyle = '#c98a4b';
        ctx.fillRect(item.x - 18, item.y - 12, 36, 24);
        ctx.fillStyle = '#2c4a6b';
        ctx.beginPath();
        ctx.arc(item.x, item.y + 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.text;
        ctx.font = `11px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('painting · $800', item.x, item.y + 30);
      } else {
        ctx.fillStyle = PALETTE.lootGlow;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.loot;
        ctx.fillRect(item.x - 12, item.y - 6, 24, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(item.x - 12, item.y - 6, 24, 4);
        ctx.fillStyle = PALETTE.text;
        ctx.font = `11px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('gold · $500', item.x, item.y + 26);
      }
    }
  }

  function drawCones(state) {
    for (const camera of state.cameras) {
      const disabled = state.empLeftSeconds > 0;
      drawCone(
        ctx,
        camera.x,
        camera.y,
        camera.angle,
        CAMERA.coneRange,
        CAMERA.coneHalfAngle,
        disabled ? PALETTE.coneDead : PALETTE.coneCamera,
        disabled ? 'rgba(120, 128, 150, 0.3)' : PALETTE.coneCameraEdge,
      );
    }
    for (const guard of state.guards) {
      drawCone(
        ctx,
        guard.x,
        guard.y,
        guard.angle,
        GUARD.coneRange,
        GUARD.coneHalfAngle,
        guard.seesThief ? 'rgba(255, 59, 48, 0.34)' : PALETTE.coneGuard,
        guard.seesThief ? PALETTE.spotted : PALETTE.coneGuardEdge,
      );
    }
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      ctx.fillStyle = PALETTE.guardDark;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.guard;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
      ctx.fill();
      // Facing tick and a cap brim, so the guard's direction reads.
      ctx.strokeStyle = '#ffd9d6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 9), guard.y + Math.sin(guard.angle) * (GUARD.radius + 9));
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - GUARD.radius - 8);
      if (guard.seesThief) {
        ctx.fillStyle = PALETTE.spotted;
        ctx.font = `bold 13px ${FONT}`;
        ctx.fillText('!', guard.x, guard.y - GUARD.radius - 22);
      }
    }
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      const disabled = state.empLeftSeconds > 0;
      ctx.fillStyle = disabled ? '#5a6274' : PALETTE.camera;
      ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
      ctx.fillStyle = '#0b0e14';
      ctx.beginPath();
      ctx.arc(camera.x + Math.cos(camera.angle) * 4, camera.y + Math.sin(camera.angle) * 4, 4, 0, Math.PI * 2);
      ctx.fill();
      // Labels sit clear of the HUD strip and of the screen edge.
      const labelBelow = camera.y < 100;
      const labelRight = camera.x > FIELD.width - 60;
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `10px ${FONT}`;
      ctx.textAlign = labelRight ? 'right' : 'center';
      ctx.fillText(
        disabled ? `${camera.name} · OFF` : camera.name,
        labelRight ? camera.x - 14 : camera.x,
        labelBelow ? camera.y + 24 : camera.y - 16,
      );
      ctx.textAlign = 'left';
    }
  }

  function drawThief(state) {
    const thief = state.thief;
    const bob = thief.moving ? Math.sin(state.time * 14) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(thief.x, thief.y + thief.radius + 2, thief.radius, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thiefDark;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y + bob, thief.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y + bob, thief.radius, 0, Math.PI * 2);
    ctx.fill();
    // The mask: a dark band with two eye slits.
    ctx.fillStyle = '#14161d';
    ctx.fillRect(thief.x - thief.radius + 2, thief.y + bob - 4, (thief.radius - 2) * 2, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(thief.x - 7, thief.y + bob - 2, 4, 3);
    ctx.fillRect(thief.x + 3, thief.y + bob - 2, 4, 3);
  }

  function drawSmoke(state) {
    for (const smoke of state.smokes) {
      const alpha = Math.min(1, smoke.left / 1.2) * 0.6;
      ctx.fillStyle = `rgba(180, 190, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(210, 218, 232, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(smoke.x - 24, smoke.y - 12, smoke.radius * 0.55, 0, Math.PI * 2);
      ctx.arc(smoke.x + 26, smoke.y + 10, smoke.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function alarmColour(value) {
    if (value < 40) return PALETTE.alarmLow;
    if (value < 75) return PALETTE.alarmMid;
    return PALETTE.alarmHigh;
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, FIELD.hudHeight);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, FIELD.hudHeight - 2, FIELD.width, 2);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('MIDNIGHT VAULT', 16, FIELD.hudHeight / 2);

    // Loot taken.
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = PALETTE.loot;
    ctx.fillText(`LOOT $${state.score.toLocaleString('en-US')}`, 250, FIELD.hudHeight / 2);

    // The alarm meter.
    const meterX = 470;
    const meterWidth = 260;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('ALARM', meterX, 14);
    ctx.fillStyle = '#262c3a';
    ctx.fillRect(meterX, 22, meterWidth, 18);
    ctx.fillStyle = alarmColour(state.alarm.value);
    ctx.fillRect(meterX, 22, meterWidth * (state.alarm.value / 100), 18);
    ctx.strokeStyle = PALETTE.hudLine;
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, 22, meterWidth, 18);
    ctx.fillStyle = state.alarm.seen ? PALETTE.spotted : PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(state.alarm.seen ? 'SPOTTED!' : `${Math.round(state.alarm.value)}%`, meterX + meterWidth + 10, 31);

    // Tools left.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `15px ${FONT}`;
    ctx.fillText(`SMOKE ×${state.smokeLeft}`, 850, FIELD.hudHeight / 2);
    ctx.fillText(`EMP ×${state.empLeft}`, 970, FIELD.hudHeight / 2);
    if (state.empLeftSeconds > 0) {
      ctx.fillStyle = PALETTE.camera;
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillText(`cameras down ${Math.ceil(state.empLeftSeconds)}s`, meterX, 50);
    }

    // Objective and clock, right aligned.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(state.diamondTaken ? 'GET TO THE EXIT!' : 'STEAL THE DIAMOND', FIELD.width - 16, 18);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`${formatTime(state.elapsed)}  ·  BEST $${best.toLocaleString('en-US')}`, FIELD.width - 16, 38);
    ctx.textAlign = 'left';
  }

  function drawPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
    ctx.fillRect(0, FIELD.hudHeight, FIELD.width, FIELD.height - FIELD.hudHeight);
    const panelWidth = 620;
    const panelHeight = 150 + lines.length * 30;
    const panelX = (FIELD.width - panelWidth) / 2;
    const panelY = 190;
    ctx.fillStyle = '#141824';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    ctx.fillStyle = accent;
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, FIELD.width / 2, panelY + 52);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `17px ${FONT}`;
    lines.forEach((line, index) => {
      ctx.fillText(line, FIELD.width / 2, panelY + 104 + index * 30);
    });
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText('Press Space or click to continue', FIELD.width / 2, panelY + panelHeight - 28);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    resize();
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawFloor();
    drawWalls();
    drawExit(state);
    drawLoot(state);
    drawCones(state);
    drawGuards(state);
    drawCameras(state);
    drawSmoke(state);
    drawThief(state);
    drawHud(state, best);

    if (screen === SCREEN_TITLE) {
      drawPanel('MIDNIGHT VAULT', [
        'One thief. Three guards. One diamond.',
        'WASD / arrows to move · Q or click: smoke bomb · E or right-click: EMP',
        'Stay out of the red cones. Grab the diamond, then slip out the exit.',
      ], PALETTE.loot);
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The museum waits. The guards do not sleep.'], PALETTE.muted);
    } else if (screen === SCREEN_OVER && state.won) {
      drawPanel('CLEAN GETAWAY!', [
        `Loot escaped with: $${state.score.toLocaleString('en-US')}`,
        `Time ${formatTime(state.elapsed)} · alarm peaked and cooled — the vault never knew.`,
      ], PALETTE.exit);
    } else if (screen === SCREEN_OVER) {
      drawPanel('BUSTED!', [
        'The alarm hit 100% and the museum locked down.',
        `Loot kept: $${state.score.toLocaleString('en-US')} — the diamond stays in its case.`,
      ], PALETTE.spotted);
    }

    // A flashing edge while the thief is seen: the caught moment, made fair and visible.
    if (screen === SCREEN_PLAY && state.alarm.seen) {
      const pulse = 0.35 + 0.25 * Math.sin(state.time * 10);
      ctx.strokeStyle = `rgba(255, 59, 48, ${pulse})`;
      ctx.lineWidth = 5;
      ctx.strokeRect(3, FIELD.hudHeight + 3, FIELD.width - 6, FIELD.height - FIELD.hudHeight - 6);
    }
  }

  return { draw };
}
