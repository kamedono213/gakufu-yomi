// がくふよみ — 楽譜を読む練習(よむ)と相対音感の練習(きく)、読み方の基本(きほん)
// 音の表し方: 譜面上の位置は「di」(全音階の通し番号 = オクターブ*7 + C0D1E2F3G4A5B6)、♯♭は acc(+1/-1)。
// 鳴らす音・鍵盤は MIDI 番号(C4 = 60)。
'use strict';

// 「もどる」「やめる」を押したら、本当にもどるか確かめる(スマホの「戻る」操作も)。
// 画面のボタンは id="back" / id="quit"。もともと確認があるボタンは data-noconfirm をつけて除く
(() => {
  let bypass = false, ignorePop = false;
  const pass = fn => { bypass = true; fn(); setTimeout(() => { bypass = false; }, 500); };
  const ask = onYes => {
    if (document.getElementById('leave-confirm')) return;
    const d = document.createElement('div');
    d.id = 'leave-confirm'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px';
    d.innerHTML = '<div style="background:#fff;color:#222;border-radius:16px;padding:20px 18px;max-width:320px;width:100%;display:grid;gap:14px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.25)">'
      + '<b style="font-size:18px">本当にもどりますか？</b><span style="font-size:14px;color:#555">いまの続きは消えることがあります。</span>'
      + '<div style="display:flex;gap:10px"><button type="button" data-a="no" style="flex:1;padding:12px;border-radius:12px;border:1px solid #ccc;background:#fff;color:#222;font:inherit;font-weight:700">つづける</button>'
      + '<button type="button" data-a="yes" style="flex:1;padding:12px;border-radius:12px;border:0;background:#2f6fd0;color:#fff;font:inherit;font-weight:700">もどる</button></div></div>';
    d.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (!a && e.target !== d) return;
      d.remove();
      if (a && a.dataset.a === 'yes') onYes();
    });
    document.body.appendChild(d);
    d.querySelector('[data-a="no"]').focus();
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('#back, #quit');
    if (!b || bypass || b.hasAttribute('data-noconfirm')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ask(() => pass(() => b.click()));
  }, true);
  // ROUTED: このアプリが画面ごとに履歴を積むか。積まないアプリは、戻る操作を受け止める「しおり」を1つ積んでおく
  const ROUTED = false;
  const guard = () => history.pushState({ leaveGuard: 1 }, '');
  if (!ROUTED) guard();
  window.addEventListener('popstate', e => {
    if (ignorePop) { ignorePop = false; e.stopImmediatePropagation(); return; }
    if (bypass) return;
    e.stopImmediatePropagation();
    if (!ROUTED) {
      const b = document.querySelector('#back, #quit');
      if (!b) { history.back(); return; }                 // メニュー画面ではそのままアプリを閉じる
      guard();
      if (b.hasAttribute('data-noconfirm')) { b.click(); return; }
      ask(() => pass(() => b.click()));
      return;
    }
    ignorePop = true; history.go(1); // いったん元の画面にとどまる
    ask(() => pass(() => history.back()));
  }, true);
})();

// ---------- ふりがな(ちりパズルと同じく、漢字の上に小さく読みを出す)
// 辞書 window.FURI は furi.js(onze.ltd/tools/furigana/make-furi.js が自動生成)。
// 画面に出た文字を自動で包むので、各画面のコードは変えなくてよい。答え合わせに使う textContent は変わらない(読みは CSS で表示)。
// 切りかえボタンは、data-furi-slot を付けた場所に自動で入る。設定はアプリごとに保存
(() => {
  const D = window.FURI || {};
  // 先頭の1文字ごとに、長い順に並べておく(文まるごと → 単語の順に当てはめる)
  const byHead = {};
  Object.keys(D).sort((a, b) => b.length - a.length).forEach(k => (byHead[k[0]] = byHead[k[0]] || []).push(k));
  const KEY = 'furi:' + location.pathname;
  let on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* 保存できなくても動く */ }
  const css = document.createElement('style');
  // アプリ側の「span に〜」という指定が効かないように、ルビの span は !important で固める
  css.textContent = '.rbw,.rb{margin:0!important;border:0!important;background:none!important;min-width:0!important;font:inherit!important;color:inherit!important;letter-spacing:inherit!important;text-indent:0!important}'
    + '.rbw{display:inline!important;padding:0!important}'
    + '.rb{display:inline-block!important;position:relative!important;padding:0!important}'
    // ふりがなありの時は行の高さを広げ、読みは行間(漢字の上のすき間)に置く。行ごとに高さがばらつかない
    + 'html.furi body{line-height:2.2}'
    + 'html.furi .rb{line-height:max(2.2em, 1em + 17px)!important}'
    + 'html.furi .rb::before{content:attr(data-rt);position:absolute;bottom:calc(50% + 1.02em);left:50%;transform:translateX(-50%);font-size:max(.5em,7.5px);font-weight:700;line-height:1.1;white-space:nowrap;letter-spacing:0;pointer-events:none}'
    + '.furi-tools{display:inline-flex;flex-wrap:wrap;gap:6px;justify-self:start;align-self:center;width:auto;flex:none;line-height:1.4}'
    + '.furi-toggle{width:auto;flex:none;line-height:1.4;border:1.5px solid rgba(127,127,127,.4);background:transparent;color:inherit;border-radius:999px;padding:4px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}'
    + '.furi-toggle[aria-pressed="true"]{border-color:currentColor}';
  document.head.appendChild(css);
  const apply = () => document.documentElement.classList.toggle('furi', on);
  apply();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TITLE']);
  const ok = el => {
    for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (e.namespaceURI === 'http://www.w3.org/2000/svg') return false;
      if (e.classList.contains('rb') || e.classList.contains('rbw') || e.hasAttribute('data-nofuri')) return false;
      if (e.lang && !/^ja/i.test(e.lang)) return false; // 外国語の文字(中国語の漢字など)には付けない
      if (SKIP.has(e.tagName)) return false;
    }
    return true;
  };
  function wrapText(node) {
    const t = node.nodeValue;
    if (!/[一-鿿々]/.test(t)) return;
    const frag = document.createDocumentFragment();
    let last = 0, hit = false;
    for (let i = 0; i < t.length;) {
      const k = (byHead[t[i]] || []).find(x => t.startsWith(x, i));
      if (!k) { i++; continue; }
      hit = true;
      if (i > last) frag.appendChild(document.createTextNode(t.slice(last, i)));
      for (const seg of D[k]) {
        if (typeof seg === 'string') { frag.appendChild(document.createTextNode(seg)); continue; }
        const s = document.createElement('span'); s.className = 'rb'; s.dataset.rt = seg[1]; s.textContent = seg[0];
        frag.appendChild(s);
      }
      i = last = i + k.length;
    }
    if (!hit) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    // 1つの span にまとめて入れる(flex や grid の中で、ルビごとに改行されないように)
    const w = document.createElement('span'); w.className = 'rbw'; w.appendChild(frag);
    node.replaceWith(w);
  }
  // 切りかえボタンを入れる箱(効果音ボタンもここに入る)
  function tools(slot) {
    let box = slot.querySelector(':scope > .furi-tools');
    if (!box) { box = document.createElement('span'); box.className = 'furi-tools'; box.setAttribute('data-nofuri', ''); slot.appendChild(box); }
    return box;
  }
  function toggleHtml() { return `<button type="button" class="furi-toggle" data-furi-toggle aria-pressed="${on}">ふりがな ${on ? 'あり' : 'なし'}</button>`; }
  function scan(root) {
    if (root.nodeType === 3) { if (ok(root.parentNode)) wrapText(root); return; }
    if (root.nodeType !== 1 || !ok(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    let n; while ((n = w.nextNode())) if (ok(n.parentNode)) list.push(n);
    list.forEach(wrapText);
    const slots = root.querySelectorAll ? [...root.querySelectorAll('[data-furi-slot]')] : [];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-furi-toggle]')) tools(s).insertAdjacentHTML('afterbegin', toggleHtml()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) scan(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-furi-toggle]'); if (!b) return;
    on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    apply();
    document.querySelectorAll('[data-furi-toggle]').forEach(x => { x.setAttribute('aria-pressed', on); x.textContent = 'ふりがな ' + (on ? 'あり' : 'なし'); });
  });
  window.furiTools = tools;
  if (document.body) scan(document.body);
})();

