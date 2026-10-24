// PWA用アイコン(PNG)を外部ライブラリなしで描く。クリーム地に鍵盤と青い音符。
// 出力: app/icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, px) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const BG = hex('#fbf7ef'), WHITE = hex('#ffffff'), EDGE = hex('#b9b2a5'), BLACK = hex('#24212b'), BLUE = hex('#2f6fd0');
function draw(size, pad) {
  const S = 4, px = Buffer.alloc(size * size * 4);
  const sc = 1 - 2 * pad, u = v => v * sc + pad;
  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const acc = [0, 0, 0];
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const fx = (x + (sx + 0.5) / S) / size, fy = (y + (sy + 0.5) / S) / size;
      let col = BG;
      // 鍵盤(下半分): 白鍵5つ、黒鍵3つ
      const kx = (fx - u(0.12)) / (0.76 * sc), ky = (fy - u(0.56)) / (0.34 * sc);
      if (kx >= 0 && kx < 1 && ky >= 0 && ky < 1) {
        const w = kx * 5; col = (w % 1 < 0.04) ? EDGE : WHITE;
        if (ky < 0.6 && [1, 2, 4].some(k => Math.abs(w - k) < 0.3)) col = BLACK;
      }
      // 音符(上): 玉と棒と旗
      const nx = (fx - u(0.4)) / sc, ny = (fy - u(0.38)) / sc;
      if (inEll(nx * Math.cos(0.4) + ny * Math.sin(0.4), -nx * Math.sin(0.4) + ny * Math.cos(0.4), 0, 0, 0.1, 0.07)) col = BLUE;
      if (Math.abs(fx - u(0.49)) < 0.022 * sc && fy > u(0.1) && fy < u(0.37)) col = BLUE;
      if (fx > u(0.49) && fx < u(0.62) && fy > u(0.1) && fy < u(0.1) + (fx - u(0.49)) * 1.2 + 0.05 * sc) col = BLUE;
      acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2];
    }
    const i = (y * size + x) * 4;
    px[i] = acc[0] / 16; px[i + 1] = acc[1] / 16; px[i + 2] = acc[2] / 16; px[i + 3] = 255;
  }
  return png(size, size, px);
}
const out = path.join(__dirname, '../app/icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), draw(192, 0.03));
fs.writeFileSync(path.join(out, 'icon-512.png'), draw(512, 0.03));
fs.writeFileSync(path.join(out, 'maskable-512.png'), draw(512, 0.14));
fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), draw(180, 0.05));
console.log('icons written');
