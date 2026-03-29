/* ═══════════════════════════════════════════
   game.js — Snake Battle
═══════════════════════════════════════════ */

// ─────────────────────────────────────────────
// Grid & layout constants
// ─────────────────────────────────────────────
const COLS   = 30;
const ROWS   = 25;
const DPAD_H = 162;   // px height of one joystick zone (label + joy-base + padding)

let CELL = 20;
let W    = COLS * CELL;
let H    = ROWS * CELL;

const DIR      = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
const OPPOSITE = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

// ─────────────────────────────────────────────
// Theme — canvas draw colors
// ─────────────────────────────────────────────
let theme = 'dark';

const THEME = {
  dark: {
    p1Head: '#A8D0E2', p1Body: '#78A8C6', p1Dead: '#263840',
    p2Head: '#EAD6BC', p2Body: '#C4AC98', p2Dead: '#362A22',
    food:         '#EAD6BC',
    foodGlowIn:   'rgba(234,214,188,0.50)',
    foodGlowOut:  'rgba(196,172,152,0)',
    bg:           '#0d1922',
    grid:         '#132030',
    overlay:      'rgba(13,25,34,0.80)',
    pauseText:    '#E6D8C6',
    pauseSub:     '#7898B4',
    respawn1:     '#A8D0E2',
    respawn2:     '#EAD6BC',
    eye:          '#0d1922',
  },
  light: {
    p1Head: '#1A5472', p1Body: '#286A8C', p1Dead: '#8AB0C4',
    p2Head: '#6A3618', p2Body: '#884C2E', p2Dead: '#BE9878',
    food:         '#5A2C10',
    foodGlowIn:   'rgba(90,44,16,0.42)',
    foodGlowOut:  'rgba(90,44,16,0)',
    bg:           '#E0D4C2',
    grid:         '#CCBFAC',
    overlay:      'rgba(237,229,210,0.82)',
    pauseText:    '#18303E',
    pauseSub:     '#3E5E72',
    respawn1:     '#1A5472',
    respawn2:     '#6A3618',
    eye:          '#EDE5D2',
  },
};

/** Returns the active color palette. */
const C = () => THEME[theme];

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light', theme === 'light');
  // Update every theme icon in DOM
  document.querySelectorAll('.theme-icon')
    .forEach(el => { el.textContent = theme === 'dark' ? '☀' : '🌙'; });
  if (snake1) draw();
}

// ─────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────
let mode         = 'pvc';    // 'pvp' | 'pvc' | 'cvc'
let gameLoop     = null;
let paused       = false;
let gameOver     = false;
let tickInterval = 100;
let wallWrap     = false;    // wrap-through-walls mode
let foodCount    = 3;        // number of food items on field (1–10)
let snake1, snake2, foods, score1, score2;

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

// ─────────────────────────────────────────────
// Responsive canvas sizing
// ─────────────────────────────────────────────
function isTouch() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function computeCell() {
  const touch    = isTouch();
  const topDpadH = touch && mode === 'pvp' ? DPAD_H : 0;
  const botDpadH = touch && mode !== 'cvc' ? DPAD_H : 0;
  const barH     = 48;
  const statH    = touch ? 0 : 26;
  const padH     = 10;

  const availW = window.innerWidth  - (touch ? 8  : 20);
  const availH = window.innerHeight - barH - topDpadH - botDpadH - statH - padH;

  CELL = Math.max(8, Math.floor(Math.min(availW / COLS, availH / ROWS)));
  W    = COLS * CELL;
  H    = ROWS * CELL;
  canvas.width  = W;
  canvas.height = H;
}

window.addEventListener('resize', () => {
  computeCell();
  if (snake1) draw();
});