// ---------- 効果音(Web Audio で合成。音声ファイルは使わない)
// SE.play('ok') のように呼ぶ。音の名前: start / select / ok / ng / star / result / perfect / land / clear / over
// SE.chain(n) は連鎖の n 段目(段ごとに高くなる)。
// 「音あり/なし」ボタンは data-furi-slot の場所に自動で入る(ふりがなボタンのとなり)。設定はアプリごとに保存
const SE = (() => {
  const KEY = 'se-muted:' + location.pathname;
  let muted = false, ctx = null;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* 保存できなくても動く */ }
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // 1音: 周波数・開始(秒)・長さ・波形・音量・(最後の周波数)
  function tone(freq, at, dur, type = 'sine', vol = 0.18, slideTo = null) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    start: () => { tone(523, 0, 0.09, 'triangle'); tone(784, 0.08, 0.14, 'triangle'); },
    select: () => tone(660, 0, 0.06, 'triangle', 0.12),
    ok: () => { tone(880, 0, 0.12, 'sine', 0.2); tone(1319, 0.1, 0.28, 'sine', 0.2); },
    ng: () => tone(220, 0, 0.32, 'square', 0.07, 150),
    star: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.14)),
    result: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.18, 'triangle')),
    perfect: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.16, 'triangle')); [1047, 1319, 1568].forEach(f => tone(f, 0.42, 0.6, 'sine', 0.1)); },
    land: () => tone(180, 0, 0.08, 'triangle', 0.16, 110),
    clear: () => { [659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.14, 'triangle')); tone(1319, 0.3, 0.45, 'sine', 0.12); },
    over: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.26, 'triangle', 0.14)),
  };
  function play(name) { if (muted || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* 音が出せない環境でも遊べる */ } }
  function chain(n) {
    if (muted) return;
    try { const f = 440 * Math.pow(2, Math.min(n - 1, 9) * 2 / 12); tone(f, 0, 0.1, 'triangle', 0.16); tone(f * 1.5, 0.07, 0.18, 'sine', 0.12); } catch (e) { /* 同上 */ }
  }
  const btn = () => `<button type="button" class="furi-toggle" data-se-toggle aria-pressed="${!muted}">${muted ? '🔇 音なし' : '🔊 音あり'}</button>`;
  function addButtons(root) {
    if (!root.querySelectorAll) return;
    const slots = [...root.querySelectorAll('[data-furi-slot]')];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-se-toggle]')) (window.furiTools ? window.furiTools(s) : s).insertAdjacentHTML('beforeend', btn()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) addButtons(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-se-toggle]'); if (!b) return;
    muted = !muted; try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    document.querySelectorAll('[data-se-toggle]').forEach(x => { x.setAttribute('aria-pressed', !muted); x.textContent = muted ? '🔇 音なし' : '🔊 音あり'; });
    play('select');
  });
  if (document.body) addButtons(document.body);
  return { play, chain, get muted() { return muted; } };
})();


const $app = document.getElementById('app');
const STORE = 'gy:';
const load = (k, d) => { try { const v = localStorage.getItem(STORE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) {} };
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 音の名前 ----------
const SEMI = [0, 2, 4, 5, 7, 9, 11];
const DOREMI = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
const PC_NAME = ['ド', 'ド♯', 'レ', 'レ♯', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'ラ♯', 'シ'];
const MOVABLE = ['ド', 'ド♯', 'レ', 'レ♯', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'ラ♯', 'シ'];
const midiOf = n => (Math.floor(n.di / 7) + 1) * 12 + SEMI[n.di % 7] + (n.acc || 0);
const nameOf = n => DOREMI[n.di % 7] + (n.acc > 0 ? '♯' : n.acc < 0 ? '♭' : '');
const di = (letter, oct) => oct * 7 + 'CDEFGAB'.indexOf(letter);
const isWhite = m => [0, 2, 4, 5, 7, 9, 11].includes(((m % 12) + 12) % 12);

// ---------- 音 (Web Audio でピアノ風の音を合成) ----------
let AC = null, master = null;
function audio() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createDynamicsCompressor(); master.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(midi, when = 0, dur = 0.9, vol = 0.32) {
  const ac = audio(); const t0 = ac.currentTime + when;
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.6);
  [[1, 1], [2, 0.42], [3, 0.18], [4, 0.09], [5, 0.04]].forEach(([h, a]) => {
    const o = ac.createOscillator(); o.type = h === 1 ? 'triangle' : 'sine'; o.frequency.value = f * h;
    const og = ac.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t0); o.stop(t0 + dur + 0.7);
  });
}
const chord = (ms, when = 0, dur = 0.9) => ms.forEach(m => tone(m, when, dur, 0.22));
// 調の確認用カデンツ(I-IV-V-I)。相対音感の「ド」を耳に入れるため
function cadence(tonic) {
  const T = tonic; [[T, T + 4, T + 7], [T + 5, T + 9, T + 12], [T + 7, T + 11, T + 14], [T, T + 4, T + 7]].forEach((c, i) => chord(c.map(x => x - 12), i * 0.55, 0.5));
  return 4 * 0.55 + 0.2;
}

// ---------- 五線を描く (SVG) ----------
const L = 12;            // 線の間隔
const H = L / 2;         // 半分(線と間の1段)
const TREBLE_BOTTOM = di('E', 4), BASS_BOTTOM = di('G', 2);
const MUSIC_FONT = "'Noto Music', 'Bravura', 'Segoe UI Symbol', serif";

