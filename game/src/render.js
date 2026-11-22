// The Meridian Vault — everything the player sees: the gallery floor, walls and
// cover, vision cones, guards and cameras, the thief, the loot and the exit,
// the alarm meter and the title, win and busted screens. Safe cover, danger
// and loot are drawn to be obvious at a glance.

import { FIELD, PALETTE, FONT, ALARM, CAMERA, GUARD, LOOT, SMOKE, THIEF } from './config.js';
import { CRATES, DIAMOND, EXIT, GOLD_BARS, WALLS } from './level.js';
import { goldCount } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_BUSTED = 'busted';

/** Fit the fixed logical field into the canvas, letterboxed, and return the scale. */
export function fitCanvas(canvas) {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const offsetX = (canvas.width - FIELD.width * scale) / 2;
  const offsetY = (canvas.height - FIELD.height * scale) / 2;
  return { scale, offsetX, offsetY };
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.floorTile;
  const tile = 80;
  for (let y = 0; y < FIELD.height; y += tile) {
    for (let x = 0; x < FIELD.width; x += tile) {
      if (((x + y) / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // The gallery's carpet runner down the central hall.
  ctx.fillStyle = '#232733';
  ctx.fillRect(436, 24, 424, 672);
}

function drawWalls(ctx) {
  for (const wall of WALLS) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
  }
}

function drawCrates(ctx) {
  for (const crate of CRATES) {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.fillStyle = PALETTE.crateTop;
    ctx.fillRect(crate.x, crate.y, crate.w, 6);
    ctx.strokeStyle = '#4a3a22';
    ctx.lineWidth = 2;
    ctx.strokeRect(crate.x + 1, crate.y + 1, crate.w - 2, crate.h - 2);
    ctx.beginPath();
    ctx.moveTo(crate.x, crate.y);
    ctx.lineTo(crate.x + crate.w, crate.y + crate.h);
    ctx.moveTo(crate.x + crate.w, crate.y);
    ctx.lineTo(crate.x, crate.y + crate.h);
    ctx.stroke();
  }
}

function drawExit(ctx, open, time) {
  const pulse = open ? 0.6 + 0.4 * Math.sin(time * 3.3) : 0;
  ctx.beginPath();
  ctx.arc(EXIT.x, EXIT.y, EXIT.radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = open ? `rgba(46, 204, 113, ${0.25 + pulse * 0.2})` : 'rgba(139, 147, 163, 0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(EXIT.x, EXIT.y, EXIT.radius, 0, Math.PI * 2);
  ctx.fillStyle = open ? PALETTE.exit : '#3a3f4d';
  ctx.fill();
  ctx.fillStyle = open ? '#0d0f14' : PALETTE.muted;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', EXIT.x, EXIT.y);
  if (!open) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `11px ${FONT}`;
    ctx.fillText('locked', EXIT.x, EXIT.y + 44);
  }
}

function drawDiamond(ctx, state) {
  if (state.diamondTaken) return;
  const bob = Math.sin(state.time * 2.5) * 3;
  // The pedestal.
  ctx.fillStyle = PALETTE.plinth;
  ctx.fillRect(DIAMOND.x - 22, DIAMOND.y - 22 + bob, 44, 44);
  ctx.strokeStyle = '#454c60';
  ctx.lineWidth = 2;
  ctx.strokeRect(DIAMOND.x - 22, DIAMOND.y - 22 + bob, 44, 44);
  // The diamond itself, glowing.
  ctx.save();
  ctx.translate(DIAMOND.x, DIAMOND.y - 26 + bob);
  ctx.rotate(Math.PI / 4);
  ctx.shadowColor = PALETTE.diamond;
  ctx.shadowBlur = 18;
  ctx.fillStyle = PALETTE.diamond;
  ctx.fillRect(-11, -11, 22, 22);
  ctx.restore();
  ctx.fillStyle = PALETTE.diamond;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('THE MERIDIAN DIAMOND', DIAMOND.x, DIAMOND.y + 44);
}

function drawGold(ctx, state) {
  for (let i = 0; i < GOLD_BARS.length; i += 1) {
    if (state.goldTaken[i]) continue;
    const bar = GOLD_BARS[i];
    ctx.save();
    ctx.translate(bar.x, bar.y);
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 10;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(-12, -6, 24, 12);
    ctx.restore();
  }
}

function drawSmoke(ctx, state) {
  for (const cloud of state.smoke) {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.smoke;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloud.x - 24, cloud.y - 14, cloud.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloud.x + 26, cloud.y + 12, cloud.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    // The vision cone first, so the guard draws over it.
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightHalfAngle, PALETTE.guardCone, PALETTE.guardConeEdge);
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fillStyle = guard.state === 'chase' ? '#ff2d2d' : PALETTE.guard;
    ctx.fill();
    ctx.strokeStyle = '#7a1f1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 8), guard.y + Math.sin(guard.angle) * (GUARD.radius + 8));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    // The guard's initial, so the player can tell them apart.
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(guard.name[0], guard.x, guard.y);
    if (guard.state === 'chase') {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText('!', guard.x, guard.y - 26);
    }
  }
}

function drawCameras(ctx, state) {
  for (const camera of state.cameras) {
    drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.sightRange, CAMERA.sightHalfAngle, PALETTE.cameraCone, PALETTE.cameraConeEdge);
    ctx.fillStyle = PALETTE.camera;
    ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.strokeStyle = '#7a1f1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

function drawThief(ctx, state) {
  const thief = state.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, THIEF.radius + 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, THIEF.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.thief;
  ctx.fill();
  ctx.strokeStyle = '#8f8a7c';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The hood and the direction the thief faces.
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, THIEF.radius - 5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.thiefCoat;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.angle) * (THIEF.radius + 6), thief.y + Math.sin(thief.angle) * (THIEF.radius + 6));
  ctx.strokeStyle = PALETTE.thief;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (state.diamondTaken) {
    ctx.save();
    ctx.translate(thief.x + 16, thief.y - 16);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.diamond;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function alarmColour(alarm) {
  if (alarm < 40) return PALETTE.alarmLow;
  if (alarm < 70) return PALETTE.alarmMid;
  return PALETTE.alarmHigh;
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, 44);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.lineTo(FIELD.width, 44);
  ctx.stroke();

  // The alarm meter.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ALARM', 16, 23);
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(90, 12, 300, 20);
  ctx.fillStyle = alarmColour(state.alarm);
  ctx.fillRect(90, 12, 300 * (state.alarm / ALARM.max), 20);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(90, 12, 300, 20);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText(`${Math.floor(state.alarm)}%`, 400, 23);

  // Loot: the diamond and the gold bars.
  ctx.fillStyle = state.diamondTaken ? PALETTE.diamond : PALETTE.muted;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText(`◆ ${state.diamondTaken ? '1' : '0'}/1`, 480, 23);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`▬ ${goldCount(state)}/${GOLD_BARS.length}`, 560, 23);

  // Smoke bombs left.
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`Smoke [E]: ${'●'.repeat(state.smokeCount)}${'○'.repeat(Math.max(0, 2 - state.smokeCount))}`, 660, 23);

  // Score and time.
  const minutes = Math.floor(state.time / 60);
  const seconds = Math.floor(state.time % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`Score ${state.score}`, 1120, 23);
  ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, 1264, 23);

  // The controls, along the bottom.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('WASD / arrows — move      E — smoke bomb      R — restart      M — mute', FIELD.width / 2, FIELD.height - 12);
}