// ─────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────
function setMode(m) {
  mode = m;
  ['pvp', 'pvc', 'cvc'].forEach(id =>
    document.getElementById('btn-' + id).classList.toggle('active', m === id)
  );

  const touch = isTouch();
  const hint  = document.getElementById('controls-hint');

  if (m === 'pvp') {
    hint.innerHTML = touch
      ? `<span class="c-p1">● 玩家1：上方搖桿</span><br>
         <span class="c-p2">● 玩家2：下方搖桿</span><br><br>
         撞牆或對方 → 扣分並重生　搶食物 → 得分`
      : `<span class="c-p1">● 玩家1：WASD 移動</span><br>
         <span class="c-p2">● 玩家2：方向鍵 移動</span><br><br>
         撞牆、撞自己或對方蛇身 → 扣分並重生<br>搶先吃到食物 → 得分`;
  } else if (m === 'pvc') {
    hint.innerHTML = touch
      ? `<span class="c-p1">● 玩家1：搖桿 或 在畫面任意滑動</span><br>
         <span class="c-p2">● 電腦：自動追蹤食物</span><br><br>
         撞牆或對方 → 扣分並重生　搶食物 → 得分`
      : `<span class="c-p1">● 玩家1：WASD 移動</span><br>
         <span class="c-p2">● 電腦：自動追蹤食物</span><br><br>
         撞牆、撞自己或對方蛇身 → 扣分並重生<br>搶先吃到食物 → 得分`;
  } else {
    hint.innerHTML =
      `<span class="c-p1">● CPU1：自動追蹤食物</span><br>
       <span class="c-p2">● CPU2：自動追蹤食物</span><br><br>
       <span class="c-accent">🤖 純觀戰模式，完全不需動手！</span><br>
       撞牆、撞自己或對方蛇身 → 扣分並重生`;
  }
}

function startGame() {
  tickInterval = parseInt(document.getElementById('speed-select').value);
  document.getElementById('menu').style.display           = 'none';
  document.getElementById('game-container').style.display = 'flex';

  // Scoreboard labels
  if (mode === 'cvc') {
    document.getElementById('p1-label').innerHTML = 'CPU1: <span id="score1">0</span>';
    document.getElementById('p2-label').innerHTML = 'CPU2: <span id="score2">0</span>';
    document.getElementById('status').textContent  = '觀戰模式 ★ 按 P 暫停';
  } else {
    document.getElementById('p1-label').innerHTML = 'P1: <span id="score1">0</span>';
    document.getElementById('p2-label').innerHTML =
      (mode === 'pvc' ? 'CPU' : 'P2') + ': <span id="score2">0</span>';
    document.getElementById('status').textContent  = '按 ESC 返回 | 按 P 暫停';
  }

  setupDpads();
  initGame();
}

// ─────────────────────────────────────────────
// D-pad setup
// ─────────────────────────────────────────────
function setupDpads() {
  const touch   = isTouch();
  const topZone = document.getElementById('dpad-top');
  const botZone = document.getElementById('dpad-bottom');

  // Always hide first, then selectively show
  topZone.classList.add('hidden');
  botZone.classList.add('hidden');

  if (!touch) return;

  if (mode === 'pvp') {
    topZone.classList.remove('hidden');   // P1 at top
    botZone.classList.remove('hidden');   // P2 at bottom
    setBottomDpadPlayer(2);
  } else if (mode === 'pvc') {
    botZone.classList.remove('hidden');   // P1 at bottom
    setBottomDpadPlayer(1);
  }
  // cvc: no dpads shown
}

/**
 * Which player the bottom joystick controls (1 = P1, 2 = P2).
 * Updated by setBottomDpadPlayer() before each game.
 */
let bottomJoyPlayer = 2;

/**
 * Reconfigures the bottom joystick to control the given player (1 or 2).
 * Updates label text, colour classes, and the bottomJoyPlayer variable.
 */
function setBottomDpadPlayer(p) {
  bottomJoyPlayer = p;
  const label    = document.getElementById('dpad-bottom-label');
  const joyBase  = document.getElementById('joy2-base');
  const joyKnob  = document.getElementById('joy2-knob');

  if (p === 1) {
    label.textContent  = 'P1';
    label.className    = 'dpad-label c-p1';
    joyBase.className  = 'joy-base';
    joyKnob.className  = 'joy-knob';
  } else {
    label.textContent  = 'P2';
    label.className    = 'dpad-label c-p2';
    joyBase.className  = 'joy-base p2';
    joyKnob.className  = 'joy-knob p2';
  }
}

// ─────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────
function backToMenu() {
  stopGame();
  document.getElementById('overlay').classList.remove('visible');
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('menu').style.display           = 'flex';
}

function restartGame() {
  document.getElementById('overlay').classList.remove('visible');
  initGame();
}

function togglePause() {
  paused = !paused;
  document.getElementById('pause-btn').textContent = paused ? '▶' : '⏸';
}

