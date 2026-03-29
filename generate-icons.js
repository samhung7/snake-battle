/**
 * generate-icons.js
 * Creates snake-themed PNG icons using only Node.js built-ins (zlib).
 * Run: node generate-icons.js
 */
'use strict';
const zlib = require('zlib');
const fs   = require('fs');

/* ── CRC32 ──────────────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ── PNG builder ─────────────────────────────── */
function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}
function makePNG(pixels, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = y * stride + 1 + x * 4;
      raw[di]   = pixels[si];
      raw[di+1] = pixels[si+1];
      raw[di+2] = pixels[si+2];
      raw[di+3] = pixels[si+3];
    }
  }
  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'binary'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Pixel drawing helpers ───────────────────── */
function drawIcon(size) {
  const px = new Uint8Array(size * size * 4);

  function blend(i, r, g, b, a) {
    const oa = px[i+3] / 255, na = a / 255;
    const fa = na + oa * (1 - na);
    if (fa < 1e-6) return;
    px[i]   = Math.round((r*na + px[i]  *oa*(1-na)) / fa);
    px[i+1] = Math.round((g*na + px[i+1]*oa*(1-na)) / fa);
    px[i+2] = Math.round((b*na + px[i+2]*oa*(1-na)) / fa);
    px[i+3] = Math.round(fa * 255);
  }

  function dot(cx, cy, rad, r, g, b) {
    const x0 = Math.max(0, (cx - rad - 1) | 0);
    const x1 = Math.min(size - 1, (cx + rad + 1) | 0);
    const y0 = Math.max(0, (cy - rad - 1) | 0);
    const y1 = Math.min(size - 1, (cy + rad + 1) | 0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const a = Math.max(0, Math.min(1, rad - Math.hypot(x-cx, y-cy) + 0.5));
      if (a > 0) blend((y*size+x)*4, r, g, b, (a*255)|0);
    }
  }

  // ── Background: rounded square #1A5472 ──────
  const CR = size * 0.18;
  const [BR, BG, BB] = [0x1A, 0x54, 0x72];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = Math.max(0, CR - x, x - (size-1-CR));
    const dy = Math.max(0, CR - y, y - (size-1-CR));
    const a  = Math.max(0, Math.min(1, CR - Math.hypot(dx, dy) + 0.5));
    if (a > 0) blend((y*size+x)*4, BR, BG, BB, (a*255)|0);
  }

  // ── Snake S-shape ────────────────────────────
  const s = size;
  const bR = size * 0.092;   // body radius
  // Colors
  const [H1, H2, H3] = [0x52, 0x8A, 0xAA];  // head: slightly darker
  const [B1, B2, B3] = [0xA8, 0xD0, 0xE2];  // body: light blue

  // Build S-curve path via cubic bezier sampling
  function bezier(p0, p1, p2, p3, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps;
      const t2 = t*t, t3 = t2*t, mt = 1-t, mt2 = mt*mt, mt3 = mt2*mt;
      pts.push([
        mt3*p0[0] + 3*mt2*t*p1[0] + 3*mt*t2*p2[0] + t3*p3[0],
        mt3*p0[1] + 3*mt2*t*p1[1] + 3*mt*t2*p2[1] + t3*p3[1],
      ]);
    }
    return pts;
  }
  const m = 0.14;  // margin
  // Three bezier segments forming S
  const seg1 = bezier([m,m+.04], [m,.38], [1-m,.38], [1-m,.50], 40);
  const seg2 = bezier([1-m,.50], [1-m,.62], [m,.62], [m,.74], 40);
  const seg3 = bezier([m,.74],  [m+.06,.74], [m+.14,.82], [m+.14,.92], 20);
  const path = [...seg1, ...seg2, ...seg3];

  // Draw body back to front
  for (let i = path.length-1; i >= 1; i--) {
    const [nx, ny] = path[i];
    const t = i / (path.length - 1);
    // Slight gradient: slightly lighter towards tail
    const fade = 0.85 + 0.15 * (1 - t);
    dot(nx*s, ny*s, bR, (B1*fade)|0, (B2*fade)|0, (B3*fade)|0);
  }
  // Head (first point)
  const [hx, hy] = path[0];
  dot(hx*s, hy*s, bR*1.15, H1, H2, H3);

  // Eyes (offset relative to head, facing right along seg1)
  const er = bR * 0.32;
  const ex = hx*s + bR*0.55, eyOff = bR*0.42;
  dot(ex, hy*s - eyOff, er,  255, 255, 255);
  dot(ex, hy*s + eyOff, er,  255, 255, 255);
  dot(ex + er*0.3, hy*s - eyOff, er*0.45, 0x0d, 0x19, 0x22);
  dot(ex + er*0.3, hy*s + eyOff, er*0.45, 0x0d, 0x19, 0x22);

  // Tongue (two prongs extending from head)
  const tx = hx*s - bR*1.2, ty = hy*s;
  dot(tx - bR*0.3, ty - bR*0.45, bR*0.18, 0xD4, 0x3A, 0x2A);
  dot(tx - bR*0.3, ty + bR*0.45, bR*0.18, 0xD4, 0x3A, 0x2A);
  for (let t = 0; t <= 1; t += 0.1) {
    const lx = hx*s - bR*0.85 - t*bR*0.35;
    const ly = ty - t*bR*0.45;
    dot(lx, ly, bR*0.14, 0xD4, 0x3A, 0x2A);
    dot(lx, ty + t*bR*0.45, bR*0.14, 0xD4, 0x3A, 0x2A);
  }

  return makePNG(px, size, size);
}

/* ── Generate all sizes ──────────────────────── */
const targets = [
  { size: 512, path: 'icons/icon-512.png'      },
  { size: 192, path: 'icons/icon-192.png'      },
  { size: 180, path: 'apple-touch-icon.png'    },
];
for (const { size, path } of targets) {
  const buf = drawIcon(size);
  fs.writeFileSync(path, buf);
  console.log(`✓ ${path}  (${size}×${size}, ${(buf.length/1024).toFixed(1)} KB)`);
}
console.log('Done.');