function staffLines(x0, x1, yBottom) {
  let s = '';
  for (let i = 0; i < 5; i++) s += `<line x1="${x0}" x2="${x1}" y1="${yBottom - i * L}" y2="${yBottom - i * L}" stroke="#3a3540" stroke-width="1.1"/>`;
  return s;
}
function clefSvg(kind, x, yBottom) {
  if (kind === 'treble') return `<text x="${x}" y="${yBottom + 0.85 * L}" font-size="${4.35 * L}" font-family="${MUSIC_FONT}" fill="#24212b">&#x1D11E;</text>`;
  return `<text x="${x}" y="${yBottom - 1.05 * L}" font-size="${4.35 * L}" font-family="${MUSIC_FONT}" fill="#24212b">&#x1D122;</text>`;
}
// 音符1つ。dur: 4=全 2=2分 1=4分 0.5=8分
function noteSvg(x, y, dur, stemUp, color, acc) {
  const filled = dur <= 1;
  let s = '';
  if (acc) s += `<text x="${x - 19}" y="${y + 5}" font-size="${1.9 * L}" font-family="${MUSIC_FONT}" fill="${color}">${acc > 0 ? '&#x266F;' : '&#x266D;'}</text>`;
  s += `<ellipse cx="${x}" cy="${y}" rx="6.6" ry="4.7" transform="rotate(-22 ${x} ${y})" fill="${filled ? color : '#fff'}" stroke="${color}" stroke-width="${filled ? 0 : 1.8}"/>`;
  if (dur < 4) {
    const sx = stemUp ? x + 6.1 : x - 6.1, sy2 = stemUp ? y - 3.3 * L : y + 3.3 * L;
    s += `<line x1="${sx}" x2="${sx}" y1="${y + (stemUp ? -1 : 1)}" y2="${sy2}" stroke="${color}" stroke-width="1.4"/>`;
    if (dur === 0.5) s += stemUp
      ? `<path d="M${sx} ${sy2} c 1 7 10 9 9 18 c -1 -7 -6 -9 -9 -10 z" fill="${color}"/>`
      : `<path d="M${sx} ${sy2} c 1 -7 10 -9 9 -18 c -1 7 -6 9 -9 10 z" fill="${color}"/>`;
  }
  return s;
}
// 休符。yTop = その段の第5線の y
function restSvg(x, yBottom, dur, color) {
  const l4 = yBottom - 3 * L, l3 = yBottom - 2 * L;
  if (dur === 4) return `<rect x="${x - 7}" y="${l4}" width="14" height="${H}" fill="${color}"/>`;
  if (dur === 2) return `<rect x="${x - 7}" y="${l3 - H}" width="14" height="${H}" fill="${color}"/>`;
  if (dur === 1) return `<text x="${x - 6}" y="${l3 + 0.9 * L}" font-size="${3.4 * L}" font-family="${MUSIC_FONT}" fill="${color}">&#x1D13D;</text>`;
  return `<text x="${x - 6}" y="${l3 + 0.7 * L}" font-size="${3.4 * L}" font-family="${MUSIC_FONT}" fill="${color}">&#x1D13E;</text>`;
}
function ledgers(x, d, bottom, yBottom) {
  let s = '';
  const top = bottom + 8;
  for (let k = bottom - 2; k >= d; k -= 2) { const y = yBottom - (k - bottom) * H; s += `<line x1="${x - 11}" x2="${x + 11}" y1="${y}" y2="${y}" stroke="#3a3540" stroke-width="1.1"/>`; }
  for (let k = top + 2; k <= d; k += 2) { const y = yBottom - (k - bottom) * H; s += `<line x1="${x - 11}" x2="${x + 11}" y1="${y}" y2="${y}" stroke="#3a3540" stroke-width="1.1"/>`; }
  return s;
}

// items: [{ dur, rest?, notes:[{di,acc,staff:'t'|'b'}], bar? }]。 state: 各itemの色('', 'cur', 'ok', 'ng')
// opts: { clef:'treble'|'bass'|'grand', labels?:bool }
function scoreSvg(items, state = [], opts = {}) {
  const grand = opts.clef === 'grand';
  const gap = 46, x0 = 8, startX = opts.clef === 'grand' ? 74 : 62;
  const width = Math.max(260, startX + items.length * gap + (items.filter(i => i.bar).length) * 8 + 24);
  const topPad = 4.5 * L;
  const tBottom = topPad + 4 * L;                  // ト音記号の段の第1線
  const bBottom = grand ? tBottom + 4 * L + 7 * L : tBottom;
  const height = (grand ? bBottom : tBottom) + 4.5 * L + (opts.labels ? 18 : 0);
  const clefs = grand ? ['treble', 'bass'] : [opts.clef || 'treble'];
  let s = `<svg class="score" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="楽譜">`;
  for (const c of clefs) {
    const yb = c === 'bass' && grand ? bBottom : tBottom;
    s += staffLines(x0, width - 8, yb) + clefSvg(c, x0 + 4, yb);
  }
  if (grand) s += `<line x1="${x0}" x2="${x0}" y1="${tBottom - 4 * L}" y2="${bBottom}" stroke="#3a3540" stroke-width="1.6"/>`;
  let x = startX;
  items.forEach((it, i) => {
    const st = state[i] || '';
    const color = st === 'ok' ? '#2e8a5c' : st === 'ng' ? '#d0443a' : st === 'cur' ? '#2f6fd0' : '#24212b';
    if (st === 'cur') s += `<rect x="${x - 17}" y="${tBottom - 6 * L}" width="34" height="${(grand ? bBottom : tBottom) - tBottom + 10 * L}" rx="8" fill="#e6eefb" opacity=".85"/>`;
    if (it.rest) {
      const yb = (it.staff === 'b' && grand) || (!grand && opts.clef === 'bass') ? (grand ? bBottom : tBottom) : tBottom;
      s += restSvg(x, yb, it.dur, color);
    } else {
      for (const n of it.notes) {
        const onBass = grand ? n.staff === 'b' : opts.clef === 'bass';
        const bottom = onBass ? BASS_BOTTOM : TREBLE_BOTTOM;
        const yb = onBass && grand ? bBottom : tBottom;
        const y = yb - (n.di - bottom) * H;
        s += ledgers(x, n.di, bottom, yb);
        s += noteSvg(x, y, it.dur, n.di < bottom + 4, color, n.acc);
        if (opts.labels || it.hint) s += `<text x="${x}" y="${(grand ? bBottom : tBottom) + 3.6 * L + (opts.labels ? 6 : 0)}" text-anchor="middle" font-size="12" font-weight="700" fill="${color}">${nameOf(n)}</text>`;
      }
    }
    x += gap;
    if (it.bar) { s += `<line x1="${x - gap / 2 + 4}" x2="${x - gap / 2 + 4}" y1="${tBottom - 4 * L}" y2="${grand ? bBottom : tBottom}" stroke="#3a3540" stroke-width="1.2"/>`; x += 8; }
  });
  return s + '</svg>';
}