// ─────────────────────────────────────────────
// Wall-wrap mode
// ─────────────────────────────────────────────
function toggleWallWrap() {
  wallWrap = !wallWrap;
  const btn = document.getElementById('wall-wrap-btn');
  btn.textContent = wallWrap ? '開啟 ✓' : '關閉';
  btn.classList.toggle('active', wallWrap);
}

// ─────────────────────────────────────────────
// Food count selector
// ─────────────────────────────────────────────
function adjustFood(delta) {
  foodCount = Math.max(1, Math.min(10, foodCount + delta));
  document.getElementById('food-count-display').textContent = foodCount;
  document.getElementById('food-minus').disabled = foodCount <= 1;
  document.getElementById('food-plus').disabled  = foodCount >= 10;
}

// ─────────────────────────────────────────────
// Game initialisation
// ─────────────────────────────────────────────
function makeSnake(sx, sy, dir, id) {
  return {
    id, dir, alive: true, respawnIn: 0, queuedDirs: [],
    body: [
      [sx, sy],
      [sx - DIR[dir][0],   sy - DIR[dir][1]],
      [sx - DIR[dir][0]*2, sy - DIR[dir][1]*2],
    ],
  };
}

function initGame() {
  score1 = 0; score2 = 0;
  gameOver = false; paused = false;
  document.getElementById('pause-btn').textContent = '⏸';
  computeCell();
  updateScoreDisplay();

  snake1 = makeSnake(7,  12, 'RIGHT', 1);
  snake2 = makeSnake(22, 12, 'LEFT',  2);
  foods  = [];
  for (let i = 0; i < foodCount; i++) spawnFood();

  stopGame();
  gameLoop = setInterval(tick, tickInterval);
}

function stopGame() {
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
}

// ─────────────────────────────────────────────
// Food
// ─────────────────────────────────────────────
function spawnFood() {
  const occ = new Set(
    [...snake1.body, ...snake2.body, ...foods].map(([x, y]) => `${x},${y}`)
  );
  let x, y, t = 0;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occ.has(`${x},${y}`) && ++t < 200);
  foods.push([x, y]);
}

// ─────────────────────────────────────────────
// Input — shared direction helper
// ─────────────────────────────────────────────
function pushDir(snake, d) {
  const last = snake.queuedDirs.at(-1) ?? snake.dir;
  if (d !== OPPOSITE[last]) snake.queuedDirs.push(d);
  if (snake.queuedDirs.length > 2) snake.queuedDirs.shift();
}

// ─────────────────────────────────────────────
// Input — keyboard
// ─────────────────────────────────────────────
const KEY1 = { KeyW:'UP', KeyS:'DOWN', KeyA:'LEFT', KeyD:'RIGHT' };
const KEY2 = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT' };

document.addEventListener('keydown', e => {
  if (e.code === 'Escape') { backToMenu(); return; }
  if (e.code === 'KeyP')   { togglePause(); return; }
  if (!snake1 || mode === 'cvc') return;

  if (KEY1[e.code] && snake1.alive)
    pushDir(snake1, KEY1[e.code]);

  // pvp: arrow keys → P2
  if (mode === 'pvp' && KEY2[e.code] && snake2?.alive) {
    e.preventDefault();
    pushDir(snake2, KEY2[e.code]);
  }
  // pvc: arrow keys also control P1 (same as WASD)
  if (mode === 'pvc' && KEY2[e.code] && snake1.alive) {
    e.preventDefault();
    pushDir(snake1, KEY2[e.code]);
  }
});

// ─────────────────────────────────────────────
// Input — touch swipe fallback (pvc: anywhere except joystick / buttons)
// ─────────────────────────────────────────────
let swipeX = 0, swipeY = 0, swipePending = false;
const gameEl = document.getElementById('game-container');

gameEl.addEventListener('touchstart', e => {
  // Ignore touches on buttons or joystick base (joystick handles its own input)
  if (e.target.closest('button, .joy-base')) return;
  swipeX = e.touches[0].clientX;
  swipeY = e.touches[0].clientY;
  swipePending = true;
}, { passive: true });

gameEl.addEventListener('touchend', e => {
  if (!swipePending) return;
  swipePending = false;
  // pvc only: swipe anywhere (outside joystick) also steers snake1
  if (mode !== 'pvc' || !snake1?.alive) return;
  const dx = e.changedTouches[0].clientX - swipeX;
  const dy = e.changedTouches[0].clientY - swipeY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  pushDir(snake1, Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'RIGHT' : 'LEFT')
    : (dy > 0 ? 'DOWN'  : 'UP'));
}, { passive: true });

