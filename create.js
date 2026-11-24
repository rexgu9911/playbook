// Playbook Create: describe a game, get it running here, keep changing it by chatting.
// Loaded on demand by app.js for #/create. Talks to the Playbook Create Worker (worker/ in the workspace):
//   GET {api}/api/health, POST {api}/api/generate (Server-Sent Events).
// Games run in a sandboxed iframe (scripts only, no same-origin), so a generated game can't touch this site.
// Projects (every version + the chat) are kept in this browser's IndexedDB until accounts exist.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slug = s => (String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-game').slice(0, 60);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const kb = n => `${Math.max(1, Math.round(n / 1024))} KB`;

  // ---------- storage: IndexedDB, with an in-memory fallback (private windows) ----------
  const DB = (() => {
    let mem = new Map(), dbp = null;
    const open = () => dbp || (dbp = new Promise(res => {
      try {
        const r = indexedDB.open('pb-create', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
        r.onsuccess = () => res(r.result); r.onerror = () => res(null);
      } catch { res(null); }
    }));
    const tx = async (mode, fn) => { const db = await open(); if (!db) return fn(null); return new Promise((res, rej) => { const t = db.transaction('projects', mode), s = t.objectStore('projects'); const out = fn(s); t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); }); };
    return {
      all: async () => { const db = await open(); if (!db) return [...mem.values()]; return new Promise(res => { const r = db.transaction('projects').objectStore('projects').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); },
      put: p => tx('readwrite', s => s ? s.put(p) : mem.set(p.id, p)),
      del: id => tx('readwrite', s => s ? s.delete(id) : mem.delete(id)),
    };
  })();

  // ---------- the game frame: error reporting is injected, and stripped again on download ----------
  const PROBE = `<script data-pb-probe>(function(){var s=function(m){try{parent.postMessage({__pbErr:String(m).slice(0,1500)},'*')}catch(e){}};addEventListener('error',function(e){s((e.message||'Script error')+(e.lineno?' (line '+e.lineno+')':''))});addEventListener('unhandledrejection',function(e){var r=e.reason;s('Unhandled promise rejection: '+(r&&r.message||r))});var ce=console.error;console.error=function(){s([].slice.call(arguments).join(' '));return ce.apply(console,arguments)}})();<\/script>`;
  const withProbe = html => /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + PROBE) : PROBE + html;

  const STARTERS = [
    'A neon snake game where the snake leaves a glowing trail',
    'A cozy 3D marble maze you tilt with the arrow keys',
    'A one-button rhythm runner with procedural music',
    'A top-down space shooter with waves and a boss',
  ];

  function mount(root, host) {
    const { esc } = host;
    const st = { models: [], real: false, model: 'mock', project: null, cur: -1, busy: null, err: '', view: 'game', list: [], credit: { usd: 0.01, markup: 2, freeFixes: 2 }, fixStreak: 0, tune: false };
    root.innerHTML = `
      <div class="cr-app" data-view="chat">
        <aside class="cr-side">
          <div class="cr-top">
            <button class="cr-proj" id="crProjBtn" aria-expanded="false"><span id="crTitle" data-noi18n>New game</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
            <button class="btn btn-sm" data-act="new">New</button>
          </div>
          <div class="cr-projects" id="crProjects" hidden></div>
          <div class="cr-msgs" id="crMsgs" aria-live="polite"></div>
          <form class="cr-compose" id="crForm">
            <textarea id="crIn" rows="3" maxlength="4000" placeholder="Describe a game, or what to change…" aria-label="Describe a game, or what to change"></textarea>
            <div class="cr-row">
              <select id="crModel" aria-label="Model"></select>
              <span class="cr-mode" id="crMode"></span>
              <button class="btn btn-accent" type="submit" id="crSend">Make it</button>
            </div>
          </form>
        </aside>
        <section class="cr-stage">
          <div class="cr-bar">
            <select id="crVer" aria-label="Version"></select>
            <div class="cr-tools">
              <button class="btn btn-sm" data-act="undo">Undo</button>
              <button class="btn btn-sm" data-act="tune" aria-pressed="false">Tune</button>
              <button class="btn btn-sm" data-act="restart">Restart</button>
              <button class="btn btn-sm" data-act="code" aria-pressed="false">Code</button>
              <button class="btn btn-sm" data-act="full">Fullscreen</button>
              <button class="btn btn-sm" data-act="download">Download</button>
            </div>
          </div>
          <div class="cr-err" id="crErr" hidden><span id="crErrText" data-noi18n></span><button class="btn btn-sm btn-accent" data-act="fix" id="crFixBtn">Ask AI to fix</button><button class="cr-x" data-act="dismiss" aria-label="Dismiss">×</button></div>
          <div class="cr-tune" id="crTune" hidden></div>
          <div class="cr-frame" id="crFrame"><div class="cr-empty" id="crEmpty"><b>Your game shows up here</b><span>Describe a game on the left. It runs right here, and you can keep changing it.</span></div></div>
          <pre class="cr-code" id="crCode" hidden data-noi18n></pre>
        </section>
        <nav class="cr-tabs" aria-label="Studio views"><button data-tab="chat" class="on">Chat</button><button data-tab="game">Game</button></nav>
      </div>`;
    const msgs = $('#crMsgs', root), input = $('#crIn', root), frameBox = $('#crFrame', root), app = $('.cr-app', root);

    // ---------- rendering ----------
    const ver = () => st.project?.versions[st.cur];
    const drawMsgs = () => {
      const p = st.project;
      app.classList.toggle('wiz', !p || (!p.messages.length && !p.versions.length));
      if (!p || (!p.messages.length && !p.versions.length)) {
        msgs.innerHTML = `<div class="cr-wz">${wizardHTML()}</div>`;
      } else {
        msgs.innerHTML = (p.plan ? `<details class="cr-plan"><summary>Game plan</summary><pre data-noi18n>${esc(p.plan)}</pre></details>` : '') + p.messages.map(m => m.role === 'user'
          ? `<div class="cr-msg me" data-noi18n>${esc(m.text)}</div>`
          : m.role === 'error' ? `<div class="cr-msg bad"><span>${esc(m.text)}</span>${m.retry && m === p.messages[p.messages.length - 1] && !st.busy ? `<button class="link" data-act="retry">${host.zh ? '重试' : 'Try again'}</button>` : ''}</div>`
          : `<div class="cr-msg ai"><div class="cr-v"><span>v${m.v + 1}</span>${m.free ? `<span class="cr-cost">${host.zh ? '免费修复' : 'Free fix'}</span>` : m.credits ? `<span class="cr-cost">${m.credits} credits</span>` : ''}${m.mode === 'edit' ? `<span class="cr-cost">${host.zh ? '增量修改' : 'small edit'}</span>` : ''}${m.v !== st.cur ? `<button class="link" data-goto="${m.v}">Open this version</button>` : ''}</div><p data-noi18n>${esc(m.text || 'Done.')}</p></div>`).join('');
      }
      if (st.busy) msgs.insertAdjacentHTML('beforeend', `<div class="cr-msg ai busy"><span class="cr-spin" aria-hidden="true"></span><span id="crStatus">${esc(st.busy.status)}</span><span class="cr-size" id="crSize"></span><button class="link" data-act="stop">Stop</button></div>`);
      host.apply?.(msgs);
      msgs.scrollTop = msgs.scrollHeight;
    };
    const drawVersions = () => {
      const vs = st.project?.versions || [];
      $('#crVer', root).innerHTML = vs.length ? vs.map((v, i) => `<option value="${i}" ${i === st.cur ? 'selected' : ''}>v${i + 1} · ${esc((v.prompt || '').slice(0, 40))}</option>`).join('') : '<option>No versions yet</option>';
      $('#crVer', root).disabled = !vs.length;
      $$('.cr-tools .btn', root).forEach(b => { b.disabled = !vs.length; });
    };
    const drawFrame = () => {
      const v = ver(); hideErr();
      $('#crEmpty', root)?.remove();
      $('iframe', frameBox)?.remove();
      if (!v) { frameBox.innerHTML = '<div class="cr-empty" id="crEmpty"><b>Your game shows up here</b><span>Describe a game on the left. It runs right here, and you can keep changing it.</span></div>'; host.apply?.(frameBox); return; }
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock');
      f.setAttribute('allow', 'autoplay; gamepad; accelerometer');
      f.title = st.project.title || 'Game';
      f.srcdoc = withProbe(v.html);
      frameBox.append(f);
      $('#crCode', root).textContent = v.html;
      setTimeout(() => { try { f.focus(); } catch {} }, 300);
    };
    // price on the button: an estimate from list prices (new game ≈ 18k output tokens; an edit ≈ 2.5k output plus reading the file)
    const estimate = (kind = 'auto') => {
      const m = st.models.find(x => x.id === st.model); if (!m || !m.price || !m.price.output) return 0;
      const v = ver(), edit = kind === 'fix' || (kind === 'auto' && v);
      const tin = edit ? (v?.html.length || 0) / 3.5 + 3500 : 3500, tout = edit ? 2500 : 18000;
      const usd = (tin * m.price.input + tout * m.price.output) / 1e6;
      return Math.ceil(usd * st.credit.markup / st.credit.usd);
    };
    const drawPrice = () => {
      const n = estimate(), v = ver(), b = $('#crSend', root);
      const verb = v ? (host.zh ? '修改' : 'Change it') : (host.zh ? '生成' : 'Make it');
      b.textContent = n ? `${verb} · ≈ ${n} credits` : `${verb} · ${host.zh ? '免费' : 'Free'}`;
      const fb = $('#crFixBtn', root); if (fb) fb.textContent = st.fixStreak < st.credit.freeFixes ? (host.zh ? '让 AI 修复（免费）' : 'Ask AI to fix (free)') : `${host.zh ? '让 AI 修复' : 'Ask AI to fix'} · ≈ ${estimate('fix')} credits`;
    };
    const drawTitle = () => { $('#crTitle', root).textContent = st.project?.title || (host.zh ? '新游戏' : 'New game'); };
    const drawAll = () => { drawTitle(); drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); };
    const showErr = m => { st.err = m; $('#crErrText', root).textContent = m; $('#crErr', root).hidden = false; };
    const hideErr = () => { st.err = ''; $('#crErr', root).hidden = true; };
    const setView = v => { st.view = v; app.dataset.view = v; $$('[data-tab]', root).forEach(b => b.classList.toggle('on', b.dataset.tab === v)); };

    // ---------- tuning: the CONFIG object at the top of the game becomes sliders (0 credits, saved as a version) ----------
    const CONF_LINE = /^(\s*)([A-Za-z_$][\w$]*)\s*:\s*(-?\d+(?:\.\d+)?|"#[0-9a-fA-F]{3,8}"|'#[0-9a-fA-F]{3,8}'|true|false)\s*(,?)\s*(?:\/\/\s*(.*))?$/;
    const CONF_BLOCK = /const\s+CONFIG\s*=\s*\{[\s\S]*?\n\s*\};?/;
    const parseConfig = html => {
      const m = html.match(CONF_BLOCK); if (!m) return [];
      return m[0].split('\n').map(l => l.match(CONF_LINE)).filter(Boolean).map(x => {
        const raw = x[3], type = /^["']#/.test(raw) ? 'color' : /^(true|false)$/.test(raw) ? 'bool' : 'num';
        return { key: x[2], type, value: type === 'color' ? raw.slice(1, -1) : type === 'bool' ? raw === 'true' : parseFloat(raw), note: (x[5] || '').trim() };
      });
    };
    const setConfig = (html, key, val) => html.replace(CONF_BLOCK, block => block.split('\n').map(l => {
      const x = l.match(CONF_LINE); if (!x || x[2] !== key) return l;
      const out = typeof val === 'string' ? '"' + val + '"' : String(val);
      return x[1] + x[2] + ': ' + out + x[4] + (x[5] ? ' // ' + x[5] : '');
    }).join('\n'));
    const hex6 = c => c.length === 4 ? '#' + [...c.slice(1)].map(ch => ch + ch).join('') : c.slice(0, 7);
    const drawTune = () => {
      const box = $('#crTune', root), v = ver(), btn = $('[data-act="tune"]', root);
      const items = v ? parseConfig(v.html) : [];
      btn.hidden = !items.length;
      if (!st.tune || !items.length) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<div class="cr-tune-h"><b>' + (host.zh ? '调参' : 'Tune') + '</b><span>' + (host.zh ? '拖动即时生效，不花 credits' : 'Changes apply instantly and cost 0 credits') + '</span></div>' + items.map(it => {
        const id = 'tn-' + it.key;
        const label = '<span class="cr-tk" data-noi18n>' + esc(it.key) + '</span>' + (it.note ? '<span class="cr-tn" data-noi18n>' + esc(it.note) + '</span>' : '');
        if (it.type === 'color') return '<label class="cr-ti" for="' + id + '">' + label + '<input id="' + id + '" type="color" data-tune="' + esc(it.key) + '" value="' + esc(hex6(it.value)) + '"></label>';
        if (it.type === 'bool') return '<label class="cr-ti" for="' + id + '">' + label + '<input id="' + id + '" type="checkbox" data-tune="' + esc(it.key) + '"' + (it.value ? ' checked' : '') + '></label>';
        const v0 = it.value, max = v0 === 0 ? 10 : Math.abs(v0) * 3, min = v0 < 0 ? -max : 0;
        const step = Number.isInteger(v0) && Math.abs(v0) >= 10 ? 1 : +(Math.abs(v0 || 1) / 100).toPrecision(2);
        return '<label class="cr-ti" for="' + id + '">' + label + '<span class="cr-tr"><input id="' + id + '" type="range" data-tune="' + esc(it.key) + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v0 + '"><output data-noi18n>' + v0 + '</output></span></label>';
      }).join('');
      host.apply?.(box);
    };
    let tuneT = 0;
    $('#crTune', root).addEventListener('input', e => {
      const el = e.target.closest('[data-tune]'); if (!el) return;
      const val = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value : +el.value;
      if (el.type === 'range') el.nextElementSibling.textContent = val;
      clearTimeout(tuneT);
      tuneT = setTimeout(() => {
        const p = st.project, v = ver(); if (!p || !v) return;
        const html = setConfig(v.html, el.dataset.tune, val);
        if (html === v.html) return;
        if (v.model === 'tune' && st.cur === p.versions.length - 1) { v.html = html; }   // keep tweaking the same tuned version
        else {
          p.versions.push({ html, summary: '', prompt: host.zh ? '调参' : 'Tuned', at: Date.now(), model: 'tune', credits: 0 });
          st.cur = p.versions.length - 1;
          p.messages.push({ role: 'ai', text: host.zh ? '用调参面板改了数值（不花 credits）。' : 'Tuned values with the panel (0 credits).', v: st.cur, credits: 0 });
          drawMsgs();
        }
        drawVersions(); drawFrame(); save();
      }, 350);
    });

    // ---------- projects ----------
    const newProject = () => ({ id: uid(), title: '', created: Date.now(), updated: Date.now(), versions: [], messages: [] });
    const save = async () => { if (!st.project?.versions.length && !st.project?.messages.length) return; st.project.updated = Date.now(); try { await DB.put(st.project); } catch { host.toast('Could not save in this browser'); } };
    const open = p => { st.project = p; st.cur = p.versions.length - 1; drawAll(); };
    const drawProjects = async () => {
      st.list = (await DB.all()).sort((a, b) => b.updated - a.updated);
      $('#crProjects', root).innerHTML = st.list.length
        ? st.list.map(p => `<div class="cr-pi ${p.id === st.project?.id ? 'on' : ''}"><button data-open="${p.id}"><b data-noi18n>${esc(p.title || 'Untitled game')}</b><span>${p.versions.length} versions · ${new Date(p.updated).toLocaleDateString()}</span></button><button class="cr-x" data-del="${p.id}" aria-label="Delete ${esc(p.title || 'Untitled game')}">×</button></div>`).join('')
        : '<p class="muted small">Games you make are kept in this browser.</p>';
      host.apply?.($('#crProjects', root));
    };

    // ---------- first-run wizard: one choice per screen, then an AI plan (3 questions + art direction) before any code ----------
    const WIZ = {
      platform: { title: 'Where will people play it?', opts: [['phone', 'Phone', 'Touch controls, one or two thumbs.'], ['computer', 'Computer', 'Keyboard and mouse.'], ['both', 'Phone and computer', 'Works with touch and with a keyboard.']] },
      orientation: { title: 'Portrait or landscape?', note: 'Players hold the phone one way for the whole game.', opts: [['portrait', 'Portrait', 'Held upright, one thumb.'], ['landscape', 'Landscape', 'Turned sideways, two thumbs.']] },
      mode: { title: 'Arcade or levels?', opts: [['arcade', 'Arcade', 'One run, one high score. Every run starts fresh.'], ['levels', 'Levels', 'A set of levels worth 1 to 3 stars, with progress saved.']] },
    };
    const newWiz = () => ({ step: 'platform', platform: '', orientation: '', mode: '', idea: '', plan: null, answers: [], style: -1, err: '', t0: 0 });
    st.wiz = newWiz();
    const label = (k, v) => (WIZ[k].opts.find(o => o[0] === v) || [, v])[1];
    const setupText = w => [`Platform: ${label('platform', w.platform)}`, w.platform !== 'computer' && w.orientation ? `Orientation: ${label('orientation', w.orientation)}` : '', `Mode: ${label('mode', w.mode)} (${(WIZ.mode.opts.find(o => o[0] === w.mode) || [, , ''])[2]})`].filter(Boolean).join('; ');
    const planText = w => {
      const p = w.plan; if (!p) return '';
      return [`Title: ${p.title}`, `Core loop: ${p.summary}`, `Setup: ${setupText(w)}`, 'Design decisions:', ...p.questions.map((q, i) => `- ${q.topic || q.question}: ${q.options[w.answers[i] ?? q.recommended]}`),
        w.style > -1 && p.styles[w.style] ? `Art direction: ${p.styles[w.style].name}: ${p.styles[w.style].description}` : ''].filter(Boolean).join('\n');
    };
    const steps = w => ['platform', ...(w.platform && w.platform !== 'computer' ? ['orientation'] : []), 'mode', 'idea', 'planning', 'q0', 'q1', 'q2', 'style', 'review'];
    const go = (dir) => { const s = steps(st.wiz), i = s.indexOf(st.wiz.step); st.wiz.step = s[Math.max(0, Math.min(s.length - 1, i + dir))]; drawMsgs(); };
    const planCredits = () => { const m = st.models.find(x => x.id === st.model); if (!m?.price?.output) return 0; return Math.ceil(((800 * m.price.input + 1500 * m.price.output) / 1e6) * st.credit.markup / st.credit.usd); };
    const wizardHTML = () => {
      const w = st.wiz, s = steps(w), shown = s.filter(x => !/^q\d$|planning/.test(x)), pos = Math.max(0, shown.indexOf(/^q\d$|planning/.test(w.step) ? 'style' : w.step));
      const head = `<div class="cr-wz-top">${w.step !== 'platform' && w.step !== 'planning' ? '<button class="link" data-wiz-back>← Back</button>' : '<span></span>'}<span class="cr-wz-n">${pos + 1} / ${shown.length}</span></div>`;
      if (WIZ[w.step]) {
        const d = WIZ[w.step];
        return head + `<h2 class="cr-wz-h">${d.title}</h2>${d.note ? `<p class="cr-wz-p">${d.note}</p>` : ''}<div class="cr-wz-opts">${d.opts.map(([v, t, sub]) => `<button class="cr-wz-opt ${w[w.step] === v ? 'on' : ''}" data-wiz="${w.step}:${v}"><b>${t}</b><span>${sub}</span></button>`).join('')}</div>`;
      }
      if (w.step === 'idea') {
        const n = planCredits();
        return head + `<h2 class="cr-wz-h">What are we building?</h2><p class="cr-wz-p">Describe it in your own words. The AI asks three questions and suggests art directions before it writes any code.</p>
          <textarea id="crIdea" rows="4" maxlength="4000" placeholder="e.g. a one-button runner where you jump to the beat" aria-label="Your game idea">${esc(w.idea)}</textarea>
          <div class="cr-starters">${STARTERS.map(x => `<button class="chip" data-starter="${esc(x)}">${esc(x)}</button>`).join('')}</div>
          ${w.err ? `<p class="cr-wz-err">${esc(w.err)}</p>` : ''}
          <div class="cr-wz-acts"><button class="btn btn-accent" data-wiz-start>${host.zh ? '开始规划' : 'Start planning'} · ${n ? `≈ ${n} credits` : (host.zh ? '免费' : 'Free')}</button><button class="link" data-wiz-skip>${host.zh ? '跳过规划，直接生成' : 'Skip planning and build now'}</button></div>
          ${host.recipes?.length ? `<div class="sx-k">Or start from a Playbook recipe</div><div class="cr-starters">${host.recipes.map(r => `<button class="chip" data-recipe="${esc(r.id)}">${esc(r.title)}</button>`).join('')}</div>` : ''}`;
      }
      if (w.step === 'planning') return head + `<div class="cr-wz-wait"><span class="cr-spin" aria-hidden="true"></span><div><b>${host.zh ? '正在规划你的游戏' : 'Planning your game'}</b><span>${host.zh ? '通常 10 到 30 秒' : 'Usually 10 to 30 seconds'}</span></div></div><p class="cr-wz-idea" data-noi18n>${esc(w.idea)}</p>`;
      const plan = w.plan, planBox = plan ? `<details class="cr-plan"><summary>Game plan</summary><b data-noi18n>${esc(plan.title)}</b><p data-noi18n>${esc(plan.summary)}</p></details>` : '';
      const qi = /^q(\d)$/.exec(w.step);
      if (qi) {
        const i = +qi[1], q = plan.questions[i];
        if (!q) { go(1); return ''; }
        return head + `<span class="cr-wz-tag">${host.zh ? `第 ${i + 1} 题，共 ${plan.questions.length} 题` : `Question ${i + 1} of ${plan.questions.length}`}${q.topic ? ` · <span data-noi18n>${esc(q.topic)}</span>` : ''}</span><h2 class="cr-wz-h" data-noi18n>${esc(q.question)}</h2>
          <div class="cr-wz-opts">${q.options.map((o, j) => `<button class="cr-wz-opt ${(w.answers[i] ?? -1) === j ? 'on' : ''}" data-wiz-ans="${i}:${j}"><b data-noi18n>${esc(o)}</b>${j === q.recommended ? `<span class="cr-rec">${host.zh ? '推荐' : 'Recommended'}</span>` : ''}</button>`).join('')}</div>
          <button class="link" data-wiz-defaults>${host.zh ? '其余都用推荐答案' : 'Use the recommended answers for the rest'}</button>${planBox}`;
      }
      if (w.step === 'style') return head + `<h2 class="cr-wz-h">${host.zh ? '选一种美术风格' : 'Pick a look'}</h2><div class="cr-wz-opts">${plan.styles.map((x, k) => `<button class="cr-wz-opt ${w.style === k ? 'on' : ''}" data-wiz-style="${k}"><b data-noi18n>${esc(x.name)}</b><span data-noi18n>${esc(x.description)}</span></button>`).join('')}</div>${planBox}`;
      if (w.step === 'review') {
        const n = estimate('new');
        return head + `<h2 class="cr-wz-h">${host.zh ? '游戏计划' : 'Game plan'}</h2><pre class="cr-wz-plan" data-noi18n>${esc(planText(w))}</pre>
          <div class="cr-wz-acts"><button class="btn btn-accent" data-wiz-build>${host.zh ? '开始生成' : 'Build it'} · ${n ? `≈ ${n} credits` : (host.zh ? '免费' : 'Free')}</button></div>`;
      }
      return '';
    };
    async function startPlanning() {
      const w = st.wiz, idea = ($('#crIdea', root)?.value || '').trim();
      if (!idea) { $('#crIdea', root)?.focus(); return; }
      w.idea = idea; w.err = ''; w.step = 'planning'; w.t0 = Date.now(); drawMsgs();
      try {
        const r = await fetch(`${host.api}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: st.model, idea, setup: setupText(w) }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.plan) throw new Error(j.error || `Request failed (${r.status})`);
        w.plan = j.plan; w.planCredits = j.credits || 0; w.answers = []; w.style = -1; w.step = 'q0';
        host.track('create/plan', st.model, true);
      } catch (e) { w.err = host.tr(e.message && !/fetch/i.test(e.message) ? e.message : 'Could not reach Playbook Create. Is the local server running?'); w.step = 'idea'; }
      drawMsgs();
    }
    function buildFromWizard(skip) {
      const w = st.wiz, idea = skip ? ($('#crIdea', root)?.value || '').trim() : w.idea;
      if (!idea) { $('#crIdea', root)?.focus(); return; }
      const p = st.project || (st.project = newProject());
      p.title = (!skip && w.plan?.title) || idea.replace(/\s+/g, ' ').slice(0, 48);
      p.plan = skip ? `Setup: ${setupText(w)}` : planText(w);
      p.setup = setupText(w);
      generate(idea);
    }

    // ---------- generation ----------
    async function generate(prompt, { error, retry } = {}) {
      if (st.busy) return;
      st.lastReq = { prompt, error };
      const p = st.project || (st.project = newProject());
      if (!p.title) p.title = prompt.replace(/\s+/g, ' ').slice(0, 48);
      const base = ver();
      if (retry) { const last = p.messages[p.messages.length - 1]; if (last?.role === 'error') p.messages.pop(); }
      else p.messages.push({ role: 'user', text: error ? `${host.zh ? '修复错误：' : 'Fix this error: '}${error}` : prompt });
      const ctl = new AbortController();
      st.busy = { status: host.zh ? '正在连接模型' : 'Connecting to the model', ctl, chars: 0 };
      drawTitle(); drawMsgs(); setView('chat');
      $('#crSend', root).disabled = true;
      const history = p.messages.filter(m => m.role === 'user').slice(-8, -1).map(m => m.text);
      st.fixStreak = error ? st.fixStreak + 1 : 0;
      let done = null, failed = '';
      try {
        const r = await fetch(`${host.api}/api/generate`, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: st.model, prompt: error ? 'Fix the error so the game runs.' : prompt, html: base?.html, error, history, plan: p.plan, setup: p.setup, fix: error ? st.fixStreak : 0 }) });
        if (!r.ok || !r.body) { failed = (await r.json().catch(() => ({}))).error || `Request failed (${r.status})`; }
        else {
          const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
          for (;;) {
            const { value, done: end } = await rd.read(); if (end) break;
            buf += dec.decode(value, { stream: true });
            let i; while ((i = buf.indexOf('\n\n')) > -1) {
              const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
              if (!line.startsWith('data:')) continue;
              let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
              if (ev.t === 'status') { st.busy.status = host.tr(ev.msg); const s = $('#crStatus', root); if (s) s.textContent = st.busy.status; }
              if (ev.t === 'delta') { st.busy.chars += ev.text.length; const z = $('#crSize', root); if (z) z.textContent = kb(st.busy.chars); }
              if (ev.t === 'done') done = ev;
              if (ev.t === 'error') failed = ev.msg;
            }
          }
        }
      } catch (e) { failed = e.name === 'AbortError' ? 'Stopped.' : 'Could not reach Playbook Create. Is the local server running?'; }
      st.busy = null; $('#crSend', root).disabled = false;
      if (done) {
        p.versions.push({ html: done.html, summary: done.summary, prompt: error ? 'Fix: ' + error.slice(0, 60) : prompt, at: Date.now(), model: done.model, credits: done.credits, costUsd: done.costUsd, usage: done.usage, mode: done.mode });
        st.cur = p.versions.length - 1;
        p.messages.push({ role: 'ai', text: done.summary, v: st.cur, credits: done.credits, free: !!done.free, mode: done.mode });
        host.track('create/generate', st.model, true);
        drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); setView('game');
      } else {
        p.messages.push({ role: 'error', text: host.tr(failed || 'Something went wrong while generating.'), retry: failed !== 'Stopped.' });
        if (error && st.fixStreak >= st.credit.freeFixes) p.messages.push({ role: 'error', text: host.tr('Automatic fixes did not solve it. Describe what you see going wrong, or open an earlier version.') });
        drawMsgs(); drawPrice();
      }
      save();
    }

    // ---------- events ----------
    $('#crForm', root).addEventListener('submit', e => { e.preventDefault(); const t = input.value.trim(); if (!t) return input.focus(); input.value = ''; generate(t); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $('#crForm', root).requestSubmit(); } });
    $('#crModel', root).addEventListener('change', e => { st.model = e.target.value; try { localStorage.setItem('pb-create-model', st.model); } catch {} drawPrice(); });
    $('#crVer', root).addEventListener('change', e => { st.cur = +e.target.value; st.fixStreak = 0; drawMsgs(); drawFrame(); drawPrice(); drawTune(); });
    root.addEventListener('click', async e => {
      const s = e.target.closest('[data-starter]'); if (s) { const box = $('#crIdea', root) || input; box.value = s.dataset.starter; box.focus(); return; }
      const wz = e.target.closest('[data-wiz]'); if (wz) { const [k, v] = wz.dataset.wiz.split(':'); st.wiz[k] = v; go(1); return; }
      if (e.target.closest('[data-wiz-back]')) { if (/^q\d$/.test(st.wiz.step) && st.wiz.step === 'q0') { st.wiz.step = 'idea'; drawMsgs(); } else go(-1); return; }
      if (e.target.closest('[data-wiz-start]')) { startPlanning(); return; }
      if (e.target.closest('[data-wiz-skip]')) { buildFromWizard(true); return; }
      const wa = e.target.closest('[data-wiz-ans]'); if (wa) { const [i, j] = wa.dataset.wizAns.split(':').map(Number); st.wiz.answers[i] = j; go(1); return; }
      if (e.target.closest('[data-wiz-defaults]')) { st.wiz.plan.questions.forEach((q, i) => { if (st.wiz.answers[i] == null) st.wiz.answers[i] = q.recommended; }); st.wiz.step = 'style'; drawMsgs(); return; }
      const ws = e.target.closest('[data-wiz-style]'); if (ws) { st.wiz.style = +ws.dataset.wizStyle; go(1); return; }
      if (e.target.closest('[data-wiz-build]')) { buildFromWizard(false); return; }
      const rc = e.target.closest('[data-recipe]'); if (rc) { const r = host.recipes.find(x => x.id === rc.dataset.recipe); try { const html = await (await fetch(r.src)).text(); st.project = newProject(); st.project.title = r.title; st.project.versions.push({ html, summary: `Started from the Playbook recipe ${r.title}.`, prompt: `Recipe: ${r.title}`, at: Date.now(), model: 'recipe', credits: 0 }); st.project.messages.push({ role: 'ai', text: `${host.zh ? '从 Playbook 配方开始：' : 'Started from the Playbook recipe '}${r.title}`, v: 0 }); st.cur = 0; drawAll(); save(); setView('game'); } catch { host.toast('Could not load that recipe'); } return; }
      const g = e.target.closest('[data-goto]'); if (g) { st.cur = +g.dataset.goto; st.fixStreak = 0; drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); setView('game'); return; }
      const tb = e.target.closest('[data-tab]'); if (tb) { setView(tb.dataset.tab); return; }
      const op = e.target.closest('[data-open]'); if (op) { const p = st.list.find(x => x.id === op.dataset.open); if (p) open(p); $('#crProjects', root).hidden = true; $('#crProjBtn', root).setAttribute('aria-expanded', 'false'); return; }
      const dl = e.target.closest('[data-del]'); if (dl) { if (dl.dataset.confirm !== '1') { dl.dataset.confirm = '1'; dl.textContent = host.zh ? '删除?' : 'Delete?'; return; } await DB.del(dl.dataset.del); if (st.project?.id === dl.dataset.del) { st.project = null; st.cur = -1; drawAll(); } drawProjects(); return; }
      if (e.target.closest('#crProjBtn')) { const box = $('#crProjects', root), on = box.hidden; box.hidden = !on; e.target.closest('#crProjBtn').setAttribute('aria-expanded', on); if (on) drawProjects(); return; }
      const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
      if (a === 'new') { if (st.busy) return; st.project = null; st.cur = -1; st.wiz = newWiz(); drawAll(); }
      if (a === 'retry' && st.lastReq) generate(st.lastReq.prompt, { error: st.lastReq.error, retry: true });
      if (a === 'stop') st.busy?.ctl.abort();
      if (a === 'restart') drawFrame();
      if (a === 'undo' && st.cur > 0) { st.cur--; st.fixStreak = 0; drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); host.toast(host.zh ? '已回到 v' + (st.cur + 1) : 'Back to v' + (st.cur + 1)); }
      if (a === 'tune') { st.tune = !st.tune; e.target.closest('button').setAttribute('aria-pressed', st.tune); drawTune(); }
      if (a === 'code') { const c = $('#crCode', root), on = c.hidden; c.hidden = !on; frameBox.hidden = on; e.target.closest('button').setAttribute('aria-pressed', on); }
      if (a === 'full') { const el = $('.cr-stage', root); (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); }
      if (a === 'download') { const v = ver(); if (!v) return; const b = new Blob([v.html], { type: 'text/html' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = `${slug(st.project.title)}-v${st.cur + 1}.html`; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); host.track('create/download', '', true); }
      if (a === 'fix' && st.err) { const m = st.err; hideErr(); generate('', { error: m }); }
      if (a === 'dismiss') hideErr();
    });
    const onMsg = e => {
      const f = $('iframe', frameBox);
      if (!root.isConnected) return removeEventListener('message', onMsg);
      if (f && e.source === f.contentWindow && e.data && typeof e.data.__pbErr === 'string' && !st.err) showErr(e.data.__pbErr);
    };
    addEventListener('message', onMsg);

    // ---------- start: models from the server, most recent project ----------
    (async () => {
      try {
        const h = await (await fetch(`${host.api}/api/health`)).json();
        st.models = h.models || []; st.real = !!h.real; if (h.credit) st.credit = h.credit;
      } catch { st.models = []; }
      const sel = $('#crModel', root);
      if (!st.models.length) {
        sel.innerHTML = '<option>Offline</option>'; sel.disabled = true; $('#crSend', root).disabled = true;
        $('#crMode', root).textContent = host.tr('Studio server offline');
      } else {
        let saved = null; try { saved = localStorage.getItem('pb-create-model'); } catch {}
        st.model = st.models.some(m => m.id === saved) ? saved : (st.models.find(m => m.id === 'claude-opus-5-5') || st.models[0]).id;
        sel.innerHTML = st.models.map(m => `<option value="${esc(m.id)}" ${m.id === st.model ? 'selected' : ''}>${esc(m.label)}</option>`).join('');
        $('#crMode', root).textContent = host.tr(st.real ? '' : 'Demo mode');
        drawPrice();
      }
      const list = (await DB.all()).sort((a, b) => b.updated - a.updated);
      if (list[0]) open(list[0]); else drawAll();
      host.apply?.(root);
    })();
  }

  window.PB_CREATE = { mount, _test: { withProbe, DB } };
})();
