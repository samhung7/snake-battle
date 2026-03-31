/* ═══════════════════════════════════════════
   game.js — Snake Battle
═══════════════════════════════════════════ */

// ─────────────────────────────────────────────
// Grid & layout constants
// ─────────────────────────────────────────────
const COLS   = 30;
const ROWS   = 25;
const DPAD_H     = 100;   // px — not used directly for pvp-touch (flex fills)
const PVP_BAR_H  = 40;    // px height of each pvp score bar
const MIN_PAD_H  = 80;    // px minimum touchpad height reserved per side

let CELL = 20;
let W    = COLS * CELL;
let H    = ROWS * CELL;

const DIR      = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
const OPPOSITE = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

// ─────────────────────────────────────────────
// Theme — canvas draw colors
// ─────────────────────────────────────────────
let theme = 'light';

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
  document.querySelectorAll('.theme-icon')
    .forEach(el => { el.textContent = theme === 'dark' ? '☀' : '🌙'; });
  if (snake1) draw();
}

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
let lang = 'zh-TW';

const I18N = {
  'zh-TW': {
    title:         '貪食蛇對戰',
    btnPvp:        '1P vs 2P',
    btnPvc:        '1P vs AI',
    btnCvc:        'AI vs AI',
    speedLabel:    '速度：',
    speedSlow:     '慢速',
    speedNormal:   '正常',
    speedFast:     '快速',
    speedCrazy:    '瘋狂',
    wallWrapLabel: '穿牆模式',
    wallWrapOn:    '開啟 ✓',
    wallWrapOff:   '關閉',
    foodLabel:     '食物數量',
    startBtn:      '開始遊戲',
    restartBtn:    '再玩一局',
    menuBtn:       '主選單',
    statusNormal:  '按 ESC 返回 | 按 P 暫停',
    statusCvc:     '觀戰模式 ★ 按 P 暫停',
    pauseText:     'PAUSED',
    pauseSubTouch: '再按 ⏸ 繼續',
    pauseSubKey:   '按 P 繼續',
    respawning:    '重生中...',
    p1: 'P1', p2: 'P2', cpu: 'AI', cpu1: 'AI 1', cpu2: 'AI 2',
    rotateHint: '請旋轉手機為直向',
    hintPvpTouch:
      `<span class="c-p1">● 玩家1：下方觸控板滑動</span><br>
       <span class="c-p2">● 玩家2：上方觸控板滑動</span><br><br>
       撞牆或對方 → 扣分並重生　搶食物 → 得分`,
    hintPvpKey:
      `<span class="c-p1">● 玩家1：WASD 移動</span><br>
       <span class="c-p2">● 玩家2：方向鍵 移動</span><br><br>
       撞牆、撞自己或對方蛇身 → 扣分並重生<br>搶先吃到食物 → 得分`,
    hintPvcTouch:
      `<span class="c-p1">● 玩家1：在畫面任意滑動操控</span><br>
       <span class="c-p2">● AI：自動追蹤食物</span><br><br>
       撞牆或對方 → 扣分並重生　搶食物 → 得分`,
    hintPvcKey:
      `<span class="c-p1">● 玩家1：WASD 或方向鍵</span><br>
       <span class="c-p2">● AI：自動追蹤食物</span><br><br>
       撞牆、撞自己或對方蛇身 → 扣分並重生<br>搶先吃到食物 → 得分`,
    hintCvc:
      `<span class="c-p1">● AI 1：自動追蹤食物</span><br>
       <span class="c-p2">● AI 2：自動追蹤食物</span><br><br>
       <span class="c-accent">🤖 純觀戰模式，完全不需動手！</span><br>
       撞牆、撞自己或對方蛇身 → 扣分並重生`,
  },

  'en': {
    title:         'Snake Battle',
    btnPvp:        '1P vs 2P',
    btnPvc:        '1P vs AI',
    btnCvc:        'AI vs AI',
    speedLabel:    'Speed:',
    speedSlow:     'Slow',
    speedNormal:   'Normal',
    speedFast:     'Fast',
    speedCrazy:    'Crazy',
    wallWrapLabel: 'Wall Wrap',
    wallWrapOn:    'On ✓',
    wallWrapOff:   'Off',
    foodLabel:     'Food Count',
    startBtn:      'Start Game',
    restartBtn:    'Play Again',
    menuBtn:       'Main Menu',
    statusNormal:  'ESC: Menu  |  P: Pause',
    statusCvc:     'Spectate ★  P: Pause',
    pauseText:     'PAUSED',
    pauseSubTouch: 'Tap ⏸ to resume',
    pauseSubKey:   'P to resume',
    respawning:    'Respawning...',
    p1: 'P1', p2: 'P2', cpu: 'AI', cpu1: 'AI 1', cpu2: 'AI 2',
    rotateHint: 'Please rotate to portrait',
    hintPvpTouch:
      `<span class="c-p1">● P1: Swipe on bottom pad</span><br>
       <span class="c-p2">● P2: Swipe on top pad</span><br><br>
       Hit wall or opponent → lose point &amp; respawn<br>Eat food first → gain point`,
    hintPvpKey:
      `<span class="c-p1">● P1: WASD keys</span><br>
       <span class="c-p2">● P2: Arrow keys</span><br><br>
       Hit wall, self, or opponent → lose point<br>Eat food first → gain point`,
    hintPvcTouch:
      `<span class="c-p1">● P1: Swipe anywhere on screen</span><br>
       <span class="c-p2">● AI: Auto-chases food</span><br><br>
       Hit wall or opponent → lose point &amp; respawn`,
    hintPvcKey:
      `<span class="c-p1">● P1: WASD or Arrow keys</span><br>
       <span class="c-p2">● AI: Auto-chases food</span><br><br>
       Hit wall, self, or opponent → lose point`,
    hintCvc:
      `<span class="c-p1">● AI 1: Auto-chases food</span><br>
       <span class="c-p2">● AI 2: Auto-chases food</span><br><br>
       <span class="c-accent">🤖 Spectator mode — sit back and watch!</span><br>
       Hit wall or body → lose point`,
  },

  'ja': {
    title:         'スネークバトル',
    btnPvp:        '1P vs 2P',
    btnPvc:        '1P vs AI',
    btnCvc:        'AI vs AI',
    speedLabel:    'スピード：',
    speedSlow:     'スロー',
    speedNormal:   'ノーマル',
    speedFast:     'ファスト',
    speedCrazy:    'クレイジー',
    wallWrapLabel: '壁抜けモード',
    wallWrapOn:    'オン ✓',
    wallWrapOff:   'オフ',
    foodLabel:     'エサの数',
    startBtn:      'ゲームスタート',
    restartBtn:    'もう一度',
    menuBtn:       'メインメニュー',
    statusNormal:  'ESC: メニュー  |  P: 一時停止',
    statusCvc:     '観戦モード ★  P: 一時停止',
    pauseText:     'PAUSED',
    pauseSubTouch: '⏸ で再開',
    pauseSubKey:   'P で再開',
    respawning:    '復活中...',
    p1: 'P1', p2: 'P2', cpu: 'AI', cpu1: 'AI 1', cpu2: 'AI 2',
    rotateHint: '縦向きに回転してください',
    hintPvpTouch:
      `<span class="c-p1">● P1：下のタッチパッドをスワイプ</span><br>
       <span class="c-p2">● P2：上のタッチパッドをスワイプ</span><br><br>
       壁・相手に当たる → 減点して復活　エサを先取り → 得点`,
    hintPvpKey:
      `<span class="c-p1">● P1：WASD キー</span><br>
       <span class="c-p2">● P2：矢印キー</span><br><br>
       壁・自分・相手に当たる → 減点<br>エサを先取り → 得点`,
    hintPvcTouch:
      `<span class="c-p1">● P1：画面をスワイプして操作</span><br>
       <span class="c-p2">● AI：自動でエサを追跡</span><br><br>
       壁・相手に当たる → 減点して復活`,
    hintPvcKey:
      `<span class="c-p1">● P1：WASD または矢印キー</span><br>
       <span class="c-p2">● AI：自動でエサを追跡</span><br><br>
       壁・自分・相手に当たる → 減点`,
    hintCvc:
      `<span class="c-p1">● AI 1：自動でエサを追跡</span><br>
       <span class="c-p2">● AI 2：自動でエサを追跡</span><br><br>
       <span class="c-accent">🤖 観戦モード — 見ているだけでOK！</span><br>
       壁や体に当たる → 減点`,
  },

  'ko': {
    title:         '스네이크 배틀',
    btnPvp:        '1P vs 2P',
    btnPvc:        '1P vs AI',
    btnCvc:        'AI vs AI',
    speedLabel:    '속도：',
    speedSlow:     '느림',
    speedNormal:   '보통',
    speedFast:     '빠름',
    speedCrazy:    '미침',
    wallWrapLabel: '벽 통과 모드',
    wallWrapOn:    '켜짐 ✓',
    wallWrapOff:   '꺼짐',
    foodLabel:     '음식 수',
    startBtn:      '게임 시작',
    restartBtn:    '다시 하기',
    menuBtn:       '메인 메뉴',
    statusNormal:  'ESC: 메뉴  |  P: 일시정지',
    statusCvc:     '관전 모드 ★  P: 일시정지',
    pauseText:     'PAUSED',
    pauseSubTouch: '⏸ 탭하여 재개',
    pauseSubKey:   'P 재개',
    respawning:    '부활 중...',
    p1: 'P1', p2: 'P2', cpu: 'AI', cpu1: 'AI 1', cpu2: 'AI 2',
    rotateHint: '세로 방향으로 회전해 주세요',
    hintPvpTouch:
      `<span class="c-p1">● P1: 아래 터치패드 스와이프</span><br>
       <span class="c-p2">● P2: 위 터치패드 스와이프</span><br><br>
       벽·상대에 충돌 → 감점 후 부활　음식 먹기 → 득점`,
    hintPvpKey:
      `<span class="c-p1">● P1: WASD 키</span><br>
       <span class="c-p2">● P2: 방향키</span><br><br>
       벽·자신·상대에 충돌 → 감점<br>음식 먹기 → 득점`,
    hintPvcTouch:
      `<span class="c-p1">● P1: 화면 스와이프로 조작</span><br>
       <span class="c-p2">● AI: 자동으로 음식 추적</span><br><br>
       벽·상대에 충돌 → 감점 후 부활`,
    hintPvcKey:
      `<span class="c-p1">● P1: WASD 또는 방향키</span><br>
       <span class="c-p2">● AI: 자동으로 음식 추적</span><br><br>
       벽·자신·상대에 충돌 → 감점`,
    hintCvc:
      `<span class="c-p1">● AI 1: 자동으로 음식 추적</span><br>
       <span class="c-p2">● AI 2: 자동으로 음식 추적</span><br><br>
       <span class="c-accent">🤖 관전 모드 — 그냥 구경하세요!</span><br>
       벽이나 몸에 충돌 → 감점`,
  },

  'zh-CN': {
    title:         '贪食蛇对战',
    btnPvp:        '1P vs 2P',
    btnPvc:        '1P vs AI',
    btnCvc:        'AI vs AI',
    speedLabel:    '速度：',
    speedSlow:     '慢速',
    speedNormal:   '正常',
    speedFast:     '快速',
    speedCrazy:    '疯狂',
    wallWrapLabel: '穿墙模式',
    wallWrapOn:    '开启 ✓',
    wallWrapOff:   '关闭',
    foodLabel:     '食物数量',
    startBtn:      '开始游戏',
    restartBtn:    '再玩一局',
    menuBtn:       '主菜单',
    statusNormal:  'ESC 返回 | P 暂停',
    statusCvc:     '观战模式 ★ P 暂停',
    pauseText:     'PAUSED',
    pauseSubTouch: '再按 ⏸ 继续',
    pauseSubKey:   '按 P 继续',
    respawning:    '重生中...',
    p1: 'P1', p2: 'P2', cpu: 'AI', cpu1: 'AI 1', cpu2: 'AI 2',
    rotateHint: '请旋转手机为竖向',
    hintPvpTouch:
      `<span class="c-p1">● 玩家1：下方触控板滑动</span><br>
       <span class="c-p2">● 玩家2：上方触控板滑动</span><br><br>
       撞墙或对方 → 扣分并重生　抢食物 → 得分`,
    hintPvpKey:
      `<span class="c-p1">● 玩家1：WASD 移动</span><br>
       <span class="c-p2">● 玩家2：方向键 移动</span><br><br>
       撞墙、撞自己或对方蛇身 → 扣分并重生<br>抢先吃到食物 → 得分`,
    hintPvcTouch:
      `<span class="c-p1">● 玩家1：在画面任意滑动操控</span><br>
       <span class="c-p2">● AI：自动追踪食物</span><br><br>
       撞墙或对方 → 扣分并重生`,
    hintPvcKey:
      `<span class="c-p1">● 玩家1：WASD 或方向键</span><br>
       <span class="c-p2">● AI：自动追踪食物</span><br><br>
       撞墙、撞自己或对方蛇身 → 扣分并重生`,
    hintCvc:
      `<span class="c-p1">● AI 1：自动追踪食物</span><br>
       <span class="c-p2">● AI 2：自动追踪食物</span><br><br>
       <span class="c-accent">🤖 纯观战模式，完全不需动手！</span><br>
       撞墙、撞自己或对方蛇身 → 扣分并重生`,
  },
};