// Pause button — fast touch response
document.getElementById('pause-btn').addEventListener('touchstart', e => {
  e.preventDefault();
  togglePause();
}, { passive: false });

// Back button — fast touch response
document.getElementById('back-btn').addEventListener('touchstart', e => {
  e.preventDefault();
  backToMenu();
}, { passive: false });

// ─────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────
function aiMove(snake, target) {
  if (!snake.alive || !target) return;
  const [hx, hy] = snake.body[0];
  const [tx, ty] = target;

  const cands = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    .filter(d => d !== OPPOSITE[snake.dir])
    .sort((a, b) => {
      const da = Math.abs(hx + DIR[a][0] - tx) + Math.abs(hy + DIR[a][1] - ty);
      const db = Math.abs(hx + DIR[b][0] - tx) + Math.abs(hy + DIR[b][1] - ty);
      return da - db;
    });

  const occ   = new Set([...snake1.body, ...snake2.body].map(([x, y]) => `${x},${y}`));
  const tail1 = `${snake1.body.at(-1)[0]},${snake1.body.at(-1)[1]}`;
  const tail2 = `${snake2.body.at(-1)[0]},${snake2.body.at(-1)[1]}`;

  for (const d of cands) {
    const nx = hx + DIR[d][0], ny = hy + DIR[d][1];
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
    const k = `${nx},${ny}`;
    if (occ.has(k) && k !== tail1 && k !== tail2) continue;
    snake.queuedDirs.push(d);
    return;
  }
  // Fallback: any non-wall direction
  for (const d of cands) {
    const nx = hx + DIR[d][0], ny = hy + DIR[d][1];
    if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) { snake.queuedDirs.push(d); return; }
  }
}

function nearestFood(snake) {
  const [hx, hy] = snake.body[0];
  return foods.reduce((b, f) => {
    const d = Math.abs(f[0] - hx) + Math.abs(f[1] - hy);
    return !b || d < Math.abs(b[0] - hx) + Math.abs(b[1] - hy) ? f : b;
  }, null);
}

/** CPU1 in cvc mode picks a food other than the one CPU2 is targeting. */
function nearestFoodExcluding(snake, rival) {
  if (foods.length <= 1) return nearestFood(snake);
  const [hx, hy] = snake.body[0];
  const rivalTarget = nearestFood(rival);
  const pool = foods.filter(f => f !== rivalTarget);
  return (pool.length ? pool : foods).reduce((b, f) => {
    const d = Math.abs(f[0] - hx) + Math.abs(f[1] - hy);
    return !b || d < Math.abs(b[0] - hx) + Math.abs(b[1] - hy) ? f : b;
  }, null);
}

// ─────────────────────────────────────────────
// Game tick
// ─────────────────────────────────────────────
function tick() {
  if (paused || gameOver) { draw(); return; }

  // Respawn countdowns
  if (!snake1.alive && --snake1.respawnIn <= 0) respawnSnake(snake1, 7,  12, 'RIGHT');
  if (!snake2.alive && --snake2.respawnIn <= 0) respawnSnake(snake2, 22, 12, 'LEFT');

  // AI moves
  if ((mode === 'pvc' || mode === 'cvc') && snake2.alive)
    aiMove(snake2, nearestFood(snake2));
  if (mode === 'cvc' && snake1.alive)
    aiMove(snake1, nearestFoodExcluding(snake1, snake2));

  moveSnake(snake1);
  moveSnake(snake2);
  checkCollision(snake1, snake2);
  checkCollision(snake2, snake1);
  checkFood(snake1, 1);
  checkFood(snake2, 2);
  while (foods.length < foodCount) spawnFood();

  updateScoreDisplay();
  draw();
}

function respawnSnake(s, x, y, dir) {
  s.body = [
    [x, y],
    [x - DIR[dir][0],   y - DIR[dir][1]],
    [x - DIR[dir][0]*2, y - DIR[dir][1]*2],
  ];
  s.dir = dir; s.queuedDirs = []; s.alive = true;
}