// ---------- レベル ----------
// rhythm: 使う音価、rests: 使う休符、measures: 4/4 の小節数(なければ count 個の4分音符)
const N = (l, o, acc = 0) => ({ di: di(l, o), acc });
const range = (a, b) => { const out = []; for (let d = a.di; d <= b.di; d++) out.push({ di: d, acc: 0 }); return out; };
const READ = [
  { id: 'r1', lesson: 'k1', title: 'ドレミ', sub: 'ド・レ・ミの3つ', clef: 'treble', pool: range(N('C', 4), N('E', 4)), count: 1, q: 10, kb: [60, 72], labels: 'all' },
  { id: 'r2', title: 'ド〜ソ', sub: '5つの音', clef: 'treble', pool: range(N('C', 4), N('G', 4)), count: 1, q: 10, kb: [60, 72], labels: 'all' },
  { id: 'r3', lesson: 'k2', title: 'ド〜高いド', sub: '1オクターブ', clef: 'treble', pool: range(N('C', 4), N('C', 5)), count: 1, q: 10, kb: [60, 72], labels: 'all' },
  { id: 'r4', title: '2つ続けて', sub: '2音ずつ読む', clef: 'treble', pool: range(N('C', 4), N('C', 5)), count: 2, q: 8, kb: [60, 72], labels: 'do' },
  { id: 'r5', title: '4つ続けて', sub: '1小節', clef: 'treble', pool: range(N('C', 4), N('C', 5)), measures: 1, rhythm: [1], q: 6, kb: [60, 72], labels: 'do' },
  { id: 'r6', lesson: 'k3', title: '音符の長さ', sub: '全・2分・4分音符', clef: 'treble', pool: range(N('C', 4), N('C', 5)), measures: 2, rhythm: [4, 2, 1], q: 5, kb: [60, 72], labels: 'do' },
  { id: 'q1', title: '記号クイズ', sub: '音符と休符の名前・長さ', quiz: 'symbols', q: 10 },
  { id: 'r7', lesson: 'k4', title: '休符が出る', sub: '4分・2分・全休符', clef: 'treble', pool: range(N('C', 4), N('C', 5)), measures: 2, rhythm: [2, 1], rests: [4, 2, 1], q: 5, kb: [60, 72], labels: 'do' },
  { id: 'r8', title: '8分音符', sub: '8分音符・8分休符も', clef: 'treble', pool: range(N('C', 4), N('C', 5)), measures: 2, rhythm: [2, 1, 0.5], rests: [1, 0.5], q: 5, kb: [60, 72], labels: 'none' },
  { id: 'r9', lesson: 'k5', title: '加線の音', sub: '下のラ〜上のラ', clef: 'treble', pool: range(N('A', 3), N('A', 5)), measures: 2, rhythm: [2, 1], q: 5, kb: [57, 81], labels: 'do' },
  { id: 'r10', lesson: 'k6', title: '♯と♭', sub: '黒い鍵盤', clef: 'treble', pool: range(N('C', 4), N('C', 5)), accidentals: true, measures: 2, rhythm: [2, 1], q: 5, kb: [60, 72], labels: 'none' },
  { id: 'r11', lesson: 'k7', title: 'ヘ音記号', sub: '左手の音(1つずつ)', clef: 'bass', pool: range(N('C', 3), N('C', 4)), count: 1, q: 10, kb: [48, 60], labels: 'do' },
  { id: 'r12', title: 'ヘ音記号で4つ', sub: '低いソ〜ド', clef: 'bass', pool: range(N('G', 2), N('C', 4)), measures: 2, rhythm: [2, 1], rests: [1], q: 5, kb: [43, 60], labels: 'do' },
  { id: 'r13', lesson: 'k8', title: '大譜表', sub: '右手と左手が交互に', clef: 'grand', grand: 'alt', q: 6, kb: [48, 79], labels: 'do' },
  { id: 'r14', title: '両手で同時に', sub: '上と下を一緒に押す', clef: 'grand', grand: 'chord', q: 6, kb: [48, 79], labels: 'do' },
  { id: 'r15', title: '両手のフレーズ', sub: 'メロディと伴奏', clef: 'grand', grand: 'phrase', q: 4, kb: [48, 79], labels: 'none' },
  { id: 'r16', lesson: 'k9', title: 'すらすら読み(右手)', sub: '時間を計って16音', clef: 'treble', pool: range(N('A', 3), N('A', 5)), accidentals: true, measures: 4, rhythm: [2, 1, 0.5], rests: [1], q: 3, kb: [57, 81], labels: 'none', timed: true },
  { id: 'r17', title: 'すらすら読み(両手)', sub: '大譜表を時間内に', clef: 'grand', grand: 'phrase', q: 3, kb: [48, 79], labels: 'none', timed: true },
];
const EAR = [
  { id: 'e1', title: '高い？低い？', sub: '2つ目の音はどっち', ear: 'updown', q: 10 },
  { id: 'e2', title: '上・下・同じ', sub: '3択で聞き分け', ear: 'updownsame', q: 10 },
  { id: 'e3', title: 'ドから聞く(3音)', sub: 'ドの次に鳴る音は？', ear: 'fromDo', set: [0, 2, 4], q: 10 },
  { id: 'e4', title: 'ドから聞く(5音)', sub: 'ド〜ソ', ear: 'fromDo', set: [0, 2, 4, 5, 7], q: 10 },
  { id: 'e5', title: 'ドから聞く(8音)', sub: 'ド〜高いド', ear: 'fromDo', set: [0, 2, 4, 5, 7, 9, 11, 12], q: 10 },
  { id: 'e6', title: '調が変わる', sub: 'ドの高さが毎回変わる', ear: 'fromDo', set: [0, 2, 4, 5, 7, 9, 11, 12], moveKey: true, q: 10 },
  { id: 'e7', title: 'メロディ(3音)', sub: '聞いたとおりに弾く', ear: 'melody', len: 3, set: [0, 2, 4, 5, 7], moveKey: true, q: 6 },
  { id: 'e8', title: 'メロディ(4音)', sub: '1オクターブの中で', ear: 'melody', len: 4, set: [0, 2, 4, 5, 7, 9, 11, 12], moveKey: true, q: 6 },
  { id: 'e9', title: '♯♭も入る', sub: '半音も聞き分ける', ear: 'fromDo', set: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], moveKey: true, q: 10 },
];

