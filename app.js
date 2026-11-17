(() => {
  const { creators, games, mechanics, byId, mechBySlug } = window.PB;
  // Launch: show no invented numbers or personas. In-house games and mechanics are made by Playbook.
  creators.Playbook = { name: 'Playbook', bio: 'Open recipes for web games, made in-house.', hue: 18 };
  games.forEach(g => { g.by = 'Playbook'; g.plays = 0; g.remixes = 0; });
  mechanics.forEach(m => { m.by = 'Playbook'; m.installs = 0; });
  const REPO = 'https://github.com/rexgu9911/playbook';
  const CONTACT_EMAIL = '';   // set a public address to add an email option next to GitHub Issues
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Visitor stats: GoatCounter (no cookies, no personal data). Empty = off and nothing loads.
  // Set to the site code, e.g. 'playbook-vibe' for https://playbook-vibe.goatcounter.com
  const GOATCOUNTER = '';
  if (GOATCOUNTER && !LOCAL) {
    const gc = document.createElement('script');
    gc.async = true; gc.src = 'https://gc.zgo.at/count.js';
    gc.dataset.goatcounter = `https://${GOATCOUNTER}.goatcounter.com/count`;
    gc.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    document.head.append(gc);
  }
  const track = (path, title, event = false) => {
    if (!GOATCOUNTER || LOCAL) return;
    const go = (tries = 0) => window.goatcounter?.count ? window.goatcounter.count({ path, title, event }) : tries < 20 && setTimeout(() => go(tries + 1), 250);
    go();
  };
  const issueUrl = (title, body, label) => `${REPO}/issues/new?${new URLSearchParams({ title, body, ...(label ? { labels: label } : {}) })}`;
  const mailUrl = (subject, body) => `mailto:${CONTACT_EMAIL}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')}`;
  const app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MCP_PKG = 'github:rexgu9911/playbook-mcp';
  const MCP_CMD = `claude mcp add playbook -- npx -y ${MCP_PKG}`;
  const MCP_REPO = 'https://github.com/rexgu9911/playbook-mcp';
  const SITE = 'playbook.example';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M'
    : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  const ava = (name, cls = '') => `<i class="ava ${cls}" style="--h:${creators[name]?.hue ?? 20}"></i>`;
  const icon = {
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  // ---------- live thumbnails: mount iframes only while on screen ----------
  const exists = {};
  const liveIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const el = e.target;
      let f = $('iframe', el);
      if (e.isIntersecting && !f) {
        const file = el.dataset.src.split('?')[0];
        if (exists[file] !== true) {
          if (exists[file] === undefined) exists[file] = fetch(file, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
          Promise.resolve(exists[file]).then(ok => { exists[file] = ok; if (ok && el.isConnected) { liveIO.unobserve(el); liveIO.observe(el); } });
          return;
        }
        f = document.createElement('iframe');
        f.loading = 'lazy'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
        f.title = ''; f.src = el.dataset.src;
        f.addEventListener('load', () => f.classList.add('on'));
        el.insertBefore(f, el.querySelector('.scan'));
      } else if (!e.isIntersecting && f) {
        f.remove();
      }
    });
  }, { rootMargin: '120px' });
  const revIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
  }), { threshold: 0.08 });
  // third-party games with no cover image: play the live page while on screen (max 4 at once, sandboxed)
  const MAX_AUTO = 4;
  const autoIO = new IntersectionObserver(entries => entries.forEach(e => {
    const el = e.target; let f = $('iframe', el);
    if (e.isIntersecting && !f) {
      if ($$('.media[data-auto] iframe').length >= MAX_AUTO) return;
      f = document.createElement('iframe');
      f.tabIndex = -1; f.setAttribute('aria-hidden', 'true'); f.title = '';
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin'); f.referrerPolicy = 'no-referrer';
      f.addEventListener('load', () => { f.classList.add('on'); el.classList.add('live'); });
      f.src = el.dataset.auto; el.insertBefore(f, el.querySelector('.scan'));
    } else if (!e.isIntersecting && f) { f.remove(); el.classList.remove('live'); }
  }), { threshold: 0.6 });
  // ---------- motion details: rolling labels and word-by-word heading reveals (off with reduced motion) ----------
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const I18N = window.PB_I18N, ZH = !!I18N?.zh;
  const rollify = root => {
    if (CALM) return;
    $$('.nav-links a, .btn:not(.copy), .link, .flinks a', root).forEach(el => {
      if (el.dataset.roll || el.children.length || !el.textContent.trim()) return;
      const t = esc(el.textContent.trim());
      el.dataset.roll = '1';
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML =`<span class="roll"><span>${t}</span><span aria-hidden="true">${t}</span></span>`;
    });
  };
  const splitify = root => {
    if (CALM || ZH) return;  // Chinese has no spaces to split on, and whole lines must stay free to wrap
    $$('.sec-head h2, .rail-head h2, .page-head h1, .gd-info h1', root).forEach(h => {
      if (h.dataset.split) return;
      h.dataset.split = '1';
      const box = document.createElement('span'); box.className = 'splitw';
      let i = 0;
      [...h.childNodes].forEach(n => {
        if (n.nodeType === 1 && n.tagName === 'BR') { box.append(' '); return; }  // line breaks are hidden on this layout: keep a space
        if (n.nodeType === 1 && n.classList.contains('chip')) return;  // badges stay put
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { box.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            w.innerHTML = `<span style="--i:${i++}">${esc(part)}</span>`; box.append(w);
          });
          n.textContent = '';
        } else if (n.nodeType === 1) {
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
          w.append(inner); n.replaceWith(w); inner.append(n); box.append(w);
        }
      });
      h.prepend(box);
      h.classList.add('split');
      revIO.observe(h);
    });
  };
  const hydrate = (root = app) => {
    $$('.media[data-auto]', root).forEach(m => autoIO.observe(m));
    $$('.media[data-src]', root).forEach(m => liveIO.observe(m));
    $$('.rv:not(.in)', root).forEach(r => revIO.observe(r));
    I18N?.apply(root);
    rollify(root); splitify(root);
  };

  const ic = {
    game: '<svg viewBox="0 0 24 24"><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-9 3h-2a5 5 0 0 1-9-3v-2a5 5 0 0 1 5-5z"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    remix: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    cube: '<svg viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    plug: '<svg viewBox="0 0 24 24"><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8zM12 18v4"/></svg>',
  };
  const media = (g, extra = '', cls = '') =>
    `<div class="media ${cls}" data-src="${g.src}&attract=1" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><div class="poster"></div><div class="scan"></div>${extra}</div>`;
  const mmedia = m =>
    `<div class="media plain" data-src="mechanics/${m.slug}.html" style="--c1:#17171c;--c2:#0d0d10"><div class="poster"></div><div class="scan"></div></div>`;

  const playIco = '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>';
  const card = (g, o = {}) => `
    <a class="card rv ${o.here ? 'here' : ''}" href="#/game/${g.id}" style="--d:${o.delay || 0}ms" aria-label="${esc(g.title)} by ${esc(g.by)}">
      ${media(g, `
        <div class="top">
          <span></span>
          <span>${g.parent ? `<span class="chip">${ic.remix}Remix</span>` : `<span class="chip">${g.is3d ? '3D' : '2D'}</span>`}</span>
        </div>
        <span class="playbtn" aria-hidden="true">${playIco}</span>`)}
      <div class="cmeta">
        <h3>${o.verb ? (g.parent ? 'Remix: ' : 'Remake ') : ''}${esc(g.title)}</h3>
        <div class="row"><span class="who">${ava(g.by)}Playbook ${g.parent ? 'remix' : 'original'} · ${esc(g.genres[0])}</span></div>
      </div>
    </a>`;

  const mcard = (m, i = 0) => `
    <a class="mcard rv" href="#/mechanic/${m.slug}" style="--d:${i * 40}ms">
      ${mmedia(m)}
      <div class="mmeta"><h3>${esc(m.name)}</h3><div class="row"><span>${esc(m.cat)}</span><span>Live demo</span></div></div>
    </a>`;

  const sorters = {
    played: (a, b) => b.plays - a.plays,
    remixed: (a, b) => b.remixes - a.remixes,
    fresh: (a, b) => a.days - b.days,
    rising: (a, b) => b.remixes / b.days - a.remixes / a.days,
  };
  const GENRES = ['All', '3D', 'Racing', 'Survivor', 'Platformer', 'Shooter', 'Puzzle', 'Action'];

  // ---------- pages ----------
  const state = { genre: 'All', sort: 'played', mcat: 'All', chart: 'played', client: 'Claude' };

  const wallControls = () => `
    <div class="controls">
      <div class="pills" id="genres">${GENRES.map(x => `<button class="pill ${x === state.genre ? 'on' : ''}" data-genre="${x}">${x === 'All' ? 'All' : x}</button>`).join('')}</div>
    </div>
    <div class="wall" id="wallGrid"></div>`;
  function bindWall() {
    drawWall();
    $('#genres').addEventListener('click', e => { const b = e.target.closest('[data-genre]'); if (!b) return; state.genre = b.dataset.genre; $$('#genres .pill').forEach(p => p.classList.toggle('on', p === b)); drawWall(); });
  }
  function drawWall() {
    const grid = $('#wallGrid'); if (!grid) return;
    $$('.media', grid).forEach(m => liveIO.unobserve(m));
    const list = games.filter(g => state.genre === 'All' || g.genres.includes(state.genre)).sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0));
    grid.innerHTML = list.length
      ? list.map((g, i) => card(g, { delay: Math.min(i, 8) * 30 })).join('')
      : '<div class="empty">Nothing here yet.</div>';
    hydrate(grid);
  }

  const contest = () => `
    <a class="contest calm rv" href="#/jam">
      <div><span class="tag"><span class="dot"></span>Coming soon</span><div class="money">Jam #1</div><p>Our first vibe gaming jam is coming. Make a game with AI, share it as a link, get picked by the community.</p></div>
      <div class="right">Community<br>Game Jam<br><span class="btn btn-sm">Get notified</span></div>
    </a>`;

  // ---------- home: maker-first. Hero shows a recipe going into your own agent. ----------
  const poster = g => `<div class="media" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><div class="poster"></div></div>`;
  const PAIRS = [['neon-drift', 'neon-drift-2'], ['swarm-arena', 'swarm-arena-1'], ['sky-hop', 'sky-hop-2'], ['tile-forge', 'tile-forge-2']];
  const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const flowInner = ([bid, rid]) => {
    const b = byId[bid], r = byId[rid];
    const ask = `Remake ${b.title}: ${r.style.replace(/ · /g, ', ').toLowerCase()}`;
    const lines = [
      `<span class="u">›</span> ${esc(ask)}`,
      `<span class="t">⏺</span> playbook.get_recipe(<span class="s">"${b.id}"</span>)`,
      `  <span class="d">⎿ prompt · ${b.mechanics.length} mechanics · palette · sound</span>`,
      `<span class="t">⏺</span> playbook.add_mechanic(<span class="s">"${esc(b.mechanics[1] || b.mechanics[0])}"</span>)`,
      `  <span class="d">⎿ added to src/feel/</span>`,
      `<span class="t">⏺</span> Write(<span class="s">${slugify(r.title)}.html</span>)`,
      `  <span class="d">⎿ 1 file · runs offline · in your repo</span>`,
      `<span class="t">⏺</span> playbook.publish --remix-of ${b.id}`,
      `  <span class="ok">⎿ ✔ live · credits ${esc(b.by)}</span>`,
    ];
    return `
      <div class="flow-top">
        <a class="flow-card" href="#/game/${b.id}">${media(b, `<span class="flabel"><span class="chip">Original</span></span>`)}<b>${esc(b.title)}</b><span>by ${esc(b.by)}</span></a>
        <span class="flow-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
        <a class="flow-card" href="#/game/${r.id}">${media(r, `<span class="flabel"><span class="chip hot">Your version</span></span>`)}<b>${esc(r.title)}</b><span>remade by ${esc(r.by)}</span></a>
      </div>
      <div class="agent" aria-label="Example agent session">
        <div class="agent-bar"><i></i><i></i><i></i><span>claude — ~/my-games</span></div>
        <pre class="agent-log">${lines.map((l, k) => `<span class="l" style="--k:${k}">${l}</span>`).join('\n')}</pre>
      </div>`;
  };

  // horizontal rail: title row with arrows + a snap-scrolling track
  const chev = d => `<svg viewBox="0 0 24 24"><path d="${d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
  const rail = ({ title, sub = '', href = '', more = 'See all', cls = '', badge = '', items }) => `
    <section class="rail ${cls}">
      <div class="rail-head">
        <div><h2>${title}${badge}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
        <div class="rail-ctl">${href ? `<a class="link" href="${href}">${more}</a>` : ''}<button class="rail-btn" data-dir="-1" aria-label="Scroll left">${chev('l')}</button><button class="rail-btn" data-dir="1" aria-label="Scroll right">${chev('r')}</button></div>
      </div>
      <div class="rail-track">${items}</div>
    </section>`;
  const bindRails = root => $$('.rail', root).forEach(r => {
    const t = $('.rail-track', r), [prev, next] = $$('.rail-btn', r);
    const sync = () => { prev.disabled = t.scrollLeft < 4; next.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4; };
    $$('.rail-btn', r).forEach(b => b.addEventListener('click', () => t.scrollBy({ left: +b.dataset.dir * t.clientWidth * 0.92, behavior: 'smooth' })));
    t.addEventListener('scroll', sync, { passive: true }); sync();
    t.tabIndex = 0; t.setAttribute('aria-label', `${$('h2', r)?.textContent.trim() || 'Games'}: use the arrow keys to scroll`);
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); t.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * t.clientWidth * 0.92, behavior: CALM ? 'auto' : 'smooth' });
    });
  });
  const tabIc = {
    recipes: '<svg viewBox="0 0 24 24"><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-9 3h-2a5 5 0 0 1-9-3v-2a5 5 0 0 1 5-5z"/></svg>',
    mech: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
    web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    fire: '<svg viewBox="0 0 24 24"><path d="M12 3s5 4.5 5 9.5A5 5 0 0 1 7 12.5C7 10 9 8 9 8s.5 2.5 2.5 3C11.5 7.5 12 3 12 3z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  // tiny poster for a Discover game (generated colours, no third-party images)
  const dposter = d => `<div class="cl-item ${d.cover ? 'has-cover' : ''}" style="${calm(d)}">${coverImg(d)}<b>${esc(d.title)}</b><span>${esc(d.creator || host(d.url))}</span></div>`;
  const FEATURE = ['Starry Nightrider', 'Oil Paint', 'What the Water Keeps', 'Sunwarden', 'Tennis', 'Evensong'];

  // order for "best of the web": hand-picked first, then covered games newest first, then live ones
  const bestOfWeb = () => {
    const picked = FEATURE.map(t => DISC.find(d => d.title === t)).filter(Boolean);
    const rest = [...DISC].sort(byNew).filter(d => !picked.includes(d));
    return [...picked, ...rest.filter(d => d.cover), ...rest.filter(d => !d.cover && d.embeddable), ...rest.filter(d => !d.cover && !d.embeddable)];
  };
  const HOME_GENRES = ['All', 'Shooter', 'Racing', 'Adventure', 'Action', 'Sports', 'Sim', 'Strategy', 'RPG'];
  const hstate = { genre: 'All' };
  function drawBest() {
    const grid = $('#bestGrid'); if (!grid) return;
    $$('.media', grid).forEach(m => autoIO.unobserve(m)); stopPreview();
    // 'All' skips games already shown higher up the home page; a genre shows everything in it
    const list = bestOfWeb().filter(d => hstate.genre === 'All' ? !hstate.seen?.has(d.url) && d.platform !== 'jam' : d.genre === hstate.genre).slice(0, 12);
    grid.innerHTML = list.length ? list.map(gcard).join('') : '<div class="empty"><b>Nothing here yet</b>Try another genre.</div>';
    hydrate(grid);
  }

  // ---------- home: this week in vibe gaming. Media first, picked by hand, creators credited. ----------
  const PICKS = ['Starry Nightrider', 'Oil Paint', 'Evensong', 'What the Water Keeps', 'Rooftop Rally'];
  // all-time best: jam winners and the vibe-coded games that drew the most attention (see notes for sources)
  const BEST = ['A Game About Capybaras Delivering Food', 'Wildbrush', 'Starfall', 'fly.pieter.com', 'Tiny Skies', 'Sky Reach', "Fanto's Mega-Mart",
    'The Long Silence', 'Kanso', 'Tidewater', 'HALDANE-4', 'Arkenfall', 'The Great Taxi Assignment', 'DUST FRONT'];
  const SHOWCASE = ['hit-stop', 'screen-shake', 'dodge-roll', 'combo-window', 'squash-stretch', 'health-bar-lag', 'pickup-magnet', 'procedural-sfx'];
  const weekOf = () => {
    const last = DISC.map(d => d.date || '').filter(x => x.length === 10).sort().pop(); if (!last) return '';
    const t = new Date(last + 'T00:00:00'); t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const pick = (d, hero, why = '') => `
    <article class="card pick ${hero ? 'pk-hero' : ''} rv">
      <a class="pick-media" href="${gLink(d)}" aria-label="${esc(d.title)}: details and play">
        <div class="media ${d.cover ? 'has-cover' : ''}" ${d.cover && d.embeddable && canHover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}">
          <div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div>
          <div class="top"><span>${hero ? '<span class="chip hot">Pick of the week</span>' : ''}</span><span><span class="chip">${dIc.out}${esc(host(d.url))}</span>${favBtn(d)}</span></div>
          <span class="playbtn" aria-hidden="true">${playIco}</span>
        </div>
      </a>
      <div class="pick-meta">
        <h3>${esc(d.title)}</h3>
        ${hero ? `<p>${esc(why || d.note || '')}</p>` : ''}
        ${d.creator ? `<a class="pick-by" href="${crLink(d.creator)}">${crAva(d.creator)}<span>${esc(d.creator)}</span></a>` : ''}
      </div>
    </article>`;

  function home() {
    const issue = WEEKS[0];
    const picks = issue ? issue.games.map(p => p.d) : PICKS.map(t => DISC.find(d => d.title === t)).filter(Boolean);
    const whyOf = d => issue?.games.find(p => p.d === d)?.why;
    const heroGames = [...picks.filter(d => d.cover), ...BEST.map(t => DISC.find(d => d.title === t)).filter(d => d && d.cover && !picks.includes(d))].slice(0, 9);
    const best = BEST.map(t => DISC.find(d => d.title === t)).filter(d => d && !picks.includes(d) && !heroGames.includes(d));
    const rec = recentGames().slice(0, 12);
    const newest = [...DISC].sort(byNew).filter(d => !picks.includes(d) && !best.includes(d)).slice(0, 18);
    const fresh = [...newest.filter(d => d.cover), ...newest.filter(d => !d.cover)].slice(0, 12);
    const seen = new Set([...picks, ...heroGames, ...best, ...fresh].map(d => d.url));
    hstate.seen = seen;   // the genre grid skips these too
    const newCover = c => c.games.some(g => !seen.has(g.url) && g.cover) ? 1 : 0;
    const follow = CREATORS.filter(c => c.games.some(g => !seen.has(g.url) && (g.cover || g.embeddable)))
      .sort((x, y) => newCover(y) - newCover(x) || y.games.length - x.games.length).slice(0, 10);
    const followCards = follow.map((c, i) => crcard(c, i, seen)).join('');
    const avoid0 = new Set(seen); follow.forEach(c => seen.add(crTop(c, avoid0).url));
    const reel = DISC.filter(d => d.cover && !seen.has(d.url) && d.platform !== 'jam').sort(byNew).slice(0, 10);
    reel.forEach(d => seen.add(d.url));
    const jams = DISC.filter(d => d.platform === 'jam' && !seen.has(d.url)).sort((a, b) => (a.cover ? 0 : 1) - (b.cover ? 0 : 1) || byNew(a, b));
    const show = SHOWCASE.map(s => mechBySlug[s]).filter(Boolean);
    const wk = issue ? weekName(issue.id).replace(/, \d{4}$/, '') : weekOf();
    const tiles = [
      ['#/mechanics', tabIc.mech, 'Game feel', `${mechanics.length} parts`, 'Hit-stop, shake, dodge roll, combos'],
      ['#/games', tabIc.recipes, 'Recipes', `${games.filter(g => !g.parent).length} games`, 'Open games you can remake'],
      ['#/creators', crIc, 'Creators', `${CREATORS.length} people`, 'Who makes the best vibe games'],
      ['#/play', ic.up, 'Submit a game', 'Free', 'Made one, or found one? Send it in', 'data-submit-game'],
    ];
    app.innerHTML = `
      <section class="hx2">
        <div class="wrap hx2-head">
          <span class="tag"><span class="dot"></span>The home of vibe gaming</span>
          <h1 class="hx2-h" data-noi18n>${ZH ? `玩最好的<span class="hx2-rot">${['vibe', 'AI 做的', '一句话做出的', '一个周末做完的'].map((w, i) => `<b class="${i ? '' : 'on'}">${w}</b>`).join('')}</span>网页游戏`
            : `Play the best <span class="hx2-rot">${['vibe-coded', 'AI-made', 'one-prompt', 'weekend-built'].map((w, i) => `<b class="${i ? '' : 'on'}">${w}</b>`).join('')}</span> games`}</h1>
          <p>Hand-picked web games made with AI. Free, no download, and every one credited to the person who made it.</p>
          <div class="hx2-acts"><a class="btn btn-accent" href="#/play">Play now</a><a class="btn" href="#/make">Make one</a></div>
        </div>
        ${heroGames.length > 2 ? `<div class="cf" id="cf" tabindex="0" aria-roledescription="carousel" aria-label="Featured games">
          ${heroGames.map((d, i) => { const pi = picks.indexOf(d); return `<a class="cf-card" href="${gLink(d)}" data-i="${i}" aria-label="${esc(d.title)}"><img src="${esc(d.cover)}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()"><span class="cf-shade"></span><span class="cf-meta"><span class="chip ${pi > -1 ? 'hot' : ''}">${pi > -1 ? `Pick #${pi + 1}` : 'All-time best'}</span><b>${esc(d.title)}</b><span>${esc(d.creator || host(d.url))}</span></span></a>`; }).join('')}
          <button class="cf-btn l" data-cf="-1" aria-label="Previous">${chev('l')}</button><button class="cf-btn r" data-cf="1" aria-label="Next">${chev('r')}</button>
        </div>
        <div class="wrap cf-cap" id="cfCap" aria-live="polite"></div>` : ''}
        <div class="wrap wk-head">
          <span class="tag"><span class="dot"></span>This week in vibe gaming</span>
          <span class="wk-date">${issue ? `Issue #${issue.no} · ` : ''}${wk ? `Week of ${esc(wk)} · ` : ''}picked by hand from ${DISC.length} games</span>
          ${issue ? `<a class="link" href="#/week/${issue.id}">Read the issue</a><a class="link wk-past" href="#/weeks">Past issues</a>` : `<a class="link" href="#/play">Play all ${DISC.length}</a>`}
        </div>
      </section>
      ${rec.length ? `<div class="wrap">${rail({ title: 'Continue playing', sub: 'Games you opened recently, kept in this browser.', href: '#/library', more: 'Your library', items: rec.map(gcard).join('') })}</div>` : ''}

      <div class="ticker" aria-label="Playbook at a glance"><div class="ticker-in">${(() => {
        const items = [`${DISC.length} vibe-coded games`, `${CREATORS.length} creators`, ...fresh.slice(0, 3).map(d => `New: ${d.title}`),
          'Cursor Vibe Jam winners inside', `${mechanics.length} game-feel parts for your agent`, 'Free and open-source MCP'];
        const run = items.map(t => `<span>${esc(t)}</span><i aria-hidden="true">✦</i>`).join('');
        return `<div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div>`;
      })()}</div></div>

      ${reel.length > 2 ? `<section class="reel" id="reel" aria-label="Showreel">
        <div class="reel-stick"><div class="wrap">
          <a class="reel-card" id="reelCard" href="${gLink(reel[0])}">
            ${reel.map((d, i) => `<img class="${i ? '' : 'on'}" src="${esc(d.cover)}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`).join('')}
            <span class="reel-shade"></span>
            <span class="reel-top"><span class="tag"><span class="dot"></span>Showreel</span><span class="reel-tc" id="reelTc">00:00 · 1/${reel.length}</span></span>
            <span class="reel-cap"><b id="reelTitle">${esc(reel[0].title)}</b><span id="reelBy">${esc(reel[0].creator || host(reel[0].url))}${reel[0].genre ? ` · ${esc(reel[0].genre)}` : ''}</span></span>
          </a>
        </div></div>
      </section>` : ''}

      <div class="wrap idx">
        ${best.length ? rail({ title: 'All-time best', sub: 'The vibe-coded games people keep coming back to: jam winners and the ones that went viral.', href: '#/play', more: `All ${DISC.length}`, items: best.map(gcard).join('') }) : ''}
        ${rail({ title: 'New this week', sub: 'Fresh from X, game jams and itch. Every card opens the creator’s own page.', href: '#/play', more: `All ${DISC.length}`, items: fresh.map(gcard).join('') })}
        ${rail({ title: 'Creators to follow', sub: 'The people behind the best vibe games right now.', href: '#/creators', more: `All ${CREATORS.length}`, cls: 'cr', items: followCards })}

        <section class="promo2 light">
          <div class="promo-big calm rv">
            <span class="pb-tag"><span class="dot"></span>For vibe coders · free and open source</span>
            <h2>Make yours feel this good<span>Game feel, recipes and search, inside your own coding agent</span></h2>
            <div class="cmd"><code><b>$</b> ${esc(MCP_CMD)}</code><button class="copy" data-copy="${esc(MCP_CMD)}">Copy</button></div>
            <div class="pb-acts"><a class="btn btn-ink" href="#/make">Start here</a><a class="btn" href="#/mcp">Cursor, Codex, Desktop</a></div>
          </div>
          <div class="tiles2">${tiles.map((t, k) => `<a class="tile2 rv" style="--d:${k * 50}ms" href="${t[0]}" ${t[5] || ''}><span class="ti">${t[1]}</span><div><h3>${t[2]} <em>${t[3]}</em></h3><p>${t[4]}</p></div></a>`).join('')}</div>
        </section>

        ${rail({ title: 'Game feel, ready to install', sub: 'What a one-line prompt gets wrong. Poke the live demo, then add it to your game by name.', href: '#/mechanics', more: `All ${mechanics.length}`, cls: 'mech', items: show.map(mcard).join('') })}

        <section class="section">
          <div class="sec-head"><div><h2>Browse by genre</h2><p>${DISC.length} vibe-coded games, sorted the way you like to play.</p></div><a class="link" href="#/play">All ${DISC.length} games</a></div>
          <div class="gtiles">${genreTiles(8)}</div>
        </section>

        ${jams.length ? rail({ title: 'From the game jams', sub: 'Winners and standouts from Cursor Vibe Jam and other AI game jams.', href: '#/play', items: jams.slice(0, 12).map(gcard).join('') }) : ''}

        ${contest()}
      </div>`;
    bindRails(app);
    bindReel(reel);
    bindHero(heroGames, picks, whyOf);
  }

  // ---- hero: a coverflow of portrait game cards (this week's picks first) and a rotating headline word ----
  let cfTimer = null, rotTimer = null;
  function bindHero(list, picks, whyOf) {
    clearInterval(cfTimer); clearInterval(rotTimer);
    const rot = $$('.hx2-rot b');
    const fit = b => { const box = b.parentElement; if (box) box.style.width = b.offsetWidth + 'px'; };
    if (rot.length) requestAnimationFrame(() => fit(rot[0]));
    if (rot.length && !CALM) { let r = 0; rotTimer = setInterval(() => { if (!rot[0].isConnected) return clearInterval(rotTimer); rot[r].classList.remove('on'); r = (r + 1) % rot.length; rot[r].classList.add('on'); fit(rot[r]); }, 2200); }
    const cf = $('#cf'); if (!cf) return;
    const cards = $$('.cf-card', cf), n = cards.length, cap = $('#cfCap');
    let c = 0, hover = false;
    const show = k => {
      c = (k + n) % n;
      cards.forEach((el, i) => {
        let o = i - c; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
        const a = Math.abs(o);
        el.style.setProperty('--o', o); el.style.setProperty('--a', Math.min(a, 3));
        el.classList.toggle('on', o === 0); el.classList.toggle('far', a > 2);
        el.tabIndex = o === 0 ? 0 : -1;
      });
      const d = list[c], pi = picks.indexOf(d);
      cap.innerHTML = `<span class="cf-k">${pi > -1 ? `This week in vibe gaming · Pick #${pi + 1}` : 'All-time best'}</span>
        <h2>${esc(d.title)}</h2>${d.creator ? `<a class="pick-by" href="${crLink(d.creator)}">${crAva(d.creator)}<span>${esc(d.creator)}</span></a>` : ''}
        <p data-noi18n>${esc((pi > -1 && whyOf(d)) || d.note || '')}</p>
        <div class="cf-acts"><a class="btn btn-accent" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Play on ${esc(host(d.url))} ↗</a><a class="btn" href="${gLink(d)}">Details</a>${favBtn(d)}</div>`;
      if (I18N) I18N.apply(cap);
    };
    cards.forEach((el, i) => el.addEventListener('click', e => { if (i !== c) { e.preventDefault(); show(i); } }));
    $$('[data-cf]', cf).forEach(b => b.addEventListener('click', () => show(c + +b.dataset.cf)));
    cf.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(c + (e.key === 'ArrowRight' ? 1 : -1)); } });
    let x0 = null;
    cf.addEventListener('pointerdown', e => { x0 = e.clientX; }, { passive: true });
    cf.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { cf.dataset.swiped = '1'; setTimeout(() => delete cf.dataset.swiped, 50); show(c + (dx < 0 ? 1 : -1)); } });
    cf.addEventListener('click', e => { if (cf.dataset.swiped) { e.preventDefault(); e.stopPropagation(); } }, true);
    cf.addEventListener('mouseenter', () => { hover = true; }); cf.addEventListener('mouseleave', () => { hover = false; });
    show(0); requestAnimationFrame(() => requestAnimationFrame(() => cf.classList.add('ready')));
    if (!CALM) cfTimer = setInterval(() => { if (!cf.isConnected) return clearInterval(cfTimer); if (!hover && !document.hidden && cf.getBoundingClientRect().bottom > 0) show(c + 1); }, 5000);
  }

  // ---- showreel: grows from a tilted card to full width as you scroll; crossfades while on screen ----
  let reelTimer = null, reelIO = null;
  function bindReel(list) {
    clearInterval(reelTimer); reelIO?.disconnect();
    const sec = $('#reel'), card = $('#reelCard'); if (!sec || !card) return;
    const imgs = () => $$('img', card);
    let i = 0, secs = 0, playing = false;
    const show = k => {
      const all = imgs(); if (!all.length) return;
      i = (k + list.length) % list.length;
      all.forEach((im, n) => im.classList.toggle('on', n === i % all.length));
      const d = list[i];
      card.href = gLink(d);
      $('#reelTitle').textContent = d.title;
      $('#reelBy').textContent = (d.creator || host(d.url)) + (d.genre ? ` · ${d.genre}` : '');
    };
    const tick = () => {
      if (!playing || !sec.isConnected) return;
      secs++;
      if (secs % 3 === 0) show(i + 1);
      const tc = $('#reelTc'); if (tc) tc.textContent = `00:${String(secs % 60).padStart(2, '0')} · ${i + 1}/${list.length}`;
    };
    if (!CALM) {
      reelIO = new IntersectionObserver(es => { playing = es[0].isIntersecting; }, { threshold: 0.25 });
      reelIO.observe(card);
      reelTimer = setInterval(tick, 1000);
    }
    reelScroll();
  }
  const reelScroll = () => {
    const sec = $('#reel'), card = $('#reelCard'); if (!sec || !card) return;
    if (CALM || innerWidth < 861) { card.style.setProperty('--p', 1); return; }
    const r = sec.getBoundingClientRect(), total = Math.max(1, r.height - innerHeight);
    const t = Math.min(1, Math.max(0, -r.top / total / 0.65));
    card.style.setProperty('--p', (1 - Math.pow(1 - t, 3)).toFixed(4));  // ease-out
  };
  let reelRaf = 0;
  window.addEventListener('scroll', () => { if (!reelRaf) reelRaf = requestAnimationFrame(() => { reelRaf = 0; reelScroll(); }); }, { passive: true });
  window.addEventListener('resize', reelScroll);

  // ---------- make: the toolkit hub for vibe coders ----------
  function makePage() {
    const originals = games.filter(g => !g.parent);
    const show = SHOWCASE.map(s => mechBySlug[s]).filter(Boolean);
    const steps = [
      ['Connect your agent', 'Claude Code, Cursor or Codex. One command. No account, no API key.', `<div class="cmd"><code><b>$</b> ${esc(MCP_CMD)}</code><button class="copy" data-copy="${esc(MCP_CMD)}">Copy</button></div><a class="link" href="#/mcp">Other clients</a>`],
      ['Add game feel', `${mechanics.length} parts, each with a live demo and its key numbers. Ask: “add hit-stop to my game”.`, '<a class="link" href="#/mechanics">Browse game feel</a>'],
      ['Start from a recipe', `${originals.length} open games with prompt, mechanics and source. Ask: “remake Neon Drift, but underwater”.`, '<a class="link" href="#/games">Browse recipes</a>'],
      ['Share it', 'Made something good? Send it in. The best ones go into the weekly picks, credited to you.', '<button class="link" data-submit-game>Submit a game</button>'],
    ];
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>For vibe coders</span>
        <h1>Make vibe games that <em>feel good</em></h1>
        <p>A one-line prompt gets you a game that runs. Playbook helps with the rest: the timing, impact and polish that keep people playing, pulled straight into your own coding agent.</p>
      </div></section>
      <div class="wrap">
        <section class="idea rv">
          <div class="idea-l"><span class="tag"><span class="dot"></span>Start from one sentence</span><h2>What do you want to make?</h2><p>Describe your game. We write the prompt and pick the game-feel parts, and your own agent builds it, so there's nothing to pay us.</p></div>
          <form class="idea-r" id="ideaForm"><div class="idea-row"><input id="ideaIn" maxlength="200" required autocomplete="off" placeholder="${ZH ? '比如：一个鱼会反击的治愈钓鱼游戏' : 'e.g. a cozy fishing game where the fish fight back'}"><button class="btn btn-accent" type="submit">Write my prompt</button></div>
            <div class="idea-ex">${(ZH ? ['沉没城市里的魂系 Boss 战', '会漂移的超市购物车赛车', '在云上跳跃的猫咪平台跳跃', '一波波怪物的割草肉鸽'] : ['a souls-like boss fight in a sunken city', 'a shopping-cart drift racer', 'a cat platformer above the clouds', 'a horde survivor with weird upgrades']).map(t => `<button type="button" class="chip" data-idea="${esc(t)}">${esc(t)}</button>`).join('')}</div>
            <div id="ideaOut" hidden><div class="prompt" id="ideaPrompt" data-noi18n></div><div class="idea-parts" id="ideaParts"></div>
              <div class="prompt-row"><a class="link" href="#/mcp">Connect the Playbook MCP first</a><button class="copy" type="button" id="ideaCopy">Copy prompt</button></div></div>
          </form>
        </section>
        <div class="stack">${steps.map((x, k) => `<div class="scard c${k}" style="--k:${k}"><div class="scard-l"><span class="n">${String(k + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}</span><h3>${x[0]}</h3></div><div class="scard-r"><p>${x[1]}</p><div class="sx">${x[2]}</div></div></div>`).join('')}</div>
        <section class="section">
          <div class="sec-head"><div><h2>Game feel, ready to install</h2><p>Poke the live demo, then add it by name.</p></div><a class="link" href="#/mechanics">All ${mechanics.length}</a></div>
          <div class="mgrid" id="makeMech">${show.map(mcard).join('')}</div>
        </section>
        <section class="section">
          <div class="sec-head"><div><h2>Open recipes</h2><p>Whole games you can remake: prompt, mechanics, look, sound and source.</p></div><a class="link" href="#/games">All ${originals.length}</a></div>
          <div class="wall three">${originals.slice(0, 6).map(g => card(g, { verb: true })).join('')}</div>
        </section>
      </div>`;
    $$('#makeMech .media').forEach(m => m.style.pointerEvents = 'none');
    bindIdea();
  }

  // one-sentence idea -> a prompt for the user's own agent, with matching game-feel parts (no generation on our side)
  const IDEA_RULES = [
    [/shoot|gun|fps|blast|space|射击|枪|飞船/i, ['muzzle-flash', 'screen-shake', 'hit-stop', 'damage-numbers']],
    [/platform|jump|climb|跳|平台|攀/i, ['platformer-controller', 'double-jump', 'squash-stretch', 'camera-follow']],
    [/fight|combat|sword|boss|brawl|souls|duel|战斗|打|剑|魂|决斗/i, ['combo-window', 'hit-stop', 'dodge-roll', 'iframes-blink', 'health-bar-lag']],
    [/race|racing|racer|car|drift|kart|cart|赛车|漂移|卡丁|购物车/i, ['dash-trail', 'camera-follow', 'screen-shake', 'impact-zoom']],
    [/survivor|horde|wave|rogue|割草|肉鸽|波次|怪物/i, ['wave-spawner', 'upgrade-cards', 'pickup-magnet', 'damage-numbers']],
    [/dungeon|rpg|loot|quest|地牢|装备|冒险/i, ['dungeon-gen', 'loot-reveal', 'upgrade-cards', 'number-roll']],
    [/grapple|swing|hook|钩|摆荡/i, ['grapple-hook']],
    [/top-?down|twin|俯视/i, ['topdown-movement']],
    [/puzzle|match|cozy|fish|farm|idle|解谜|消除|钓鱼|种田|治愈|放置/i, ['button-juice', 'particle-burst', 'number-roll', 'procedural-sfx']],
  ];
  const ideaParts = t => {
    const out = [];
    IDEA_RULES.forEach(([re, ms]) => { if (re.test(t)) ms.forEach(m => out.includes(m) || out.push(m)); });
    ['screen-shake', 'particle-burst', 'button-juice', 'procedural-sfx'].forEach(m => out.length < 4 && !out.includes(m) && out.push(m));
    return out.filter(m => mechBySlug[m]).slice(0, 5);
  };
  function bindIdea() {
    const f = $('#ideaForm'); if (!f) return;
    const run = () => {
      const t = $('#ideaIn').value.trim(); if (!t) return;
      const ms = ideaParts(t).map(s => mechBySlug[s]);
      const p = ZH
        ? `做一个浏览器游戏：${t}。\n\n做成一个打开就能玩的网页游戏（HTML5 canvas 或 three.js），电脑和手机都能玩。\n用 Playbook MCP 加手感，安装下面这些组件，并按它们的 key numbers 调好：\n${ms.map(m => `- ${m.slug}（${m.name}）`).join('\n')}\n\n完成前自己玩一遍：修掉任何让人觉得慢或不公平的地方，让前 10 秒就好玩。`
        : `Make a browser game: ${t}.\n\nBuild it as a single web game (HTML5 canvas or three.js) that opens instantly and works on desktop and phone.\nUse the Playbook MCP for game feel. Install these parts and tune them with their key numbers:\n${ms.map(m => `- ${m.slug} (${m.name})`).join('\n')}\n\nBefore you finish, play it yourself: fix anything that feels slow or unfair, and make the first 10 seconds fun.`;
      $('#ideaPrompt').textContent = p;
      $('#ideaCopy').dataset.copy = p;
      $('#ideaParts').innerHTML = ms.map(m => `<a class="chip" href="#/mechanic/${m.slug}">${esc(m.name)}</a>`).join('');
      $('#ideaOut').hidden = false;
      track('idea', t.slice(0, 60), true);
    };
    f.addEventListener('submit', e => { e.preventDefault(); run(); });
    $$('[data-idea]', f).forEach(b => b.addEventListener('click', () => { $('#ideaIn').value = b.dataset.idea; run(); }));
  }

  function gamesPage(genre) {
    state.genre = GENRES.includes(genre) ? genre : 'All';
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <h1>${state.genre === 'All' ? 'Every game is a <em>recipe</em>' : `<em>${esc(state.genre)}</em> recipes`}</h1>
        <p>${games.length} games you can play right now, each a single HTML file with its prompt, mechanics and art direction open. Pick one and remake it in your agent.</p>
      </div></section>
      <div class="wrap">${wallControls()}</div>`;
    bindWall();
  }

  const CLIENTS = {
    'Claude Code': { how: 'Run this in your terminal, then start claude in your project.', cmd: MCP_CMD },
    'Cursor': { how: 'Add this to ~/.cursor/mcp.json (or .cursor/mcp.json in your project), then reload Cursor.', cmd: `{\n  "mcpServers": {\n    "playbook": { "type": "stdio", "command": "npx", "args": ["-y", "${MCP_PKG}"] }\n  }\n}` },
    'Codex': { how: 'Run this once (it writes ~/.codex/config.toml for you).', cmd: `codex mcp add playbook -- npx -y ${MCP_PKG}` },
    'Claude Desktop': { how: 'In the macOS menu bar: Claude → Settings… → Developer → Edit Config. Add this to claude_desktop_config.json, then quit and reopen Claude.', cmd: `{\n  "mcpServers": {\n    "playbook": { "command": "npx", "args": ["-y", "${MCP_PKG}"] }\n  }\n}` },
    'Other': { how: 'Any MCP client that runs stdio servers. Needs Node 18+.', cmd: `npx -y ${MCP_PKG}` },
  };
  function mcpPage() {
    if (!CLIENTS[state.client]) state.client = 'Claude Code';
    const c = CLIENTS[state.client];
    const originals = games.filter(g => !g.parent);
    app.innerHTML = `
      <div class="subbar" id="clients">${Object.keys(CLIENTS).map(k => `<button class="${k === state.client ? 'on' : ''}" data-client="${k}"><i></i>${k}</button>`).join('')}</div>
      <section class="page-head dots" style="padding:96px 0 72px"><div class="wrap">
        <h1>Remake <em>web games</em><br>in ${esc(state.client)} with Playbook</h1>
        <p>${esc(c.how)}</p>
        <div class="mcp-code"><pre>${esc(c.cmd)}</pre><button class="copy" data-copy="${esc(c.cmd)}">Copy</button></div>
        <div class="acts"><a class="btn btn-lg" href="${MCP_REPO}" target="_blank" rel="noopener">Source on GitHub</a><a class="btn btn-lg" href="#/mechanics">Browse mechanics</a></div>
        <div class="mcp-tools">
          <div><code>search</code><span>Find recipes, mechanics and AI games from the web</span></div>
          <div><code>get_recipe</code><span>Prompt, mechanics, look, sound and source of a game</span></div>
          <div><code>get_mechanic</code><span>A game-feel part with a working reference implementation</span></div>
          <div><code>list</code><span>Every recipe or mechanic, by genre or category</span></div>
        </div>
        <p class="note">Then just ask: “Add hit-stop to my game” · “Remake Neon Drift, but underwater” · “Find AI-made racing games for inspiration”.</p>
      </div></section>
      <div class="wrap">
        <div class="sec-head plain"><h2>Recipes with <span style="color:#ff6a3d">✺</span> Fable 5.2</h2></div>
        <div class="pills" style="margin-bottom:16px"><button class="pill on">Popular</button><a class="pill" style="display:inline-flex;align-items:center" href="#/games/3D">3D</a><a class="pill" style="display:inline-flex;align-items:center" href="#/games/Puzzle">Puzzle</a><a class="pill" style="display:inline-flex;align-items:center" href="#/mechanics">Mechanics</a></div>
        <div class="wall three">${originals.map(g => card(g, { verb: true })).join('')}</div>
        <section class="section"><div class="sec-head plain"><h2>One-click mechanics for ${esc(state.client)}</h2></div>
          <div class="mgrid">${mechanics.slice(0, 5).map(mcard).join('')}</div></section>
      </div>`;
    $('#clients').onclick = e => { const b = e.target.closest('[data-client]'); if (!b) return; state.client = b.dataset.client; mcpPage(); hydrate(); };
  }

  function jamPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Coming soon</span>
        <h1>Playbook <em>Jam #1</em></h1>
        <p>Pick any game on the wall, remake it in your agent, publish it as a link. Dates, rules and prizes will be announced here first.</p>
      </div></section>
      <div class="wrap">${contest()}
        <section class="section"><div class="sec-head"><div><h2>Start from one of these</h2></div></div>
        <div class="wall">${games.filter(g => !g.parent).slice(0, 4).map(g => card(g, { verb: true })).join('')}</div></section>
      </div>`;
  }

  function gamePage(id) {
    const g = byId[id]; if (!g) return notFound();
    const root = g.parent ? byId[g.parent] : g;
    const kids = games.filter(x => x.parent === root.id);
    const c = creators[g.by];
    app.innerHTML = `
      <section class="gpage"><div class="wrap">
        <div class="crumbs"><a href="#/games">Games</a><span>/</span><span>${esc(g.genres.join(' · '))}</span></div>
        <div class="ggrid">
          <div class="player bezel rv">
            <div class="core"><div class="screen"><iframe id="game" src="${g.src}" title="${esc(g.title)}" allow="fullscreen; autoplay" allowfullscreen></iframe></div></div>
            <div class="pbar">
              <div><h1>${esc(g.title)}</h1>
                <div class="by">${ava(g.by)}<a href="#/games">Playbook ${g.parent ? 'remix' : 'original'}</a>${g.parent ? `<span>· remix of <a href="#/game/${root.id}" style="color:var(--ink)">${esc(root.title)}</a></span>` : ''}</div></div>
              <div class="pact">
                <button class="icon-btn" id="redo" aria-label="Restart">${icon.redo}</button>
                <button class="icon-btn" data-copy="https://${SITE}/g/${g.id}" aria-label="Copy link">${icon.link}</button>
                <button class="icon-btn" id="full" aria-label="Fullscreen">${icon.full}</button>
              </div>
            </div>
            <div class="hint">${esc(g.controls)}</div>
          </div>

          <aside class="recipe bezel rv" style="--d:100ms"><div class="core">
            <h2>Recipe <span class="chip">${g.is3d ? 'Three.js' : 'Canvas 2D'} · 1 file</span></h2>
            <p class="lead">What this game is made of. Take all of it, or just the parts you want.</p>
            <button class="btn btn-accent btn-lg btn-block" data-remake="${g.id}"><span>Remake this game</span><span class="btn-ico">↗</span></button>
            <div class="rsec"><label>Mechanics</label><div class="mchips">${g.mechanics.map(s => `<a class="mchip" href="#/mechanic/${s}">${esc(mechBySlug[s].name)}</a>`).join('')}</div></div>
            <div class="rsec"><label>Art direction</label><div class="sw"><i style="background:${g.colors[0]}"></i><i style="background:${g.colors[1]}"></i><span>${esc(g.style)}</span></div></div>
            <div class="rsec"><label>Sound</label><div style="font-size:14px">${esc(g.audio)}</div></div>
            <div class="rsec"><label>Prompt</label><div class="prompt">${esc(g.prompt)}</div><div class="prompt-row"><button class="copy" data-copy="${esc(g.prompt)}">Copy prompt</button></div></div>
          </div></aside>
        </div>
      </div></section>

      <section class="section tight"><div class="wrap">
        <div class="sec-head"><div><span class="tag rv">Lineage</span><h2 class="rv" style="--d:60ms">Where it came from,<br>where it went.</h2></div>
        <p class="rv" style="--d:120ms">Every remake credits its source. ${esc(root.title)} has ${kids.length} remakes on Playbook so far.</p></div>
        <div class="lineage">
          ${card(root, { here: root.id === g.id })}
          <span class="arrow">remixed into →</span>
          ${kids.map(k => card(k, { here: k.id === g.id })).join('')}
        </div>
      </div></section>

      <section class="section tight"><div class="wrap">
        <div class="sec-head"><div><span class="tag rv">More recipes</span></div></div>
        <div class="wall">${games.filter(x => x.by === g.by && x.id !== g.id).slice(0, 3).map(x => card(x)).join('') || `<div class="empty">This is ${esc(c.name)}'s only game so far.</div>`}</div>
      </div></section>`;
    const f = $('#game');
    $('#redo').onclick = () => { f.src = g.src; };
    $('#full').onclick = () => { (f.requestFullscreen || f.webkitRequestFullscreen)?.call(f); };
  }

  function mechanicsPage() {
    const cats = ['All', ...new Set(mechanics.map(m => m.cat))];
    app.innerHTML = `
      <section class="page-head"><div class="wrap">
        <span class="tag rv">Mechanics</span>
        <h1 class="rv" style="--d:60ms">Small parts that make<br>a game feel good.</h1>
        <p class="rv" style="--d:120ms">Each one is a live demo, a prompt and an install command. Poke them. They react.</p>
      </div></section>
      <section class="section tight" style="padding-top:20px"><div class="wrap">
        <div class="controls rv"><div class="pills" id="mcats">${cats.map(c => `<button class="pill ${c === state.mcat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <span class="mono small muted">${mechanics.length} components · each one is a live demo</span></div>
        <div class="mgrid" id="mgrid"></div>
      </div></section>`;
    const draw = () => {
      const grid = $('#mgrid');
      $$('.media', grid).forEach(m => liveIO.unobserve(m));
      grid.innerHTML = mechanics.filter(m => state.mcat === 'All' || m.cat === state.mcat).sort((a, b) => b.installs - a.installs).map(mcard).join('');
      $$('.media', grid).forEach(m => m.style.pointerEvents = 'none');
      hydrate(grid);
    };
    draw();
    $('#mcats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; state.mcat = b.dataset.cat; $$('#mcats .pill').forEach(p => p.classList.toggle('on', p === b)); draw(); });
  }

  function mechanicPage(slug) {
    const m = mechBySlug[slug]; if (!m) return notFound();
    const used = games.filter(g => g.mechanics.includes(slug) && !g.parent);
    const cmd = `Use playbook get_mechanic ${m.slug} and add it to my game`;
    app.innerHTML = `
      <section class="gpage"><div class="wrap">
        <div class="crumbs"><a href="#/mechanics">Mechanics</a><span>/</span><span>${esc(m.cat)}</span></div>
        <div class="ggrid">
          <div class="player bezel rv">
            <div class="core"><div class="screen"><iframe src="mechanics/${m.slug}.html" title="${esc(m.name)} demo"></iframe></div></div>
            <div class="pbar"><div><h1>${esc(m.name)}</h1><div class="by">${ava(m.by)}<span>Playbook · ${esc(m.cat)}</span></div></div></div>
            <div class="hint">Live demo. Click, tap or use the keyboard inside the frame.</div>
          </div>
          <aside class="recipe bezel rv" style="--d:100ms"><div class="core">
            <h2>Install <span class="chip">${esc(m.cat)}</span></h2>
            <p class="lead">${esc(m.desc)}</p>
            <div class="cmd" style="margin-top:0"><code><b>›</b> ${cmd}</code><button class="copy" data-copy="${cmd}">Copy</button></div>
            ${m.keys?.length ? `<div class="rsec" style="margin-top:18px"><label>Key numbers</label><div class="keys">${m.keys.map(k => `<div><code>${esc(k.name)}</code><b>${esc(String(k.value))}${k.unit ? ` <span>${esc(k.unit)}</span>` : ''}</b><p>${esc(k.note)}</p></div>`).join('')}</div></div>` : ''}
            <div class="rsec" style="margin-top:18px"><label>Or paste into your agent</label><div class="prompt">${esc(m.prompt)}</div><div class="prompt-row"><button class="copy" data-copy="${esc(m.prompt)}">Copy prompt</button></div></div>
            <div class="rsec"><label>Works with</label><div class="mchips"><span class="mchip">Canvas 2D</span><span class="mchip">Three.js</span><span class="mchip">Phaser</span></div></div>
            <p class="note">The first line works once <a class="link" href="#/mcp">Playbook MCP</a> is installed; the prompt works in any coding agent as is.</p>
          </div></aside>
        </div>
      </div></section>
      <section class="section tight"><div class="wrap">
        <div class="sec-head"><div><span class="tag rv">In the wild</span><h2 class="rv" style="--d:60ms">Games using it.</h2></div></div>
        <div class="wall">${used.map(g => card(g)).join('')}</div>
      </div></section>`;
  }

  function publishPage() {
    app.innerHTML = `
      <section class="page-head"><div class="wrap">
        <span class="tag rv">Publish</span>
        <h1 class="rv" style="--d:60ms">One file in.<br>One link out.</h1>
        <p class="rv" style="--d:120ms">Drop the HTML file your agent made. You get a game page, a share link and a spot on the charts.</p>
      </div></section>
      <section class="section tight" style="padding-top:20px"><div class="wrap">
        <div class="pubgrid">
          <div class="drop bezel rv" id="drop"><div class="core"><div>
            <span class="tag">.html · up to 5 MB</span>
            <h3>Drop your game here</h3>
            <p class="muted">Publishing opens soon. For now this preview runs only in your browser tab; nothing is uploaded.</p>
            <div class="or">or</div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <label class="btn btn-plain" style="cursor:pointer">Choose file<input id="file" type="file" accept=".html,text/html" hidden></label>
              <button class="btn btn-accent btn-plain" id="sample">Try with a sample</button>
            </div>
          </div></div></div>
          <div class="term bezel rv" style="--d:100ms"><div class="core">
            <div class="bar3"><i></i><i></i><i></i></div>
            <pre id="term"><span class="d"># or straight from your agent</span>
<span class="p">$</span> playbook publish ./my-game.html
<span class="d">waiting for a file…</span></pre>
          </div></div>
        </div>
        <div class="result bezel" id="result"><div class="core">
          <div class="screen"><iframe id="preview" title="Your game"></iframe></div>
          <div class="info">
            <span class="tag"><span class="dot"></span>Preview</span>
            <h3 id="rtitle">Your game</h3>
            <div class="cmd" style="margin:0"><code id="rlink"></code><button class="copy" id="rcopy">Copy</button></div>
            <p class="muted small">When publishing opens, this link will work anywhere, embed in any site, and credit the game you remixed from.</p>
          </div>
        </div></div>
      </div></section>`;
    const term = $('#term'), drop = $('#drop'), result = $('#result');
    let blobUrl = null;
    const run = (name, url, sizeKb) => {
      const slug = name.replace(/\.html?$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-game';
      const lines = [
        `<span class="p">$</span> playbook publish ./${esc(name)}`,
        `<span class="d">→</span> reading file <span class="y">${sizeKb} KB</span>`,
        `<span class="d">→</span> checking: single file, no trackers, runs offline <span class="ok">ok</span>`,
        `<span class="d">→</span> recording 6s attract loop for the wall <span class="ok">ok</span>`,
        `<span class="d">→</span> extracting recipe: mechanics, palette, prompt <span class="ok">ok</span>`,
        `<span class="ok">✔ published</span>  https://${SITE}/g/${esc(slug)}`,
      ];
      term.innerHTML = ''; result.classList.remove('on');
      lines.forEach((l, i) => setTimeout(() => {
        term.innerHTML += l + '\n';
        if (i === lines.length - 1) {
          $('#preview').src = url; $('#rtitle').textContent = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          $('#rlink').textContent = `${SITE}/g/${slug}`; $('#rcopy').dataset.copy = `https://${SITE}/g/${slug}`;
          result.classList.add('on'); result.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 450 * (i + 1)));
    };
    const take = file => {
      if (!file) return;
      if (!/\.html?$/i.test(file.name)) return toast('Please choose an .html file');
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(new Blob([file], { type: 'text/html' }));
      run(file.name, blobUrl, Math.max(1, Math.round(file.size / 1024)));
    };
    $('#file').onchange = e => take(e.target.files[0]);
    $('#sample').onclick = () => run('tile-forge.html', 'games/tile-forge.html?theme=2', 38);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
  }

  function notFound() {
    const m = mechBySlug['platformer-controller'] || mechanics[0];
    app.innerHTML = `
      <section class="nf wrap"><div class="nf-grid">
        <div>
          <span class="tag"><span class="dot"></span>404</span>
          <h1>Game over.</h1>
          <p>This page doesn't exist, but this one does. Jump around while you're here: it's ${esc(m.name)}, one of our ${mechanics.length} game-feel parts.</p>
          <div class="acts"><a class="btn btn-accent" href="#/">Respawn at home</a><a class="btn" href="#/play">Play all games</a></div>
        </div>
        <div class="nf-game"><iframe src="mechanics/${m.slug}.html" title="${esc(m.name)}, playable"></iframe></div>
      </div></section>`;
  }


  // ---------- discover: games from around the web (link + credit only) ----------
  const DISC = (window.PB_DISCOVER || []).filter(d => !d.stale).map((d, i) => ({ ...d, _i: i }));
  // a page of its own for every listed game: #/g/<slug>
  const G_BY = {};
  DISC.forEach(d => { const base = slugify(d.title) || 'game'; let k = base, n = 2; while (G_BY[k]) k = `${base}-${n++}`; d.slug = k; G_BY[k] = d; });
  const gLink = d => `#/g/${d.slug}`;
  // favorites: kept in this browser only, no account
  const G_URL = new Set(DISC.map(d => d.url));
  const FAV_KEY = 'pb-favs';
  const FAVS = new Set((() => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; } })());
  // recently played: kept in this browser, newest first
  const REC_KEY = 'pb-recent';
  const RECENT = (() => { try { const v = JSON.parse(localStorage.getItem(REC_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } })();
  const played = u => {
    const i = RECENT.findIndex(r => r.u === u); if (i > -1) RECENT.splice(i, 1);
    RECENT.unshift({ u, t: Date.now() }); RECENT.length = Math.min(RECENT.length, 40);
    try { localStorage.setItem(REC_KEY, JSON.stringify(RECENT)); } catch {}
  };
  const recentGames = () => RECENT.map(r => DISC.find(d => d.url === r.u)).filter(Boolean);
  const saveFavs = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...FAVS])); } catch {} };
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const favBtn = d => `<button class="fav ${FAVS.has(d.url) ? 'on' : ''}" data-fav="${esc(d.url)}" aria-pressed="${FAVS.has(d.url)}" aria-label="${FAVS.has(d.url) ? 'Saved' : 'Save'}">${heart}</button>`;
  // guides: editorial lists built by tools/build_guides.py
  const GUIDES = (window.PB_GUIDES || []).map(g => ({ ...g, title: ZH && g.title_zh ? g.title_zh : g.title, intro: ZH && g.intro_zh ? g.intro_zh : g.intro,
    games: g.urls.map(u => DISC.find(d => d.url === u)).filter(Boolean) })).filter(g => g.games.length >= 3);
  // weekly issues ("This week in vibe gaming"), newest first; picks point at listed games by URL
  const LIVE = 'https://rexgu9911.github.io/playbook/';
  const WEEKS = (window.PB_WEEKS || []).map(w => ({ ...w, intro: ZH && w.intro_zh ? w.intro_zh : w.intro, games: w.picks.map(p => ({ why: ZH && p.why_zh ? p.why_zh : p.why, d: DISC.find(x => x.url === p.url) })).filter(p => p.d) }))
    .filter(w => w.games.length);
  const pickOf = d => WEEKS.filter(w => w.games.some(p => p.d === d)).sort((a, b) => b.no - a.no).map(w => ({ w, why: w.games.find(p => p.d === d).why }))[0];
  const pickBox = (pk, title) => `<a class="gd-pick" href="#/week/${pk.w.id}"><span class="gd-pick-k">This week in vibe gaming · Issue #${pk.w.no}</span>${title ? `<b>${esc(title)}</b>` : ''}<span class="gd-pick-why" data-noi18n>${esc(pk.why)}</span></a>`;
  const weekName = id => { const d = new Date(id + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const xPost = w => [`This week in vibe gaming · ${weekName(w.id)}`, '', ...w.games.map((p, i) => `${i + 1}. ${p.d.title}${p.d.creator ? ` by ${p.d.creator}` : ''}`), '', `Play them all: ${LIVE}s/week/${w.id}/`].join('\n');
  const PLATFORMS = { x: 'X', youtube: 'YouTube', hn: 'Hacker News', reddit: 'Reddit', itch: 'itch.io', jam: 'Game jam', wavedash: 'Wavedash', other: 'Web' };
  const dstate = { genre: 'All', platform: 'All', d3: false, sort: 'new' };
  const hashHue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const dDate = d => { if (!d) return ''; const [y, m] = d.split('-'); return m ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y : y; };
  const dIc = {
    out: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    live: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/></svg>',
  };
  // external previews: only on hover (desktop), one at a time, sandboxed, removed on leave.
  // Keeps third-party cookie banners, audio and CPU out of the grid; touch devices see the poster.
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let hoverT = null, liveEl = null;
  const stopPreview = () => {
    clearTimeout(hoverT);
    if (liveEl) { $('iframe', liveEl)?.remove(); liveEl.classList.remove('live', 'loading'); liveEl = null; }
  };
  const startPreview = el => {
    if (liveEl === el) return;
    stopPreview();
    hoverT = setTimeout(() => {
      liveEl = el; el.classList.add('loading');
      const f = document.createElement('iframe');
      f.tabIndex = -1; f.setAttribute('aria-hidden', 'true'); f.title = '';
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      f.referrerPolicy = 'no-referrer';
      f.addEventListener('load', () => { f.classList.add('on'); el.classList.add('live'); el.classList.remove('loading'); });
      f.src = el.dataset.ext;
      el.insertBefore(f, el.querySelector('.scan'));
    }, 380);
  };
  if (canHover) {
    document.addEventListener('pointerover', e => { const m = e.target.closest?.('.media[data-ext]'); if (m) startPreview(m); });
    document.addEventListener('pointerout', e => { const m = e.target.closest?.('.media[data-ext]'); if (m && !m.contains(e.relatedTarget)) stopPreview(); });
  }

  // cover image straight from the creator's site (their own share image); fallback handled in onerror
  const coverImg = d => d.cover ? `<img class="cover" src="${esc(d.cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('has-cover');this.remove()">` : '';
  const calm = d => { const h = hashHue(d.title + d.url); return `--c1:hsl(${h} 32% 30%);--c2:hsl(${(h + 40) % 360} 24% 16%)`; };
  const dcard = (d, i = 0) => {
    const eng = d.engine && d.engine.toLowerCase() !== 'unknown' ? d.engine : '';
    const auto = !d.cover && d.embeddable;
    const hover = d.cover && d.embeddable && canHover;
    return `
    <article class="card dcard rv" style="--d:${Math.min(i, 8) * 30}ms">
      <a class="dlink" href="${gLink(d)}" aria-label="${esc(d.title)}: details and play">
        <div class="media ${d.cover ? 'has-cover' : ''}" ${auto ? `data-auto="${esc(d.url)}"` : ''} ${hover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}">
          <div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div>
          <div class="top">
            <span>${auto ? '<span class="chip"><i class="livedot"></i>Live</span>' : ''}</span>
            <span><span class="chip">${dIc.out}${esc(host(d.url))}</span>${favBtn(d)}</span>
          </div>
          <span class="playbtn" aria-hidden="true">${playIco}</span>
        </div>
      </a>
      <div class="dmeta">
        <h3>${esc(d.title)}</h3>
        <div class="dtags">${d.genre ? `<span class="chip">${esc(d.genre)}</span>` : ''}${eng ? `<span class="chip">${esc(eng)}</span>` : ''}${d.is3d ? '<span class="chip">3D</span>' : ''}${d.touch === true ? '<span class="chip">Touch</span>' : ''}${d.date ? `<span class="chip">${esc(dDate(d.date))}</span>` : ''}</div>
        <p class="dnote">${esc(d.note || '')}</p>
        <div class="dby">
          ${d.creator ? `<a class="who" href="${crLink(d.creator)}">${crAva(d.creator)}${esc(d.creator)}${d.model ? `<span class="dim"> · ${esc(d.model)}</span>` : ''}</a>` : `<span class="who"><i class="ava" style="--h:${hashHue(d.title + d.url)}"></i>Unknown creator</span>`}
          ${d.source ? `<a href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">Source · ${esc(PLATFORMS[d.platform] || 'Web')} ↗</a>` : ''}
        </div>
        <button class="dclaim" data-claim="${d._i}">Is this yours? Claim or remove</button>
      </div>
    </article>`;
  };
  // compact card for browsing (home rails, genre grid): picture, title, creator. Full details live on Play.
  const gcard = (d, i = 0) => {
    const auto = !d.cover && d.embeddable, hover = d.cover && d.embeddable && canHover;
    return `
    <article class="card dcard gcard rv" style="--d:${Math.min(i, 8) * 30}ms">
      <a class="dlink" href="${gLink(d)}" aria-label="${esc(d.title)}: details and play">
        <div class="media ${d.cover ? 'has-cover' : ''}" ${auto ? `data-auto="${esc(d.url)}"` : ''} ${hover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}">
          <div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div>
          <div class="top"><span>${auto ? '<span class="chip"><i class="livedot"></i>Live</span>' : ''}</span><span><span class="chip host">${dIc.out}${esc(host(d.url))}</span>${favBtn(d)}</span></div>
          <span class="playbtn" aria-hidden="true">${playIco}</span>
        </div>
      </a>
      <div class="gmeta">${d.creator ? `<a class="stk-c" href="${crLink(d.creator)}">${esc(d.creator)}</a>` : ''}<h3>${esc(d.title)}</h3><p>${[d.genre, d.model].filter(Boolean).map(esc).join(' · ') || 'Web game'}</p></div>
    </article>`;
  };
  const byNew = (a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title);

  // ---------- creators: built from the games we list (link + credit only) ----------
  const crSlug = h => String(h).trim().replace(/^@|^u\//, '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-|-$/g, '');
  const crLink = h => `#/c/${encodeURIComponent(crSlug(h))}`;
  const crIc = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  const crAva = (h, cls = '') => `<i class="cava ${cls}" style="--h:${hashHue(h)}" aria-hidden="true">${esc((String(h).replace(/^@|^u\//, '')[0] || '?').toUpperCase())}</i>`;
  const crProfile = h => /^@[A-Za-z0-9_]{1,30}$/.test(h) ? { url: `https://x.com/${h.slice(1)}`, name: 'X' }
    : /^u\/[A-Za-z0-9_-]{2,30}$/.test(h) ? { url: `https://www.reddit.com/user/${h.slice(2)}`, name: 'Reddit' } : null;
  const CREATORS = (() => {
    const m = new Map();
    DISC.forEach(d => {
      const h = (d.creator || '').trim(); if (!h) return;
      const k = crSlug(h); if (!k) return;
      if (!m.has(k)) m.set(k, { slug: k, handle: h, games: [] });
      m.get(k).games.push(d);
    });
    const covered = c => c.games.some(g => g.cover) ? 1 : 0;
    return [...m.values()]
      .map(c => ({ ...c, games: c.games.sort((a, b) => (a.cover ? 0 : 1) - (b.cover ? 0 : 1) || byNew(a, b)) }))
      .sort((a, b) => b.games.length - a.games.length || covered(b) - covered(a) || byNew(a.games[0], b.games[0]));
  })();
  const crBySlug = Object.fromEntries(CREATORS.map(c => [c.slug, c]));
  // avoid: games already on screen, so a creator card shows something new
  const crTop = (c, avoid = null) => {
    const fresh = avoid instanceof Set ? c.games.filter(g => !avoid.has(g.url)) : c.games;
    return fresh.find(g => g.cover) || fresh.find(g => g.embeddable) || fresh[0] || c.games[0];
  };
  const crcard = (c, i = 0, avoid = null) => {
    const top = crTop(c, avoid);
    return `
    <a class="card crcard rv" href="${crLink(c.handle)}" style="--d:${Math.min(i, 8) * 30}ms">
      <div class="media ${top.cover ? 'has-cover' : ''}" ${!top.cover && top.embeddable ? `data-auto="${esc(top.url)}"` : ''} style="${calm(top)}"><div class="poster"><b class="ptitle">${esc(top.title)}</b></div>${coverImg(top)}<div class="scan"></div></div>
      <div class="crmeta">${crAva(c.handle)}<div><b>${esc(c.handle)}</b><span>${c.games.length} game${c.games.length > 1 ? 's' : ''} · ${esc(top.title)}</span></div></div>
    </a>`;
  };

  function creatorsPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>${CREATORS.length} creators so far</span>
        <h1>The people making <em>vibe games</em></h1>
        <p>Everyone behind a game we list, linked to their own pages. Is one of them you? Open your profile to claim it, fix the details or take it down.</p>
      </div></section>
      <div class="wrap">
        <div class="crgrid">${CREATORS.map((c, i) => crcard(c, i)).join('')}</div>
        <p class="note dfoot">Profiles are built from the public posts where creators shared their games. Nothing is copied or hosted here.</p>
      </div>`;
  }

  function creatorProfile(slug) {
    const c = crBySlug[slug]; if (!c) return notFound();
    const prof = crProfile(c.handle);
    const plats = [...new Set(c.games.map(g => PLATFORMS[g.platform] || 'Web'))];
    const engines = [...new Set(c.games.map(g => g.engine).filter(e => e && !/unknown/i.test(e)))];
    app.innerHTML = `
      <section class="page-head"><div class="wrap">
        <div class="crumbs"><a href="#/creators">Creators</a><span>/</span><span>${esc(c.handle)}</span></div>
        <div class="chead2 rv">${crAva(c.handle, 'lg')}<div>
          <h1>${esc(c.handle)}</h1>
          <p>${c.games.length} game${c.games.length > 1 ? 's' : ''} on Playbook · found on ${esc(plats.join(', '))}${engines.length ? ` · made with ${esc(engines.slice(0, 3).join(', '))}` : ''}</p>
        </div></div>
        <div class="acts">${prof ? `<a class="btn" href="${prof.url}" target="_blank" rel="noopener noreferrer">${prof.name} profile ↗</a>` : ''}<button class="btn btn-accent" data-claim-creator="${esc(c.slug)}">Is this you? Claim this profile</button></div>
      </div></section>
      <div class="wrap">${(picks => picks.length ? `<div class="cr-picks">${picks.join('')}</div>` : '')(c.games.map(g => [g, pickOf(g)]).filter(x => x[1]).map(([g, pk]) => pickBox(pk, g.title)))}<div class="wall">${c.games.map(dcard).join('')}</div></div>`;
  }

  function claimCreatorModal(slug) {
    const c = crBySlug[slug]; if (!c) return;
    openModal(`
      <span class="tag">${esc(c.handle)}</span>
      <h2>Claim this profile.</h2>
      <p class="lead">Add your links and a short bio, fix a credit, list another game of yours, or ask us to take the profile down.</p>
      <form id="ccForm">
        <div class="field"><label for="ccWhat">I want to</label><select id="ccWhat"><option>Claim my profile</option><option>Add another game of mine</option><option>Fix a credit or detail</option><option>Remove my profile and games</option></select></div>
        <div class="field"><label for="ccProof">A link that shows this is you</label><input id="ccProof" required maxlength="160" placeholder="https:// (a post or page on the account above)"></div>
        <button class="btn btn-accent btn-block" type="submit">Continue on GitHub</button>
      </form>
      <p class="note">This opens a pre-filled issue on our GitHub repo. Removal requests are acted on as soon as we see them.</p>
      <p class="note">No GitHub account? If we told you about this listing, just reply to that message and we'll take care of it.</p>`);
    $('#ccForm').addEventListener('submit', e => {
      e.preventDefault();
      const w = $('#ccWhat').value;
      const body = `Profile: ${c.handle}\nRequest: ${w}\nProof it is me: ${$('#ccProof').value}\nGames listed: ${c.games.map(g => g.title).join(', ')}\n\nDetails (links, bio, fixes):\n`;
      window.open(issueUrl(`${/Remove/.test(w) ? 'Remove' : 'Claim'} profile: ${c.handle}`, body, /Remove/.test(w) ? 'removal' : 'claim'), '_blank', 'noopener');
      closeModal(); toast('Opened GitHub in a new tab');
    });
  }

  function drawDiscover() {
    const grid = $('#discGrid'); if (!grid) return;
    stopPreview();
    const list = DISC.filter(d => (dstate.genre === 'All' || d.genre === dstate.genre)
      && (dstate.platform === 'All' || d.platform === dstate.platform)
      && (!dstate.d3 || d.is3d) && (!dstate.touch || d.touch === true))
      .sort(dstate.sort === 'new' ? byNew : (a, b) => a.title.localeCompare(b.title));
    grid.innerHTML = list.length ? list.map(dcard).join('') : '<div class="empty"><b>Nothing matches yet</b>Try fewer filters, or <button class="link" data-submit-game>submit a game you found</button>.</div>';
    $('#discCount').textContent = I18N ? I18N.tr(`${list.length} of ${DISC.length} games`) : `${list.length} of ${DISC.length} games`;
    hydrate(grid);
  }
  // genre tiles: a muted single-colour halftone over one of the genre's own covers; full colour on hover
  const TINTS = ['#d98a70', '#a3b878', '#9890cf', '#cfae7f', '#6fa9a6', '#c27a8f', '#c4ad5c', '#7f9cc9'];
  const genreTiles = (max = 12) => {
    const counts = {};
    DISC.forEach(d => { if (d.genre) counts[d.genre] = (counts[d.genre] || 0) + 1; });
    const used = new Set();
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, max).map(([g, n], i) => {
      const pool = DISC.filter(d => d.genre === g && d.cover && !used.has(d.url)).sort(byNew);
      const pic = pool.find(d => BEST.includes(d.title)) || pool[0];
      if (pic) used.add(pic.url);
      return `<a class="gtile rv" href="#/play/${encodeURIComponent(g)}" style="--tint:${TINTS[i % TINTS.length]};--d:${Math.min(i, 8) * 30}ms">${pic ? `<img src="${esc(pic.cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<i class="ht" aria-hidden="true"></i><b>${esc(g)}</b><span>${n} games</span></a>`;
    }).join('');
  };

  function discGamePage(slug) {
    const d = G_BY[slug]; if (!d) return notFound();
    const eng = d.engine && !/unknown/i.test(d.engine) ? d.engine : '';
    const own = d.creator ? (crBySlug[crSlug(d.creator)]?.games || []).filter(x => x !== d && !x.stale) : [];
    const like = DISC.filter(x => x !== d && x.genre && x.genre === d.genre && !own.includes(x))
      .sort((a, b) => (a.cover ? 0 : 1) - (b.cover ? 0 : 1) || byNew(a, b)).slice(0, 8);
    const h = host(d.url);
    const facts = [['Made with', d.model], ['Engine', eng], ['Found on', PLATFORMS[d.platform] || 'Web'], ['Shared', dDate(d.date)], ['Link checked', d.verified]].filter(x => x[1]);
    app.innerHTML = `
      <section class="gd wrap">
        <div class="crumbs"><a href="#/play">Play</a><span>/</span>${d.genre ? `<a href="#/play/${encodeURIComponent(d.genre)}">${esc(d.genre)}</a><span>/</span>` : ''}<span>${esc(d.title)}</span></div>
        <div class="gd-grid">
          <div class="gd-stage">
            <div class="media gd-media ${d.cover ? 'has-cover' : ''}" id="gdStage" style="${calm(d)}">
              <div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}
              <div class="gd-over">${d.embeddable ? `<button class="btn btn-accent btn-lg" id="gdPlay">${playIco}Play here</button>` : ''}<a class="btn btn-lg ${d.embeddable ? '' : 'btn-accent'}" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Play on ${esc(h)} ↗</a></div>
            </div>
            <p class="gd-hint">${d.embeddable ? 'Play here runs the creator’s own page in a sandboxed frame. ' : ''}Playbook links to the creator’s site and credits them; nothing is copied or hosted here.</p>
          </div>
          <aside class="gd-info">
            <h1>${esc(d.title)}</h1>
            ${d.creator ? `<a class="gd-by" href="${crLink(d.creator)}">${crAva(d.creator)}<span>${esc(d.creator)}</span></a>` : ''}
            <p class="gd-note">${esc(d.note || '')}</p>
            ${(pk => pk ? pickBox(pk) : '')(pickOf(d))}
            <div class="dtags">${d.genre ? `<span class="chip">${esc(d.genre)}</span>` : ''}${d.is3d ? '<span class="chip">3D</span>' : '<span class="chip">2D</span>'}${eng ? `<span class="chip">${esc(eng)}</span>` : ''}${d.touch === true ? '<span class="chip">Touch</span>' : ''}${d.code ? '<span class="chip">Open source</span>' : ''}</div>
            <dl class="gd-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
            <div class="gd-acts">
              <a class="btn btn-accent btn-block" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Play on ${esc(h)} ↗</a>
              ${d.source && d.source !== d.url ? `<a class="btn btn-block" href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">Where it was shared ↗</a>` : ''}
              <button class="btn btn-block" data-copy="${esc(`${LIVE}s/g/${d.slug}/`)}">Copy share link</button>
              <button class="btn btn-block savebtn ${FAVS.has(d.url) ? 'on' : ''}" data-fav="${esc(d.url)}" aria-pressed="${FAVS.has(d.url)}">${heart}<span>${FAVS.has(d.url) ? 'Saved' : 'Save'}</span></button>
            </div>
            <button class="dclaim" data-claim="${d._i}">Is this yours? Claim or remove</button>
          </aside>
        </div>
        ${d.code ? (() => {
          const rp = `Clone ${d.code} and remix ${d.title}${d.creator ? ` by ${d.creator}` : ''}: [describe your twist]. Keep the original credit and follow the license in the repo.`;
          return `<section class="section tight"><div class="remix rv"><div class="remix-l"><span class="tag"><span class="dot"></span>Open source</span><h2>Remix this game</h2><p>The creator published the source. Start from it in your own agent, keep their credit, and check the license in the repo.</p><a class="btn" href="${esc(d.code)}" target="_blank" rel="noopener noreferrer">View the source ↗</a></div><div class="remix-r"><div class="prompt" data-noi18n>${esc(rp)}</div><div class="prompt-row"><button class="copy" data-copy="${esc(rp)}">Copy prompt</button></div></div></div></section>`;
        })() : ''}
        ${(() => {
          const share = `${LIVE}s/g/${d.slug}/`, picked = pickOf(d)?.w;
          const kinds = [['featured-dark', 'Dark'], ['featured-light', 'Light'], ...(picked ? [['pick-orange', 'Weekly pick'], ['pick-dark', 'Weekly pick, dark']] : [])];
          const post = picked ? `My game ${d.title} was picked in This week in vibe gaming #${picked.no} on Playbook 🎮 ${share}`
            : `My game ${d.title} is featured on Playbook, the home of vibe gaming 🎮 ${share}`;
          return `<section class="section tight kit"><div class="sec-head"><div><h2>Share kit</h2><p>Made this game? Show it's on Playbook. Badges link back here.</p></div><a class="link" href="#/standards">Our standards</a></div>
          <div class="kit-grid">${kinds.map(([b, lab]) => {
            const alt = b.startsWith('pick') ? 'Weekly pick on Playbook' : 'Featured on Playbook', img = `${LIVE}badge/${b}.svg`;
            const html = `<a href="${share}" target="_blank" rel="noopener"><img src="${img}" alt="${alt}" width="236" height="54"></a>`, md = `[![${alt}](${img})](${share})`;
            return `<div class="kit-card"><div class="kit-prev ${b.includes('light') ? 'light' : ''}"><img src="badge/${b}.svg" alt="${alt}" width="236" height="54"></div><div class="kit-meta"><span>${lab}</span><span class="kit-btns"><button class="btn btn-sm" data-copy="${esc(html)}">HTML</button><button class="btn btn-sm" data-copy="${esc(md)}">Markdown</button></span></div></div>`;
          }).join('')}<div class="kit-card post"><p data-noi18n>${esc(post)}</p><button class="btn btn-sm" data-copy="${esc(post)}">Copy post</button></div></div></section>`;
        })()}
        ${own.length ? `<section class="section tight"><div class="sec-head"><div><h2>More from ${esc(d.creator)}</h2></div><a class="link" href="${crLink(d.creator)}">Profile</a></div><div class="wall">${own.slice(0, 8).map(gcard).join('')}</div></section>` : ''}
        ${like.length ? `<section class="section tight"><div class="sec-head"><div><h2>More ${esc(d.genre.toLowerCase())} games</h2></div><a class="link" href="#/play/${encodeURIComponent(d.genre)}">All ${esc(d.genre.toLowerCase())}</a></div><div class="wall">${like.map(gcard).join('')}</div></section>` : ''}
      </section>`;
    $('#gdPlay')?.addEventListener('click', () => {
      played(d.url);
      const st = $('#gdStage');
      st.classList.add('playing');
      st.innerHTML = `<iframe src="${esc(d.url)}" title="${esc(d.title)}" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms" allow="fullscreen; autoplay; gamepad" referrerpolicy="no-referrer"></iframe>`;
    });
  }

  function weekPage(id) {
    const k = WEEKS.findIndex(w => w.id === id); if (k < 0) return notFound();
    const w = WEEKS[k], newer = WEEKS[k - 1], older = WEEKS[k + 1];
    const link = `${LIVE}s/week/${w.id}/`;
    app.innerHTML = `
      <section class="wkp wrap">
        <div class="crumbs"><a href="#/weeks">Weekly picks</a><span>/</span><span>Issue #${w.no}</span></div>
        <div class="wkp-head">
          <span class="tag"><span class="dot"></span>This week in vibe gaming · Issue #${w.no}</span>
          <h1>Week of ${esc(weekName(w.id))}</h1>
          <p>${esc(w.intro)}</p>
          <div class="acts"><button class="btn btn-accent" data-copy="${esc(link)}">Copy link</button><button class="btn" data-copy="${esc(xPost(w))}">Copy post for X</button></div>
        </div>
        <ol class="wkp-list">${w.games.map((p, i) => { const d = p.d; return `
          <li class="wkp-item rv">
            <a class="wkp-media" href="${gLink(d)}" aria-label="${esc(d.title)}: details and play">
              <div class="media ${d.cover ? 'has-cover' : ''}" ${d.cover && d.embeddable && canHover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}"><div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div></div>
            </a>
            <div class="wkp-text">
              <span class="wkp-n">${String(i + 1).padStart(2, '0')}${i === 0 ? ' · Pick of the week' : ''}</span>
              <h2><a href="${gLink(d)}">${esc(d.title)}</a></h2>
              ${d.creator ? `<a class="wkp-by" href="${crLink(d.creator)}">${crAva(d.creator)}<span>${esc(d.creator)}</span></a>` : ''}
              <p>${esc(p.why)}</p>
              <div class="wkp-acts"><a class="btn btn-accent" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Play on ${esc(host(d.url))} ↗</a><a class="link" href="${gLink(d)}">Details</a></div>
            </div>
          </li>`; }).join('')}</ol>
        <nav class="wkp-nav">${older ? `<a class="btn" href="#/week/${older.id}">← Issue #${older.no}</a>` : '<span></span>'}<a class="link" href="#/weeks">All issues</a>${newer ? `<a class="btn" href="#/week/${newer.id}">Issue #${newer.no} →</a>` : '<span></span>'}</nav>
      </section>`;
  }

  function weeksPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Every Monday</span>
        <h1>This week in <em>vibe gaming</em></h1>
        <p>Five AI-made web games we think are worth your time, picked by hand each week and credited to the people who made them. ${WEEKS.length} issue${WEEKS.length === 1 ? '' : 's'} so far.</p>
      </div></section>
      <div class="wrap"><div class="wkx">${WEEKS.map(w => `
        <a class="wkx-card rv" href="#/week/${w.id}">
          <div class="wkx-art">${w.games.slice(0, 3).map(p => `<span class="${p.d.cover ? 'has-cover' : ''}" style="${calm(p.d)}">${p.d.cover ? `<img src="${esc(p.d.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span>`).join('')}</div>
          <div class="wkx-meta"><span class="wkp-n">Issue #${w.no}</span><h3>Week of ${esc(weekName(w.id))}</h3><p>${esc(w.intro)}</p></div>
        </a>`).join('') || '<div class="empty">The first issue is on its way.</div>'}</div></div>`;
  }

  const STANDARDS = [['Made mostly with AI', 'The creator says in public that AI wrote most of the code, and we link to where they said it.'],
    ['Free to play in a browser', 'No download, no sign-in and no payment to start playing.'],
    ['An original game', "No clones of other people's games, characters or names. Inspired by is fine; copies are not."],
    ['A real game', 'Something you can play and win, lose or score in, not a tech demo, a tool or a screensaver.'],
    ['Not a content farm', "We list a creator's best work, not hundreds of near-identical games."],
    ['Credited and respected', "We link to the creator's own page and show the image they publish. Nothing is copied or hosted here, and creators can claim or remove a listing at any time."]];
  function standardsPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Quality standards</span>
        <h1>What makes the cut</h1>
        <p>Playbook is picky on purpose. Every game here passes the same bar, and every weekly pick is chosen by a person.</p>
      </div></section>
      <div class="wrap">
        <ol class="std">${STANDARDS.map(([t, p], i) => `<li class="std-item rv"><span class="wkp-n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>
        <section class="std-picks rv"><h2>How weekly picks are chosen</h2><p>Each week a person picks five games that stand out for how they look, how they feel to play, or what they try. Every pick says why.</p>
          <div class="acts"><button class="btn btn-accent" data-submit-game>Submit a game</button><a class="btn" href="#/weeks">Read the picks</a></div></section>
      </div>`;
  }

  function savedPage() {
    const saved = DISC.filter(d => FAVS.has(d.url)), rec = recentGames();
    const picks = (WEEKS[0]?.games || []).map(p => p.d);
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Library</span>
        <h1>Your library</h1>
        <p>Games you played and saved, kept in this browser. No account needed.</p>
        <div class="lib-stats"><span><b>${rec.length}</b> played</span><span><b>${saved.length}</b> saved</span></div>
      </div></section>
      <div class="wrap">
        ${rec.length ? `<section class="section tight"><div class="sec-head"><div><h2>Recently played</h2></div><button class="link" id="libClear">Clear history</button></div><div class="wall">${rec.map(gcard).join('')}</div></section>` : ''}
        <section class="section tight"><div class="sec-head"><div><h2>Saved</h2></div></div>
          ${saved.length ? `<div class="wall">${saved.map(gcard).join('')}</div>` : `<div class="empty"><b>Nothing saved yet</b>Tap ♡ on any game to save it here.</div>`}</section>
        ${!rec.length && !saved.length && picks.length ? `<section class="section tight"><div class="sec-head"><div><h2>Start with this week's picks</h2></div><a class="link" href="#/play">Play all games</a></div><div class="wall">${picks.map(gcard).join('')}</div></section>` : ''}
      </div>`;
    $('#libClear')?.addEventListener('click', () => { RECENT.length = 0; try { localStorage.removeItem(REC_KEY); } catch {} savedPage(); hydrate(); });
  }

  function guidesPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Guides</span>
        <h1>Where to start</h1>
        <p>Short lists of the vibe-coded games worth your time, picked by theme and kept up to date as new games arrive.</p>
      </div></section>
      <div class="wrap"><div class="wkx">${GUIDES.map(g => `
        <a class="wkx-card rv" href="#/guide/${g.slug}">
          <div class="wkx-art">${g.games.filter(d => d.cover).slice(0, 3).map(d => `<span class="has-cover" style="${calm(d)}"><img src="${esc(d.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>`).join('')}</div>
          <div class="wkx-meta"><span class="wkp-n">${g.games.length} games</span><h3>${esc(g.title)}</h3><p>${esc(g.intro)}</p></div>
        </a>`).join('')}</div></div>`;
  }

  function guidePage(slug) {
    const g = GUIDES.find(x => x.slug === slug); if (!g) return notFound();
    app.innerHTML = `
      <section class="wkp wrap">
        <div class="crumbs"><a href="#/guides">Guides</a><span>/</span><span>${esc(g.title)}</span></div>
        <div class="wkp-head">
          <span class="tag"><span class="dot"></span>Guide · ${g.games.length} games</span>
          <h1>${esc(g.title)}</h1>
          <p>${esc(g.intro)}</p>
          <div class="acts"><button class="btn btn-accent" data-copy="${esc(`${LIVE}s/guides/${g.slug}/`)}">Copy link</button><a class="btn" href="#/guides">All guides</a></div>
        </div>
        <ol class="wkp-list">${g.games.map((d, i) => `
          <li class="wkp-item rv">
            <a class="wkp-media" href="${gLink(d)}" aria-label="${esc(d.title)}: details and play">
              <div class="media ${d.cover ? 'has-cover' : ''}" ${d.cover && d.embeddable && canHover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}"><div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div></div>
            </a>
            <div class="wkp-text">
              <span class="wkp-n">${String(i + 1).padStart(2, '0')}</span>
              <h2><a href="${gLink(d)}">${esc(d.title)}</a></h2>
              ${d.creator ? `<a class="wkp-by" href="${crLink(d.creator)}">${crAva(d.creator)}<span>${esc(d.creator)}</span></a>` : ''}
              <p>${esc(d.note || '')}</p>
              <div class="wkp-acts"><a class="btn btn-accent" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Play on ${esc(host(d.url))} ↗</a><a class="link" href="${gLink(d)}">Details</a>${favBtn(d)}</div>
            </div>
          </li>`).join('')}</ol>
      </section>`;
  }

  function discoverPage(arg = '') {
    const count = k => DISC.reduce((m, d) => (d[k] && (m[d[k]] = (m[d[k]] || 0) + 1), m), {});
    const genres = Object.entries(count('genre')).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const plats = Object.keys(PLATFORMS).filter(p => count('platform')[p]);
    const live = DISC.filter(d => d.embeddable).length;
    const g0 = genres.includes(arg) ? arg : 'All';
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Updated every week</span>
        <h1>Play the best <em>vibe-coded</em> games</h1>
        <p>${DISC.length} games people made with AI and shared in public, from X, game jams, itch and Hacker News. Every card opens the creator's own page and credits the post where we found it. Nothing is copied or rehosted.</p>
        <div class="acts"><button class="btn btn-accent" data-submit-game>Submit a game</button><a class="btn" href="#/creators">Meet the creators</a><a class="btn" href="#/saved">Saved (${FAVS.size})</a><a class="btn" href="#/guides">Guides</a></div>
      </div></section>
      <div class="wrap">
        ${g0 === 'All' ? `<section class="rand"><div class="sec-head"><div><h2>Three at random</h2><p>Not sure what to play? Let the arcade pick.</p></div><button class="btn" id="randBtn">Shuffle ↻</button></div><div class="wall three" id="rand3"></div></section>
        <div class="gtiles small">${genreTiles(12)}</div>` : ''}
        <div class="controls">
          <div class="pills" id="dGenres"><button class="pill ${g0 === 'All' ? 'on' : ''}" data-v="All">All</button><button class="pill" id="d3d" aria-pressed="false">3D only</button><button class="pill" id="dtouch" aria-pressed="false">Touch-friendly</button>${genres.map(g => `<button class="pill ${g === g0 ? 'on' : ''}" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>
          <div class="seg" id="dSort"><button data-v="new" class="on">Newest</button><button data-v="az">A–Z</button></div>
        </div>
        <div class="controls">
          <div class="pills" id="dPlats"><span class="plabel">Found on</span><button class="pill on" data-v="All">Anywhere</button>${plats.map(p => `<button class="pill" data-v="${p}">${PLATFORMS[p]}</button>`).join('')}</div>
          <span class="dcount"><span id="discCount"></span>${canHover ? ` · ${live} preview on hover` : ''}</span>
        </div>
        <div class="wall" id="discGrid"></div>
        <p class="note dfoot">Listings are links to third-party pages that their creators made public. Titles and credits are shown as given at the source; each link was last checked on the date in our index. Creators can claim or remove a listing from its card at any time.${LOCAL ? ' <a href="#/review" class="dclaim">Review queue</a>' : ''}</p>
      </div>`;
    Object.assign(dstate, { genre: g0, platform: 'All', d3: false, touch: false, sort: 'new' });
    const pick = (id, key) => $(id).addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      dstate[key] = b.dataset.v; $$(id + ' [data-v]').forEach(x => x.classList.toggle('on', x === b)); drawDiscover();
    });
    pick('#dGenres', 'genre'); pick('#dPlats', 'platform'); pick('#dSort', 'sort');
    $('#d3d').addEventListener('click', e => { dstate.d3 = !dstate.d3; e.currentTarget.classList.toggle('on', dstate.d3); e.currentTarget.setAttribute('aria-pressed', dstate.d3); drawDiscover(); });
    $('#dtouch').addEventListener('click', e => { dstate.touch = !dstate.touch; e.currentTarget.classList.toggle('on', dstate.touch); e.currentTarget.setAttribute('aria-pressed', dstate.touch); drawDiscover(); });
    const rand = () => {
      const pool = DISC.filter(d => d.cover), pickN = [];
      while (pickN.length < 3 && pool.length) pickN.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      const box = $('#rand3'); if (!box) return;
      box.innerHTML = pickN.map(gcard).join(''); hydrate(box);
    };
    if ($('#randBtn')) { $('#randBtn').addEventListener('click', rand); rand(); }
    drawDiscover();
  }
  const freshRow = () => DISC.length ? `
        <section class="section tight fresh">
          <div class="sec-head"><div><span class="tag"><span class="dot"></span>Updated weekly</span><h2>Ideas from around the web</h2><p>The newest AI-made games people shared on X, Hacker News, itch and in jams. Play them for inspiration; each card opens the creator's own page, and the code stays theirs.</p></div><a class="link" href="#/play">All ${DISC.length} games →</a></div>
          <div class="wall" id="freshGrid">${[...DISC].sort(byNew).slice(0, 4).map(dcard).join('')}</div>
        </section>` : '';

  function submitGameModal() {
    openModal(`
      <span class="tag"><span class="dot"></span>Discover</span>
      <h2>Submit a game.</h2>
      <p class="lead">Yours or one you found. We check that it loads and that the creator shared it publicly, then list it with a link and credit.</p>
      <form id="sgForm">
        <div class="field"><label for="sgUrl">Playable link</label><input id="sgUrl" type="url" required placeholder="https://"></div>
        <div class="two">
          <div class="field"><label for="sgBy">Creator handle</label><input id="sgBy" maxlength="60" placeholder="@handle"></div>
          <div class="field"><label for="sgSrc">Where it was shared</label><input id="sgSrc" type="url" placeholder="Link to the post"></div>
        </div>
        <button class="btn btn-accent btn-block" type="submit">Continue on GitHub</button>
        ${CONTACT_EMAIL ? '<button class="btn btn-block" type="button" id="sgMail" style="margin-top:8px">Send by email instead</button>' : ''}
      </form>
      <p class="note">This opens a pre-filled public issue on our GitHub repo (a free GitHub account is needed). We check every link by hand before listing it.</p>`);
    const sgBody = () => `Playable link: ${$('#sgUrl').value}\nCreator: ${$('#sgBy').value || '(unknown)'}\nShared at: ${$('#sgSrc').value || '(unknown)'}\n\nWhy it is worth listing:\n`;
    $('#sgForm').addEventListener('submit', e => { e.preventDefault(); window.open(issueUrl(`Submit: ${$('#sgUrl').value}`, sgBody(), 'submission'), '_blank', 'noopener'); closeModal(); toast('Opened GitHub in a new tab'); });
    $('#sgMail')?.addEventListener('click', () => { if (!$('#sgForm').reportValidity()) return; location.href = mailUrl('Playbook: game submission', sgBody()); closeModal(); });
  }
  function claimModal(i) {
    const d = DISC[i]; if (!d) return;
    openModal(`
      <span class="tag">${esc(d.title)}</span>
      <h2>Is this yours?</h2>
      <p class="lead">Claim the listing to edit its details, or ask us to take it down. Removal requests from the creator are honoured without questions.</p>
      <form id="clForm">
        <div class="field"><label for="clWhat">I want to</label><select id="clWhat"><option>Claim this listing</option><option>Remove this listing</option><option>Fix the credit or details</option></select></div>
        <div class="field"><label for="clProof">Your public handle or a link that shows it is yours</label><input id="clProof" required maxlength="120" placeholder="@handle or https://"></div>
        <button class="btn btn-accent btn-block" type="submit">Continue on GitHub</button>
        ${CONTACT_EMAIL ? '<button class="btn btn-block" type="button" id="clMail" style="margin-top:8px">Send by email instead</button>' : ''}
      </form>
      <p class="note">This opens a pre-filled issue on our GitHub repo. Removal requests from the creator are acted on as soon as we see them. Listed link: ${esc(host(d.url))}</p>
      <p class="note">No GitHub account? If we told you about this listing, just reply to that message and we'll take care of it.</p>`);
    const clBody = () => `Listing: ${d.title}\nURL: ${d.url}\nRequest: ${$('#clWhat').value}\nProof it is mine: ${$('#clProof').value}\n\nDetails:\n`;
    $('#clForm').addEventListener('submit', e => { e.preventDefault(); const w = $('#clWhat').value; window.open(issueUrl(`${w.split(' ')[0]}: ${d.title}`, clBody(), /Remove/.test(w) ? 'removal' : 'claim'), '_blank', 'noopener'); closeModal(); toast('Opened GitHub in a new tab'); });
    $('#clMail')?.addEventListener('click', () => { if (!$('#clForm').reportValidity()) return; location.href = mailUrl(`Playbook: ${$('#clWhat').value} — ${d.title}`, clBody()); closeModal(); });
  }


  // ---------- review queue (internal): candidates found by tools/collect.py ----------
  const RQ_KEY = 'pb-review-v1';
  const rqLoad = () => { try { return JSON.parse(localStorage.getItem(RQ_KEY) || '{}'); } catch { return {}; } };
  const rqSave = () => { try { localStorage.setItem(RQ_KEY, JSON.stringify(rq.dec)); } catch {} };
  const RQ_GENRES = ['', 'Action', 'Adventure', 'Arcade', 'Flight', 'Platformer', 'Puzzle', 'Racing', 'RPG', 'Roguelike', 'Shooter', 'Sim', 'Sports', 'Strategy'];
  const RQ_REASONS = ['Not a game', 'Not clearly AI-made', "Someone else's IP", 'Too thin or unfinished', 'Needs login or payment', 'Unsafe or spammy', 'Duplicate'];
  const RQ_EDIT = ['title', 'creator', 'genre', 'engine', 'model', 'note'];
  const rq = { tab: 'todo', items: [], dec: {}, generated: '', since: '' };
  const rqLoadQueue = () => new Promise(res => {
    delete window.PB_CANDIDATES;
    const s = document.createElement('script');
    s.src = 'candidates.js?t=' + Date.now();
    s.onload = () => { s.remove(); res(window.PB_CANDIDATES || null); };
    s.onerror = () => { s.remove(); res(null); };
    document.head.appendChild(s);
  });
  const rqStrength = n => n >= 2 ? ['Names a model or tool', 'ok'] : n >= 1 ? ['Says it is AI-made', 'mid'] : ['Feed tag only', 'low'];
  const rqWall = c => [403, 429, 503].includes(c.check.status);
  const rqEntry = c => ({ ...Object.fromEntries(['title', 'url', 'creator', 'source', 'platform', 'engine', 'model', 'genre', 'is3d', 'date'].map(k => [k, c[k]])), note: '', ...(rq.dec[c.id]?.entry || {}) });
  const rqState = c => rq.dec[c.id]?.action || '';

  const rqRow = c => {
    const d = rq.dec[c.id] || {}, e = rqEntry(c), [sl, sc] = rqStrength(c.strength), st = c.check.status;
    return `
    <article class="rq ${d.action ? 'is-' + d.action : ''}" data-id="${esc(c.id)}">
      <div class="rq-score" title="Evidence × 10 + recency + engagement + game signals"><b>${Math.round(c.score)}</b><span>score</span></div>
      <div class="rq-main">
        <div class="rq-head">
          <input class="rq-title" data-f="title" value="${esc(e.title)}" maxlength="80" aria-label="Title">
          <div class="rq-links">
            <a class="btn btn-sm" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Open game ↗</a>
            <a class="btn btn-sm" href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a>
          </div>
        </div>
        <div class="rq-sub">${esc(host(c.url))} · ${esc(c.signal)} · ${c.date ? 'shared ' + esc(c.date) : 'no date'} · found ${esc(c.found)}</div>
        ${c.subtitle && c.subtitle !== c.title ? `<p class="rq-desc">${esc(c.subtitle)}</p>` : ''}
        <blockquote class="rq-ev ${sc}"><span>${sl}</span>${esc(c.evidence || 'No AI statement found in the text.')}</blockquote>
        <div class="rq-checks">
          <span class="chip ${st === 200 ? 'okc' : 'warn'}">HTTP ${st || esc(c.check.error || 'error')}${rqWall(c) ? ' · bot wall?' : ''}</span>
          <span class="chip">${c.check.embeddable ? 'Embeddable' : 'No embed'}</span>
          ${c.check.engine_hint ? `<span class="chip">${ic.code}${esc(c.check.engine_hint)}</span>` : ''}
          ${c.check.has_canvas ? '<span class="chip">canvas</span>' : ''}
          ${c.check.noindex ? '<span class="chip warn" title="The page asks search engines not to index it. Often a hosting default; check the creator shared it publicly.">noindex</span>' : ''}
          ${c.check.page_title ? `<span class="rq-pt">Page title: “${esc(c.check.page_title)}”</span>` : ''}
        </div>
        <div class="rq-fields">
          <div class="field"><label>Creator</label><input data-f="creator" value="${esc(e.creator)}" maxlength="60"></div>
          <div class="field"><label>Genre</label><select data-f="genre">${RQ_GENRES.map(g => `<option value="${g}" ${g === e.genre ? 'selected' : ''}>${g || '—'}</option>`).join('')}</select></div>
          <div class="field"><label>Engine</label><input data-f="engine" value="${esc(e.engine)}" maxlength="30"></div>
          <div class="field"><label>Model (as the source states)</label><input data-f="model" value="${esc(e.model)}" maxlength="60"></div>
          <label class="rq-check"><input type="checkbox" data-f="is3d" ${e.is3d ? 'checked' : ''}> 3D</label>
        </div>
        <div class="field rq-note"><label>One-line note in your own words (required to approve)</label><input data-f="note" value="${esc(e.note)}" maxlength="140" placeholder="Why is it worth a click?"></div>
        ${st !== 200 ? `<label class="rq-check"><input type="checkbox" data-f="browser_ok" ${d.browser_ok ? 'checked' : ''}> I opened it in a browser and it works</label>` : ''}
        <div class="rq-acts">
          ${d.action ? `<span class="rq-state">${d.action === 'approve' ? 'Approved' : 'Rejected · ' + esc(d.reason || '')}</span><button class="btn btn-sm" data-act="undo">Undo</button>`
            : `<button class="btn btn-accent btn-sm" data-act="approve">Approve</button>
               <select class="rq-reason" aria-label="Reason to reject">${RQ_REASONS.map(r => `<option>${esc(r)}</option>`).join('')}</select>
               <button class="btn btn-sm" data-act="reject">Reject</button>`}
        </div>
      </div>
    </article>`;
  };

  function rqDraw() {
    const list = $('#rqList'); if (!list) return;
    const n = { todo: 0, approve: 0, reject: 0 };
    rq.items.forEach(c => n[rqState(c) || 'todo']++);
    $$('#rqTabs [data-v]').forEach(b => { b.classList.toggle('on', b.dataset.v === rq.tab); $('i', b).textContent = n[b.dataset.v]; });
    const shown = rq.items.filter(c => (rqState(c) || 'todo') === rq.tab);
    list.innerHTML = shown.length ? shown.map(rqRow).join('')
      : `<div class="empty">${rq.tab === 'todo' ? (rq.items.length ? 'All caught up. Export your decisions below.' : 'The queue is empty. Run the collector to fill it.') : 'Nothing here yet.'}</div>`;
    const decided = n.approve + n.reject;
    $('#rqExport').disabled = !decided;
    $('#rqExport').textContent = decided ? `Export ${decided} decision${decided > 1 ? 's' : ''}` : 'Export decisions';
  }
  function rqRead(row) {
    const c = rq.items.find(x => x.id === row.dataset.id), d = rq.dec[c.id] || (rq.dec[c.id] = {});
    d.entry = { ...(d.entry || {}) };
    $$('[data-f]', row).forEach(i => {
      if (i.dataset.f === 'browser_ok') d.browser_ok = i.checked;
      else d.entry[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value.trim();
    });
    return { c, d };
  }
  function rqExport() {
    const decisions = rq.items.filter(rqState).map(c => {
      const d = rq.dec[c.id];
      return { id: c.id, action: d.action, reason: d.reason || '', browser_ok: !!d.browser_ok, entry: rqEntry(c) };
    });
    const now = new Date(), pad = n => String(n).padStart(2, '0');
    const name = `decisions-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), queue: rq.generated, decisions }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    const cmd = `python3 tools/apply.py ~/Downloads/${name}`;
    $('#rqCmd').innerHTML = `<span>Then run</span><code>${esc(cmd)}</code><button class="copy" data-copy="${esc(cmd)}">Copy</button>`;
    toast(`Saved ${name}`);
  }

  async function reviewPage() {
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Internal · Discover</span>
        <h1>Review <em>queue</em></h1>
        <p id="rqMeta">Loading candidates…</p>
      </div></section>
      <div class="wrap rq-wrap">
        <div class="controls">
          <div class="seg" id="rqTabs"><button data-v="todo" class="on">To review <i></i></button><button data-v="approve">Approved <i></i></button><button data-v="reject">Rejected <i></i></button></div>
          <a class="btn btn-sm" href="#/play">Back to Discover</a>
        </div>
        <div id="rqList"></div>
        <div class="rq-bar"><button class="btn btn-accent" id="rqExport" disabled>Export decisions</button><div id="rqCmd" class="rq-cmd"><span>Decisions are kept in this browser until you export them.</span></div></div>
      </div>`;
    const data = await rqLoadQueue();
    if (!$('#rqList')) return; // navigated away while loading
    rq.items = (data?.items || []).slice().sort((a, b) => b.score - a.score);
    rq.generated = data?.generated || ''; rq.tab = 'todo';
    const ids = new Set(rq.items.map(c => c.id));
    rq.dec = Object.fromEntries(Object.entries(rqLoad()).filter(([k]) => ids.has(k)));
    rqSave();
    $('#rqMeta').innerHTML = data
      ? `${rq.items.length} candidates collected ${esc((rq.generated || '').slice(0, 10))} (posts since ${esc(data.since || '?')}). Open each game, check the source says it is AI-made, write a one-line note, then approve or reject.`
      : 'No queue found. Run <code>python3 tools/collect.py</code> first.';
    $('#rqTabs').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; rq.tab = b.dataset.v; rqDraw(); window.scrollTo({ top: $('#rqTabs').offsetTop - 80 }); });
    const list = $('#rqList');
    list.addEventListener('input', e => { const row = e.target.closest('.rq'); if (row && e.target.dataset.f) { rqRead(row); rqSave(); } });
    list.addEventListener('change', e => { const row = e.target.closest('.rq'); if (row && e.target.dataset.f) { rqRead(row); rqSave(); } });
    list.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const row = b.closest('.rq'), { c, d } = rqRead(row);
      if (b.dataset.act === 'approve') {
        if (!d.entry.note) { toast('Write a one-line note first'); $('[data-f=note]', row).focus(); return; }
        if (c.check.status !== 200 && !d.browser_ok) { toast('Open it in a browser and tick the check first'); return; }
        d.action = 'approve';
      } else if (b.dataset.act === 'reject') { d.action = 'reject'; d.reason = $('.rq-reason', row).value; }
      else { delete d.action; delete d.reason; }
      rqSave(); rqDraw();
    });
    $('#rqExport').addEventListener('click', rqExport);
    rqDraw();
  }

  // ---------- modals ----------
  const modal = $('#modal'), modalBody = $('#modalBody');
  const openModal = html => { modalBody.innerHTML = `<button class="icon-btn x" data-close aria-label="Close">${icon.close}</button>` + html; I18N?.apply(modalBody); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };

  function mcpModal() {
    const tabs = {
      'Claude Code': CLIENTS['Claude Code'].cmd,
      'Cursor': CLIENTS['Cursor'].cmd,
      'Codex': CLIENTS['Codex'].cmd,
    };
    openModal(`
      <span class="tag"><span class="dot"></span>Playbook MCP</span>
      <h2>Bring the wall into your agent.</h2>
      <p class="lead">Search games and mechanics and pull a recipe, without leaving your editor.</p>
      <div class="tabs" id="mtabs">${Object.keys(tabs).map((t, i) => `<button class="${i ? '' : 'on'}" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="prompt" id="mcode">${esc(tabs['Claude Code'])}</div>
      <div class="prompt-row"><button class="copy" id="mcopy" data-copy="${esc(tabs['Claude Code'])}">Copy</button></div>
      <div class="rsec" style="margin-top:16px"><label>Then just ask</label>
        <div class="mchips"><span class="mchip">“Remake Neon Drift but underwater”</span><span class="mchip">“Add hit-stop to my game”</span><span class="mchip">“Find racing games for ideas”</span></div></div>
      <p class="note">Free and open source. Needs Node 18+. <a class="link" href="${MCP_REPO}" target="_blank" rel="noopener">Source on GitHub</a></p>`);
    $('#mtabs').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; $$('#mtabs button').forEach(x => x.classList.toggle('on', x === b)); $('#mcode').textContent = tabs[b.dataset.t]; $('#mcopy').dataset.copy = tabs[b.dataset.t]; };
  }

  function remakeModal(id) {
    const g = byId[id];
    openModal(`
      <span class="tag">Remake · ${esc(g.title)}</span>
      <h2>Make it yours.</h2>
      <p class="lead">Keep the mechanics and feel. Change what it looks like and who it is about.</p>
      <div class="field"><label>New theme</label><input id="rTheme" value="underwater reef at night" maxlength="80"></div>
      <div class="two">
        <div class="field"><label>Player is</label><input id="rHero" value="a tiny submarine" maxlength="60"></div>
        <div class="field"><label>Difficulty</label><select id="rDiff"><option>Chill</option><option selected>Same as original</option><option>Brutal</option></select></div>
      </div>
      <div class="tabs" id="rtabs"><button class="on" data-t="prompt">With Playbook MCP</button><button data-t="plain">Without MCP</button></div>
      <div class="prompt" id="rOut"></div>
      <div class="prompt-row"><button class="copy" id="rCopy">Copy</button></div>
      <p class="note">Paste into Claude Code, Cursor or Codex. The MCP version also pulls the source and mechanic code: <a class="link" href="#/mcp">install it</a>.</p>`);
    let tab = 'prompt';
    const draw = () => {
      const th = $('#rTheme').value.trim() || g.style, he = $('#rHero').value.trim() || 'the same hero', d = $('#rDiff').value;
      const out = tab === 'prompt'
        ? `Use the playbook MCP: get_recipe "${g.id}" with include_source.\nRemake it as a single HTML file with this theme: ${th}.\nThe player is ${he}. Difficulty: ${d.toLowerCase()}.\nKeep these mechanics and their timings: ${g.mechanics.join(', ')}.\nCredit it as a remix of ${g.title} from Playbook.`
        : `${g.prompt}\n\nTheme: ${th}. The player is ${he}. Difficulty: ${d.toLowerCase()}.\nInclude: ${g.mechanics.map(s => mechBySlug[s]?.name || s).join(', ')}.\nSound: ${g.audio}`;
      $('#rOut').textContent = out; $('#rCopy').dataset.copy = out;
    };
    draw();
    ['rTheme', 'rHero', 'rDiff'].forEach(i => $('#' + i).addEventListener('input', draw));
    $('#rtabs').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; $$('#rtabs button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  }

  // ---------- search palette (⌘K or /) ----------
  const cmdk = $('#cmdk'), cmdkIn = $('#cmdkInput'), cmdkList = $('#cmdkList');
  const PAGES = [['Weekly picks', '#/weeks'], ['Quality standards', '#/standards'], ['Guides', '#/guides'], ['Library', '#/library'], ['Play all games', '#/play'], ['Creators', '#/creators'], ['Make: start here', '#/make'], ['Game feel (mechanics)', '#/mechanics'], ['Open recipes', '#/games'], ['Connect Playbook MCP', '#/mcp'], ['Playbook Jam', '#/jam']];
  let cmdkItems = [], cmdkSel = 0;
  const lc = s => String(s || '').toLowerCase();
  function searchAll(q) {
    const words = lc(q).trim().split(/\s+/).filter(Boolean), any = words.length > 0;
    const hit = hay => words.every(w => hay.includes(w));
    const G = games.filter(g => any ? hit(lc([g.title, g.by, g.genres.join(' '), g.is3d ? '3d three.js' : '2d canvas', g.style, g.parent ? 'remix' : 'original'].join(' '))) : !g.parent)
      .slice(0, any ? 6 : 3).map(g => ({ group: 'Playbook recipes', title: g.title, sub: `${g.by} · ${g.genres.join(' · ')}`, href: `#/game/${g.id}`, c1: g.colors[0], c2: g.colors[1], go: 'Play' }));
    const D = (any ? DISC.filter(d => hit(lc([d.title, d.creator, d.genre, d.engine, d.model, PLATFORMS[d.platform], d.is3d ? '3d' : '', host(d.url), d.note].join(' ')))) : [...DISC].sort(byNew))
      .slice(0, any ? 8 : 6).map(d => { const h = hashHue(d.title + d.url); return { group: any ? 'From the web' : 'Fresh from the web', title: d.title, sub: [d.creator || host(d.url), d.genre, d.model].filter(Boolean).join(' · '), href: gLink(d), c1: `hsl(${h} 78% 54%)`, c2: `hsl(${(h + 80) % 360} 72% 40%)`, go: 'Open' }; });
    const M = any ? mechanics.filter(m => hit(lc([m.name, m.cat, m.desc].join(' ')))).slice(0, 4).map(m => ({ group: 'Mechanics', title: m.name, sub: m.cat, href: `#/mechanic/${m.slug}`, c1: '#4a4337', c2: '#17150f', go: 'Open' })) : [];
    const C = any ? CREATORS.filter(c => hit(lc(c.handle + ' ' + c.games.map(g => g.title).join(' ')))).slice(0, 4).map(c => { const h = hashHue(c.handle); return { group: 'Creators', title: c.handle, sub: `${c.games.length} game${c.games.length > 1 ? 's' : ''} · ${c.games[0].title}`, href: crLink(c.handle), c1: `hsl(${h} 40% 46%)`, c2: `hsl(${(h + 40) % 360} 30% 24%)`, go: 'Profile' }; }) : [];
    const P = PAGES.filter(p => !any || hit(lc(p[0]))).map(p => ({ group: 'Pages', title: I18N ? I18N.tr(p[0]) : p[0], sub: '', href: p[1], go: 'Go' }));
    return any ? [...D, ...C, ...G, ...M, ...P] : [...D, ...G, ...P];
  }
  function drawSearch() {
    cmdkItems = searchAll(cmdkIn.value);
    cmdkSel = Math.min(cmdkSel, Math.max(0, cmdkItems.length - 1));
    let last = '';
    cmdkList.innerHTML = cmdkItems.length ? cmdkItems.map((it, i) => {
      const head = it.group !== last ? `<div class="cmdk-group">${esc(it.group)}</div>` : ''; last = it.group;
      return head + `<div class="cmdk-item ${i === cmdkSel ? 'sel' : ''}" role="option" aria-selected="${i === cmdkSel}" data-i="${i}">
        ${it.c1 ? `<i class="sw2" style="--c1:${it.c1};--c2:${it.c2}"></i>` : ''}<div><b>${esc(it.title)}</b>${it.sub ? `<span>${esc(it.sub)}</span>` : ''}</div><span class="go">${esc(it.go)}</span></div>`;
    }).join('') : `<div class="cmdk-empty">No games match “${esc(cmdkIn.value)}”. Try a genre like racing or puzzle.</div>`;
    I18N?.apply(cmdkList);
    $('.cmdk-item.sel', cmdkList)?.scrollIntoView({ block: 'nearest' });
  }
  function openSearch(q = '') {
    cmdk.classList.add('open'); cmdk.setAttribute('aria-hidden', 'false');
    cmdkIn.value = q; cmdkSel = 0; drawSearch(); setTimeout(() => cmdkIn.focus(), 30);
  }
  const closeSearch = () => { cmdk.classList.remove('open'); cmdk.setAttribute('aria-hidden', 'true'); };
  const goItem = it => { if (!it) return; closeSearch(); if (it.ext) window.open(it.href, '_blank', 'noopener,noreferrer'); else location.hash = it.href; };
  cmdkIn.addEventListener('input', () => { cmdkSel = 0; drawSearch(); });
  cmdkIn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdkSel = Math.min(cmdkSel + 1, cmdkItems.length - 1); drawSearch(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkSel = Math.max(cmdkSel - 1, 0); drawSearch(); }
    else if (e.key === 'Enter') { e.preventDefault(); goItem(cmdkItems[cmdkSel]); }
  });
  cmdkList.addEventListener('click', e => { const el = e.target.closest('[data-i]'); if (el) goItem(cmdkItems[+el.dataset.i]); });
  cmdkList.addEventListener('mousemove', e => { const el = e.target.closest('[data-i]'); if (el && +el.dataset.i !== cmdkSel) { cmdkSel = +el.dataset.i; $$('.cmdk-item', cmdkList).forEach(x => x.classList.toggle('sel', x === el)); } });
  $('[data-cmdk-close]').addEventListener('click', closeSearch);

  // ---------- global events ----------
  const toastEl = $('#toast'); let toastT;
  function toast(msg) { toastEl.textContent = I18N ? I18N.tr(msg) : msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1800); }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
    toast('Copied');
    if (btn?.classList.contains('copy')) { const old = btn.textContent; btn.textContent = I18N ? I18N.tr('Copied') : 'Copied'; btn.classList.add('done'); setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1400); }
  }
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = on => { menu.classList.toggle('open', on); burger.setAttribute('aria-expanded', on); menu.setAttribute('aria-hidden', !on); };
  burger.onclick = () => setMenu(!menu.classList.contains('open'));

  document.addEventListener('click', e => {
    const fv = e.target.closest('[data-fav]');
    if (fv) {
      e.preventDefault(); e.stopPropagation();
      const u = fv.dataset.fav, on = !FAVS.has(u);
      on ? FAVS.add(u) : FAVS.delete(u); saveFavs();
      $$(`[data-fav="${CSS.escape(u)}"]`).forEach(b => {
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
        if (b.classList.contains('fav')) b.setAttribute('aria-label', I18N ? I18N.tr(on ? 'Saved' : 'Save') : (on ? 'Saved' : 'Save'));
        const t = $('span', b); if (t && b.classList.contains('savebtn')) t.textContent = I18N ? I18N.tr(on ? 'Saved' : 'Save') : (on ? 'Saved' : 'Save');
      });
      toast(on ? 'Saved' : 'Removed from saved');
      track(`${on ? 'save' : 'unsave'}/${u.replace(/^https?:\/\//, '')}`, '', true);
      if (/^#\/(saved|library)$/.test(location.hash) && !on) savedPage();
      return;
    }
    const out = e.target.closest('a[href^="http"]');
    if (out && G_URL.has(out.getAttribute('href'))) played(out.getAttribute('href'));
    if (out && out.hostname !== location.hostname) track(`out/${out.hostname}${out.pathname}`.replace(/\/$/, ''), out.textContent.trim().slice(0, 80) || out.hostname, true);
    const c = e.target.closest('[data-copy]'); if (c) { e.preventDefault(); return copy(c.dataset.copy, c); }
    if (e.target.closest('[data-open-mcp]')) { e.preventDefault(); setMenu(false); return mcpModal(); }
    const r = e.target.closest('[data-remake]'); if (r) return remakeModal(r.dataset.remake);
    if (e.target.closest('[data-submit-game]')) { e.preventDefault(); return submitGameModal(); }
    if (e.target.closest('[data-search]')) { e.preventDefault(); setMenu(false); return openSearch(); }
    const q = e.target.closest('[data-q]'); if (q) { e.preventDefault(); return openSearch(q.dataset.q); }
    const cl = e.target.closest('[data-claim]'); if (cl) return claimModal(+cl.dataset.claim);
    const cc = e.target.closest('[data-claim-creator]'); if (cc) return claimCreatorModal(cc.dataset.claimCreator);
    if (e.target.closest('[data-lang]')) { try { localStorage.setItem('pb-lang', ZH ? 'en' : 'zh'); } catch {} return location.reload(); }
    if (e.target.closest('[data-top]')) return window.scrollTo({ top: 0, behavior: CALM ? 'auto' : 'smooth' });
    if (e.target.closest('[data-close]')) return closeModal();
    if (e.target.closest('.menu a')) setMenu(false);
    
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); setMenu(false); closeSearch(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openSearch(); }
  });

  // ---------- router ----------
  function route() {
    const [, page = '', arg = ''] = location.hash.replace(/^#/, '').split('/');
    $$('.media', app).forEach(m => { liveIO.unobserve(m); autoIO.unobserve(m); });
    stopPreview(); closeSearch();
    closeModal();
    const nav = { '': 'home', library: 'library', standards: 'play', play: 'play', g: 'play', week: 'play', weeks: 'play', saved: 'library', guides: 'play', guide: 'play', discover: 'play', review: 'play', make: 'make', game: 'make', games: 'make', mechanics: 'make', mechanic: 'make', publish: 'make', mcp: 'make', creators: 'creators', c: 'creators', jam: 'jam' }[page];
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
    const tab = { home: 'home', play: 'play', make: 'make', creators: 'creators', library: 'library' }[nav];
    $$('[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    const a = decodeURIComponent(arg);
    if (page === 'charts') { location.replace('#/play'); return; }
    if (page === 'creator') { location.replace('#/creators'); return; }
    ({ '': home, library: savedPage, standards: standardsPage, saved: savedPage, guides: guidesPage, guide: () => guidePage(a), week: () => weekPage(a), weeks: weeksPage, g: () => discGamePage(a), play: () => discoverPage(a), discover: () => discoverPage(a), make: makePage, creators: creatorsPage, c: () => creatorProfile(a), games: () => gamesPage(a), mcp: mcpPage, jam: jamPage, game: () => gamePage(a), mechanics: mechanicsPage, mechanic: () => mechanicPage(a), publish: publishPage, review: LOCAL ? reviewPage : notFound }[page] || notFound)();
    window.scrollTo(0, 0);
    hydrate();
    const sub = location.hash.split('/')[3];
    if (sub === 'kit') requestAnimationFrame(() => $('.kit')?.scrollIntoView({ block: 'start' }));
    if (sub === 'claim') { if (page === 'g' && G_BY[a]) claimModal(G_BY[a]._i); if (page === 'c' && crBySlug[a]) claimCreatorModal(a); }
    const ttl = page === 'game' && byId[a] ? byId[a].title : page === 'mechanic' && mechBySlug[a] ? mechBySlug[a].name : page === 'c' && crBySlug[a] ? crBySlug[a].handle : page === 'g' && G_BY[a] ? G_BY[a].title : page === 'week' && WEEKS.find(w => w.id === a) ? `Week of ${weekName(a)}` : page === 'guide' && GUIDES.find(x => x.slug === a) ? GUIDES.find(x => x.slug === a).title
      : { library: 'Library', standards: 'Quality standards', saved: 'Library', guides: 'Guides', weeks: 'Weekly picks', play: 'Play', discover: 'Play', make: 'Make', creators: 'Creators', mechanics: 'Game feel', games: 'Recipes', mcp: 'Connect MCP', jam: 'Jam' }[page];
    document.title = ttl ? `${ttl} — Playbook` : 'Playbook — the home of vibe gaming';
    track('/' + (location.hash.replace(/^#\/?/, '') || ''), document.title);
    if (I18N) document.title = I18N.tr(document.title);
  }
  const navEl = $('#nav');
  const navSync = () => navEl.classList.toggle('over', !!document.querySelector('.hx') && scrollY < 40);
  window.addEventListener('scroll', navSync, { passive: true });
  window.addEventListener('hashchange', navSync);
  window.addEventListener('hashchange', route);
  I18N?.apply(document.body);
  $$('[data-lang]').forEach(b => { b.textContent = ZH ? 'EN' : '中文'; b.setAttribute('aria-label', ZH ? 'Switch to English' : '切换到中文'); });
  rollify(document.querySelector('#nav')); rollify(document.querySelector('.footer'));
  route();
  navSync();
})();