function moveSnake(s) {
  if (!s.alive) return;
  if (s.queuedDirs.length) {
    const nxt = s.queuedDirs.shift();
    if (nxt !== OPPOSITE[s.dir]) s.dir = nxt;
  }
  const [hx, hy] = s.body[0];
  const [dx, dy] = DIR[s.dir];
  let nx = hx + dx;
  let ny = hy + dy;
  // Wrap-through-walls: emerge from the opposite side
  if (wallWrap) {
    nx = (nx + COLS) % COLS;
    ny = (ny + ROWS) % ROWS;
  }
  s.body.unshift([nx, ny]);
  s.body.pop();
}

function checkCollision(s, other) {
  if (!s.alive) return;
  const [hx, hy] = s.body[0];

  // Wall collision — skipped in wrap mode
  if (!wallWrap && (hx < 0 || hy < 0 || hx >= COLS || hy >= ROWS)) { killSnake(s); return; }

  for (let i = 1; i < s.body.length; i++)
    if (s.body[i][0] === hx && s.body[i][1] === hy) { killSnake(s); return; }

  if (other.alive)
    for (const [x, y] of other.body)
      if (x === hx && y === hy) { killSnake(s); return; }
}

function killSnake(s) {
  s.alive     = false;
  s.respawnIn = Math.round(2500 / tickInterval);
  if (s.id === 1) score1 = Math.max(0, score1 - 1);
  else            score2 = Math.max(0, score2 - 1);
}

function checkFood(s, pNum) {
  if (!s.alive) return;
  const [hx, hy] = s.body[0];
  for (let i = foods.length - 1; i >= 0; i--) {
    if (foods[i][0] === hx && foods[i][1] === hy) {
      foods.splice(i, 1);
      s.body.push([...s.body.at(-1)]);
      if (pNum === 1) score1++; else score2++;
    }
  }
}

function updateScoreDisplay() {
  document.getElementById('score1').textContent = score1;
  document.getElementById('score2').textContent = score2;
}

// ─────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────
function draw() {
  const col = C();

  // Background
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = col.grid;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }

  // Food
  for (const [fx, fy] of foods) {
    const cx = fx * CELL + CELL / 2, cy = fy * CELL + CELL / 2;
    const g  = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL);
    g.addColorStop(0, col.foodGlowIn);
    g.addColorStop(1, col.foodGlowOut);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col.food;
    ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - Math.max(1, CELL * 0.08), 0, Math.PI * 2); ctx.fill();
  }

  // Snakes
  drawSnake(snake1, col.p1Head, col.p1Body, col.p1Dead, col.eye);
  drawSnake(snake2, col.p2Head, col.p2Body, col.p2Dead, col.eye);

  // Pause overlay
  if (paused) {
    ctx.fillStyle = col.overlay;
    ctx.fillRect(0, 0, W, H);
    const fs = Math.max(16, (CELL * 1.9) | 0);
    ctx.fillStyle   = col.pauseText;
    ctx.font        = `bold ${fs}px Courier New`;
    ctx.textAlign   = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font      = `${(fs * 0.58) | 0}px Courier New`;
    ctx.fillStyle = col.pauseSub;
    ctx.fillText(isTouch() ? '再按 ⏸ 繼續' : '按 P 繼續', W / 2, H / 2 + fs);
    ctx.textAlign = 'left';
  }

  // Respawn countdowns
  const l1 = mode === 'cvc' ? 'CPU1' : 'P1';
  const l2 = mode === 'pvp' ? 'P2' : (mode === 'cvc' ? 'CPU2' : 'CPU');
  if (!snake1.alive) drawRespawn(snake1, col.respawn1, l1);
  if (!snake2.alive) drawRespawn(snake2, col.respawn2, l2);
}