// ---------- きほん(読み方のレッスン) ----------
const ex = (items, opts) => scoreSvg(items, [], opts);
const q4 = (l, o, acc = 0) => ({ dur: 1, notes: [{ di: di(l, o), acc }] });
const LESSONS = {
  k1: { title: '五線と音の高さ', body: () => `
    <p>楽譜は5本の線(五線)でできています。<b>上にあるほど高い音、下にあるほど低い音</b>です。</p>
    <p>音符は「線の上」か「線と線の間」に置かれます。線→間→線→間…と1段上がるごとに、ドレミが1つずつ上がります。</p>
    ${ex([q4('C', 4), q4('D', 4), q4('E', 4)], { clef: 'treble', labels: true })}
    <p class="tip">ト音記号の楽譜では、<b>下に1本線を足したところがド</b>。ドは線の上、レは線の下、ミは一番下の線の上です。</p>` },
  k2: { title: 'ドからドまで', body: () => `
    <p>ドから順に上がっていくと、8つ目でまたドになります(1オクターブ)。</p>
    ${ex(range(N('C', 4), N('C', 5)).map(n => ({ dur: 1, notes: [n] })), { clef: 'treble', labels: true })}
    <p class="tip">覚え方: <b>線の音はド・ミ・ソ・シ・レ・ファ</b>(1つ飛ばし)、<b>間の音はレ・ファ・ラ・ド・ミ</b>。線と間を交互に数えれば、どの音でも分かります。</p>` },
  k3: { title: '音符の長さ', body: () => `
    <p>音符の形で、音をのばす長さ(拍)が決まります。</p>
    ${ex([{ dur: 4, notes: [N('G', 4)] }, { dur: 2, notes: [N('G', 4)] }, { dur: 1, notes: [N('G', 4)] }, { dur: 0.5, notes: [N('G', 4)] }], { clef: 'treble' })}
    <p>左から <b>全音符(4拍)・2分音符(2拍)・4分音符(1拍)・8分音符(半拍)</b>。白い玉は長い音、黒い玉は短い音、旗がつくとさらに半分です。</p>
    <p class="tip">このゲームでは長さに関係なく、音の高さの鍵盤を押せば正解です。長さは見て覚えましょう。</p>` },
  k4: { title: '休符', body: () => `
    <p>休符は「音を出さずに休む」記号です。長さは音符と同じです。</p>
    ${ex([{ dur: 4, rest: true }, { dur: 2, rest: true }, { dur: 1, rest: true }, { dur: 0.5, rest: true }], { clef: 'treble' })}
    <p>左から <b>全休符(4拍)・2分休符(2拍)・4分休符(1拍)・8分休符(半拍)</b>。</p>
    <p class="tip">全休符と2分休符は形が似ています。<b>全休符は線にぶら下がる(重いから下がる)</b>、<b>2分休符は線の上に乗る(帽子)</b>と覚えます。休符が来たら「やすみ」ボタンを押しましょう。</p>` },
  k5: { title: '加線(かせん)', body: () => `
    <p>五線からはみ出す音は、短い線(加線)を足して書きます。</p>
    ${ex([q4('A', 3), q4('B', 3), q4('C', 4), q4('G', 5), q4('A', 5)], { clef: 'treble', labels: true })}
    <p class="tip">加線も「線→間→線」の数え方は同じです。下のドから下へ: シ(線の下)、ラ(加線2本目の上)。</p>` },
  k6: { title: '♯(シャープ)と♭(フラット)', body: () => `
    <p><b>♯は半音上げる</b>(右どなりの鍵盤)、<b>♭は半音下げる</b>(左どなりの鍵盤)記号です。多くは黒い鍵盤になります。</p>
    ${ex([q4('F', 4), q4('F', 4, 1), q4('B', 4), q4('B', 4, -1)], { clef: 'treble', labels: true })}
    <p class="tip">このゲームでは、記号はその音にだけつきます(同じ小節の後ろの音には効きません)。</p>` },
  k7: { title: 'ヘ音記号', body: () => `
    <p>低い音(左手)はヘ音記号の楽譜で書きます。<b>上から2本目の線(記号の2つの点の間)がファ</b>です。</p>
    ${ex(range(N('C', 3), N('C', 4)).map(n => ({ dur: 1, notes: [n] })), { clef: 'bass', labels: true })}
    <p class="tip">ヘ音記号の<b>一番上に1本線を足したところが真ん中のド</b>。ト音記号の下のドと同じ音です。</p>` },
  k8: { title: '大譜表と両手', body: () => `
    <p>ピアノの楽譜は、ト音記号(右手)とヘ音記号(左手)を2段セットで書きます。これを大譜表といいます。</p>
    ${ex([{ dur: 1, notes: [{ di: di('E', 4), acc: 0, staff: 't' }, { di: di('C', 3), acc: 0, staff: 'b' }] }, { dur: 1, notes: [{ di: di('G', 4), acc: 0, staff: 't' }, { di: di('G', 3), acc: 0, staff: 'b' }] }], { clef: 'grand', labels: true })}
    <p class="tip">縦にそろって並んでいる音は<b>同時に</b>弾きます。2本の指で一緒に鍵盤を押しましょう(パソコンなら少しの間に2つ押せばOK)。</p>` },
  k9: { title: 'スラスラ読むコツ', body: () => `
    <p>文章を1文字ずつ読まないのと同じで、楽譜も<b>かたまりで読みます</b>。</p>
    <p>・<b>形で読む</b>: 「線→線」は1つ飛ばし(3度)、「線→間」はとなり(2度)。上がる/下がるの形を先に見る。</p>
    <p>・<b>目印の音から数える</b>: ト音記号のソ(記号の渦の線)、真ん中のド、ヘ音記号のファ。</p>
    <p>・<b>少し先を見る</b>: 今の音を押しながら、次の音を見ておく。</p>
    <p class="tip">ここからは時間を計ります。間違えずに、だんだん速く。1分間に読める音の数が増えていけば上達しています。</p>` },
};

// ---------- 状態 ----------
let tab = load('tab', 'read');
const stars = load('stars', {});
const record = load('record', {});
const setStar = (id, n) => { if (!stars[id] || stars[id] < n) { stars[id] = n; save('stars', stars); } };
function unlocked(list, i) { return i === 0 || !!stars[list[i - 1].id]; }

// ---------- ホーム ----------
function home() {
  stopKeys();
  const list = tab === 'ear' ? EAR : READ;
  const cleared = list.filter(l => stars[l.id]).length;
  const items = [];
  list.forEach((l, i) => {
    if (tab === 'read' && l.lesson) items.push(`<button class="lv lesson" data-lesson="${l.lesson}"><span class="no">きほん</span><b>${esc(LESSONS[l.lesson].title)}</b><span class="small muted">読む前に</span></button>`);
    const ok = unlocked(list, i);
    items.push(`<button class="lv ${stars[l.id] ? 'done' : ''}" data-lv="${l.id}" ${ok ? '' : 'disabled'}><span class="no">${tab === 'ear' ? 'きく' : 'よむ'} ${i + 1}</span><b>${esc(l.title)}</b><span class="small muted">${esc(l.sub)}</span><span class="st">${'★'.repeat(stars[l.id] || 0)}${'☆'.repeat(3 - (stars[l.id] || 0))}</span></button>`);
  });
  const best = record.npm ? `<p class="small muted">すらすら読みの最高記録: 1分あたり <b>${record.npm}</b> 音</p>` : '';
  $app.innerHTML = `<div class="home">
    <div class="mast" data-furi-slot><h1>がくふ<span>よみ</span></h1><p class="muted">楽譜が、日本語の文章みたいに読めるようになるまで。</p></div>
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" data-tab="read" aria-selected="${tab === 'read'}">🎹 楽譜をよむ</button>
      <button class="tab" role="tab" data-tab="ear" aria-selected="${tab === 'ear'}">👂 音をきく(相対音感)</button>
    </div>
    <div class="goal"><div class="row" style="justify-content:space-between"><b>${tab === 'ear' ? '相対音感' : '読譜'}の進みぐあい</b><span class="small muted">${cleared} / ${list.length}</span></div><div class="bar"><i style="width:${cleared / list.length * 100}%"></i></div>${tab === 'ear' ? '<p class="small muted">基準の「ド」からの距離で音が分かる耳(相対音感)を育てます。イヤホン推奨。</p>' : best}</div>
    <div class="grid">${items.join('')}</div>
    <p class="small muted">スマホは横持ちがおすすめ。音が出ないときは、マナーモードを切ってください。</p>
  </div>`;
  $app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; save('tab', tab); home(); });
  $app.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => lesson(b.dataset.lesson));
  $app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { audio(); start(b.dataset.lv); });
}

function lesson(id) {
  const k = LESSONS[id];
  $app.innerHTML = `<div class="sheet"><div class="row"><button class="ghost" id="back">← もどる</button></div>
    <div class="card"><h2>${esc(k.title)}</h2>${k.body()}</div>
    <div class="row"><button class="primary" id="go">練習へ進む</button></div></div>`;
  $app.querySelector('#back').onclick = home;
  $app.querySelector('#go').onclick = () => { const lv = READ.find(l => l.lesson === id); audio(); start(lv.id); };
}