/** Safe translation lookup. */
function T(key) {
  return (I18N[lang] && I18N[lang][key] !== undefined)
    ? I18N[lang][key]
    : (I18N['zh-TW'][key] ?? key);
}

/** Apply all data-i18n translations and refresh dynamic text. */
function setLang(l) {
  lang = l;
  document.title = T('title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = T(key);
    if (val !== undefined) el.textContent = val;
  });
  // Wall-wrap button text depends on current state
  const wwBtn = document.getElementById('wall-wrap-btn');
  if (wwBtn) wwBtn.textContent = wallWrap ? T('wallWrapOn') : T('wallWrapOff');
  // Refresh mode hint
  setMode(mode);
}

// ─────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────
let mode         = 'pvc';
let gameLoop     = null;
let paused       = false;
let gameOver     = false;
let tickInterval = 100;
let wallWrap     = true;     // default: wall-wrap on
let foodCount    = 3;
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
  const touch = isTouch();
  let barH = 48, topH = 0, botH = 0;

  if (touch && mode === 'pvp') {
    // pvp-touch: regular topbar is hidden; pvp score bars + min touchpad reserved
    barH = 0;
    topH = PVP_BAR_H + MIN_PAD_H;   // pvp-bar-top + minimum touchpad1 height
    botH = MIN_PAD_H + PVP_BAR_H;   // minimum touchpad2 height + pvp-bar-bottom
  }

  const statH  = touch ? 0 : 26;
  const padH   = touch ? 6 : 10;
  const availW = window.innerWidth  - (touch ? 4 : 20);
  const availH = window.innerHeight - barH - topH - botH - statH - padH;

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
  if (!hint) return;

  if (m === 'pvp') {
    hint.innerHTML = touch ? T('hintPvpTouch') : T('hintPvpKey');
  } else if (m === 'pvc') {
    hint.innerHTML = touch ? T('hintPvcTouch') : T('hintPvcKey');
  } else {
    hint.innerHTML = T('hintCvc');
  }
}