function drawSnake(s, headCol, bodyCol, deadCol, eyeCol) {
  for (let i = s.body.length - 1; i >= 0; i--) {
    const [x, y]  = s.body[i];
    const isHead  = i === 0;

    ctx.fillStyle = isHead
      ? (s.alive ? headCol : deadCol)
      : (s.alive ? shadeColor(bodyCol, 1 - (i / s.body.length) * 0.4) : deadCol);

    const pad = Math.max(1, CELL * (isHead ? 0.05 : 0.10));
    const r   = Math.max(2, CELL * (isHead ? 0.22 : 0.15));
    roundRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2, r);
    ctx.fill();

    // Eyes
    if (isHead && s.alive) {
      ctx.fillStyle = eyeCol;
      const [dx, dy] = DIR[s.dir];
      const ex = dy !== 0 ? CELL * 0.28 : (dx > 0 ? CELL * 0.72 : CELL * 0.22);
      const ey = dx !== 0 ? CELL * 0.28 : (dy > 0 ? CELL * 0.72 : CELL * 0.22);
      const offs = dx !== 0
        ? [[ex, CELL * 0.22], [ex, CELL * 0.65]]
        : [[CELL * 0.22, ey], [CELL * 0.65, ey]];
      const er = Math.max(1.2, CELL * 0.10);
      for (const [ox, oy] of offs) {
        ctx.beginPath(); ctx.arc(x * CELL + ox, y * CELL + oy, er, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function drawRespawn(s, color, label) {
  const secs = (s.respawnIn * tickInterval / 1000).toFixed(1);
  ctx.fillStyle = color + '1A';
  ctx.fillRect(0, 0, W, H);

  const px = s.id === 1 ? W * 0.25 : W * 0.75;
  const py = H / 2;
  const fs = Math.max(11, CELL | 0);

  ctx.fillStyle   = color;
  ctx.font        = `bold ${fs}px Courier New`;
  ctx.textAlign   = 'center';
  ctx.fillText(`${label} 重生中...`, px, py - fs * 0.4);
  ctx.font        = `${(fs * 0.82) | 0}px Courier New`;
  ctx.fillStyle   = '#aaa';
  ctx.fillText(`${secs}s`, px, py + fs * 1.1);
  ctx.textAlign   = 'left';
}

// ─────────────────────────────────────────────
// Drawing utilities
// ─────────────────────────────────────────────
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function shadeColor(hex, ratio) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${(r * ratio) | 0},${(g * ratio) | 0},${(b * ratio) | 0})`;
}

// ─────────────────────────────────────────────
// Joystick setup
// ─────────────────────────────────────────────
/**
 * Attach a virtual joystick to the given base/knob elements.
 * getPlayerFn() is called on each move to get the target player (1 or 2).
 */
function setupJoystick(baseId, knobId, getPlayerFn) {
  const base = document.getElementById(baseId);
  const knob = document.getElementById(knobId);
  if (!base || !knob) return;

  const R    = 52;   // clamp radius in px (slightly less than base radius so knob stays inside)
  const DEAD = 14;   // dead-zone radius in px
  let touchId = null;
  let centerX = 0;
  let centerY = 0;
  let lastDir = null;

  function getCenter() {
    const rect = base.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function moveKnob(dx, dy) {
    const dist  = Math.hypot(dx, dy);
    const ratio = Math.min(dist, R) / (dist || 1);
    const ox    = dx * ratio;
    const oy    = dy * ratio;
    knob.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;

    if (dist < DEAD) { lastDir = null; return; }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;   // -180 .. 180
    const dir =
      angle > -45  && angle <=  45  ? 'RIGHT' :
      angle >  45  && angle <= 135  ? 'DOWN'  :
      angle > -135 && angle <= -45  ? 'UP'    : 'LEFT';

    if (dir !== lastDir) {
      lastDir = dir;
      const player = getPlayerFn();
      const snake  = player === 1 ? snake1 : snake2;
      if (snake?.alive) pushDir(snake, dir);
    }
  }

  function resetKnob() {
    knob.style.transform = 'translate(-50%, -50%)';
    lastDir = null;
    touchId = null;
  }

  base.addEventListener('touchstart', e => {
    e.preventDefault();
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    const c = getCenter();
    centerX = c.x; centerY = c.y;
    moveKnob(t.clientX - centerX, t.clientY - centerY);
  }, { passive: false });

  base.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = [...e.changedTouches].find(tt => tt.identifier === touchId);
    if (!t) return;
    moveKnob(t.clientX - centerX, t.clientY - centerY);
  }, { passive: false });

  base.addEventListener('touchend', e => {
    if ([...e.changedTouches].some(tt => tt.identifier === touchId)) resetKnob();
  }, { passive: false });

  base.addEventListener('touchcancel', () => resetKnob(), { passive: false });
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
setMode('pvc');
setupJoystick('joy1-base', 'joy1-knob', () => 1);
setupJoystick('joy2-base', 'joy2-knob', () => bottomJoyPlayer);