// ---------- 問題づくり ----------
function stepPick(pool, prev) {
  if (!prev) return pick(pool);
  // 楽譜らしく、近い音へ動くことを多めに
  const near = pool.filter(n => Math.abs(n.di - prev.di) <= 3 && n.di !== prev.di);
  return Math.random() < 0.75 && near.length ? pick(near) : pick(pool);
}
function withAcc(n, lv) {
  if (!lv.accidentals || Math.random() > 0.35) return { ...n, acc: 0 };
  const l = n.di % 7;
  const canSharp = [0, 1, 3, 4, 5].includes(l), canFlat = [1, 2, 4, 5, 6].includes(l);
  // 鍵盤の外に出る♯♭(高いドの♯など)は出さない
  const inKb = a => { const m = midiOf({ ...n, acc: a }); return m >= lv.kb[0] && m <= lv.kb[1]; };
  const opts = [canSharp && 1, canFlat && -1].filter(a => a && inKb(a));
  return { ...n, acc: opts.length ? pick(opts) : 0 };
}
function makeRhythm(lv) {
  const out = [];
  for (let m = 0; m < lv.measures; m++) {
    let left = 4;
    while (left > 0) {
      const durs = lv.rhythm.filter(d => d <= left);
      let d = pick(durs);
      if (d === 0.5) { out.push({ dur: 0.5 }); out.push({ dur: 0.5 }); left -= 1; continue; } // 8分は2つ組で1拍
      const useRest = lv.rests && Math.random() < 0.22 && lv.rests.includes(d);
      out.push({ dur: d, rest: useRest }); left -= d;
    }
    out[out.length - 1].bar = m < lv.measures - 1;
  }
  // 8分休符は8分音符の片方を置き換える
  if (lv.rests && lv.rests.includes(0.5)) out.forEach(it => { if (it.dur === 0.5 && Math.random() < 0.18) it.rest = true; });
  if (out.every(it => it.rest)) out[0].rest = false;
  return out;
}
function makeReadQuestion(lv) {
  if (lv.grand) return makeGrand(lv);
  const items = lv.measures ? makeRhythm(lv) : Array.from({ length: lv.count }, () => ({ dur: 1 }));
  let prev = null;
  items.forEach(it => { if (!it.rest) { const n = withAcc(stepPick(lv.pool, prev), lv); prev = n; it.notes = [n]; } else it.notes = []; });
  return items;
}
function makeGrand(lv) {
  const RH = range(N('C', 4), N('G', 5)), LH = range(N('C', 3), N('B', 3));
  const t = n => ({ ...n, staff: 't' }), b = n => ({ ...n, staff: 'b' });
  const len = lv.grand === 'phrase' ? 8 : 4;
  const items = []; let pr = null, pl = null;
  for (let i = 0; i < len; i++) {
    let notes;
    if (lv.grand === 'alt') { notes = Math.random() < 0.5 ? [t(pr = stepPick(RH, pr))] : [b(pl = stepPick(LH, pl))]; }
    else if (lv.grand === 'chord') { notes = [t(pr = stepPick(RH, pr)), b(pl = stepPick(LH, pl))]; }
    else { // フレーズ: 右手は毎拍、左手は小節の頭(と3拍目)で和音の根音
      pr = stepPick(RH, pr); notes = [t(pr)];
      if (i % 2 === 0) { pl = pick(LH.filter(n => [0, 3, 4].includes(n.di % 7))); notes.push(b(pl)); }
    }
    items.push({ dur: 1, notes, bar: i % 4 === 3 && i < len - 1 });
  }
  return items;
}

// ---------- 鍵盤 ----------
let keyHandler = null, pcKeys = null;
function stopKeys() { if (pcKeys) { window.removeEventListener('keydown', pcKeys); pcKeys = null; } }
function keyboardHtml(lo, hi, labels, tonic = null) {
  const whites = []; for (let m = lo; m <= hi; m++) if (isWhite(m)) whites.push(m);
  const w = 100 / whites.length;
  const lab = m => {
    const pc = ((m % 12) + 12) % 12;
    if (tonic !== null) { const rel = ((m - tonic) % 12 + 12) % 12; const name = MOVABLE[rel]; return labels === 'none' ? '' : (rel === 0 ? `<span class="lab do">ド</span>` : labels === 'all' && isWhite(m) ? name : ''); }
    if (labels === 'all') return isWhite(m) ? PC_NAME[pc] : '';
    if (labels === 'do') return pc === 0 ? `<span class="lab do">ド${m === 60 ? '' : ''}</span>` : '';
    return '';
  };
  let s = `<div class="kb" id="kb">`;
  whites.forEach(m => s += `<div class="wk ${tonic !== null && ((m - tonic) % 12 + 12) % 12 === 0 ? 'tonic' : ''}" data-m="${m}">${lab(m)}</div>`);
  whites.forEach((m, i) => { const b = m + 1; if (b <= hi && !isWhite(b)) s += `<div class="bk ${tonic !== null && ((b - tonic) % 12 + 12) % 12 === 0 ? 'tonic' : ''}" data-m="${b}" style="left:calc(${(i + 1) * w}% - ${w * 0.32}%);width:${w * 0.64}%">${tonic !== null && labels !== 'none' && ((b - tonic) % 12 + 12) % 12 === 0 ? 'ド' : ''}</div>`; });
  return s + '</div>';
}
function bindKeyboard(onPress) {
  const kb = document.getElementById('kb'); if (!kb) return;
  keyHandler = onPress;
  kb.addEventListener('pointerdown', e => {
    const k = e.target.closest('[data-m]'); if (!k) return;
    e.preventDefault(); const m = +k.dataset.m;
    tone(m, 0, 0.7); k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 160);
    keyHandler && keyHandler(m, k);
  });
  // パソコンのキーボード: A S D F G H J K L = 白鍵、W E T Y U O P = 黒鍵(一番左のドから)
  const lo = Math.min(...[...kb.querySelectorAll('[data-m]')].map(e => +e.dataset.m));
  const baseC = lo + ((12 - (lo % 12)) % 12);
  const map = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
  stopKeys();
  pcKeys = e => {
    if (e.repeat || !(e.key in map)) return;
    const m = baseC + map[e.key]; const el = kb.querySelector(`[data-m="${m}"]`); if (!el) return;
    tone(m, 0, 0.7); el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 160);
    keyHandler && keyHandler(m, el);
  };
  window.addEventListener('keydown', pcKeys);
}
function flashKey(m, cls) { const el = document.querySelector(`#kb [data-m="${m}"]`); if (!el) return; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 450); }

