// Playbook Create: describe a game, get it running here, keep changing it by chatting, publish it.
// Loaded on demand by app.js for #/create/studio. Talks to the Playbook Create Worker (worker/ in the workspace).
// Accounts, credits and cloud saving come from cloud.js (host.cloud). Signed out, projects stay in this browser.
// Games run in a sandboxed iframe (scripts only, no same-origin), so a generated game can't touch this site.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slug = s => (String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-game').slice(0, 60);
  const uid = () => 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  const kb = n => `${Math.max(1, Math.round(n / 1024))} KB`;

  // ---------- browser storage: IndexedDB, with an in-memory fallback (private windows) ----------
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
  // The probe also answers the studio's checks: {__pbCmd:'probe'} returns errors, frames drawn, what is on screen and
  // an optional screenshot of the biggest canvas; {__pbCmd:'input'} presses keys and clicks like a first-time player.
  const PROBE = `<script data-pb-probe>(function(){
var errs=0,frames=0,types={},P=parent;
var s=function(m){errs++;try{P.postMessage({__pbErr:String(m).slice(0,1500)},'*')}catch(e){}};
addEventListener('error',function(e){s((e.message||'Script error')+(e.lineno?' (line '+e.lineno+')':''))});
addEventListener('unhandledrejection',function(e){var r=e.reason;s('Unhandled promise rejection: '+(r&&r.message||r))});
var ce=console.error;console.error=function(){s([].slice.call(arguments).join(' '));return ce.apply(console,arguments)};
var raf=window.requestAnimationFrame;window.requestAnimationFrame=function(cb){return raf.call(window,function(t){frames++;cb(t)})};
var ael=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,f,o){types[t]=1;return ael.call(this,t,f,o)};
function big(){var b=null,a=0;[].forEach.call(document.querySelectorAll('canvas'),function(c){var r=c.getBoundingClientRect(),x=r.width*r.height;if(x>a){a=x;b=c}});return b}
function snap(w){var c=big();if(!c||!c.width||!c.height)return null;var o=document.createElement('canvas'),k=Math.min(1,w/c.width);o.width=Math.max(1,Math.round(c.width*k));o.height=Math.max(1,Math.round(c.height*k));try{o.getContext('2d').drawImage(c,0,0,o.width,o.height)}catch(e){return null}return o}
function look(o){if(!o)return null;try{var g=document.createElement('canvas');g.width=16;g.height=10;var x=g.getContext('2d');x.drawImage(o,0,0,16,10);var d=x.getImageData(0,0,16,10).data,sig=[],n=0,sum=0,sq=0,seen={},cols=0;
for(var i=0;i<d.length;i+=4){var v=Math.round((d[i]*3+d[i+1]*6+d[i+2])/10);sig.push(v);sum+=v;sq+=v*v;n++;var k=(d[i]>>5)+'.'+(d[i+1]>>5)+'.'+(d[i+2]>>5);if(!seen[k]){seen[k]=1;cols++}}
var m=sum/n,full=o.getContext('2d').getImageData(0,0,o.width,o.height).data,fc={},fn=0;for(var j=0;j<full.length;j+=4*97){var q=(full[j]>>4)+'.'+(full[j+1]>>4)+'.'+(full[j+2]>>4);if(!fc[q]){fc[q]=1;fn++}}
return{std:Math.sqrt(Math.max(0,sq/n-m*m)),cols:cols,detail:fn,sig:sig}}catch(e){return{tainted:true}}}
function key(t,c,k,n){var e=new KeyboardEvent(t,{bubbles:true,cancelable:true,code:c,key:k});try{Object.defineProperty(e,'keyCode',{get:function(){return n}});Object.defineProperty(e,'which',{get:function(){return n}})}catch(x){}(document.activeElement||document.body).dispatchEvent(e)}
function tap(el,x,y){['pointerdown','mousedown','touchstart','pointerup','mouseup','touchend','click'].forEach(function(t){var e;try{e=t.indexOf('touch')===0?new TouchEvent(t,{bubbles:true,cancelable:true,touches:t==='touchstart'?[new Touch({identifier:1,target:el,clientX:x,clientY:y})]:[],changedTouches:[new Touch({identifier:1,target:el,clientX:x,clientY:y})]}):t.indexOf('pointer')===0?new PointerEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,isPrimary:true,pointerType:'mouse'}):new MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y})}catch(err){return}el.dispatchEvent(e)})}
addEventListener('message',function(ev){var d=ev.data;if(!d||ev.source!==P||!d.__pbCmd)return;
if(d.__pbCmd==='input'){try{window.focus()}catch(x){}
var b=[].filter.call(document.querySelectorAll('button,[role=button]'),function(x){return /start|play|begin|go|开始|游戏/i.test(x.textContent||'')&&x.offsetParent})[0];if(b)b.click();
var c=big()||document.body,r=c.getBoundingClientRect();tap(c,r.left+r.width/2,r.top+r.height/2);
[['Space',' ',32],['Enter','Enter',13],['ArrowUp','ArrowUp',38],['KeyW','w',87]].forEach(function(k){key('keydown',k[0],k[1],k[2]);key('keyup',k[0],k[1],k[2])});
key('keydown','ArrowRight','ArrowRight',39);key('keydown','KeyD','d',68);setTimeout(function(){key('keyup','ArrowRight','ArrowRight',39);key('keyup','KeyD','d',68);key('keydown','ArrowLeft','ArrowLeft',37);setTimeout(function(){key('keyup','ArrowLeft','ArrowLeft',37)},300)},400);return}
if(d.__pbCmd==='probe'){raf.call(window,function(){var o=snap(d.w||640),out={__pbProbe:d.id,errs:errs,frames:frames,types:Object.keys(types),canvas:!!big(),text:((document.body&&document.body.innerText)||'').trim().length,nodes:document.body?document.body.getElementsByTagName('*').length:0,look:look(o)};
if(d.shot&&o){try{out.shot=o.toDataURL('image/jpeg',0.82)}catch(x){}}P.postMessage(out,'*')})}});
})();<\/script>`;
  const withProbe = html => /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + PROBE) : PROBE + html;

  const STARTERS = [
    ['A neon snake game where the snake leaves a glowing trail', '一条会留下发光轨迹的霓虹贪吃蛇'],
    ['A cozy 3D marble maze you tilt with the arrow keys', '用方向键倾斜的治愈 3D 弹珠迷宫'],
    ['A one-button rhythm runner with procedural music', '配程序生成音乐的单键节奏跑酷'],
    ['A top-down space shooter with waves and a boss', '有一波波敌人和 Boss 的俯视角太空射击'],
  ];

  // line icons (24px grid, stroked)
  const ICONS = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    tune: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    computer: '<rect x="3.5" y="4" width="17" height="11.5" rx="1.5"/><path d="M1.5 19.5h21"/>',
    both: '<rect x="2" y="5" width="13" height="9" rx="1.2"/><path d="M1 17.5h12"/><rect x="16" y="8" width="6.5" height="12" rx="1.6"/>',
    portrait: '<rect x="7" y="3" width="10" height="18" rx="2.2"/>',
    landscape: '<rect x="3" y="7" width="18" height="10" rx="2.2"/>',
    arcade: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5.5h3V7a3 3 0 0 1-3 3M7 5.5H4V7a3 3 0 0 0 3 3"/>',
    levels: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    spark: '<path d="M12 3.5 13.7 9 19 10.5l-5.3 1.6L12 17.5l-1.7-5.4L5 10.5 10.3 9z"/><path d="M19 17.5v3M17.5 19h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;

  function mount(root, host) {
    const { esc } = host, cloud = host.cloud, T = (en, cn) => (host.zh ? cn : en);
    const st = { models: [], real: false, model: 'mock', project: null, cur: -1, busy: null, err: '', view: 'game', list: [], credit: { usd: 0.01, markup: 2, freeFixes: 2, mock: 0 }, fixStreak: 0, tune: false, sync: Promise.resolve(), syncErr: '' };
    const tool = (act, ic, label, extra = '') => `<button class="cr-tb" data-act="${act}" aria-label="${label}" data-tip="${label}" ${extra}>${icon(ic)}</button>`;
    root.innerHTML = `
      <div class="cr-app" data-view="chat">
        <header class="cr-head">
          <div class="cr-head-l">
            <button class="cr-proj" id="crProjBtn" aria-expanded="false" aria-haspopup="true"><span class="cr-proj-k">${T('Project', '项目')}</span><span class="cr-proj-t" id="crTitle" data-noi18n>${T('New game', '新游戏')}</span>${icon('chev')}</button>
            <button class="cr-tb cr-new" data-act="new" aria-label="${T('New game', '新游戏')}" data-tip="${T('New game', '新游戏')}">${icon('plus')}</button>
            <span class="cr-sync" id="crSync"></span>
            <div class="cr-projects" id="crProjects" hidden></div>
          </div>
          <div class="cr-head-r"><div class="cr-acct" id="crAcct"></div><button class="btn btn-sm btn-accent cr-pub" data-act="publish" id="crPub">${T('Publish', '发布')}</button></div>
        </header>
        <aside class="cr-side">
          <div class="cr-msgs" id="crMsgs" aria-live="polite"></div>
          <form class="cr-compose" id="crForm">
            <div class="cr-box">
              <textarea id="crIn" rows="2" maxlength="4000" placeholder="${T('Ask for a change: “make it harder”, “add a boss”…', '说说要改什么：“难一点”“加一个 Boss”……')}" aria-label="${T('Describe what to change', '描述要怎么改')}"></textarea>
              <div class="cr-row">
                <label class="cr-model" title="${T('Model', '模型')}">${icon('spark')}<select id="crModel" aria-label="${T('Model', '模型')}"></select>${icon('chev')}</label>
                <span class="cr-mode" id="crMode"></span>
                <button class="btn btn-accent cr-send" type="submit" id="crSend">${T('Make it', '生成')}</button>
              </div>
            </div>
          </form>
        </aside>
        <section class="cr-stage">
          <div class="cr-bar">
            <div class="cr-vers" id="crVer" aria-label="${T('Versions', '版本')}"></div>
            <div class="cr-tools">
              ${tool('undo', 'undo', T('Undo this turn (free)', '撤销本轮（免费）'))}
              ${tool('tune', 'tune', T('Tune values (free)', '调参（免费）'), 'aria-pressed="false"')}
              ${tool('restart', 'restart', T('Restart the game', '重新开始'))}
              ${tool('code', 'code', T('Show the code', '查看代码'), 'aria-pressed="false"')}
              ${tool('full', 'full', T('Full screen', '全屏'))}
              ${tool('download', 'download', T('Download HTML', '下载 HTML'))}
            </div>
          </div>
          <div class="cr-err" id="crErr" hidden><span id="crErrText" data-noi18n></span><button class="btn btn-sm btn-accent" data-act="fix" id="crFixBtn">Ask AI to fix</button><button class="cr-x" data-act="dismiss" aria-label="${T('Dismiss', '关闭')}">×</button></div>
          <div class="cr-tune" id="crTune" hidden></div>
          <div class="cr-frame" id="crFrame"></div>
          <div class="cr-build" id="crBuild" hidden></div>
          <div class="cr-wiz" id="crWiz" hidden></div>
          <pre class="cr-code" id="crCode" hidden data-noi18n></pre>
        </section>
        <nav class="cr-tabs" aria-label="${T('Studio views', '工作室视图')}"><button data-tab="chat" class="on">${T('Chat', '对话')}</button><button data-tab="game">${T('Game', '游戏')}</button></nav>
      </div>`;
    const msgs = $('#crMsgs', root), input = $('#crIn', root), frameBox = $('#crFrame', root), app = $('.cr-app', root), wizBox = $('#crWiz', root);

    // ---------- account (top right) ----------
    const drawAcct = () => {
      const box = $('#crAcct', root), u = cloud?.user;
      if (!cloud) { box.hidden = true; return; }
      box.innerHTML = u
        ? `<button class="cr-bal" data-act="topup" title="${T('Your credits. Click to top up.', '你的 credits，点击充值')}"><b>${u.balance}</b><span>credits</span><i>+</i></button><details class="cr-menu"><summary aria-label="${T('Account', '账号')}"><span class="cr-ava" data-noi18n>${esc((u.name || '?').slice(0, 1).toUpperCase())}</span></summary><div><b class="cr-who" data-noi18n>${esc(u.name)}</b><label><input type="checkbox" data-ask ${cloud.askOn() ? 'checked' : ''}> ${T('Ask before spending credits', '花 credits 前先问我')}</label><button class="link" data-act="ledger">${T('Credit history', 'credits 记录')}</button><button class="link" data-act="tokens">${T('Access tokens for coding agents', '给编程 agent 的访问令牌')}</button><button class="link" data-act="signout">${T('Sign out', '退出登录')}</button></div></details>`
        : `<button class="btn btn-sm" data-act="signin">${T('Sign in', '登录')}</button>`;
      const sy = $('#crSync', root);
      sy.innerHTML = st.syncErr ? `<span class="bad" title="${esc(st.syncErr)}">${T('Not saved', '未保存')}</span>` : st.project?.versions.length ? `<span>${u && st.project.cloud ? T('Saved to your account', '已存进账号') : T('Saved in this browser', '已存在这个浏览器')}</span>` : '';
    };
    cloud?.on(() => { drawAcct(); drawPrice(); drawPub(); });

    // ---------- rendering ----------
    const ver = () => st.project?.versions[st.cur];
    const isWiz = () => { const p = st.project; return !p || (!p.messages.length && !p.versions.length); };
    const INTRO = () => `<div class="cr-intro">
        <span class="tag"><span class="dot"></span>${T('AI game studio', 'AI 游戏工作室')}</span>
        <h2>${T('Describe it. Play it. Keep changing it.', '描述它，玩它，接着改。')}</h2>
        <ol class="cr-how">
          <li><b>${T('Plan', '规划')}</b><span>${T('Answer three questions and pick a look. No code yet.', '回答三个问题、选一种画风，还不写代码。')}</span></li>
          <li><b>${T('Build', '生成')}</b><span>${T('The AI writes the whole game. It runs right here.', 'AI 写出完整的游戏，直接在这里运行。')}</span></li>
          <li><b>${T('Change', '修改')}</b><span>${T('Ask for changes in chat, or drag the Tune sliders for free.', '在对话里提修改，或者免费拖动调参滑块。')}</span></li>
          <li><b>${T('Publish', '发布')}</b><span>${T('An automatic test plays it first. Then you get a link.', '先自动试玩一遍，通过后拿到分享链接。')}</span></li>
        </ol>
      </div>`;
    const drawMsgs = () => {
      const p = st.project, wiz = isWiz();
      app.classList.toggle('wiz', wiz);
      wizBox.hidden = !wiz;
      if (wiz) {
        msgs.innerHTML = INTRO();
        wizBox.innerHTML = `<div class="cr-wz">${wizardHTML()}</div>`;
        host.apply?.(wizBox);
      } else {
        wizBox.innerHTML = '';
        msgs.innerHTML = (p.plan ? `<details class="cr-plan"><summary>${T('Game plan', '游戏计划')}</summary><pre data-noi18n>${esc(p.plan)}</pre></details>` : '') + p.messages.map(m => m.role === 'user'
          ? `<div class="cr-msg me" data-noi18n>${esc(m.text)}</div>`
          : m.role === 'error' ? `<div class="cr-msg bad"><span>${esc(m.text)}</span>${m.retry && m === p.messages[p.messages.length - 1] && !st.busy ? `<button class="link" data-act="retry">${T('Try again', '重试')}</button>` : ''}${m.topup ? `<button class="link" data-act="topup">${T('Get credits', '购买 credits')}</button>` : ''}${m.signin ? `<button class="link" data-act="signin">${T('Sign in', '登录')}</button>` : ''}</div>`
          : `<div class="cr-msg ai"><div class="cr-v"><button class="cr-vtag ${m.v === st.cur ? 'on' : ''}" data-goto="${m.v}" title="${m.v === st.cur ? T('Playing this version', '正在玩这个版本') : T('Open this version', '打开这个版本')}">v${m.v + 1}</button>${m.free ? `<span class="cr-cost">${T('Free fix', '免费修复')}</span>` : m.credits ? `<span class="cr-cost">${m.credits} credits</span>` : `<span class="cr-cost">${T('0 credits', '0 credits')}</span>`}${m.mode === 'edit' ? `<span class="cr-cost">${T('small edit', '增量修改')}</span>` : ''}</div><p data-noi18n>${esc(m.text || 'Done.')}</p></div>`).join('');
      }
      if (st.busy) msgs.insertAdjacentHTML('beforeend', `<div class="cr-msg ai busy"><span class="cr-spin" aria-hidden="true"></span><span id="crStatus">${esc(st.busy.status)}</span><span class="cr-size" id="crSize"></span><button class="link" data-act="stop">${T('Stop', '停止')}</button></div>`);
      host.apply?.(msgs);
      msgs.scrollTop = msgs.scrollHeight;
      drawBuild();
    };
    // the build card over the stage while the model works: steps, knowledge in use, how much code is written
    const STEPS = () => [T('Read the request', '读懂需求'), ver() ? T('Change the code', '修改代码') : T('Write the code', '写代码'), T('Start the game', '启动游戏')];
    const stageOf = msg => /writ|chang|rewrit|写|改/i.test(msg || '') ? 1 : 0;
    const drawBuild = () => {
      const box = $('#crBuild', root), b = st.busy;
      box.hidden = !b;
      if (!b) { box.innerHTML = ''; return; }
      box.classList.toggle('edit', !!ver());
      const at = b.stage || 0;
      box.innerHTML = `<div class="cr-build-card" role="status">
          <div class="cr-build-h"><span class="cr-spin" aria-hidden="true"></span><b id="crStatus2">${esc(b.status)}</b><button class="link" data-act="stop">${T('Stop', '停止')}</button></div>
          <ol class="cr-steps">${STEPS().map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><i></i><span>${s}</span></li>`).join('')}</ol>
          <div class="cr-meter"><span><span id="crSize2">${b.chars ? kb(b.chars) : '0 KB'}</span> ${T('of code written', '代码已写出')}</span>${b.know?.length ? `<span class="cr-know" title="${T('Game-making knowledge the AI is using for this game', 'AI 为这款游戏用到的游戏制作知识')}">${T('Using', '使用')} ${b.know.map(k => `<em data-noi18n>${esc(k)}</em>`).join('')}</span>` : ''}</div>
        </div>`;
    };
    const updBuild = () => {
      const b = st.busy; if (!b) return;
      const s2 = $('#crStatus2', root); if (s2) s2.textContent = b.status;
      const z2 = $('#crSize2', root); if (z2) z2.textContent = kb(b.chars || 1);
      $$('.cr-steps li', root).forEach((li, i) => { li.className = i < (b.stage || 0) ? 'done' : i === (b.stage || 0) ? 'now' : ''; });
    };
    const drawVersions = () => {
      const vs = st.project?.versions || [], box = $('#crVer', root);
      box.innerHTML = vs.length
        ? `<span class="cr-vers-k">${T('Versions', '版本')}</span>` + vs.map((v, i) => `<button class="cr-vchip ${i === st.cur ? 'on' : ''} ${v.model === 'tune' ? 'tuned' : ''}" data-goto="${i}" title="${esc((v.prompt || '').slice(0, 80))}" aria-pressed="${i === st.cur}">v${i + 1}</button>`).join('')
        : `<span class="cr-vers-k">${T('No versions yet', '还没有版本')}</span>`;
      const on = $('.cr-vchip.on', box); if (on) box.scrollLeft = on.offsetLeft - box.clientWidth / 2;
      $$('.cr-tools .cr-tb', root).forEach(b => { b.disabled = !vs.length; });
      drawPub();
    };
    const drawPub = () => { const b = $('#crPub', root); if (!b) return; b.hidden = !cloud; b.disabled = !ver(); b.textContent = st.project?.gameId ? T('Published', '已发布') : T('Publish', '发布'); };
    const device = () => { const s = st.project?.setup || ''; return /Platform: Phone(;|$)/.test(s) ? (/Landscape/.test(s) ? 'landscape' : 'portrait') : 'full'; };
    const EMPTY = () => `<div class="cr-empty" id="crEmpty"><b>${T('Your game shows up here', '你的游戏会出现在这里')}</b><span>${T('Describe a change in the chat, or start a new game.', '在对话里描述修改，或者开始一个新游戏。')}</span></div>`;
    const drawFrame = () => {
      const v = ver(); hideErr();
      $('#crEmpty', root)?.remove();
      $('iframe', frameBox)?.remove();
      frameBox.dataset.device = device();
      if (!v) { frameBox.innerHTML = isWiz() ? '' : EMPTY(); host.apply?.(frameBox); return; }
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
    const curModel = () => st.models.find(x => x.id === st.model);
    const estimate = (kind = 'auto') => {
      const m = curModel(); if (!m) return 0;
      if (!m.price?.output) return m.id === 'mock' && cloud?.user ? (kind === 'plan' ? Math.ceil(st.credit.mock / 4) : st.credit.mock) : 0;
      if (kind === 'plan') return Math.ceil(((800 * m.price.input + 1500 * m.price.output) / 1e6) * st.credit.markup / st.credit.usd);
      const v = ver(), edit = kind === 'fix' || (kind === 'auto' && v);
      const tin = edit ? (v?.html.length || 0) / 3.5 + 3500 : 3500, tout = edit ? 2500 : 18000;
      const usd = (tin * m.price.input + tout * m.price.output) / 1e6;
      return Math.ceil(usd * st.credit.markup / st.credit.usd);
    };
    const priceLabel = n => n ? `≈ ${n} credits` : T('Free', '免费');
    const drawPrice = () => {
      const n = estimate(), v = ver(), b = $('#crSend', root);
      b.textContent = `${v ? T('Change it', '修改') : T('Make it', '生成')} · ${priceLabel(n)}`;
      const fb = $('#crFixBtn', root); if (fb) fb.textContent = st.fixStreak < st.credit.freeFixes ? T('Ask AI to fix (free)', '让 AI 修复（免费）') : `${T('Ask AI to fix', '让 AI 修复')} · ${priceLabel(estimate('fix'))}`;
    };
    const drawTitle = () => { $('#crTitle', root).textContent = st.project?.title || T('New game', '新游戏'); };
    const drawAll = () => { drawTitle(); drawAcct(); drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); };
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
      box.innerHTML = '<div class="cr-tune-h"><b>' + T('Tune', '调参') + '</b><span>' + T('Changes apply instantly and cost 0 credits', '拖动即时生效，不花 credits') + '</span></div>' + items.map(it => {
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
        if (v.model === 'tune' && st.cur === p.versions.length - 1) { v.html = html; v.dirty = true; }   // keep tweaking the same tuned version
        else {
          p.versions.push({ html, summary: '', prompt: T('Tuned', '调参'), at: Date.now(), model: 'tune', credits: 0 });
          st.cur = p.versions.length - 1;
          p.messages.push({ role: 'ai', text: T('Tuned values with the panel (0 credits).', '用调参面板改了数值（不花 credits）。'), v: st.cur, credits: 0 });
          drawMsgs();
        }
        drawVersions(); drawFrame(); save();
      }, 350);
    });

    // ---------- projects: this browser (IndexedDB) always; the account too when signed in ----------
    const newProject = () => ({ id: uid(), title: '', created: Date.now(), updated: Date.now(), versions: [], messages: [] });
    const strip = p => ({ ...p, versions: p.versions.map(({ dirty, ...v }) => v) });

    // Upload whatever the account doesn't have yet: the project itself, new versions, a re-tuned latest version, the chat.
    function sync(p) {
      if (!cloud?.user || !p || (!p.versions.length && !p.messages.length)) return st.sync;
      st.sync = st.sync.then(async () => {
        try {
          if (!p.cloud) {
            const j = await cloud.getJSON('/api/projects', { method: 'POST', body: { id: p.id, title: p.title, plan: p.plan, setup: p.setup, messages: p.messages } });
            if (j.id !== p.id) { await DB.del(p.id); p.id = j.id; }
            p.cloud = true; p.synced = 0;
          }
          for (let n = p.synced || 0; n < p.versions.length; n++) {
            const v = p.versions[n];
            await cloud.req(`/api/projects/${p.id}/versions/${n}`, { method: 'PUT', body: { html: v.html, prompt: v.prompt, summary: v.summary, model: v.model, mode: v.mode, credits: v.credits || 0 } });
            p.synced = n + 1; v.dirty = false;
          }
          const last = p.versions[p.versions.length - 1];
          if (last?.dirty) { await cloud.req(`/api/projects/${p.id}/versions/${p.versions.length - 1}`, { method: 'PUT', body: { html: last.html, prompt: last.prompt, summary: last.summary, model: last.model, mode: last.mode, credits: 0 } }); last.dirty = false; }
          await cloud.req(`/api/projects/${p.id}`, { method: 'PUT', body: { title: p.title, plan: p.plan, setup: p.setup, messages: p.messages } });
          await DB.put(strip(p));
          st.syncErr = ''; drawAcct();
        } catch (e) {
          if (e.status === 404 || e.status === 409) { p.cloud = false; p.synced = 0; }   // gone or out of sync: re-create on the next save
          st.syncErr = e.message; drawAcct();
        }
      });
      return st.sync;
    }
    const save = async () => {
      const p = st.project; if (!p?.versions.length && !p?.messages.length) return;
      p.updated = Date.now();
      try { await DB.put(strip(p)); } catch { host.toast(T('Could not save in this browser', '无法保存在这个浏览器里')); }
      drawAcct();
      sync(p);
    };
    const open = p => { st.project = p; st.cur = p.versions.length - 1; st.fixStreak = 0; drawAll(); };
    async function openCloud(pid) {
      const j = await cloud.getJSON(`/api/projects/${pid}`);
      const p = { id: j.project.id, title: j.project.title, plan: j.project.plan, setup: j.project.setup, messages: j.project.messages || [], gameId: j.project.gameId, remixOf: j.project.remixOf, created: j.project.created, updated: j.project.updated,
        versions: j.versions.map(v => ({ html: v.html, prompt: v.prompt, summary: v.summary, model: v.model, mode: v.mode, credits: v.credits, at: v.created })), cloud: true };
      p.synced = p.versions.length;
      await DB.put(p); open(p); return p;
    }
    // Put browser projects into the account after signing in (once each).
    async function moveLocal() {
      const local = (await DB.all()).filter(p => !p.cloud && p.versions?.length);
      for (const p of local) await sync(p);
      if (local.length) host.toast(T(`Saved ${local.length} game${local.length > 1 ? 's' : ''} from this browser to your account`, `已把这个浏览器里的 ${local.length} 个游戏存进账号`));
    }
    const drawProjects = async () => {
      const box = $('#crProjects', root);
      const local = (await DB.all()).filter(p => !cloud?.user || !p.cloud);
      let remote = [];
      if (cloud?.user) { try { remote = (await cloud.getJSON('/api/projects')).projects; } catch {} }
      st.list = [...remote.map(p => ({ ...p, remote: true })), ...local.map(p => ({ id: p.id, title: p.title, updated: p.updated, versions: p.versions.length, local: true }))].sort((a, b) => b.updated - a.updated);
      box.innerHTML = st.list.length
        ? st.list.map(p => `<div class="cr-pi ${p.id === st.project?.id ? 'on' : ''}"><button data-open="${esc(p.id)}"><b data-noi18n>${esc(p.title || 'Untitled game')}</b><span>${p.versions} ${T(p.versions === 1 ? 'version' : 'versions', '个版本')} · ${new Date(p.updated).toLocaleDateString()}${p.game_id ? ` · ${T('published', '已发布')}` : ''}${p.local && cloud?.user ? ` · ${T('this browser', '本浏览器')}` : ''}</span></button><button class="cr-x" data-del="${esc(p.id)}" aria-label="Delete ${esc(p.title || 'Untitled game')}">×</button></div>`).join('')
        : `<p class="muted small">${cloud?.user ? T('Your games are saved to your account.', '你的游戏会保存在账号里。') : T('Games you make are kept in this browser. Sign in to keep them in your account.', '游戏保存在这个浏览器里。登录后可以存进账号。')}</p>`;
      host.apply?.(box);
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
      return [`Title: ${p.title}`, `Idea: ${w.idea}`, `Core loop: ${p.summary}`, `Setup: ${setupText(w)}`, 'Design decisions:', ...p.questions.map((q, i) => `- ${q.topic || q.question}: ${q.options[w.answers[i] ?? q.recommended]}`),
        w.style > -1 && p.styles[w.style] ? `Art direction: ${p.styles[w.style].name}: ${p.styles[w.style].description}` : ''].filter(Boolean).join('\n');
    };
    const steps = w => ['platform', ...(w.platform && w.platform !== 'computer' ? ['orientation'] : []), 'mode', 'idea', 'planning', 'q0', 'q1', 'q2', 'style', 'review'];
    const go = (dir) => { const s = steps(st.wiz), i = s.indexOf(st.wiz.step); st.wiz.step = s[Math.max(0, Math.min(s.length - 1, i + dir))]; drawMsgs(); };
    const wizardHTML = () => {
      const w = st.wiz;
      // progress: Setup · Idea · Plan · Look · Build
      const PH = [T('Setup', '设置'), T('Idea', '想法'), T('Plan', '规划'), T('Look', '画风'), T('Build', '生成')];
      const ph = WIZ[w.step] ? 0 : w.step === 'idea' ? 1 : /^q\d$|planning/.test(w.step) ? 2 : w.step === 'style' ? 3 : 4;
      const head = `<div class="cr-wz-top">${w.step !== 'platform' && w.step !== 'planning' ? `<button class="link" data-wiz-back>← ${T('Back', '返回')}</button>` : '<span></span>'}<ol class="cr-wz-prog" aria-label="${T('Progress', '进度')}">${PH.map((x, i) => `<li class="${i < ph ? 'done' : i === ph ? 'now' : ''}"><span>${x}</span></li>`).join('')}</ol></div>`;
      if (WIZ[w.step]) {
        const d = WIZ[w.step];
        return head + `<h2 class="cr-wz-h">${d.title}</h2>${d.note ? `<p class="cr-wz-p">${d.note}</p>` : ''}<div class="cr-wz-opts cards n${d.opts.length}">${d.opts.map(([v, t, sub]) => `<button class="cr-wz-opt ${w[w.step] === v ? 'on' : ''}" data-wiz="${w.step}:${v}"><span class="cr-wz-ic">${icon(v)}</span><b>${t}</b><span>${sub}</span></button>`).join('')}</div>`;
      }
      if (w.step === 'idea') {
        return head + `<h2 class="cr-wz-h">What are we building?</h2><p class="cr-wz-p">Describe it in your own words. The AI asks three questions and suggests art directions before it writes any code.</p>
          <div class="cr-idea"><textarea id="crIdea" rows="4" maxlength="4000" placeholder="e.g. a one-button runner where you jump to the beat" aria-label="Your game idea">${esc(w.idea)}</textarea><div class="cr-idea-tags">${['platform', 'orientation', 'mode'].filter(k => w[k] && (k !== 'orientation' || w.platform !== 'computer')).map(k => `<span class="chip">${icon(w[k])}${label(k, w[k])}</span>`).join('')}</div></div>
          <div class="cr-starters">${STARTERS.map(([en, cn]) => T(en, cn)).map(x => `<button class="chip" data-starter="${esc(x)}" data-noi18n>${esc(x)}</button>`).join('')}</div>
          ${w.err ? `<p class="cr-wz-err">${esc(w.err)}</p>` : ''}
          <div class="cr-wz-acts"><button class="btn btn-accent" data-wiz-start>${T('Start planning', '开始规划')} · ${priceLabel(estimate('plan'))}</button><button class="link" data-wiz-skip>${T('Skip planning and build now', '跳过规划，直接生成')}</button></div>
          ${host.recipes?.length ? `<div class="sx-k">Or start from a Playbook template</div><div class="cr-starters">${host.recipes.map(r => `<button class="chip" data-recipe="${esc(r.id)}">${esc(r.title)}</button>`).join('')}</div>` : ''}`;
      }
      if (w.step === 'planning') return head + `<div class="cr-wz-wait"><span class="cr-spin" aria-hidden="true"></span><div><b>${T('Planning your game', '正在规划你的游戏')}</b><span>${T('Usually 10 to 30 seconds', '通常 10 到 30 秒')}</span></div></div><p class="cr-wz-idea" data-noi18n>${esc(w.idea)}</p>`;
      const plan = w.plan, planBox = plan ? `<details class="cr-plan"><summary>Game plan</summary><b data-noi18n>${esc(plan.title)}</b><p data-noi18n>${esc(plan.summary)}</p></details>` : '';
      const qi = /^q(\d)$/.exec(w.step);
      if (qi) {
        const i = +qi[1], q = plan.questions[i];
        if (!q) { go(1); return ''; }
        return head + `<span class="cr-wz-tag">${T(`Question ${i + 1} of ${plan.questions.length}`, `第 ${i + 1} 题，共 ${plan.questions.length} 题`)}${q.topic ? ` · <span data-noi18n>${esc(q.topic)}</span>` : ''}</span><h2 class="cr-wz-h" data-noi18n>${esc(q.question)}</h2>
          <div class="cr-wz-opts">${q.options.map((o, j) => `<button class="cr-wz-opt ${(w.answers[i] ?? -1) === j ? 'on' : ''}" data-wiz-ans="${i}:${j}"><b data-noi18n>${esc(o)}</b>${j === q.recommended ? `<span class="cr-rec">${T('Recommended', '推荐')}</span>` : ''}</button>`).join('')}</div>
          <button class="link" data-wiz-defaults>${T('Use the recommended answers for the rest', '其余都用推荐答案')}</button>${planBox}`;
      }
      if (w.step === 'style') return head + `<h2 class="cr-wz-h">${T('Pick a look', '选一种美术风格')}</h2><div class="cr-wz-opts">${plan.styles.map((x, k) => `<button class="cr-wz-opt ${w.style === k ? 'on' : ''}" data-wiz-style="${k}"><b data-noi18n>${esc(x.name)}</b><span data-noi18n>${esc(x.description)}</span></button>`).join('')}</div>${planBox}`;
      if (w.step === 'review') return head + `<h2 class="cr-wz-h">${T('Game plan', '游戏计划')}</h2><pre class="cr-wz-plan" data-noi18n>${esc(planText(w))}</pre>
          <div class="cr-wz-acts"><button class="btn btn-accent" data-wiz-build>${T('Build it', '开始生成')} · ${priceLabel(estimate('new'))}</button></div>`;
      return '';
    };

    // Real models need an account and credits; the demo model is free unless the server charges for it.
    async function canSpend(n, what) {
      const m = curModel();
      if (m && m.id !== 'mock' && !cloud?.user) {
        if (!cloud || !(await cloud.signIn(T('Sign in to use AI models. New accounts get free credits to try them.', '登录后才能使用 AI 模型。新账号送免费 credits。')))) return false;
      }
      if (n && cloud?.user) {
        if (cloud.user.balance < n) { await cloud.topUp(T(`This needs about ${n} credits and you have ${cloud.user.balance}.`, `这一步大约需要 ${n} credits，你还有 ${cloud.user.balance}。`)); return !!cloud.user && cloud.user.balance >= n; }
        return cloud.confirmSpend(n, what);
      }
      return true;
    }
    async function startPlanning() {
      const w = st.wiz, idea = ($('#crIdea', root)?.value || '').trim();
      if (!idea) { $('#crIdea', root)?.focus(); return; }
      w.idea = idea;
      if (!(await canSpend(estimate('plan'), T('Plan the game', '规划游戏')))) return;
      w.err = ''; w.step = 'planning'; w.t0 = Date.now(); drawMsgs();
      try {
        const j = cloud ? await cloud.getJSON('/api/plan', { method: 'POST', body: { model: st.model, idea, setup: setupText(w) } })
          : await (async () => { const r = await fetch(`${host.api}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: st.model, idea, setup: setupText(w) }) }); const x = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(x.error || `Request failed (${r.status})`), { status: r.status }); return x; })();
        if (!j.plan) throw new Error('The plan came back empty. Try again.');
        cloud?.setBalance(j.balance);
        w.plan = j.plan; w.planCredits = j.credits || 0; w.answers = []; w.style = -1; w.step = 'q0';
        host.track('create/plan', st.model, true);
      } catch (e) {
        cloud?.setBalance(e.data?.balance);
        w.err = e.status === 402 ? T('Not enough credits for this. Top up to continue.', 'credits 不够了，充值后继续。') : e.status === 0 ? T('Could not reach Playbook Create. Is the local server running?', '连不上 Playbook Create，本地服务器开着吗？') : host.tr(e.message);
        w.step = 'idea';
        if (e.status === 402) cloud?.topUp();
      }
      drawMsgs();
    }
    function buildFromWizard(skip) {
      const w = st.wiz, idea = skip ? ($('#crIdea', root)?.value || '').trim() : w.idea;
      if (!idea) { $('#crIdea', root)?.focus(); return; }
      const p = st.project || (st.project = newProject());
      p.title = (!skip && w.plan?.title) || idea.replace(/\s+/g, ' ').slice(0, 48);
      p.plan = skip ? `Idea: ${idea}\nSetup: ${setupText(w)}` : planText(w);
      p.setup = setupText(w);
      generate(idea);
    }

    // ---------- generation ----------
    async function generate(prompt, { error, retry } = {}) {
      if (st.busy) return;
      const freeFix = !!error && st.fixStreak < st.credit.freeFixes;
      const n = freeFix ? 0 : estimate(error ? 'fix' : 'auto');
      if (!(await canSpend(n, ver() ? T('Change the game', '修改游戏') : T('Make the game', '生成游戏')))) return;
      st.lastReq = { prompt, error };
      const p = st.project || (st.project = newProject());
      if (!p.title) p.title = prompt.replace(/\s+/g, ' ').slice(0, 48);
      const base = ver();
      if (retry) { const last = p.messages[p.messages.length - 1]; if (last?.role === 'error') p.messages.pop(); }
      else p.messages.push({ role: 'user', text: error ? `${T('Fix this error: ', '修复错误：')}${error}` : prompt });
      const ctl = new AbortController();
      st.busy = { status: T('Connecting to the model', '正在连接模型'), ctl, chars: 0, stage: 0 };
      drawTitle(); drawMsgs(); setView('chat');
      $('#crSend', root).disabled = true;
      const history = p.messages.filter(m => m.role === 'user').slice(-8, -1).map(m => m.text);
      st.fixStreak = error ? st.fixStreak + 1 : 0;
      let done = null, failed = '', status = 200, failData = null;
      try {
        if (cloud?.user) { await sync(p); if (!p.cloud) throw Object.assign(new Error(st.syncErr || T('Could not save the project to your account.', '无法把项目存进账号。')), { status: 0 }); }
        const body = { model: st.model, prompt: error ? 'Fix the error so the game runs.' : prompt, html: base?.html, error, history, plan: p.plan, setup: p.setup, projectId: cloud?.user ? p.id : undefined };
        const r = cloud ? await cloud.req('/api/generate', { method: 'POST', body, signal: ctl.signal })
          : await fetch(`${host.api}/api/generate`, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok || !r.body) { status = r.status; failed = (await r.json().catch(() => ({}))).error || `Request failed (${r.status})`; }
        else {
          const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
          for (;;) {
            const { value, done: end } = await rd.read(); if (end) break;
            buf += dec.decode(value, { stream: true });
            let i; while ((i = buf.indexOf('\n\n')) > -1) {
              const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
              if (!line.startsWith('data:')) continue;
              let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
              if (ev.t === 'status') { st.busy.status = host.tr(ev.msg); st.busy.stage = Math.max(st.busy.stage || 0, stageOf(ev.msg)); const s = $('#crStatus', root); if (s) s.textContent = st.busy.status; updBuild(); }
              if (ev.t === 'knowledge') { st.busy.know = (ev.titles || []).filter((_, k) => ev.ids?.[k] !== 'core'); drawBuild(); }
              if (ev.t === 'delta') { st.busy.chars += ev.text.length; const z = $('#crSize', root); if (z) z.textContent = kb(st.busy.chars); updBuild(); }
              if (ev.t === 'done') done = ev;
              if (ev.t === 'error') { failed = ev.msg; failData = ev; }
            }
          }
        }
      } catch (e) { status = e.status ?? 0; failData = e.data; failed = e.abort || e.name === 'AbortError' ? 'Stopped.' : (e.status ? e.message : T('Could not reach Playbook Create. Is the local server running?', '连不上 Playbook Create，本地服务器开着吗？')); }
      st.busy = null; $('#crSend', root).disabled = false;
      cloud?.setBalance((done || failData)?.balance);
      if (done) {
        p.versions.push({ html: done.html, summary: done.summary, prompt: error ? 'Fix: ' + error.slice(0, 60) : prompt, at: Date.now(), model: done.model, credits: done.credits, costUsd: done.costUsd, usage: done.usage, mode: done.mode });
        st.cur = p.versions.length - 1;
        p.messages.push({ role: 'ai', text: done.summary, v: st.cur, credits: done.credits, free: !!done.free, mode: done.mode });
        host.track('create/generate', st.model, true);
        drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); setView('game');
      } else {
        if (error) st.fixStreak--;
        const msg = status === 402 ? T('Not enough credits for this. Top up to continue.', 'credits 不够了，充值后继续。') : status === 401 ? T('Sign in to continue.', '请先登录。') : host.tr(failed || 'Something went wrong while generating.');
        p.messages.push({ role: 'error', text: msg + (failData?.refunded ? ' ' + T('Your credits were refunded.', '已退还 credits。') : ''), retry: failed !== 'Stopped.' && status !== 402 && status !== 401, topup: status === 402, signin: status === 401 });
        if (error && st.fixStreak >= st.credit.freeFixes) p.messages.push({ role: 'error', text: host.tr('Automatic fixes did not solve it. Describe what you see going wrong, or open an earlier version.') });
        drawMsgs(); drawPrice();
        if (status === 402) cloud?.topUp();
      }
      save();
    }

    // ---------- automatic test: run the game in a visible test frame, play it like a first-time player, take a cover ----------
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function playtest(html, holder) {
      const phone = /Platform: Phone/.test(st.project?.setup || '') && !/Landscape/.test(st.project?.setup || '');
      const W = phone ? 390 : 960, H = phone ? 844 : 600;
      const k = Math.min((holder.clientWidth || 380) / W, 230 / H);
      holder.innerHTML = ''; holder.style.height = Math.round(H * k) + 'px';
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock');
      f.setAttribute('allow', 'autoplay');
      f.title = T('Game test', '游戏测试');
      f.style.cssText = `width:${W}px;height:${H}px;transform:scale(${k});transform-origin:0 0;border:0;display:block;pointer-events:none;margin-left:${Math.max(0, Math.round(((holder.clientWidth || 380) - W * k) / 2))}px`;
      f.srcdoc = withProbe(html);
      const errors = [], waiters = {};
      const onM = e => { if (e.source !== f.contentWindow || !e.data) return; if (typeof e.data.__pbErr === 'string') errors.push(e.data.__pbErr); if (e.data.__pbProbe && waiters[e.data.__pbProbe]) waiters[e.data.__pbProbe](e.data); };
      addEventListener('message', onM);
      holder.append(f);
      const ask = (extra = {}, ms = 2500) => new Promise(res => {
        const id = Math.random().toString(36).slice(2);
        const t = setTimeout(() => { delete waiters[id]; res(null); }, ms);
        waiters[id] = d => { clearTimeout(t); delete waiters[id]; res(d); };
        try { f.contentWindow.postMessage({ __pbCmd: 'probe', id, w: 640, ...extra }, '*'); } catch { res(null); }
      });
      const blank = p => {
        if (!p) return true;
        if (p.canvas && p.look && !p.look.tainted) return p.look.std < 3 && p.look.cols <= 2 && p.look.detail <= 3;
        return !p.canvas && p.text < 2 && p.nodes < 4;
      };
      const run = (async () => {
        await sleep(2200);
        const a = await ask({ shot: true });
        try { f.contentWindow.postMessage({ __pbCmd: 'input' }, '*'); } catch {}
        await sleep(1700);
        const b = await ask({ shot: true });
        const listens = (b?.types || []).some(t => /^(key|pointer|mouse|touch|click)/.test(t));
        const moved = a?.look?.sig && b?.look?.sig ? a.look.sig.reduce((s, v, i) => s + Math.abs(v - b.look.sig[i]), 0) / a.look.sig.length : 0;
        const checks = [
          { id: 'runs', ok: !!b, blocking: true, label: b ? T('Starts and keeps running', '能启动并持续运行') : T('The game stopped responding', '游戏没有响应') },
          { id: 'errors', ok: !errors.length && !(b?.errs), blocking: true, label: errors.length || b?.errs ? T('Errors while running', '运行时出错') : T('No errors while running', '运行时没有报错'), detail: errors[0] },
          { id: 'screen', ok: !blank(b), blocking: true, label: blank(b) ? T('Blank screen after starting', '开始后画面是空白的') : T('Something is on screen', '画面正常显示') },
          { id: 'loop', ok: !b || (b.frames - (a?.frames || 0)) > 15 || !b.canvas, blocking: false, label: !b || (b.frames - (a?.frames || 0)) > 15 || !b.canvas ? T('Animation is running', '动画在运行') : T('No animation running (fine for turn-based games)', '没有动画在运行（回合制游戏可以忽略）') },
          { id: 'input', ok: listens, blocking: false, label: listens ? (moved > 2 ? T('Reacts to keyboard, mouse or touch', '会响应键盘、鼠标或触屏') : T('Listens to keyboard, mouse or touch', '监听了键盘、鼠标或触屏')) : T('No keyboard, mouse or touch controls found', '没有找到键盘、鼠标或触屏操作') },
        ];
        const cover = (!blank(b) && b?.shot) || (!blank(a) && a?.shot) || null;
        return { checks, pass: checks.every(c => c.ok || !c.blocking), cover, errors };
      })();
      return { run, shoot: async () => (await ask({ shot: true }))?.shot || null, stop: () => { removeEventListener('message', onM); f.remove(); } };
    }

    // ---------- publishing ----------
    async function publishDialog() {
      const p = st.project, v = ver(); if (!p || !v) return;
      if (!cloud) return;
      if (!cloud.user && !(await cloud.signIn(T('Sign in to publish your game and get a link to share.', '登录后可以发布游戏，拿到分享链接。')))) return;
      await sync(p);
      if (!p.cloud) { host.toast(st.syncErr || T('Could not save the project to your account.', '无法把项目存进账号。')); return; }
      let test = null, result = null, cover = null;
      const done = cloud.dialog(`
        <h2>${p.gameId ? T('Update your published game', '更新已发布的游戏') : T('Publish your game', '发布你的游戏')}</h2>
        <p class="pbd-p">${T(`Publishes version ${st.cur + 1}. Anyone with the link can play it, and it shows up in Play under Made on Playbook. Your chat stays private.`, `发布第 ${st.cur + 1} 版。有链接的人都能玩，也会出现在“游戏”的“在 Playbook 制作”里。对话内容不会公开。`)}</p>
        <div class="pbd-test"><div class="pbd-tf" id="pbdTF"></div><div><b class="pbd-th">${T('Automatic test', '自动测试')}</b><ul class="pbd-checks" id="pbdChecks"><li class="run">${T('Playing your game like a first-time player…', '正在像新玩家一样试玩你的游戏…')}</li></ul></div></div>
        <div class="pbd-fixbar" id="pbdFixbar" hidden><button class="btn btn-sm btn-accent" data-fixit>${T('Ask AI to fix it', '让 AI 修复')}</button><button class="link" data-retest>${T('Test again', '重新测试')}</button></div>
        <div class="pbd-cover" id="pbdCover" hidden><img alt="${T('Cover', '封面')}"><div><b>${T('Cover', '封面')}</b><span>${T('Taken from your game. Shown on its card in Play.', '从游戏画面截取，显示在“游戏”页的卡片上。')}</span><button class="link" data-retake>${T('Take it again', '重新截取')}</button></div></div>
        <form class="pbd-form" id="pbdPub">
          <label class="pbd-l" for="pbdT">${T('Title', '标题')}</label>
          <input id="pbdT" maxlength="60" required value="${esc(p.title || '')}">
          <label class="pbd-l" for="pbdD">${T('One line about it (optional)', '一句话介绍（可选）')}</label>
          <input id="pbdD" maxlength="300" value="${esc(p.description || '')}">
          <button class="btn btn-accent" type="submit" disabled>${T('Testing…', '测试中…')}</button>
        </form>
        <div class="pbd-done" id="pbdDone" hidden></div>
        ${p.gameId ? `<button class="link" data-unpub>${T('Unpublish', '取消发布')}</button>` : ''}
        <p class="pbd-err" id="pbdErr" role="alert"></p>
        <p class="pbd-fine">${T('Only publish games you made and have the right to share. No copies of other games or characters.', '只发布你自己做的、有权分享的游戏。不要复制别人的游戏或角色。')}</p>`,
      (box, close) => {
        const btn = box.querySelector('#pbdPub button');
        const setCover = c => { cover = c; const cv = box.querySelector('#pbdCover'); cv.hidden = !c; if (c) cv.querySelector('img').src = c; };
        const runTest = async () => {
          test?.stop();
          btn.disabled = true; btn.textContent = T('Testing…', '测试中…');
          box.querySelector('#pbdFixbar').hidden = true;
          box.querySelector('#pbdChecks').innerHTML = `<li class="run">${T('Playing your game like a first-time player…', '正在像新玩家一样试玩你的游戏…')}</li>`;
          test = playtest(v.html, box.querySelector('#pbdTF'));
          result = await test.run;
          if (!box.isConnected) return;
          box.querySelector('#pbdChecks').innerHTML = result.checks.map(c => `<li class="${c.ok ? 'ok' : c.blocking ? 'bad' : 'warn'}"><span>${c.ok ? '✓' : c.blocking ? '✕' : '!'}</span><div>${esc(c.label)}${c.detail ? `<small data-noi18n>${esc(c.detail.slice(0, 160))}</small>` : ''}</div></li>`).join('');
          setCover(result.cover);
          box.querySelector('#pbdFixbar').hidden = result.pass;
          btn.disabled = !result.pass;
          btn.textContent = result.pass ? (p.gameId ? T('Update', '更新') : T('Publish', '发布')) : T('Fix the problems above to publish', '修好上面的问题才能发布');
          host.track('create/playtest', result.pass ? 'pass' : 'fail', true);
        };
        runTest();
        box.querySelector('[data-retest]').addEventListener('click', runTest);
        box.querySelector('[data-retake]').addEventListener('click', async () => { const c = await test?.shoot(); if (c) setCover(c); else host.toast(T('Could not take a picture of the game', '截取不到游戏画面')); });
        box.querySelector('[data-fixit]').addEventListener('click', () => {
          const bad = result?.checks.find(c => !c.ok && c.blocking);
          const msg = bad?.id === 'errors' && result.errors[0] ? result.errors[0]
            : bad?.id === 'screen' ? 'Automatic test: the screen stays blank after the game starts and after the first click or key press. Make sure it draws the title screen right away and the game after the first input.'
            : 'Automatic test: the game stopped responding (it may be stuck in an endless loop). Make sure nothing blocks the main thread.';
          close(null); generate('', { error: msg });
        });
        const showDone = (url, gid) => {
          const d = box.querySelector('#pbdDone'); d.hidden = false;
          d.innerHTML = `<b>${T('Live', '已上线')}</b><div class="cmd"><code data-noi18n>${esc(url)}</code><button class="copy" data-cp>${T('Copy', '复制')}</button></div><div class="pbd-acts"><a class="btn" href="#/m/${esc(gid)}">${T('Open the game page', '打开游戏页')}</a><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${T('Play full screen', '全屏玩')}</a></div>`;
          d.querySelector('[data-cp]').addEventListener('click', () => host.copy?.(url));
          d.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close(true)));
        };
        box.querySelector('#pbdPub').addEventListener('submit', async e => {
          e.preventDefault(); box.querySelector('#pbdErr').textContent = '';
          if (!result?.pass) return;
          btn.disabled = true;
          try {
            p.title = box.querySelector('#pbdT').value.trim() || p.title; p.description = box.querySelector('#pbdD').value.trim();
            await sync(p);
            const j = await cloud.getJSON(`/api/projects/${p.id}/publish`, { method: 'POST', body: { n: st.cur, title: p.title, description: p.description, cover } });
            p.gameId = j.id; save(); drawTitle(); drawPub();
            e.target.hidden = true; box.querySelector('.pbd-test').hidden = true; box.querySelector('#pbdCover').hidden = true;
            showDone(j.url, j.id); test?.stop();
            host.track('create/publish', '', true);
          } catch (x) { box.querySelector('#pbdErr').textContent = x.message; btn.disabled = false; }
        });
        box.querySelector('[data-unpub]')?.addEventListener('click', async () => {
          try { await cloud.req(`/api/projects/${p.id}/unpublish`, { method: 'POST' }); p.gameId = null; save(); drawPub(); host.toast(T('Unpublished', '已取消发布')); close(true); }
          catch (x) { box.querySelector('#pbdErr').textContent = x.message; }
        });
      });
      done.then(() => test?.stop());
    }

    // Personal access tokens: let Claude Code, Cursor or Codex publish here through the Playbook MCP (publish_to_playbook).
    async function tokensDialog() {
      const when = t => t ? new Date(t).toLocaleDateString() : T('never', '从未');
      const cfg = tk => JSON.stringify({ mcpServers: { playbook: { command: 'npx', args: ['-y', 'github:rexgu9911/playbook-mcp'], env: { PLAYBOOK_TOKEN: tk, PLAYBOOK_CREATE_API: host.api } } } }, null, 2);
      cloud.dialog(`<h2>${T('Access tokens', '访问令牌')}</h2>
        <p class="pbd-p">${T('Let your coding agent publish games here: the Playbook MCP has a publish_to_playbook tool. A token can only publish and list your games. It cannot spend credits or change your account, and you can revoke it anytime.', '让你的编程 agent 把游戏发布到这里：Playbook MCP 有一个 publish_to_playbook 工具。令牌只能发布和列出你的游戏，不能花 credits，也不能改账号，随时可以撤销。')}</p>
        <form class="pbd-form pbd-tk-new" id="tkNew"><label class="pbd-l" for="tkName">${T('Name', '名称')}</label><div class="pbd-row"><input id="tkName" maxlength="40" placeholder="${T('e.g. Claude Code on my laptop', '比如：笔记本上的 Claude Code')}"><button class="btn btn-accent" type="submit">${T('Make a token', '生成令牌')}</button></div></form>
        <div id="tkOnce" hidden></div>
        <div class="pbd-led" id="tkList"></div>
        <p class="pbd-err" id="tkErr" role="alert"></p>`,
      (box) => {
        const err = m => { box.querySelector('#tkErr').textContent = m || ''; };
        const draw = async () => {
          let rows = []; try { rows = (await cloud.getJSON('/api/me/tokens')).tokens; } catch (e) { err(e.message); }
          box.querySelector('#tkList').innerHTML = rows.length ? rows.map(r => `<div><span><b data-noi18n>${esc(r.name)}</b><small><code data-noi18n>${esc(r.prefix)}…</code> · ${T('made', '创建于')} ${when(r.created)} · ${T('last used', '上次使用')} ${when(r.lastUsed)}</small></span><button class="link" data-revoke="${esc(r.id)}">${T('Revoke', '撤销')}</button></div>`).join('') : `<p class="muted small">${T('No tokens yet.', '还没有令牌。')}</p>`;
        };
        box.querySelector('#tkNew').addEventListener('submit', async e => {
          e.preventDefault(); err('');
          try {
            const j = await cloud.getJSON('/api/me/tokens', { method: 'POST', body: { name: box.querySelector('#tkName').value.trim() } });
            const once = box.querySelector('#tkOnce'); once.hidden = false;
            once.innerHTML = `<div class="pbd-once"><b>${T('Copy it now. It is shown only once.', '现在就复制，它只显示这一次。')}</b><div class="cmd"><code data-noi18n>${esc(j.token)}</code><button class="copy" data-cp="tok">${T('Copy', '复制')}</button></div><span>${T('Add it to your MCP client config (never paste it into a chat):', '把它加进 MCP 客户端的配置里（不要贴进对话）：')}</span><pre data-noi18n>${esc(cfg(j.token))}</pre><button class="link" data-cp="cfg">${T('Copy the config', '复制配置')}</button></div>`;
            once.querySelector('[data-cp="tok"]').addEventListener('click', () => host.copy?.(j.token));
            once.querySelector('[data-cp="cfg"]').addEventListener('click', () => host.copy?.(cfg(j.token)));
            box.querySelector('#tkName').value = ''; draw();
          } catch (x) { err(x.message); }
        });
        box.querySelector('#tkList').addEventListener('click', async e => {
          const b = e.target.closest('[data-revoke]'); if (!b) return;
          if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = T('Revoke?', '确定撤销?'); return; }
          try { await cloud.req(`/api/me/tokens/${b.dataset.revoke}`, { method: 'DELETE' }); draw(); } catch (x) { err(x.message); }
        });
        draw();
      });
    }

    async function ledgerDialog() {
      let rows = [];
      try { rows = (await cloud.getJSON('/api/me/ledger')).entries; } catch (e) { host.toast(e.message); return; }
      const kind = { trial: T('Welcome credits', '新账号赠送'), topup: T('Top-up', '充值'), charge: T('Generation', '生成'), refund: T('Refund', '退款'), adjust: T('Adjustment', '调整') };
      cloud.dialog(`<h2>${T('Credit history', 'credits 记录')}</h2><p class="pbd-bal">${T('Balance', '余额')}: <b>${cloud.user.balance}</b> credits</p>
        <div class="pbd-led">${rows.length ? rows.map(r => `<div><span>${esc(kind[r.kind] || r.kind)}<small>${new Date(r.created).toLocaleString()}</small></span><b class="${r.delta > 0 ? 'up' : ''}">${r.delta > 0 ? '+' : ''}${r.delta}</b></div>`).join('') : `<p class="muted">${T('Nothing yet.', '还没有记录。')}</p>`}</div>`);
    }

    // ---------- events ----------
    $('#crForm', root).addEventListener('submit', e => { e.preventDefault(); const t = input.value.trim(); if (!t) return input.focus(); input.value = ''; generate(t); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $('#crForm', root).requestSubmit(); } });
    $('#crModel', root).addEventListener('change', e => { st.model = e.target.value; try { localStorage.setItem('pb-create-model', st.model); } catch {} drawPrice(); if (app.classList.contains('wiz')) drawMsgs(); });
    root.addEventListener('change', e => { if (e.target.matches('[data-ask]')) cloud?.setAsk(e.target.checked); });
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
      const rc = e.target.closest('[data-recipe]'); if (rc) { const r = host.recipes.find(x => x.id === rc.dataset.recipe); try { const html = await (await fetch(r.src)).text(); st.project = newProject(); st.project.title = r.title; st.project.versions.push({ html, summary: `Started from the Playbook template ${r.title}.`, prompt: `Template: ${r.title}`, at: Date.now(), model: 'recipe', credits: 0 }); st.project.messages.push({ role: 'ai', text: `${T('Started from the Playbook template ', '从 Playbook 模板开始：')}${r.title}`, v: 0 }); st.cur = 0; drawAll(); save(); setView('game'); } catch { host.toast('Could not load that template'); } return; }
      const g = e.target.closest('[data-goto]'); if (g) { st.cur = +g.dataset.goto; st.fixStreak = 0; drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); setView('game'); return; }
      const tb = e.target.closest('[data-tab]'); if (tb) { setView(tb.dataset.tab); return; }
      const op = e.target.closest('[data-open]'); if (op) {
        const item = st.list.find(x => x.id === op.dataset.open);
        $('#crProjects', root).hidden = true; $('#crProjBtn', root).setAttribute('aria-expanded', 'false');
        if (item?.remote) { try { await openCloud(item.id); } catch (x) { host.toast(x.message); } }
        else { const p = (await DB.all()).find(x => x.id === op.dataset.open); if (p) open(p); }
        return;
      }
      const dl = e.target.closest('[data-del]'); if (dl) {
        if (dl.dataset.confirm !== '1') { dl.dataset.confirm = '1'; dl.textContent = T('Delete?', '删除?'); return; }
        const item = st.list.find(x => x.id === dl.dataset.del);
        if (item?.remote) { try { await cloud.req(`/api/projects/${item.id}`, { method: 'DELETE' }); } catch (x) { host.toast(x.message); return; } }
        await DB.del(dl.dataset.del);
        if (st.project?.id === dl.dataset.del) { st.project = null; st.cur = -1; st.wiz = newWiz(); drawAll(); }
        drawProjects(); return;
      }
      if (!e.target.closest('.cr-projects') && !e.target.closest('#crProjBtn')) { $('#crProjects', root).hidden = true; $('#crProjBtn', root).setAttribute('aria-expanded', 'false'); }
      if (e.target.closest('#crProjBtn')) { const box = $('#crProjects', root), on = box.hidden; box.hidden = !on; e.target.closest('#crProjBtn').setAttribute('aria-expanded', on); if (on) drawProjects(); return; }
      const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
      if (a === 'new') { if (st.busy) return; $('#crProjects', root).hidden = true; st.project = null; st.cur = -1; st.wiz = newWiz(); drawAll(); }
      if (a === 'retry' && st.lastReq) generate(st.lastReq.prompt, { error: st.lastReq.error, retry: true });
      if (a === 'stop') st.busy?.ctl.abort();
      if (a === 'restart') drawFrame();
      if (a === 'undo' && st.cur > 0) { st.cur--; st.fixStreak = 0; drawMsgs(); drawVersions(); drawFrame(); drawPrice(); drawTune(); host.toast(T('Back to v', '已回到 v') + (st.cur + 1)); }
      if (a === 'tune') { st.tune = !st.tune; e.target.closest('button').setAttribute('aria-pressed', st.tune); drawTune(); }
      if (a === 'code') { const c = $('#crCode', root), on = c.hidden; c.hidden = !on; frameBox.hidden = on; e.target.closest('button').setAttribute('aria-pressed', on); }
      if (a === 'full') { const el = $('.cr-stage', root); (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); }
      if (a === 'download') { const v = ver(); if (!v) return; const b = new Blob([v.html], { type: 'text/html' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = `${slug(st.project.title)}-v${st.cur + 1}.html`; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); host.track('create/download', '', true); }
      if (a === 'publish') publishDialog();
      if (a === 'fix' && st.err) { const m = st.err; hideErr(); generate('', { error: m }); }
      if (a === 'dismiss') hideErr();
      if (a === 'signin') { if (await cloud?.signIn()) { await moveLocal(); drawProjects(); } }
      if (a === 'topup') cloud?.topUp();
      if (a === 'ledger') ledgerDialog();
      if (a === 'tokens') { $('.cr-menu', root)?.removeAttribute('open'); tokensDialog(); }
      if (a === 'signout') { await cloud?.signOut(); }
    });
    const onMsg = e => {
      const f = $('iframe', frameBox);
      if (!root.isConnected) return removeEventListener('message', onMsg);
      if (f && e.source === f.contentWindow && e.data && typeof e.data.__pbErr === 'string' && !st.err) showErr(e.data.__pbErr);
    };
    addEventListener('message', onMsg);

    // ---------- start: models and account from the server, then a project ----------
    (async () => {
      drawAcct();
      let h = null;
      try { h = cloud ? await cloud.ready : await (await fetch(`${host.api}/api/health`)).json(); } catch {}
      st.models = h?.models || []; st.real = !!h?.real; if (h?.credit) st.credit = { ...st.credit, ...h.credit };
      const sel = $('#crModel', root);
      if (!st.models.length) {
        sel.innerHTML = '<option>Offline</option>'; sel.disabled = true; $('#crSend', root).disabled = true;
        $('#crMode', root).textContent = host.tr('Studio server offline');
      } else {
        let saved = null; try { saved = localStorage.getItem('pb-create-model'); } catch {}
        st.model = st.models.some(m => m.id === saved) ? saved : (st.models.find(m => m.id === 'claude-opus-5-5') || st.models[0]).id;
        sel.innerHTML = st.models.map(m => `<option value="${esc(m.id)}" ${m.id === st.model ? 'selected' : ''}>${esc(m.label)}</option>`).join('');
        $('#crMode', root).textContent = host.tr(st.real ? '' : 'Demo mode');
      }
      drawAcct();
      // a game started from the prompt box on #/create: go straight to planning (when it is free) or to the idea step
      let seed = null; try { seed = JSON.parse(sessionStorage.getItem('pb-create-seed') || 'null'); sessionStorage.removeItem('pb-create-seed'); } catch {}
      if (seed?.idea && st.models.length) {
        st.project = null; st.cur = -1;
        st.wiz = { ...newWiz(), platform: seed.platform || 'both', orientation: seed.platform === 'computer' ? '' : (seed.orientation || 'portrait'), mode: seed.mode || 'arcade', idea: String(seed.idea).slice(0, 4000), step: 'idea' };
        drawAll(); host.apply?.(root);
        if (!estimate('plan')) startPlanning();
        return;
      }
      if (host.open && cloud?.user) { try { await openCloud(host.open); host.apply?.(root); return; } catch (e) { host.toast(e.message); } }
      let first = null;
      if (cloud?.user) { try { const r = (await cloud.getJSON('/api/projects')).projects; if (r[0]) first = await openCloud(r[0].id).catch(() => null); } catch {} }
      if (!first) { const list = (await DB.all()).filter(p => !cloud?.user || !p.cloud).sort((a, b) => b.updated - a.updated); if (list[0]) open(list[0]); else drawAll(); }
      host.apply?.(root);
    })();
  }

  window.PB_CREATE = { mount, _test: { withProbe, DB } };
})();