function startGame() {
  tickInterval = parseInt(document.getElementById('speed-select').value);
  document.getElementById('menu').style.display           = 'none';
  document.getElementById('game-container').style.display = 'flex';

  if (mode === 'cvc') {
    document.getElementById('p1-label').innerHTML =
      T('cpu1') + ': <span id="score1">0</span>';
    document.getElementById('p2-label').innerHTML =
      T('cpu2') + ': <span id="score2">0</span>';
    document.getElementById('status').textContent = T('statusCvc');
  } else {
    document.getElementById('p1-label').innerHTML =
      T('p1') + ': <span id="score1">0</span>';
    document.getElementById('p2-label').innerHTML =
      (mode === 'pvc' ? T('cpu') : T('p2')) + ': <span id="score2">0</span>';
    document.getElementById('status').textContent = T('statusNormal');
  }

  lockPortrait();
  setupDpads();
  initGame();
}

// ─────────────────────────────────────────────
// Portrait orientation lock
// ─────────────────────────────────────────────
function lockPortrait() {
  try {
    if (screen.orientation?.lock) {
      screen.orientation.lock('portrait-primary').catch(() => {});
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────
// Touchpad zones (pvp touch only; pvc uses full-screen swipe)
// ─────────────────────────────────────────────
function setupDpads() {
  const touch          = isTouch();
  const topZone        = document.getElementById('dpad-top');
  const botZone        = document.getElementById('dpad-bottom');
  const pvpBarTop      = document.getElementById('pvp-bar-top');
  const pvpBarBot      = document.getElementById('pvp-bar-bottom');
  const gameTopbar     = document.getElementById('game-topbar');
  const gameContainer  = document.getElementById('game-container');

  // Reset all to defaults
  topZone.classList.add('hidden');
  botZone.classList.add('hidden');
  pvpBarTop.classList.add('hidden');
  pvpBarBot.classList.add('hidden');
  gameTopbar.classList.remove('hidden');
  gameContainer.classList.remove('pvp-touch');

  if (!touch) return;

  if (mode === 'pvp') {
    topZone.classList.remove('hidden');     // P1 touchpad at top
    botZone.classList.remove('hidden');     // P2 touchpad at bottom
    pvpBarTop.classList.remove('hidden');   // score bar P1 perspective
    pvpBarBot.classList.remove('hidden');   // score bar P2 perspective (rotated)
    gameTopbar.classList.add('hidden');     // regular topbar hidden
    gameContainer.classList.add('pvp-touch');
  }
  // pvc & cvc: no touchpad zones — pvc uses full-screen swipe
}

// ─────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────
function backToMenu() {
  stopGame();
  document.getElementById('overlay').classList.remove('visible');
  const gc = document.getElementById('game-container');
  gc.style.display = 'none';
  // Clean up pvp-touch layout state so next visit starts fresh
  gc.classList.remove('pvp-touch');
  document.getElementById('game-topbar').classList.remove('hidden');
  document.getElementById('menu').style.display = 'flex';
}

function restartGame() {
  document.getElementById('overlay').classList.remove('visible');
  initGame();
}

function togglePause() {
  paused = !paused;
  const icon = paused ? '▶' : '⏸';
  document.getElementById('pause-btn').textContent = icon;
  const pvpBtn = document.getElementById('pvp-pause-btn');
  if (pvpBtn) pvpBtn.textContent = icon;
}

// ─────────────────────────────────────────────
// Wall-wrap mode
// ─────────────────────────────────────────────
function toggleWallWrap() {
  wallWrap = !wallWrap;
  const btn = document.getElementById('wall-wrap-btn');
  btn.textContent = wallWrap ? T('wallWrapOn') : T('wallWrapOff');
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
  const pvpBtn = document.getElementById('pvp-pause-btn');
  if (pvpBtn) pvpBtn.textContent = '⏸';
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
// Input — touch swipe (pvc: TRUE full-screen, registered on document)
// ─────────────────────────────────────────────
let swipeX = 0, swipeY = 0, swipePending = false;

// Use document so the swipe zone covers the entire viewport, including
// areas outside #game-container (status bar, safe areas, etc.)
document.addEventListener('touchstart', e => {
  // Ignore touches on interactive widgets (buttons, joystick base, selects)
  if (e.target.closest('button, .joy-base, select')) return;
  swipeX = e.touches[0].clientX;
  swipeY = e.touches[0].clientY;
  swipePending = true;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!swipePending) return;
  swipePending = false;
  // Only act in pvc mode while the game screen is visible and snake is alive
  if (mode !== 'pvc' || !snake1?.alive) return;
  if (document.getElementById('game-container').style.display === 'none') return;
  const dx = e.changedTouches[0].clientX - swipeX;
  const dy = e.changedTouches[0].clientY - swipeY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  pushDir(snake1, Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'RIGHT' : 'LEFT')
    : (dy > 0 ? 'DOWN'  : 'UP'));
}, { passive: true });

// Prevent context menu / long-press callout anywhere on screen
document.addEventListener('contextmenu', e => e.preventDefault());

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
// AI — distance & movement helpers
// ─────────────────────────────────────────────

/**
 * Wrapped Manhattan distance.
 * When wallWrap is on the board is toroidal, so the shortest path
 * may go through a wall — this accounts for that.
 */
function wDist(ax, ay, bx, by) {
  const dx = wallWrap
    ? Math.min(Math.abs(ax - bx), COLS - Math.abs(ax - bx))
    : Math.abs(ax - bx);
  const dy = wallWrap
    ? Math.min(Math.abs(ay - by), ROWS - Math.abs(ay - by))
    : Math.abs(ay - by);
  return dx + dy;
}

/** One step in direction d from (x, y), wrapping if wallWrap is on. */
function wStep(x, y, d) {
  let nx = x + DIR[d][0], ny = y + DIR[d][1];
  if (wallWrap) { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; }
  return [nx, ny];
}

/** Nearest food to snake, using wrapped distance. */
function nearestFood(snake) {
  const [hx, hy] = snake.body[0];
  return foods.reduce((b, f) => {
    const d = wDist(f[0], f[1], hx, hy);
    return !b || d < wDist(b[0], b[1], hx, hy) ? f : b;
  }, null);
}

/** Nearest food excluding the one the rival is already targeting. */
function nearestFoodExcluding(snake, rival) {
  if (foods.length <= 1) return nearestFood(snake);
  const [hx, hy] = snake.body[0];
  const rivalTarget = nearestFood(rival);
  const pool = foods.filter(f => f !== rivalTarget);
  return (pool.length ? pool : foods).reduce((b, f) => {
    const d = wDist(f[0], f[1], hx, hy);
    return !b || d < wDist(b[0], b[1], hx, hy) ? f : b;
  }, null);
}

/**
 * Predict the rival's next `steps` positions (greedy toward nearest food).
 * Returns a Set of "x,y" key strings the rival is likely to pass through.
 */
function rivalLookahead(rival, steps) {
  if (!rival.alive || !foods.length) return new Set();
  let [rx, ry] = rival.body[0];
  let dir = rival.dir;
  const ahead = new Set();
  for (let i = 0; i < steps; i++) {
    // Pick direction minimising wrapped distance to nearest food
    const best = ['UP', 'DOWN', 'LEFT', 'RIGHT']
      .filter(d => d !== OPPOSITE[dir])
      .sort((a, b) => {
        const [nxa, nya] = wStep(rx, ry, a);
        const [nxb, nyb] = wStep(rx, ry, b);
        const fa = foods.reduce((mn, f) => Math.min(mn, wDist(nxa, nya, f[0], f[1])), Infinity);
        const fb = foods.reduce((mn, f) => Math.min(mn, wDist(nxb, nyb, f[0], f[1])), Infinity);
        return fa - fb;
      })[0];
    if (!best) break;
    [rx, ry] = wStep(rx, ry, best);
    dir = best;
    ahead.add(`${rx},${ry}`);
  }
  return ahead;
}

// ─────────────────────────────────────────────
// AI — main move decision
// ─────────────────────────────────────────────
function aiMove(snake, target) {
  if (!snake.alive || !target) return;
  const [hx, hy] = snake.body[0];
  const rival     = snake === snake1 ? snake2 : snake1;

  const occ   = new Set([...snake1.body, ...snake2.body].map(([x, y]) => `${x},${y}`));
  const tail1 = `${snake1.body.at(-1)[0]},${snake1.body.at(-1)[1]}`;
  const tail2 = `${snake2.body.at(-1)[0]},${snake2.body.at(-1)[1]}`;

  // Rival's predicted path for the next 4 ticks
  const rivalAhead = rivalLookahead(rival, 4);

  // Rival's nearest food and how far they are from it
  const rivalFoodTarget = rival.alive ? nearestFood(rival) : null;
  const [rx, ry]        = rival.alive ? rival.body[0] : [-1, -1];
  const rivalToFood     = rivalFoodTarget
    ? wDist(rx, ry, rivalFoodTarget[0], rivalFoodTarget[1])
    : Infinity;

  const scored = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    .filter(d => d !== OPPOSITE[snake.dir])
    .map(d => {
      const [nx, ny] = wStep(hx, hy, d);
      if (!wallWrap && (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS)) return null;
      const k = `${nx},${ny}`;
      if (occ.has(k) && k !== tail1 && k !== tail2) return null;

      // Base score: wrapped distance to own food target (lower = better)
      let score = wDist(nx, ny, target[0], target[1]) * 10;

      // Block bonus: stepping onto the rival's predicted path cuts them off
      if (rivalAhead.has(k)) score -= 25;

      // Cut-off bonus: heading to the rival's food faster than they can —
      // steals the food AND forces them to reroute through our body
      if (rivalFoodTarget) {
        const myToRivalFood = wDist(nx, ny, rivalFoodTarget[0], rivalFoodTarget[1]);
        if (myToRivalFood < rivalToFood) score -= 8;
      }

      return { d, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  if (scored.length) { snake.queuedDirs.push(scored[0].d); return; }

  // Fallback: any direction that avoids immediate wall collision
  for (const d of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
    if (d === OPPOSITE[snake.dir]) continue;
    const [nx, ny] = wStep(hx, hy, d);
    if (wallWrap || (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS)) {
      snake.queuedDirs.push(d); return;
    }
  }
}

// ─────────────────────────────────────────────
// Game tick
// ─────────────────────────────────────────────
function tick() {
  if (paused || gameOver) { draw(); return; }

  if (!snake1.alive && --snake1.respawnIn <= 0) respawnSnake(snake1, 7,  12, 'RIGHT');
  if (!snake2.alive && --snake2.respawnIn <= 0) respawnSnake(snake2, 22, 12, 'LEFT');

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
  // Update all score display elements (main + pvp bars top & bottom)
  for (const [id, val] of [
    ['score1',   score1], ['pvp-s1a', score1], ['pvp-s1b', score1],
    ['score2',   score2], ['pvp-s2a', score2], ['pvp-s2b', score2],
  ]) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

// ─────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────
function draw() {
  const col = C();

  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = col.grid;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }

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

  drawSnake(snake1, col.p1Head, col.p1Body, col.p1Dead, col.eye);
  drawSnake(snake2, col.p2Head, col.p2Body, col.p2Dead, col.eye);

  if (paused) {
    ctx.fillStyle = col.overlay;
    ctx.fillRect(0, 0, W, H);
    const fs = Math.max(16, (CELL * 1.9) | 0);
    ctx.fillStyle   = col.pauseText;
    ctx.font        = `bold ${fs}px Courier New`;
    ctx.textAlign   = 'center';
    ctx.fillText(T('pauseText'), W / 2, H / 2);
    ctx.font      = `${(fs * 0.58) | 0}px Courier New`;
    ctx.fillStyle = col.pauseSub;
    ctx.fillText(isTouch() ? T('pauseSubTouch') : T('pauseSubKey'), W / 2, H / 2 + fs);
    ctx.textAlign = 'left';
  }

  const l1 = mode === 'cvc' ? T('cpu1') : T('p1');
  const l2 = mode === 'pvp' ? T('p2') : (mode === 'cvc' ? T('cpu2') : T('cpu'));
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
  ctx.fillText(`${label} ${T('respawning')}`, px, py - fs * 0.4);
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
// Touchpad setup (pvp: each player gets a swipe strip)
// ─────────────────────────────────────────────
/**
 * Attach swipe-to-steer logic to a touchpad element.
 * getPlayerFn() returns 1 or 2 to identify which snake to steer.
 * Supports both quick swipes (touchstart→end) and continuous drag (touchmove).
 */
function setupTouchpad(padId, getPlayerFn) {
  const pad = document.getElementById(padId);
  if (!pad) return;

  const THRESHOLD = 16;   // px drag before a direction registers
  let touchId = null, startX = 0, startY = 0;

  function steer(clientX, clientY) {
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESHOLD) return;
    const snake = getPlayerFn() === 1 ? snake1 : snake2;
    if (snake?.alive) {
      pushDir(snake, Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : 'LEFT')
        : (dy > 0 ? 'DOWN'  : 'UP'));
    }
    // Reset reference point so each subsequent drag segment works
    startX = clientX;
    startY = clientY;
  }

  pad.addEventListener('touchstart', e => {
    e.preventDefault();
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    startX  = t.clientX;
    startY  = t.clientY;
  }, { passive: false });

  pad.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = [...e.changedTouches].find(tt => tt.identifier === touchId);
    if (t) steer(t.clientX, t.clientY);
  }, { passive: false });

  pad.addEventListener('touchend', e => {
    const t = [...e.changedTouches].find(tt => tt.identifier === touchId);
    if (!t) return;
    steer(t.clientX, t.clientY);
    touchId = null;
  }, { passive: false });

  pad.addEventListener('touchcancel', () => { touchId = null; }, { passive: false });
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────

// pvp pause button — fast touch response
document.getElementById('pvp-pause-btn').addEventListener('touchstart', e => {
  e.preventDefault();
  togglePause();
}, { passive: false });

// pvp back buttons (class-based in case of multiple) — fast touch response
document.querySelectorAll('.pvp-back-btn').forEach(btn => {
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    backToMenu();
  }, { passive: false });
});

// Default: light theme
document.body.classList.add('light');
document.querySelectorAll('.theme-icon').forEach(el => { el.textContent = '🌙'; });

// Default: wall-wrap on — sync button appearance
const _wwBtn = document.getElementById('wall-wrap-btn');
if (_wwBtn) { _wwBtn.classList.add('active'); }

// Apply default language (also sets mode hint and wall-wrap button text)
setLang('zh-TW');
setMode('pvc');

setupTouchpad('touchpad1', () => 1);
setupTouchpad('touchpad2', () => 2);