// ---------- 読む練習(プレイ) ----------
let game = null;
function start(id) {
  SE.play('start');
  const lv = READ.find(l => l.id === id) || EAR.find(l => l.id === id);
  if (lv.quiz) return symbolQuiz(lv);
  if (lv.ear) return earGame(lv);
  game = { lv, qi: 0, miss: 0, notes: 0, t0: performance.now(), items: null, pos: 0, state: [], pending: null };
  nextQuestion();
}
function nextQuestion() {
  const g = game;
  if (g.qi >= g.lv.q) return finish();
  g.items = makeReadQuestion(g.lv); g.pos = 0; g.state = g.items.map(() => ''); g.pending = null; g.hintShown = false;
  // 小節が多いと横に長くなるので、8つずつに区切って見せる
  g.page = 0;
  renderPlay();
}
function visible() { const g = game, per = 8, s = Math.floor(g.pos / per) * per; return { s, items: g.items.slice(s, s + per), state: g.state.slice(s, s + per) }; }
function renderPlay(msg = '', cls = '') {
  const g = game, lv = g.lv;
  g.state = g.state.map((s, i) => i === g.pos ? (s === 'ng' ? 'ng' : 'cur') : (s === 'cur' ? '' : s));
  const v = visible();
  const labels = lv.labels === 'all';
  $app.innerHTML = `<div class="play">
    <div class="top"><button class="pill icon" id="quit" aria-label="やめる">✕</button><span class="t">${esc(lv.title)}</span>
      <button class="pill" id="hint">ヒント</button><span class="pill">${g.qi + 1} / ${lv.q}</span><span class="pill">ミス ${g.miss}</span>${lv.timed ? '<span class="pill" id="clock">0.0秒</span>' : ''}</div>
    <div class="stage"><div class="msg ${cls}">${msg}</div>${scoreSvg(v.items.map((it, i) => ({ ...it, hint: g.hintShown && v.s + i === g.pos })), v.state, { clef: lv.clef, labels })}</div>
    <div class="kbwrap"><div class="kbtools">${lv.rests || lv.grand === 'phrase' ? '<button class="rest" id="rest">やすみ</button>' : ''}</div>${keyboardHtml(lv.kb[0], lv.kb[1], lv.labels)}</div>
    <div class="portrait-hint">スマホを横にすると鍵盤が大きくなります</div>
  </div>`;
  $app.querySelector('#quit').onclick = home;
  $app.querySelector('#hint').onclick = () => { g.hintShown = true; g.usedHint = true; renderPlay('ヒント: 音の名前を出しました', ''); };
  const rb = $app.querySelector('#rest'); if (rb) rb.onclick = () => press('rest');
  bindKeyboard(m => press(m));
  if (lv.timed) { clearInterval(g.timer); g.timer = setInterval(() => { const c = document.getElementById('clock'); if (c) c.textContent = ((performance.now() - g.t0) / 1000).toFixed(1) + '秒'; else clearInterval(g.timer); }, 100); }
}
function press(m) {
  const g = game; if (!g || !g.items) return;
  const it = g.items[g.pos]; if (!it) return;
  if (it.rest) {
    if (m === 'rest') return advance();
    return wrong(m, '休符です。「やすみ」を押そう');
  }
  if (m === 'rest') return wrong(null, '音符です。鍵盤を押そう');
  const need = it.notes.map(midiOf);
  if (!need.includes(m)) return wrong(m, '');
  flashKey(m, 'ok');
  if (need.length === 1) return advance();
  // 両手: 少しの間(0.9秒)にもう片方も押せば正解
  const now = performance.now();
  if (!g.pending || now - g.pending.t > 900) g.pending = { t: now, got: new Set() };
  g.pending.got.add(m);
  if (need.every(x => g.pending.got.has(x))) { g.pending = null; return advance(); }
  setTimeout(() => { if (g.pending && performance.now() - g.pending.t > 900 && g.items[g.pos] === it) { g.pending = null; renderPlay('両手を同時に！', 'ng'); } }, 950);
}
function wrong(m, text) {
  const g = game; g.miss++; g.state[g.pos] = 'ng';
  if (m !== null && m !== 'rest') flashKey(m, 'ng');
  const it = g.items[g.pos];
  if (!text && !it.rest) { const n = it.notes[0]; g.hintShown = g.miss % 2 === 0 || g.hintShown; text = g.hintShown ? `正解は「${it.notes.map(nameOf).join('と')}」` : 'ちがう音です'; }
  SE.play('ng');
  renderPlay(text, 'ng');
}
function advance() {
  const g = game; g.state[g.pos] = g.state[g.pos] === 'ng' ? 'ng' : 'ok';
  if (!g.items[g.pos].rest) g.notes += g.items[g.pos].notes.length;
  g.pos++; g.hintShown = false;
  if (g.pos >= g.items.length) {
    g.qi++;
    const msg = g.qi >= g.lv.q ? 'クリア！' : 'よし！次へ';
    if (g.qi < g.lv.q) SE.play('ok');
    renderPlay(msg, 'ok');
    setTimeout(nextQuestion, 600);
    return;
  }
  renderPlay();
}
function finish() {
  const g = game; clearInterval(g.timer); stopKeys();
  const sec = (performance.now() - g.t0) / 1000;
  let st = g.miss === 0 && !g.usedHint ? 3 : g.miss <= 3 ? 2 : 1;
  let extra = '';
  if (g.lv.timed) {
    const npm = Math.round(g.notes / sec * 60);
    if (!record.npm || npm > record.npm) { record.npm = npm; save('record', record); }
    if (npm < 20 && st > 1) st--; // ゆっくりすぎると★を1つ減らす
    extra = `<p>1分あたり <b>${npm}</b> 音(最高 ${record.npm})。文章のように読めるようになると、60音を超えてきます。</p>`;
  }
  setStar(g.lv.id, st);
  resultScreen(g.lv, st, `ミス ${g.miss} ・ ${sec.toFixed(0)}秒`, extra);
}
function resultScreen(lv, st, line, extra = '') {
  const list = lv.ear ? EAR : READ;
  const i = list.indexOf(lv), next = list[i + 1];
  SE.play(st === 3 ? 'perfect' : 'result');
  $app.innerHTML = `<div class="sheet"><div class="card" style="text-align:center">
    <h2>${esc(lv.title)}</h2><div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div><p class="muted">${line}</p>${extra}
    <div class="row" style="justify-content:center"><button class="ghost" id="again">もう一度</button>${next ? `<button class="primary" id="next">次へ: ${esc(next.title)}</button>` : ''}<button class="ghost" id="home">メニュー</button></div>
  </div></div>`;
  $app.querySelector('#again').onclick = () => start(lv.id);
  $app.querySelector('#home').onclick = home;
  const nb = $app.querySelector('#next'); if (nb) nb.onclick = () => (next.lesson ? lesson(next.lesson) : start(next.id));
}

