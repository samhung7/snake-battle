# 🐍 Snake Battle — 貪食蛇對戰

A polished two-player Snake game playable in any browser — desktop or mobile.
Live demo → **[samhung7.github.io/snake-battle](https://samhung7.github.io/snake-battle)**

---

## Features

| | |
|---|---|
| 🎮 **Three game modes** | 1P vs 2P · 1P vs CPU · CPU vs CPU (spectator) |
| 🤖 **Smart AI** | CPU snakes chase the nearest food while avoiding collisions |
| 🌀 **Wall-wrap mode** | Toggle snakes passing through walls (on by default) |
| 🍎 **Configurable food** | 1 – 10 food items on the field at once |
| 📱 **Mobile-first** | Full-screen swipe (pvc) · dual joysticks (pvp) |
| ⌨️ **Keyboard support** | WASD + Arrow keys for P1 in pvc; Arrow keys for P2 in pvp |
| 🌗 **Light / Dark theme** | Toggleable at any time, light by default |
| 🌐 **5 languages** | 繁中 · 简中 · English · 日本語 · 한국어 |

---

## Controls

### Desktop

| Player | Keys |
|--------|------|
| P1 | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or Arrow keys |
| P2 (pvp) | Arrow keys |

**ESC** → back to menu
**P** → pause / resume

### Mobile

| Mode | Control |
|------|---------|
| 1P vs CPU | Swipe anywhere on screen |
| 1P vs 2P | Two virtual joysticks (top = P1, bottom = P2) |

---

## Game Rules

- **Eat food** → +1 point, snake grows longer
- **Hit a wall / yourself / the other snake** → −1 point (min 0), respawn after ~2 s
- First to run away with the most points wins!

---

## Project Structure

```
snake-battle/
├── index.html        # Markup & game screens
├── css/
│   └── style.css     # Theming via CSS custom properties
└── js/
    └── game.js       # All game logic, AI, rendering, i18n
```

---

## Running Locally

```bash
npx serve .          # serves on http://localhost:3000
# — or —
python3 -m http.server 3000
```

Open `http://localhost:3000` in your browser.

---

## Tech Stack

- Vanilla HTML5 / CSS3 / JavaScript (no frameworks, no build step)
- Canvas 2D API for rendering
- CSS Custom Properties for dual-theme support
- Touch Events API for mobile joystick & swipe controls
- Hosted via **GitHub Pages**
