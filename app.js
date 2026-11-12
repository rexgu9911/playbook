(() => {
  const { creators, games, mechanics, byId, mechBySlug } = window.PB;
  // Launch: show no invented numbers or personas. In-house games and mechanics are made by Playbook.
  creators.Playbook = { name: 'Playbook', bio: 'Open recipes for web games, made in-house.', hue: 18 };
  games.forEach(g => { g.by = 'Playbook'; g.plays = 0; g.remixes = 0; });
  mechanics.forEach(m => { m.by = 'Playbook'; m.installs = 0; });
  const REPO = 'https://github.com/rexgu9911/playbook';
  const CONTACT_EMAIL = '';   // set a public address to add an email option next to GitHub Issues
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
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
  const hydrate = (root = app) => {
    $$('.media[data-auto]', root).forEach(m => autoIO.observe(m));
    $$('.media[data-src]', root).forEach(m => liveIO.observe(m));
    $$('.rv:not(.in)', root).forEach(r => revIO.observe(r));
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
    <a class="contest rv" href="#/jam">
      <div><div class="money">Jam #1</div><p>Our first community game jam is coming. Make a game with AI, publish it as a link, get ranked by the community.</p></div>
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
    const list = bestOfWeb().filter(d => hstate.genre === 'All' || d.genre === hstate.genre).slice(0, 12);
    grid.innerHTML = list.length ? list.map(dcard).join('') : '<div class="empty"><b>Nothing here yet</b>Try another genre.</div>';
    hydrate(grid);
  }

  function home() {
    const week = [...DISC].sort(byNew);
    const covered = week.filter(d => d.cover);
    const feat = FEATURE.map(t => DISC.find(d => d.title === t && d.cover)).filter(Boolean);
    const hero = feat[0] || covered[0];
    const collage = [...feat.slice(1), ...covered.filter(d => !feat.includes(d))].slice(0, 6);
    const higgs = DISC.filter(d => /higgsfield/i.test(d.model) || /higgsfield\.app/.test(d.url));
    const higgsHero = higgs.find(d => d.cover) || higgs[0];
    const mech = mechBySlug['screen-shake'] || mechanics[0];
    const live = week.filter(d => !d.cover && d.embeddable);
    const jams = DISC.filter(d => d.platform === 'jam').sort((a, b) => (a.cover ? 0 : 1) - (b.cover ? 0 : 1) || byNew(a, b));
    const tiles = [
      ['#/discover', tabIc.web, 'Discover', `${DISC.length} games`, 'The best AI-made games on the web'],
      ['#/mechanics', tabIc.mech, 'Mechanics', `${mechanics.length} parts`, 'Hit-stop, shake, coyote time'],
      ['#/games', tabIc.recipes, 'Playbook recipes', `${games.filter(g => !g.parent).length} originals`, 'Open recipes you can remake'],
      ['#/discover', ic.up, 'Submit a game', 'Free', 'Found a great one? Send it in', 'data-submit-game'],
    ];
    app.innerHTML = `
      <div class="bnr" id="bnr">
        ${hero ? `<a class="bnr-card" href="${esc(hero.url)}" target="_blank" rel="noopener noreferrer">
          <div class="media has-cover feat" style="${calm(hero)}"><div class="poster"></div>${coverImg(hero)}<span class="bnr-tag"><span class="chip hot">Featured</span><span class="chip">${dIc.out}${esc(host(hero.url))}</span></span></div>
          <h3>${esc(hero.title)}</h3><p>by ${esc(hero.creator)} · ${esc(hero.note)}</p>
        </a>` : ''}
        <a class="bnr-card" href="#/discover">
          <div class="media collage"><div class="cl-grid">${collage.map(dposter).join('')}</div><span class="bnr-tag"><span class="chip hot">This week</span><span class="chip">${week.slice(0, 20).filter(d => /fable/i.test(d.model)).length} new Fable 5.2 games</span></span></div>
          <h3>Hot on X this week</h3><p>The AI-made games everyone is sharing, in one place.</p>
        </a>
        ${higgsHero ? `<a class="bnr-card" href="#/discover" data-q="Higgsfield">
          <div class="media ${higgsHero.cover ? 'has-cover' : ''} feat" style="${calm(higgsHero)}"><div class="poster"></div>${coverImg(higgsHero)}<span class="bnr-tag"><span class="chip">Made with Higgsfield</span></span></div>
          <h3>Higgsfield games</h3><p>${higgs.length} games Higgsfield built with Fable 5.2, playable in the browser.</p>
        </a>` : ''}
        <a class="bnr-card" href="#/mechanic/${mech.slug}">
          <div class="media plain" data-src="mechanics/${mech.slug}.html" style="--c1:#17171c;--c2:#0d0d10"><div class="poster"></div><div class="scan"></div><span class="bnr-tag"><span class="chip">Mechanics</span></span></div>
          <h3>Game feel, as installable parts</h3><p>${esc(mech.name)} and ${mechanics.length - 1} more. Poke the demo, install by name.</p>
        </a>
        <a class="bnr-card" href="#/jam">
          <div class="media jamart"><div class="ja-in"><small>Playbook</small><b>Jam #1</b><span>Coming soon. Get notified.</span></div><span class="bnr-tag"><span class="chip">Coming soon</span></span></div>
          <h3>Community game jam</h3><p>Build something, publish it as a link, get ranked by plays.</p>
        </a>
      </div>

      <div class="wrap">
        <section class="promo2">
          <div class="promo-big rv">
            <span class="sticker">Free &amp;<br>open source</span>
            <span class="pb-tag"><span class="dot"></span>Playbook MCP</span>
            <h2>Saw a game you love?<span>Make your own version in your agent</span></h2>
            <div class="cmd"><code><b>$</b> ${esc(MCP_CMD)}</code><button class="copy" data-copy="${esc(MCP_CMD)}">Copy</button></div>
            <div class="pb-acts"><a class="btn btn-ink" href="#/mcp">Setup for Cursor, Codex, Desktop</a><a class="btn" href="#/mechanics">Browse mechanics</a></div>
          </div>
          <div class="tiles2">${tiles.map((t, k) => `<a class="tile2 rv" style="--d:${k * 50}ms" href="${t[0]}" ${t[5] || ''}><span class="ti">${t[1]}</span><div><h3>${t[2]} <em>${t[3]}</em></h3><p>${t[4]}</p></div></a>`).join('')}</div>
        </section>

        <section class="section">
          <div class="sec-head"><div><h2>Best of the web</h2><p>Hand-picked AI-made games, playable in your browser. Each card opens the creator's own page.</p></div><a class="link" href="#/discover">All ${DISC.length} games</a></div>
          <div class="controls"><div class="pills" id="bestGenres">${HOME_GENRES.map(g => `<button class="pill ${g === hstate.genre ? 'on' : ''}" data-v="${g}">${g}</button>`).join('')}</div></div>
          <div class="wall" id="bestGrid"></div>
        </section>

        ${rail({ title: 'Hot this week', badge: ' <span class="chip hot">From X</span>', sub: 'Shared in the last few days.', href: '#/discover', more: `All ${DISC.length}`, items: [...covered.slice(0, 8), ...live.slice(0, 4)].map(dcard).join('') })}
        ${live.length ? rail({ title: 'Live right now', badge: ' <span class="chip"><i class="livedot"></i> Playing</span>', sub: 'These pages play right here. Scroll to watch, click to take over.', href: '#/discover', items: live.slice(0, 10).map(dcard).join('') }) : ''}
        ${rail({ title: 'Shooters', href: '#/discover/Shooter', more: 'All shooters', items: DISC.filter(d => d.genre === 'Shooter').sort((a, b) => (a.cover ? 0 : 1) - (b.cover ? 0 : 1) || byNew(a, b)).slice(0, 10).map(dcard).join('') })}
        ${rail({ title: 'Game feel, ready to install', sub: 'The parts a one-line prompt gets wrong. Poke the live demo, then add it to your game.', href: '#/mechanics', more: 'All mechanics', cls: 'mech', items: [...mechanics].sort((a, b) => b.installs - a.installs).map(mcard).join('') })}
        ${jams.length ? rail({ title: 'From the game jams', sub: 'Winners and standouts from Vibe Jam and other AI game jams.', href: '#/discover', items: jams.slice(0, 12).map(dcard).join('') }) : ''}

        ${contest()}
      </div>`;
    drawBest();
    $('#bestGenres').addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      hstate.genre = b.dataset.v; $$('#bestGenres .pill').forEach(x => x.classList.toggle('on', x === b)); drawBest();
    });
    bindRails(app);
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

  function chartsPage() {
    app.innerHTML = `
      <section class="page-head"><div class="wrap">
        <span class="tag rv"><span class="dot"></span>Charts · this week</span>
        <h1 class="rv" style="--d:60ms">What people play,<br>and what they copy.</h1>
        <p class="rv" style="--d:120ms">Plays show what is fun. Remixes show what is worth building on. Creators earn from both.</p>
      </div></section>
      <section class="section tight" style="padding-top:20px"><div class="wrap">
        <div class="controls rv"><div class="seg" id="chartSeg">
          <button data-chart="played" class="${state.chart === 'played' ? 'on' : ''}">Most played</button>
          <button data-chart="remixed" class="${state.chart === 'remixed' ? 'on' : ''}">Most remixed</button>
          <button data-chart="rising" class="${state.chart === 'rising' ? 'on' : ''}">Rising</button>
        </div></div>
        <div class="board bezel rv"><div class="core" id="board"></div></div>
      </div></section>`;
    const draw = () => {
      const board = $('#board');
      $$('.media', board).forEach(m => liveIO.unobserve(m));
      const key = state.chart === 'played' ? g => g.plays : state.chart === 'remixed' ? g => g.remixes : g => g.remixes / g.days;
      const list = [...games].sort(sorters[state.chart]).slice(0, 12);
      const max = key(list[0]);
      board.innerHTML = `<div class="brow head"><span>#</span><span></span><span>Game</span><span>Creator</span><span style="text-align:right">Plays</span><span style="text-align:right">Remixes</span><span></span></div>` +
        list.map((g, i) => `
        <a class="brow" href="#/game/${g.id}">
          <span class="pos">${String(i + 1).padStart(2, '0')}</span>
          <div class="media thumb" data-src="${g.src}&attract=1" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><div class="poster"></div><div class="scan"></div></div>
          <div><h3>${esc(g.title)}</h3><span class="small muted">${esc(g.genres.join(' · '))}${g.parent ? ' · remix' : ''}</span></div>
          <span class="small muted" style="display:flex;gap:8px;align-items:center">${ava(g.by)}${esc(g.by)}</span>
          <span class="num">${fmt(g.plays)}</span>
          <span class="num">${fmt(g.remixes)}</span>
          <div class="bar"><i style="width:${Math.max(4, key(g) / max * 100)}%"></i></div>
        </a>`).join('');
      hydrate(board);
    };
    draw();
    $('#chartSeg').addEventListener('click', e => { const b = e.target.closest('[data-chart]'); if (!b) return; state.chart = b.dataset.chart; $$('#chartSeg button').forEach(p => p.classList.toggle('on', p === b)); draw(); });
  }

  function creatorPage(name) {
    const c = creators[name]; if (!c) return notFound();
    const own = games.filter(g => g.by === name).sort(sorters.played);
    const mech = mechanics.filter(m => m.by === name);
    const plays = own.reduce((s, g) => s + g.plays, 0), rem = own.reduce((s, g) => s + g.remixes, 0);
    const earn = Math.round(plays * 0.0011 + rem * 0.4);
    app.innerHTML = `
      <section class="page-head"><div class="wrap">
        <div class="chead rv">${ava(name, 'lg')}<div><span class="tag">Creator</span><h1 style="margin-top:12px">${esc(c.name)}</h1></div></div>
        <p class="rv" style="--d:80ms">${esc(c.bio)}</p>
        <div class="cstats">
          <div class="bezel rv"><div class="core"><b>${own.length}</b><span>Games</span></div></div>
          <div class="bezel rv" style="--d:60ms"><div class="core"><b>${fmt(plays)}</b><span>Plays</span></div></div>
          <div class="bezel rv" style="--d:120ms"><div class="core"><b>${fmt(rem)}</b><span>Times remixed</span></div></div>
          <div class="bezel rv" style="--d:180ms"><div class="core"><b style="color:var(--coin)">$${fmt(earn)}</b><span>Earned · demo figure</span></div></div>
        </div>
        <div class="wall">${own.map(g => card(g)).join('') || '<div class="empty">No games yet.</div>'}</div>
        ${mech.length ? `<div class="sec-head" style="margin-top:80px"><div><span class="tag">Mechanics by ${esc(c.name)}</span></div></div><div class="mgrid">${mech.map(mcard).join('')}</div>` : ''}
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
    app.innerHTML = `<section class="page-head"><div class="wrap"><span class="tag">404</span><h1>Game over.</h1><p>That page does not exist. <a href="#/" style="color:var(--accent)">Back to the wall</a></p></div></section>`;
  }


  // ---------- discover: games from around the web (link + credit only) ----------
  const DISC = (window.PB_DISCOVER || []).filter(d => !d.stale).map((d, i) => ({ ...d, _i: i }));
  const PLATFORMS = { x: 'X', youtube: 'YouTube', hn: 'Hacker News', reddit: 'Reddit', itch: 'itch.io', jam: 'Game jam', other: 'Web' };
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
      <a class="dlink" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer" aria-label="Play ${esc(d.title)} on ${esc(host(d.url))} (opens in a new tab)">
        <div class="media ${d.cover ? 'has-cover' : ''}" ${auto ? `data-auto="${esc(d.url)}"` : ''} ${hover ? `data-ext="${esc(d.url)}"` : ''} style="${calm(d)}">
          <div class="poster"><b class="ptitle">${esc(d.title)}</b></div>${coverImg(d)}<div class="scan"></div>
          <div class="top">
            <span>${auto ? '<span class="chip"><i class="livedot"></i>Live</span>' : hover ? '<span class="chip">Hover to play</span>' : ''}</span>
            <span><span class="chip">${dIc.out}${esc(host(d.url))}</span></span>
          </div>
          <span class="playbtn" aria-hidden="true">${playIco}</span>
        </div>
      </a>
      <div class="dmeta">
        <h3>${esc(d.title)}</h3>
        <div class="dtags">${d.genre ? `<span class="chip">${esc(d.genre)}</span>` : ''}${eng ? `<span class="chip">${esc(eng)}</span>` : ''}${d.is3d ? '<span class="chip">3D</span>' : ''}${d.date ? `<span class="chip">${esc(dDate(d.date))}</span>` : ''}</div>
        <p class="dnote">${esc(d.note || '')}</p>
        <div class="dby">
          <span class="who"><i class="ava" style="--h:${hashHue(d.title + d.url)}"></i>${d.creator ? esc(d.creator) : 'Unknown creator'}${d.model ? `<span class="dim"> · ${esc(d.model)}</span>` : ''}</span>
          ${d.source ? `<a href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">Source · ${esc(PLATFORMS[d.platform] || 'Web')} ↗</a>` : ''}
        </div>
        <button class="dclaim" data-claim="${d._i}">Is this yours? Claim or remove</button>
      </div>
    </article>`;
  };
  const byNew = (a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title);

  function drawDiscover() {
    const grid = $('#discGrid'); if (!grid) return;
    stopPreview();
    const list = DISC.filter(d => (dstate.genre === 'All' || d.genre === dstate.genre)
      && (dstate.platform === 'All' || d.platform === dstate.platform)
      && (!dstate.d3 || d.is3d))
      .sort(dstate.sort === 'new' ? byNew : (a, b) => a.title.localeCompare(b.title));
    grid.innerHTML = list.length ? list.map(dcard).join('') : '<div class="empty"><b>Nothing matches yet</b>Try fewer filters, or <button class="link" data-submit-game>submit a game you found</button>.</div>';
    $('#discCount').textContent = `${list.length} of ${DISC.length} games`;
    hydrate(grid);
  }
  function discoverPage(arg = '') {
    const count = k => DISC.reduce((m, d) => (d[k] && (m[d[k]] = (m[d[k]] || 0) + 1), m), {});
    const genres = Object.entries(count('genre')).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const plats = Object.keys(PLATFORMS).filter(p => count('platform')[p]);
    const live = DISC.filter(d => d.embeddable).length;
    const g0 = genres.includes(arg) ? arg : 'All';
    app.innerHTML = `
      <section class="page-head dots"><div class="wrap">
        <span class="tag"><span class="dot"></span>Indexed from around the web</span>
        <h1>Discover <em>AI-made</em> games</h1>
        <p>${DISC.length} games people built with AI and shared in public. We link to the creator's own page and credit the post where we found it. Nothing is copied or rehosted.</p>
        <div class="acts"><button class="btn btn-accent" data-submit-game>Submit a game</button><a class="btn" href="#/games">Playbook originals</a></div>
      </div></section>
      <div class="wrap">
        <div class="controls">
          <div class="pills" id="dGenres"><button class="pill ${g0 === 'All' ? 'on' : ''}" data-v="All">All</button><button class="pill" id="d3d" aria-pressed="false">3D only</button>${genres.map(g => `<button class="pill ${g === g0 ? 'on' : ''}" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>
          <div class="seg" id="dSort"><button data-v="new" class="on">Newest</button><button data-v="az">A–Z</button></div>
        </div>
        <div class="controls">
          <div class="pills" id="dPlats"><span class="plabel">Found on</span><button class="pill on" data-v="All">Anywhere</button>${plats.map(p => `<button class="pill" data-v="${p}">${PLATFORMS[p]}</button>`).join('')}</div>
          <span class="dcount"><span id="discCount"></span>${canHover ? ` · ${live} preview on hover` : ''}</span>
        </div>
        <div class="wall" id="discGrid"></div>
        <p class="note dfoot">Listings are links to third-party pages that their creators made public. Titles and credits are shown as given at the source; each link was last checked on the date in our index. Creators can claim or remove a listing from its card at any time.${LOCAL ? ' <a href="#/review" class="dclaim">Review queue</a>' : ''}</p>
      </div>`;
    Object.assign(dstate, { genre: g0, platform: 'All', d3: false, sort: 'new' });
    const pick = (id, key) => $(id).addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      dstate[key] = b.dataset.v; $$(id + ' [data-v]').forEach(x => x.classList.toggle('on', x === b)); drawDiscover();
    });
    pick('#dGenres', 'genre'); pick('#dPlats', 'platform'); pick('#dSort', 'sort');
    $('#d3d').addEventListener('click', e => { dstate.d3 = !dstate.d3; e.currentTarget.classList.toggle('on', dstate.d3); e.currentTarget.setAttribute('aria-pressed', dstate.d3); drawDiscover(); });
    drawDiscover();
  }
  const freshRow = () => DISC.length ? `
        <section class="section tight fresh">
          <div class="sec-head"><div><span class="tag"><span class="dot"></span>Updated weekly</span><h2>Ideas from around the web</h2><p>The newest AI-made games people shared on X, Hacker News, itch and in jams. Play them for inspiration; each card opens the creator's own page, and the code stays theirs.</p></div><a class="link" href="#/discover">All ${DISC.length} games →</a></div>
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
      <p class="note">This opens a pre-filled issue on our GitHub repo. Removal requests from the creator are acted on as soon as we see them. Listed link: ${esc(host(d.url))}</p>`);
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
          <a class="btn btn-sm" href="#/discover">Back to Discover</a>
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
  const openModal = html => { modalBody.innerHTML = `<button class="icon-btn x" data-close aria-label="Close">${icon.close}</button>` + html; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); };
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
  const PAGES = [['Browse all recipes', '#/games'], ['Discover games from the web', '#/discover'], ['Mechanics', '#/mechanics'], ['Publish a game', '#/publish'], ['Connect Playbook MCP', '#/mcp'], ['Playbook Jam', '#/jam']];
  let cmdkItems = [], cmdkSel = 0;
  const lc = s => String(s || '').toLowerCase();
  function searchAll(q) {
    const words = lc(q).trim().split(/\s+/).filter(Boolean), any = words.length > 0;
    const hit = hay => words.every(w => hay.includes(w));
    const G = games.filter(g => any ? hit(lc([g.title, g.by, g.genres.join(' '), g.is3d ? '3d three.js' : '2d canvas', g.style, g.parent ? 'remix' : 'original'].join(' '))) : !g.parent)
      .slice(0, any ? 6 : 3).map(g => ({ group: 'Playbook recipes', title: g.title, sub: `${g.by} · ${g.genres.join(' · ')}`, href: `#/game/${g.id}`, c1: g.colors[0], c2: g.colors[1], go: 'Play' }));
    const D = (any ? DISC.filter(d => hit(lc([d.title, d.creator, d.genre, d.engine, d.model, PLATFORMS[d.platform], d.is3d ? '3d' : '', host(d.url), d.note].join(' ')))) : [...DISC].sort(byNew))
      .slice(0, any ? 8 : 6).map(d => { const h = hashHue(d.title + d.url); return { group: any ? 'From the web' : 'Fresh from the web', title: d.title, sub: [d.creator || host(d.url), d.genre, d.model].filter(Boolean).join(' · '), href: d.url, ext: true, c1: `hsl(${h} 78% 54%)`, c2: `hsl(${(h + 80) % 360} 72% 40%)`, go: host(d.url) + ' ↗' }; });
    const M = any ? mechanics.filter(m => hit(lc([m.name, m.cat, m.desc].join(' ')))).slice(0, 4).map(m => ({ group: 'Mechanics', title: m.name, sub: m.cat, href: `#/mechanic/${m.slug}`, c1: '#4a4337', c2: '#17150f', go: 'Open' })) : [];
    const P = PAGES.filter(p => !any || hit(lc(p[0]))).map(p => ({ group: 'Pages', title: p[0], sub: '', href: p[1], go: 'Go' }));
    return any ? [...D, ...G, ...M, ...P] : [...D, ...G, ...P];
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
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1800); }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
    toast('Copied');
    if (btn?.classList.contains('copy')) { const old = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1400); }
  }
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = on => { menu.classList.toggle('open', on); burger.setAttribute('aria-expanded', on); menu.setAttribute('aria-hidden', !on); };
  burger.onclick = () => setMenu(!menu.classList.contains('open'));

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]'); if (c) { e.preventDefault(); return copy(c.dataset.copy, c); }
    if (e.target.closest('[data-open-mcp]')) { e.preventDefault(); setMenu(false); return mcpModal(); }
    const r = e.target.closest('[data-remake]'); if (r) return remakeModal(r.dataset.remake);
    if (e.target.closest('[data-submit-game]')) { e.preventDefault(); return submitGameModal(); }
    if (e.target.closest('[data-search]')) { e.preventDefault(); setMenu(false); return openSearch(); }
    const q = e.target.closest('[data-q]'); if (q) { e.preventDefault(); return openSearch(q.dataset.q); }
    const cl = e.target.closest('[data-claim]'); if (cl) return claimModal(+cl.dataset.claim);
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
    const nav = { '': 'home', game: 'games', games: 'games', mechanics: 'mechanics', mechanic: 'mechanics', charts: 'charts', creator: 'charts', publish: 'publish', mcp: 'mcp', jam: 'jam', discover: 'discover', review: 'discover' }[page];
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
    const tab = { home: 'home', games: 'games', discover: 'discover', mcp: 'make', publish: 'make' }[nav];
    $$('[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    const a = decodeURIComponent(arg);
    if (page === 'charts' || page === 'creator') { location.replace('#/discover'); return; }
    ({ '': home, games: () => gamesPage(a), mcp: mcpPage, jam: jamPage, game: () => gamePage(a), mechanics: mechanicsPage, mechanic: () => mechanicPage(a), charts: chartsPage, creator: () => creatorPage(a), publish: publishPage, discover: () => discoverPage(a), review: LOCAL ? reviewPage : notFound }[page] || notFound)();
    window.scrollTo(0, 0);
    hydrate();
    document.title = (page === 'game' && byId[a] ? byId[a].title + ' — ' : '') + 'Playbook';
  }
  const navEl = $('#nav');
  const navSync = () => navEl.classList.toggle('over', !!document.querySelector('.hx') && scrollY < 40);
  window.addEventListener('scroll', navSync, { passive: true });
  window.addEventListener('hashchange', navSync);
  window.addEventListener('hashchange', route);
  route();
  navSync();
})();