// ---------- 記号クイズ ----------
const SYMBOLS = [
  { item: { dur: 4, notes: [N('B', 4)] }, name: '全音符', beats: '4拍' },
  { item: { dur: 2, notes: [N('B', 4)] }, name: '2分音符', beats: '2拍' },
  { item: { dur: 1, notes: [N('B', 4)] }, name: '4分音符', beats: '1拍' },
  { item: { dur: 0.5, notes: [N('B', 4)] }, name: '8分音符', beats: '半拍' },
  { item: { dur: 4, rest: true }, name: '全休符', beats: '4拍' },
  { item: { dur: 2, rest: true }, name: '2分休符', beats: '2拍' },
  { item: { dur: 1, rest: true }, name: '4分休符', beats: '1拍' },
  { item: { dur: 0.5, rest: true }, name: '8分休符', beats: '半拍' },
];
function symbolQuiz(lv) {
  const st = { qi: 0, miss: 0, t0: performance.now() };
  const ask = () => {
    if (st.qi >= lv.q) { const s = st.miss === 0 ? 3 : st.miss <= 2 ? 2 : 1; setStar(lv.id, s); return resultScreen(lv, s, `ミス ${st.miss}`); }
    const sym = pick(SYMBOLS), byName = Math.random() < 0.6;
    const right = byName ? sym.name : sym.beats;
    const pool = [...new Set(SYMBOLS.map(s => byName ? s.name : s.beats))];
    const opts = [right, ...pool.filter(o => o !== right).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    $app.innerHTML = `<div class="play" style="grid-template-rows:auto 1fr auto">
      <div class="top"><button class="pill icon" id="quit">✕</button><span class="t">${esc(lv.title)}</span><span class="pill">${st.qi + 1} / ${lv.q}</span><span class="pill">ミス ${st.miss}</span></div>
      <div class="stage"><div class="msg">${byName ? 'この記号の名前は？' : '何拍のばす(休む)？'}</div>${scoreSvg([sym.item], [], { clef: 'treble' })}</div>
      <div class="answers">${opts.map(o => `<button class="ans" data-a="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
    $app.querySelector('#quit').onclick = home;
    $app.querySelectorAll('.ans').forEach(b => b.onclick = () => {
      if (b.dataset.a === right) { b.classList.add('ok'); SE.play('ok'); st.qi++; setTimeout(ask, 500); }
      else { b.classList.add('ng'); SE.play('ng'); st.miss++; $app.querySelector(`.ans[data-a="${CSS.escape(right)}"]`).classList.add('ok'); setTimeout(() => { st.qi++; ask(); }, 1100); }
    });
  };
  ask();
}

// ---------- 音感(きく) ----------
function earGame(lv) {
  const st = { qi: 0, miss: 0, t0: performance.now(), first: true };
  const ask = () => {
    if (st.qi >= lv.q) { const s = st.miss === 0 ? 3 : st.miss <= 3 ? 2 : 1; setStar(lv.id, s); return resultScreen(lv, s, `ミス ${st.miss}`); }
    if (lv.ear === 'updown' || lv.ear === 'updownsame') return askUpDown();
    return askFromDo();
  };
  function frame(body, tools) {
    $app.innerHTML = `<div class="play"><div class="top"><button class="pill icon" id="quit">✕</button><span class="t">${esc(lv.title)}</span>${tools || ''}<span class="pill">${st.qi + 1} / ${lv.q}</span><span class="pill">ミス ${st.miss}</span></div>${body}<div class="portrait-hint">横持ちがおすすめです</div></div>`;
    $app.querySelector('#quit').onclick = home;
  }
  function askUpDown() {
    const a = 55 + rnd(17); let d = (1 + rnd(lv.ear === 'updown' ? 7 : 5)) * (Math.random() < 0.5 ? -1 : 1);
    if (lv.ear === 'updownsame' && Math.random() < 0.3) d = 0;
    const b = a + d; const right = d > 0 ? '上がった' : d < 0 ? '下がった' : '同じ';
    const play = () => { tone(a, 0, 0.6); tone(b, 0.75, 0.8); };
    const opts = lv.ear === 'updown' ? ['上がった', '下がった'] : ['上がった', '同じ', '下がった'];
    frame(`<div class="stage"><div class="msg">2つ目の音は？</div><button class="primary" id="replay" style="font-size:20px;padding:18px 30px">▶ もう一度きく</button></div><div class="answers">${opts.map(o => `<button class="ans" data-a="${o}">${o}</button>`).join('')}</div>`);
    $app.querySelector('#replay').onclick = play;
    $app.querySelectorAll('.ans').forEach(btn => btn.onclick = () => {
      if (btn.dataset.a === right) { btn.classList.add('ok'); st.qi++; setTimeout(ask, 600); }
      else { btn.classList.add('ng'); st.miss++; $app.querySelector(`.ans[data-a="${right}"]`).classList.add('ok'); setTimeout(() => { st.qi++; ask(); }, 1300); }
    });
    setTimeout(play, 250);
  }
  function askFromDo() {
    const tonic = lv.moveKey ? 55 + rnd(10) : 60;            // ドの高さ(調)
    const seqLen = lv.ear === 'melody' ? lv.len : 1;
    const seq = [];
    for (let i = 0; i < seqLen; i++) {
      let r = pick(lv.set);
      if (lv.ear === 'melody' && i > 0) { const near = lv.set.filter(x => Math.abs(x - seq[i - 1]) <= 4); if (near.length && Math.random() < 0.7) r = pick(near); }
      seq.push(r);
    }
    if (lv.ear !== 'melody' && seq[0] === 0 && Math.random() < 0.6) seq[0] = pick(lv.set.filter(x => x));
    const target = seq.map(r => tonic + r);
    // 鍵盤の両端は白鍵にそろえる(ドが黒鍵の調でも崩れないように)
    let lo = tonic, hi = tonic + 12; while (!isWhite(lo)) lo--; while (!isWhite(hi)) hi++;
    let pos = 0, wrongHere = false;
    const playTarget = (delay = 0) => target.forEach((m, i) => tone(m, delay + i * 0.62, 0.55));
    const playAll = () => { const d = lv.moveKey ? cadence(tonic) : (tone(tonic, 0, 0.7), 1.0); playTarget(d); };
    frame(`<div class="stage"><div class="msg" id="m">${lv.ear === 'melody' ? `${seqLen}つの音を順に弾こう` : 'ドのあとに鳴った音は？'}</div>
        <div class="row" style="justify-content:center"><button class="primary" id="all">▶ ドから聞く</button><button class="ghost" id="tg">▶ 問題だけ</button><button class="ghost" id="do">ドだけ</button></div></div>
      <div class="kbwrap"><div class="kbtools"><span class="small muted">金色の線がド。${lv.moveKey ? 'ドの位置は毎回変わります。' : ''}</span></div>${keyboardHtml(lo, hi, lv.moveKey ? 'do' : 'all', tonic)}</div>`);
    $app.querySelector('#all').onclick = playAll;
    $app.querySelector('#tg').onclick = () => playTarget(0);
    $app.querySelector('#do').onclick = () => tone(tonic, 0, 0.8);
    bindKeyboard(m => {
      const need = target[pos];
      const msg = document.getElementById('m');
      if (m === need) {
        flashKey(m, 'ok'); pos++;
        if (pos >= target.length) { if (wrongHere) st.miss++; st.qi++; msg.className = 'msg ok'; msg.textContent = 'せいかい！'; setTimeout(ask, 800); }
        else { msg.className = 'msg'; msg.textContent = `いいね、${pos + 1}つ目は？`; }
      } else {
        flashKey(m, 'ng'); wrongHere = true; msg.className = 'msg ng';
        const rel = ((need - tonic) % 12 + 12) % 12;
        msg.textContent = `ちがいます。正解は「${MOVABLE[rel]}」(ドから${need - tonic}半音)`; flashKey(need, 'ok');
        if (lv.ear !== 'melody') { st.miss++; st.qi++; setTimeout(ask, 1500); } else { pos = 0; setTimeout(() => { msg.className = 'msg'; msg.textContent = '最初からもう一度'; playTarget(0.2); }, 1300); }
      }
    });
    setTimeout(playAll, 300);
  }
  ask();
}

window.addEventListener('pointerdown', () => { if (AC && AC.state === 'suspended') AC.resume(); }, { passive: true });
home();