/** The room itself, with everyone in it. */
export function drawWorld(ctx, state) {
  drawFloor(ctx);
  drawExit(ctx, state.diamondTaken, state.time);
  drawDiamond(ctx, state);
  drawGold(ctx, state);
  drawCrates(ctx);
  drawWalls(ctx);
  drawSmoke(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawHud(ctx, state);
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = accent;
  ctx.font = `bold 54px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, FIELD.width / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `20px ${FONT}`;
  let y = 320;
  for (const line of lines) {
    ctx.fillText(line, FIELD.width / 2, y);
    y += 34;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Draw the whole frame for the given screen over the world state. */
export function drawScreen(ctx, state, screen, best) {
  drawWorld(ctx, state);
  if (screen === SCREEN_TITLE) {
    drawOverlay(
      ctx,
      'THE MERIDIAN VAULT',
      [
        'One diamond. Three guards. Two cameras. One way out.',
        'Grab the Meridian Diamond, then slip out through the skylight vent.',
        'Stay out of the yellow cones. Smoke [E] hides you. The alarm only falls when nobody sees you.',
        '',
        'WASD / arrows — move      E — smoke bomb      R — restart',
        'Press ENTER or click to start',
        best > 0 ? `Best getaway: ${best} points` : '',
      ],
      PALETTE.diamond,
    );
  } else if (screen === SCREEN_WIN) {
    drawOverlay(
      ctx,
      'CLEAN GETAWAY',
      [
        `Score ${state.score} points — the diamond is yours in ${formatTime(state.endTime)}.`,
        `Spotted ${state.timesSpotted} time${state.timesSpotted === 1 ? '' : 's'} · gold ${goldCount(state)}/${GOLD_BARS.length}`,
        best > 0 ? `Best getaway: ${best} points` : '',
        '',
        'Press R or click to run it again',
      ],
      PALETTE.exit,
    );
  } else if (screen === SCREEN_BUSTED) {
    drawOverlay(
      ctx,
      'BUSTED',
      [
        'The alarm hit the roof and the gallery doors slammed shut.',
        `Score ${state.score} points · spotted ${state.timesSpotted} time${state.timesSpotted === 1 ? '' : 's'}`,
        '',
        'Press R or click to try again',
      ],
      PALETTE.alarmHigh,
    );
  }
}
