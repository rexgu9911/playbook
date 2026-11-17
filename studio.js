// Playbook Studio: free asset makers that run entirely in the browser (no AI, no server, no account).
// Loaded on demand by app.js for #/studio. Everything a person makes here is theirs (CC0-style: no strings).
//   PB_STUDIO.mountSfx(root, host)      sound effects: presets, sliders, WAV export, copy-paste game code
//   PB_STUDIO.mountSprites(root, host)  pixel sprites: seeded generator, animation frames, PNG sheet + manifest
// host = { esc, toast, track, apply }  (apply = Chinese interface pass on new DOM)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const download = (blob, name) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const fileName = s => (String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ======================= sound effects =======================
  // The synth below is also what "Copy code" hands to the game, so it must stay self-contained.
  function playbookSfx(ctx, p, when) {
    const t0 = when === undefined ? ctx.currentTime : when, d = p.duration;
    const out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = p.lowpass;
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(p.volume, t0 + p.attack);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    lp.connect(out); out.connect(ctx.destination);
    const f0 = p.freq, f1 = Math.max(20, p.freqEnd), voices = [];
    if (p.wave !== 'noise') {
      const o = ctx.createOscillator();
      o.type = p.wave === 'saw' ? 'sawtooth' : p.wave;
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
      if (p.jump && p.jump !== 1) o.detune.setValueAtTime(1200 * Math.log2(p.jump), t0 + p.jumpAt);
      if (p.wobble > 0) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = p.wobbleRate; lg.gain.value = p.wobble;
        lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0); lfo.stop(t0 + d + 0.02);
      }
      const g = ctx.createGain(); g.gain.value = 1 - p.noise * 0.7;
      o.connect(g); g.connect(lp); voices.push(o);
    }
    if (p.wave === 'noise' || p.noise > 0) {
      const n = Math.ceil(ctx.sampleRate * (d + 0.02)), buf = ctx.createBuffer(1, n, ctx.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(f0 * 2, t0); bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1 * 2), t0 + d);
      g.gain.value = p.wave === 'noise' ? 1.6 : p.noise;
      s.connect(bp); bp.connect(g); g.connect(lp); voices.push(s);
    }
    voices.forEach(v => { v.start(t0); v.stop(t0 + d + 0.02); });
    return t0 + d;
  }

  const SLIDERS = [  // key, label, min, max, log scale, unit, decimals
    ['freq', 'Start pitch', 40, 3000, true, 'Hz', 0], ['freqEnd', 'End pitch', 20, 3000, true, 'Hz', 0],
    ['duration', 'Length', 0.04, 1.5, false, 's', 2], ['attack', 'Attack', 0.001, 0.2, true, 's', 3],
    ['jump', 'Pitch jump', 0.5, 2, false, '×', 2], ['jumpAt', 'Jump at', 0, 0.6, false, 's', 2],
    ['wobble', 'Wobble', 0, 80, false, 'Hz', 0], ['wobbleRate', 'Wobble speed', 1, 30, false, 'Hz', 0],
    ['noise', 'Noise', 0, 1, false, '', 2], ['lowpass', 'Brightness', 300, 12000, true, 'Hz', 0], ['volume', 'Volume', 0.05, 0.8, false, '', 2],
  ];
  const WAVES = [['square', 'Square'], ['saw', 'Saw'], ['triangle', 'Triangle'], ['sine', 'Sine'], ['noise', 'Noise']];
  const base = () => ({ wave: 'square', freq: 440, freqEnd: 440, duration: 0.25, attack: 0.003, jump: 1, jumpAt: 0.1, wobble: 0, wobbleRate: 12, noise: 0, lowpass: 9000, volume: 0.45 });
  const PRESETS = {
    Coin: () => ({ ...base(), wave: pick(['square', 'sine', 'triangle']), freq: rnd(700, 1200), get freqEnd() { return this.freq; }, duration: rnd(0.25, 0.45), jump: rnd(1.3, 1.6), jumpAt: rnd(0.05, 0.09) }),
    Jump: () => { const f = rnd(180, 380); return { ...base(), wave: pick(['square', 'triangle']), freq: f, freqEnd: f * rnd(1.8, 3), duration: rnd(0.18, 0.32) }; },
    Laser: () => ({ ...base(), wave: pick(['saw', 'square']), freq: rnd(900, 1600), freqEnd: rnd(90, 280), duration: rnd(0.12, 0.28) }),
    Hit: () => ({ ...base(), wave: 'square', freq: rnd(200, 420), freqEnd: rnd(50, 120), duration: rnd(0.08, 0.18), noise: rnd(0.4, 0.7), lowpass: rnd(2500, 6000) }),
    Explosion: () => ({ ...base(), wave: 'noise', freq: rnd(300, 800), freqEnd: rnd(35, 80), duration: rnd(0.5, 1.1), attack: 0.004, lowpass: rnd(1500, 4000), volume: 0.6 }),
    'Power-up': () => { const f = rnd(280, 480); return { ...base(), wave: pick(['triangle', 'square']), freq: f, freqEnd: f * rnd(2.5, 3.5), duration: rnd(0.5, 0.8), wobble: rnd(15, 40), wobbleRate: rnd(12, 20) }; },
    Hurt: () => ({ ...base(), wave: 'saw', freq: rnd(400, 650), freqEnd: rnd(120, 200), duration: rnd(0.18, 0.3), noise: rnd(0.2, 0.4), lowpass: rnd(3000, 7000) }),
    Blip: () => { const f = rnd(600, 1100); return { ...base(), wave: pick(['square', 'sine']), freq: f, freqEnd: f, duration: rnd(0.05, 0.11), volume: 0.35 }; },
  };
  const tidy = p => {
    const q = { ...p };
    SLIDERS.forEach(([k, , lo, hi]) => { q[k] = Math.min(hi, Math.max(lo, +q[k])); });
    q.attack = Math.min(q.attack, q.duration * 0.6); q.jumpAt = Math.min(q.jumpAt, q.duration * 0.9);
    return q;
  };
  const round = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(SLIDERS.find(s => s[0] === k)?.[6] ?? 3) : v]));
  const mutate = p => tidy({ ...p, ...Object.fromEntries(SLIDERS.filter(s => s[0] !== 'volume').map(([k]) => [k, p[k] * rnd(0.88, 1.12)])) });
  const randomSfx = () => tidy({ ...base(), wave: pick(WAVES)[0], freq: Math.exp(rnd(Math.log(80), Math.log(2000))), freqEnd: Math.exp(rnd(Math.log(40), Math.log(2500))),
    duration: rnd(0.06, 0.8), jump: Math.random() < 0.3 ? rnd(0.7, 1.8) : 1, jumpAt: rnd(0.03, 0.2), wobble: Math.random() < 0.3 ? rnd(5, 50) : 0, wobbleRate: rnd(4, 24),
    noise: Math.random() < 0.3 ? rnd(0.1, 0.7) : 0, lowpass: Math.exp(rnd(Math.log(1500), Math.log(12000))) });

  const toWav = buf => {
    const d = buf.getChannelData(0), n = d.length; let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
    const k = peak > 0.98 ? 0.98 / peak : 1;   // keep exported files from clipping
    const b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, d[i] * k)); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    return new Blob([b], { type: 'audio/wav' });
  };
  const renderSfx = async p => {
    const rate = 44100, ctx = new OfflineAudioContext(1, Math.ceil(rate * (p.duration + 0.05)), rate);
    playbookSfx(ctx, p, 0);
    return ctx.startRendering();
  };
  const sfxCode = (p, name) => `// ${name}: made with Playbook Studio (https://rexgu9911.github.io/playbook/#/studio). Free to use, no credit needed.
const ${name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[^a-z]+/, '') || 'sfx'} = ${JSON.stringify(round(p))};

// Plays a sound made in Playbook Studio. Call it from a click or key press (browsers need a user gesture first).
${playbookSfx.toString()}

// usage: const audio = new AudioContext(); playbookSfx(audio, ${name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[^a-z]+/, '') || 'sfx'});`;

  function mountSfx(root, host) {
    const esc = host.esc;
    let p = tidy(PRESETS.Coin()), name = 'coin', audio = null;
    const recent = [];
    const toPos = ([, , lo, hi, log], v) => log ? Math.round(1000 * Math.log(v / lo) / Math.log(hi / lo)) : Math.round(1000 * (v - lo) / (hi - lo));
    const fromPos = ([, , lo, hi, log], x) => log ? lo * Math.pow(hi / lo, x / 1000) : lo + (hi - lo) * x / 1000;
    root.innerHTML = `
      <div class="sx-grid">
        <div class="sx-side">
          <div class="sx-k">Start from</div>
          <div class="sx-presets">${Object.keys(PRESETS).map(k => `<button class="pill" data-preset="${esc(k)}">${esc(k)}</button>`).join('')}</div>
          <div class="sx-row"><button class="btn" data-act="random">Randomize</button><button class="btn" data-act="mutate">Mutate</button></div>
          <div class="sx-k">Recent</div>
          <div class="sx-recent" id="sxRecent"><span class="muted small">Sounds you make show up here.</span></div>
        </div>
        <div class="sx-main">
          <div class="sx-stage">
            <button class="sx-play" data-act="play" aria-label="Play sound"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg></button>
            <canvas id="sxWave" width="900" height="160" aria-hidden="true"></canvas>
          </div>
          <div class="seg sx-waves" id="sxWaves">${WAVES.map(([k, l]) => `<button data-wave="${k}">${l}</button>`).join('')}</div>
          <div class="sx-sliders">${SLIDERS.map(s => `<label class="sx-sl"><span>${esc(s[1])}<b data-val="${s[0]}"></b></span><input type="range" min="0" max="1000" data-k="${s[0]}" aria-label="${esc(s[1])}"></label>`).join('')}</div>
          <div class="sx-out">
            <div class="field"><label for="sxName">File name</label><input id="sxName" maxlength="40" autocomplete="off" spellcheck="false"></div>
            <div class="sx-row"><button class="btn btn-accent" data-act="add">Add to pack</button><button class="btn" data-act="wav">Download WAV</button><button class="btn" data-act="code">Copy code for your game</button><button class="btn" data-act="json">Copy settings</button></div>
          </div>
        </div>
      </div>`;
    const wave = $('#sxWave', root), nameIn = $('#sxName', root);
    const sync = () => {
      SLIDERS.forEach(s => { $(`[data-k="${s[0]}"]`, root).value = toPos(s, p[s[0]]); $(`[data-val="${s[0]}"]`, root).textContent = ` ${(+p[s[0]]).toFixed(s[6])}${s[5] ? ' ' + s[5] : ''}`; });
      $$('[data-wave]', root).forEach(b => b.classList.toggle('on', b.dataset.wave === p.wave));
      nameIn.value = name;
      drawWave();
    };
    let drawN = 0;
    const drawWave = async () => {
      const n = ++drawN, buf = await renderSfx(p); if (n !== drawN || !wave.isConnected) return;
      const c = wave.getContext('2d'), d = buf.getChannelData(0), W = wave.width, H = wave.height, step = d.length / W;
      c.clearRect(0, 0, W, H); c.fillStyle = getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff5b1f';
      let peak = 0.0001; for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i]));
      for (let x = 0; x < W; x++) {
        let lo = 1, hi = -1; for (let i = Math.floor(x * step), e = Math.floor((x + 1) * step); i < e; i++) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
        const y1 = H / 2 - (hi / peak) * H * 0.45, y2 = H / 2 - (lo / peak) * H * 0.45; c.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
    };
    const play = () => {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); playbookSfx(audio, p); } catch { host.toast('Sound is not available in this browser'); }
    };
    const remember = () => {
      recent.unshift({ p: { ...p }, name }); recent.length = Math.min(recent.length, 8);
      $('#sxRecent', root).innerHTML = recent.map((r, i) => `<button class="chip" data-recent="${i}">${esc(r.name)}</button>`).join('');
      host.apply?.($('#sxRecent', root));
    };
    const set = (np, nm) => { p = tidy(np); if (nm) name = nm; sync(); play(); remember(); };
    root.addEventListener('click', e => {
      const pr = e.target.closest('[data-preset]'); if (pr) { set(PRESETS[pr.dataset.preset](), fileName(pr.dataset.preset)); host.track('studio/sfx/' + fileName(pr.dataset.preset), '', true); return; }
      const rc = e.target.closest('[data-recent]'); if (rc) { const r = recent[+rc.dataset.recent]; p = { ...r.p }; name = r.name; sync(); play(); return; }
      const wv = e.target.closest('[data-wave]'); if (wv) { p.wave = wv.dataset.wave; sync(); play(); return; }
      const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
      if (a === 'play') play();
      if (a === 'random') set(randomSfx(), 'sound-' + Math.random().toString(36).slice(2, 6));
      if (a === 'mutate') set(mutate(p));
      if (a === 'wav') renderSfx(p).then(b => { download(toWav(b), fileName(name) + '.wav'); host.track('studio/sfx/wav', '', true); });
      if (a === 'code') { host.copy(sfxCode(p, fileName(name))); host.track('studio/sfx/code', '', true); }
      if (a === 'json') host.copy(JSON.stringify(round(p), null, 2));
      if (a === 'add') { const nm = pack.add({ kind: 'sfx', name: fileName(name), params: round(p) }); host.toast(`Added to pack: ${nm}`); host.track('studio/pack/add-sfx', '', true); }
    });
    root.addEventListener('input', e => {
      const k = e.target.dataset.k; if (k) { const s = SLIDERS.find(x => x[0] === k); p[k] = fromPos(s, +e.target.value); p = tidy(p); $(`[data-val="${k}"]`, root).textContent = ` ${(+p[k]).toFixed(s[6])}${s[5] ? ' ' + s[5] : ''}`; drawWave(); }
      if (e.target === nameIn) name = nameIn.value;
    });
    root.addEventListener('change', e => { if (e.target.dataset.k) { play(); } if (e.target === nameIn) name = fileName(nameIn.value); });
    sync();
    host.apply?.(root);
  }

  // ======================= pixel sprites =======================
  const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const PALETTES = {
    Ember: ['#1a0f0d', '#7a2418', '#d9482b', '#ff9a52', '#ffe08a'], Moss: ['#0f1a12', '#2f5a2c', '#5f9b3f', '#a8d36a', '#f2e8a0'],
    Tide: ['#0c1424', '#1f4a7a', '#3b86c4', '#7fd0f0', '#f5f1d8'], Candy: ['#1d1023', '#7b2d6b', '#d9579b', '#ffa0c8', '#fff1a8'],
    Dusk: ['#120f1f', '#3f2f73', '#7556c9', '#b69cff', '#ffd6a0'], Bone: ['#111111', '#4a4744', '#8f8a82', '#d8d2c4', '#ff5b1f'],
  };
  const hsl = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
  const paletteFor = (name, r) => {
    if (PALETTES[name]) return PALETTES[name];
    const h = r() * 360, acc = (h + 140 + r() * 80) % 360;
    return [hsl(h, 35, 8), hsl(h, 55, 26), hsl(h, 62, 46), hsl(h + 12, 75, 70), hsl(acc, 85, 72)];
  };
  // fill chance for a cell of the left half (x = 0 at the edge, hw - 1 at the centre line)
  const SHAPES = {
    creature: (x, y, hw, n, r) => {
      const dx = (hw - 1 - x) / hw, dy = (y - n * 0.48) / (n * 0.5);
      let p = 1.05 - (dx * dx * 1.15 + dy * dy * 0.95);
      if (y > n * 0.78 && (hw - 1 - x) % 3 === 1) p += 0.45;   // legs
      if (y < n * 0.25 && (hw - 1 - x) === Math.floor(hw * 0.5)) p += 0.35 * r();   // ears / horns
      return p;
    },
    ship: (x, y, hw, n) => {
      const w = hw * (0.18 + 0.82 * Math.min(1, y / (n * 0.85)));
      let p = (hw - 1 - x) < w ? 0.82 : 0.06;
      if (y > n * 0.55 && y < n * 0.82) p += 0.25;   // wings
      if (y >= n - 2 && (hw - 1 - x) > 1) p = 0.05;
      return p;
    },
    item: (x, y, hw, n) => {
      const dx = (hw - 0.5 - x) / hw, dy = (y + 0.5 - n / 2) / (n / 2), d = Math.sqrt(dx * dx + dy * dy);
      return d < 0.62 ? 0.95 : d < 0.82 ? 0.42 : 0;
    },
  };
  // spec: { type, size, seed, pal, mut } -> grid of colours (null = transparent)
  const makeSprite = spec => {
    const n = spec.size, hw = Math.ceil(n / 2), r = mulberry(spec.seed), pal = paletteFor(spec.pal, mulberry(spec.seed ^ 0x9e3779b9));
    let half = [];
    for (let y = 0; y < n; y++) { half.push([]); for (let x = 0; x < hw; x++) half[y].push(x > 0 && y > 0 && y < n - 1 && r() < SHAPES[spec.type](x, y, hw, n, r)); }
    if (spec.mut) { const m = mulberry(spec.mut); for (let k = 0; k < 2 + Math.floor(n / 6); k++) { const y = 1 + Math.floor(m() * (n - 2)), x = 1 + Math.floor(m() * (hw - 1)); half[y][x] = !half[y][x]; } }
    // drop lonely cells
    half = half.map((row, y) => row.map((v, x) => v && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => half[y + a]?.[x + b] || (x + b === hw && half[y + a]?.[x]))));
    const full = half.map(row => n % 2 ? [...row, ...row.slice(0, -1).reverse()] : [...row, ...[...row].reverse()]);
    const g = full.map(row => row.map(v => v ? 'b' : null));
    const spots = half.map(row => row.map(() => r() < 0.07));   // accent spots, mirrored like the body
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (g[y][x] === 'b') { if (!full[y - 1]?.[x]) g[y][x] = 'l'; else if (!full[y + 1]?.[x]) g[y][x] = 'd'; else if (spec.type !== 'ship' && spots[y][Math.min(x, n - 1 - x)]) g[y][x] = 'a'; }
      else if ([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => full[y + a]?.[x + b])) g[y][x] = 'o';
    }
    if (spec.type === 'creature') {   // eyes in the upper body, mirrored
      const ey = Math.round(n * 0.38), ex = Math.max(1, Math.floor(n / 2) - 1 - Math.floor(r() * Math.max(1, n / 6)));
      [ex, n - 1 - ex].forEach(x => { if (full[ey]?.[x]) { g[ey][x] = 'o'; if (full[ey - 1]?.[x]) g[ey - 1][x] = 'w'; } });
    }
    if (spec.type === 'ship') { const c = Math.floor(n / 2); for (let y = Math.round(n * 0.3); y < Math.round(n * 0.45); y++) [c - 1, n % 2 ? c : c].forEach(x => { if (full[y]?.[x]) g[y][x] = 'a'; }); }
    const col = { o: pal[0], d: pal[1], b: pal[2], l: pal[3], a: pal[4], w: '#ffffff' };
    const out = g.map(row => row.map(k => k ? col[k] : null));
    out.outline = pal[0];   // the hit-flash frame keeps the outline and turns the rest white
    return out;
  };
  const FRAMES = [1, 2, 1, 0];   // idle bob: vertical offset per frame (frame height = size + 2)
  const drawFrame = (c, grid, s, ox, oy, white) => {
    grid.forEach((row, y) => row.forEach((v, x) => { if (!v) return; c.fillStyle = white && v !== grid.outline ? '#ffffff' : v; c.fillRect(ox + x * s, oy + y * s, s, s); }));
  };
  const sheetCanvas = (grid, s) => {
    const n = grid.length, cv = document.createElement('canvas'); cv.width = n * s * 5; cv.height = (n + 2) * s;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    FRAMES.forEach((dy, i) => drawFrame(c, grid, s, i * n * s, dy * s));
    drawFrame(c, grid, s, 4 * n * s, s, true);   // hit flash
    return cv;
  };

  function mountSprites(root, host) {
    const esc = host.esc;
    const st = { type: 'creature', size: 16, pal: 'Random', scale: 4, batch: [], sel: 0 };
    const newSeed = () => Math.floor(Math.random() * 2 ** 31);
    root.innerHTML = `
      <div class="sp-ctl">
        <div class="seg" id="spType"><button data-type="creature">Creature</button><button data-type="ship">Ship</button><button data-type="item">Item</button></div>
        <div class="seg" id="spSize"><button data-size="12">12 px</button><button data-size="16">16 px</button><button data-size="24">24 px</button></div>
        <label class="sp-pal"><span class="sr">Palette</span><select id="spPal">${['Random', ...Object.keys(PALETTES)].map(k => `<option value="${k}">${k}</option>`).join('')}</select></label>
        <button class="btn btn-accent" data-act="batch">New batch</button>
      </div>
      <div class="sp-grid">
        <div class="sp-cands" id="spCands" role="listbox" aria-label="Generated sprites"></div>
        <div class="sp-detail">
          <div class="sp-big"><canvas id="spBig" width="240" height="270" aria-label="Animated preview"></canvas></div>
          <div class="sp-meta"><span class="muted small" id="spSeed"></span></div>
          <div class="sx-row"><button class="btn" data-act="similar">More like this</button></div>
          <div class="field"><label for="spName">File name</label><input id="spName" value="hero" maxlength="40" autocomplete="off" spellcheck="false"></div>
          <div class="sp-k">Export size</div>
          <div class="seg" id="spScale">${[1, 2, 4, 8].map(s => `<button data-scale="${s}">${s}×</button>`).join('')}</div>
          <div class="sx-row"><button class="btn btn-accent" data-act="add">Add to pack</button><button class="btn" data-act="sheet">Download sprite sheet</button><button class="btn" data-act="png">Download PNG</button></div>
          <div class="sx-row"><button class="btn" data-act="phaser">Copy Phaser code</button><button class="btn" data-act="manifest">Copy manifest</button></div>
          <p class="note">The sheet has 5 frames in a row: 4 for idle and 1 hit flash. Frame size is shown in the manifest.</p>
        </div>
      </div>`;
    const cands = $('#spCands', root), big = $('#spBig', root), nameIn = $('#spName', root);
    const cur = () => st.batch[st.sel];
    const draw = () => {
      cands.innerHTML = st.batch.map((s, i) => `<button class="sp-cand ${i === st.sel ? 'on' : ''}" data-i="${i}" role="option" aria-selected="${i === st.sel}" aria-label="Sprite ${i + 1}"><canvas width="${s.size * 4}" height="${s.size * 4}"></canvas></button>`).join('');
      $$('.sp-cand canvas', cands).forEach((cv, i) => { const c = cv.getContext('2d'); drawFrame(c, st.batch[i].grid, 4, 0, 0); });
      $('#spSeed', root).textContent = `${cur().type} · ${cur().size}×${cur().size} · seed ${cur().seed}${cur().mut ? '.' + cur().mut : ''}`;
      $$('[data-type]', root).forEach(b => b.classList.toggle('on', b.dataset.type === st.type));
      $$('[data-size]', root).forEach(b => b.classList.toggle('on', +b.dataset.size === st.size));
      $$('[data-scale]', root).forEach(b => b.classList.toggle('on', +b.dataset.scale === st.scale));
    };
    const batch = (similar = false) => {
      const base0 = cur();
      st.batch = Array.from({ length: 16 }, (_, i) => {
        const spec = similar && i ? { ...base0, mut: newSeed() } : similar ? { ...base0 } : { type: st.type, size: st.size, pal: st.pal, seed: newSeed(), mut: 0 };
        return { ...spec, grid: makeSprite(spec) };
      });
      st.sel = 0; draw();
    };
    let frame = 0;
    const tick = setInterval(() => {
      if (!big.isConnected) return clearInterval(tick);
      const s = cur(); if (!s) return; const n = s.size, sc = Math.floor(Math.min(240 / n, 270 / (n + 2)));
      const c = big.getContext('2d'); c.clearRect(0, 0, big.width, big.height);
      const ox = Math.floor((big.width - n * sc) / 2), oy = Math.floor((big.height - (n + 2) * sc) / 2);
      drawFrame(c, s.grid, sc, ox, oy + FRAMES[frame % 4] * sc); frame++;
    }, 160);
    const manifest = () => { const s = cur(), nm = fileName(nameIn.value); return { name: nm, image: `${nm}-sheet.png`, frameWidth: s.size * st.scale, frameHeight: (s.size + 2) * st.scale, frames: 5,
      animations: { idle: { frames: [0, 1, 2, 3], fps: 6, loop: true }, hit: { frames: [4], fps: 1 } }, made_with: 'Playbook Studio', seed: s.seed, type: s.type }; };
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-type]'); if (t) { st.type = t.dataset.type; batch(); return; }
      const z = e.target.closest('[data-size]'); if (z) { st.size = +z.dataset.size; batch(); return; }
      const sc = e.target.closest('[data-scale]'); if (sc) { st.scale = +sc.dataset.scale; draw(); return; }
      const c = e.target.closest('[data-i]'); if (c) { st.sel = +c.dataset.i; draw(); return; }
      const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
      const nm = fileName(nameIn.value);
      if (a === 'batch') batch();
      if (a === 'similar') batch(true);
      if (a === 'sheet') { sheetCanvas(cur().grid, st.scale).toBlob(b => download(b, `${nm}-sheet.png`)); host.track('studio/sprite/sheet', '', true); }
      if (a === 'png') { const s = cur(), cv = document.createElement('canvas'); cv.width = cv.height = s.size * st.scale; drawFrame(cv.getContext('2d'), s.grid, st.scale, 0, 0); cv.toBlob(b => download(b, `${nm}.png`)); host.track('studio/sprite/png', '', true); }
      if (a === 'manifest') host.copy(JSON.stringify(manifest(), null, 2));
      if (a === 'add') { const { type, size, seed, pal, mut } = cur(); const added = pack.add({ kind: 'sprite', name: nm, spec: { type, size, seed, pal, mut }, scale: st.scale }); host.toast(`Added to pack: ${added}`); host.track('studio/pack/add-sprite', '', true); }
      if (a === 'phaser') { const m = manifest(); host.copy(`// ${m.name}: made with Playbook Studio. Free to use, no credit needed.
// preload()
this.load.spritesheet('${m.name}', '${m.image}', { frameWidth: ${m.frameWidth}, frameHeight: ${m.frameHeight} });
// create()
this.anims.create({ key: '${m.name}-idle', frames: this.anims.generateFrameNumbers('${m.name}', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
this.anims.create({ key: '${m.name}-hit', frames: [{ key: '${m.name}', frame: 4 }], frameRate: 1 });
const ${m.name.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase()).replace(/^[^a-z]+/, '') || 'sprite'} = this.add.sprite(100, 100, '${m.name}').play('${m.name}-idle');`); host.track('studio/sprite/phaser', '', true); }
    });
    $('#spPal', root).addEventListener('change', e => { st.pal = e.target.value; batch(); });
    batch();
    host.apply?.(root);
  }


  // ======================= asset pack =======================
  // A pack lives in this browser (localStorage) as recipes, not files: sounds keep their settings, sprites their seed.
  // "Download pack" rebuilds every file and zips them with a manifest and a ready-to-import JS module.
  const PACK_KEY = 'pb-studio-pack';
  const pack = {
    get: () => { try { const v = JSON.parse(localStorage.getItem(PACK_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } },
    set: list => { try { localStorage.setItem(PACK_KEY, JSON.stringify(list.slice(0, 60))); } catch {} window.dispatchEvent(new Event('pb-pack')); },
    add(item) {
      const list = pack.get(), base = fileName(item.name); let nm = base, n = 2;
      while (list.some(x => x.kind === item.kind && x.name === nm)) nm = `${base}-${n++}`;
      list.push({ ...item, name: nm }); pack.set(list); return nm;
    },
  };
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  // minimal zip writer (stored, no compression): enough for a handful of small assets
  const zip = files => {
    const enc = new TextEncoder(), parts = [], dir = []; let off = 0;
    files.forEach(({ name, data }) => {
      const nb = enc.encode(name), crc = crc32(data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true);
      parts.push(h, nb, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
      dir.push(c, nb); off += 30 + nb.length + data.length;
    });
    const size = dir.reduce((n, x) => n + x.byteLength, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...dir, e], { type: 'application/zip' });
  };
  const bytes = async blob => new Uint8Array(await blob.arrayBuffer());
  const camel = n => n.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[^a-z]+/, '') || 'asset';
  const buildPack = async list => {
    const files = [], man = { made_with: 'Playbook Studio', url: 'https://rexgu9911.github.io/playbook/#/studio', license: 'Yours to use however you like; no credit needed.', sounds: [], sprites: [] };
    for (const it of list) {
      if (it.kind === 'sfx') {
        files.push({ name: `sounds/${it.name}.wav`, data: await bytes(toWav(await renderSfx(tidy(it.params)))) });
        man.sounds.push({ name: it.name, file: `sounds/${it.name}.wav`, settings: round(tidy(it.params)) });
      } else {
        const g = makeSprite(it.spec), sc = it.scale || 4, blob = await new Promise(r => sheetCanvas(g, sc).toBlob(r));
        files.push({ name: `sprites/${it.name}-sheet.png`, data: await bytes(blob) });
        man.sprites.push({ name: it.name, file: `sprites/${it.name}-sheet.png`, frameWidth: it.spec.size * sc, frameHeight: (it.spec.size + 2) * sc, frames: 5,
          animations: { idle: { frames: [0, 1, 2, 3], fps: 6, loop: true }, hit: { frames: [4], fps: 1 } }, seed: it.spec.seed, type: it.spec.type });
      }
    }
    const js = `// Playbook Studio asset pack. Import it, then call playSound('name') after the first click or key press.
export const sounds = ${JSON.stringify(Object.fromEntries(man.sounds.map(x => [x.name, x.settings])), null, 1)};
export const sprites = ${JSON.stringify(man.sprites.map(({ name, file, frameWidth, frameHeight, animations }) => ({ name, file, frameWidth, frameHeight, animations })), null, 1)};

let audio;
export function playSound(name) {
  audio = audio || new AudioContext();
  return playbookSfx(audio, sounds[name]);
}

// Phaser: call loadSprites(this) in preload() and makeAnimations(this) in create()
export function loadSprites(scene, base = '') { sprites.forEach(s => scene.load.spritesheet(s.name, base + s.file, { frameWidth: s.frameWidth, frameHeight: s.frameHeight })); }
export function makeAnimations(scene) {
  sprites.forEach(s => {
    scene.anims.create({ key: s.name + '-idle', frames: scene.anims.generateFrameNumbers(s.name, { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    scene.anims.create({ key: s.name + '-hit', frames: [{ key: s.name, frame: 4 }], frameRate: 1 });
  });
}

${playbookSfx.toString()}
`;
    const readme = `Playbook Studio asset pack
==========================
Made at ${man.url}
${man.sounds.length} sound(s), ${man.sprites.length} sprite sheet(s). Everything here is yours to use however you like; no credit needed.

sounds/      WAV files (mono, 44.1 kHz). The same sounds can also be played live from code: see playbook-assets.js.
sprites/     PNG sprite sheets, 5 frames in a row: 4 idle frames, then 1 hit flash. Frame sizes are in manifest.json.
manifest.json        every asset with its file, frame size, animations and the settings that made it
playbook-assets.js   ES module: playSound(name), plus loadSprites(scene) / makeAnimations(scene) for Phaser

Tell your coding agent: "Use the assets in this folder. playbook-assets.js shows how to load them."
`;
    files.push({ name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(man, null, 2)) });
    files.push({ name: 'playbook-assets.js', data: new TextEncoder().encode(js) });
    files.push({ name: 'README.txt', data: new TextEncoder().encode(readme) });
    return zip(files);
  };

  function mountPack(root, host) {
    const esc = host.esc;
    const draw = () => {
      if (!root.isConnected) return window.removeEventListener('pb-pack', draw);
      const list = pack.get();
      root.innerHTML = `<div class="pk-head"><div><h2>Your asset pack</h2><p>${list.length ? 'Saved in this browser. Download it as one zip: files, a manifest and code to load them.' : 'Add sounds and sprites with "Add to pack". They stay in this browser until you download them as one zip.'}</p></div>
        ${list.length ? `<div class="sx-row"><button class="btn btn-accent" data-pk="zip">Download pack (.zip)</button><button class="btn" data-pk="clear">Clear</button></div>` : ''}</div>
        ${list.length ? `<ul class="pk-list">${list.map((it, i) => `<li><span class="pk-kind">${it.kind === 'sfx' ? 'Sound' : 'Sprite'}</span><b data-noi18n>${esc(it.name)}</b><button class="pk-x" data-pk-rm="${i}" aria-label="Remove ${esc(it.name)}">×</button></li>`).join('')}</ul>` : ''}`;
      host.apply?.(root);
    };
    root.addEventListener('click', async e => {
      const rm = e.target.closest('[data-pk-rm]'); if (rm) { const l = pack.get(); l.splice(+rm.dataset.pkRm, 1); pack.set(l); return; }
      const a = e.target.closest('[data-pk]')?.dataset.pk; if (!a) return;
      if (a === 'clear') pack.set([]);
      if (a === 'zip') { const b = e.target.closest('button'); b.disabled = true; try { download(await buildPack(pack.get()), 'playbook-assets.zip'); host.track('studio/pack/zip', String(pack.get().length), true); } finally { b.disabled = false; } }
    });
    window.addEventListener('pb-pack', draw);
    draw();
  }

  window.PB_STUDIO = { mountSfx, mountSprites, mountPack, _test: { makeSprite, sheetCanvas, renderSfx, toWav, PRESETS, tidy, buildPack, pack } };
})();
