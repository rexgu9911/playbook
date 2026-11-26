// Playbook accounts and credits on the client: session token, API calls, sign-in and top-up dialogs.
// Loaded on demand (with create.js, and on Made-on-Playbook game pages). Talks to the Playbook Create Worker.
// The session token is kept in localStorage ('pb-session') and sent as a bearer token; no cookies.
(() => {
  let inst = null;
  window.PB_CLOUD = { init(o) { return inst || (inst = make(o)); } };

  function make({ api, esc, toast, zh, apply, tr }) {
    const T = (en, cn) => (zh ? cn : en);
    let tok = null; try { tok = localStorage.getItem('pb-session'); } catch {}
    const subs = new Set();
    const st = { user: null, health: null, ready: null };
    const emit = () => subs.forEach(f => { try { f(st.user); } catch {} });

    async function req(path, { method = 'GET', body, signal } = {}) {
      let r;
      try {
        r = await fetch(api + path, { method, signal, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      } catch (e) { const err = new Error(e.name === 'AbortError' ? 'Stopped.' : T('Could not reach Playbook. Check your connection.', '连不上 Playbook，请检查网络。')); err.status = 0; err.abort = e.name === 'AbortError'; throw err; }
      if (r.status === 401 && tok && path !== '/api/me') { setToken(null); st.user = null; emit(); }
      if (!r.ok) { const j = await r.json().catch(() => ({})); const err = new Error(tr ? tr(j.error || `Request failed (${r.status})`) : (j.error || `Request failed (${r.status})`)); err.status = r.status; err.data = j; throw err; }
      return r;
    }
    const getJSON = async (path, o) => (await req(path, o)).json();
    const setToken = t => { tok = t; try { t ? localStorage.setItem('pb-session', t) : localStorage.removeItem('pb-session'); } catch {} };
    const setBalance = b => { if (st.user && typeof b === 'number') { st.user.balance = b; emit(); } };

    async function refresh() {
      if (!tok) { st.user = null; emit(); return null; }
      try { st.user = (await getJSON('/api/me')).user; } catch (e) { if (e.status) st.user = null; }
      if (!st.user && tok) setToken(null);
      emit(); return st.user;
    }
    st.ready = (async () => {
      try { st.health = await getJSON('/api/health'); } catch { st.health = null; }
      await refresh();
      // back from Stripe Checkout: the webhook credits the account a moment later
      if (/[?&]paid=/.test(location.hash) && st.user) {
        const before = st.user.balance;
        for (let i = 0; i < 8; i++) { await new Promise(r => setTimeout(r, 1500)); await refresh(); if (st.user && st.user.balance > before) break; }
        toast?.(st.user && st.user.balance > before ? T('Credits added. Thank you!', '已到账，谢谢！') : T('Payment received. Credits will appear shortly.', '已付款，credits 稍后到账。'));
        history.replaceState(null, '', location.hash.replace(/[?&]paid=[^&]*/, ''));
      }
      return st.health;
    })();

    // ---------- dialogs ----------
    function dialog(html, onMount) {
      return new Promise(resolve => {
        const box = document.createElement('div');
        box.className = 'pbd'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
        box.innerHTML = `<div class="pbd-scrim" data-pbd-close></div><div class="pbd-card"><button class="pbd-x" data-pbd-close aria-label="${T('Close', '关闭')}">×</button>${html}</div>`;
        const prev = document.activeElement;
        const close = v => { if (!box.isConnected) return; box.remove(); removeEventListener('keydown', onKey); removeEventListener('hashchange', onNav); try { prev?.focus(); } catch {} resolve(v); };
        const onKey = e => { if (e.key === 'Escape') close(null); };
        const onNav = () => close(null);   // a link inside or outside the dialog changed the page
        addEventListener('hashchange', onNav);
        box.addEventListener('click', e => { if (e.target.closest('[data-pbd-close]')) close(null); });
        addEventListener('keydown', onKey);
        document.body.append(box);
        apply?.(box);
        onMount?.(box, close);
        setTimeout(() => box.querySelector('input,button.btn-accent,button')?.focus(), 30);
      });
    }

    async function signIn(reason) {
      await st.ready;
      const a = st.health?.auth || {};
      if (!st.health) { toast?.(T('Could not reach Playbook. Check your connection.', '连不上 Playbook，请检查网络。')); return null; }
      return dialog(`
        <h2>${T('Sign in to Playbook', '登录 Playbook')}</h2>
        <p class="pbd-p">${esc(reason || T('Save your games to your account, publish them and use AI models with credits.', '把游戏存进账号、发布游戏，用 credits 使用 AI 模型。'))}</p>
        ${a.email ? `<form class="pbd-form" data-step="email">
          <label class="pbd-l" for="pbdEmail">${T('Email', '邮箱')}</label>
          <input id="pbdEmail" type="email" autocomplete="email" required placeholder="you@example.com">
          <button class="btn btn-accent" type="submit">${T('Email me a code', '发验证码')}</button>
        </form>
        <form class="pbd-form" data-step="code" hidden>
          <label class="pbd-l" for="pbdCode">${T('Code from the email', '邮件里的验证码')}</label>
          <input id="pbdCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required placeholder="123456">
          <p class="pbd-hint" id="pbdHint"></p>
          <button class="btn btn-accent" type="submit">${T('Sign in', '登录')}</button>
          <button class="link" type="button" data-again>${T('Use a different email', '换一个邮箱')}</button>
        </form>` : `<p class="pbd-p">${T('Sign-in is not set up on this server yet.', '这个服务器还没有开通登录。')}</p>`}
        ${a.dev ? `<div class="pbd-dev"><span>${T('Local development', '本地开发')}</span><button class="btn btn-sm" data-dev>${T('Quick dev sign-in', '开发者快速登录')}</button></div>` : ''}
        <p class="pbd-err" id="pbdErr" role="alert"></p>
        <p class="pbd-fine">${T('New accounts get a few free credits to try the AI models.', '新账号送少量 credits，用来试用 AI 模型。')}</p>`,
      (box, close) => {
        let email = '';
        const err = m => { box.querySelector('#pbdErr').textContent = m || ''; };
        const done = async j => { setToken(j.token); st.user = j.user; emit(); toast?.(j.created ? T(`Welcome! ${j.user.balance} free credits added.`, `欢迎！已送你 ${j.user.balance} credits。`) : T('Signed in', '已登录')); close(st.user); };
        box.querySelector('[data-step="email"]')?.addEventListener('submit', async e => {
          e.preventDefault(); err(''); email = box.querySelector('#pbdEmail').value.trim();
          const b = e.target.querySelector('button'); b.disabled = true;
          try {
            const j = await getJSON('/api/auth/email/start', { method: 'POST', body: { email } });
            e.target.hidden = true; const c = box.querySelector('[data-step="code"]'); c.hidden = false;
            box.querySelector('#pbdHint').textContent = j.devCode ? T(`Dev mode: your code is ${j.devCode}`, `开发模式：验证码是 ${j.devCode}`) : T(`We sent a 6-digit code to ${email}.`, `验证码已发到 ${email}。`);
            box.querySelector('#pbdCode').focus();
          } catch (x) { err(x.message); } finally { b.disabled = false; }
        });
        box.querySelector('[data-step="code"]')?.addEventListener('submit', async e => {
          e.preventDefault(); err('');
          const b = e.target.querySelector('button[type=submit]'); b.disabled = true;
          try { await done(await getJSON('/api/auth/email/verify', { method: 'POST', body: { email, code: box.querySelector('#pbdCode').value } })); }
          catch (x) { err(x.message); b.disabled = false; }
        });
        box.querySelector('[data-again]')?.addEventListener('click', () => { box.querySelector('[data-step="code"]').hidden = true; box.querySelector('[data-step="email"]').hidden = false; err(''); });
        box.querySelector('[data-dev]')?.addEventListener('click', async () => {
          try { await done(await getJSON('/api/auth/dev', { method: 'POST', body: { name: 'Dev' } })); } catch (x) { err(x.message); }
        });
      });
    }

    async function topUp(reason) {
      await st.ready;
      if (!st.user && !(await signIn(T('Sign in to buy credits.', '登录后才能买 credits。')))) return null;
      const b = st.health?.billing || { packs: [] };
      const money = p => new Intl.NumberFormat(zh ? 'zh-CN' : 'en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.cents / 100);
      return dialog(`
        <h2>${T('Get credits', '购买 credits')}</h2>
        <p class="pbd-p">${esc(reason || T('Credits pay for AI generations. Prices are shown on every button before you spend anything.', 'credits 用来支付 AI 生成。每个按钮上都会先显示价格。'))}</p>
        <p class="pbd-bal">${T('Balance', '余额')}: <b>${st.user.balance}</b> credits</p>
        <div class="pbd-packs">${b.packs.map(p => `<button class="pbd-pack" data-pack="${esc(p.id)}"><b>${p.credits.toLocaleString()} credits</b><span>${money(p)}</span></button>`).join('')}</div>
        ${b.test ? `<p class="pbd-note">${T('Test mode: no payment is taken and credits are added straight away.', '测试模式：不会扣款，credits 立即到账。')}</p>` : !b.stripe ? `<p class="pbd-note">${T('Payments are not set up on this server yet.', '这个服务器还没有开通付款。')}</p>` : `<p class="pbd-fine">${T('Payment is handled by Stripe. Credits do not expire.', '由 Stripe 处理付款。credits 不会过期。')}</p>`}
        <p class="pbd-err" id="pbdErr" role="alert"></p>
        <p class="pbd-fine">${T('A generation that fails is refunded automatically. Fixing an error the game reports is free for the first two tries.', '生成失败会自动退还。修复游戏报错的前两次免费。')}</p>`,
      (box, close) => {
        box.querySelectorAll('[data-pack]').forEach(btn => btn.addEventListener('click', async () => {
          if (!b.test && !b.stripe) return;
          box.querySelectorAll('[data-pack]').forEach(x => { x.disabled = true; });
          try {
            const j = await getJSON('/api/billing/checkout', { method: 'POST', body: { pack: btn.dataset.pack, returnUrl: location.href } });
            if (j.url) { location.href = j.url; return; }
            await refresh(); toast?.(T(`${j.credited} test credits added`, `已加 ${j.credited} 测试 credits`)); close(st.user);
          } catch (x) { box.querySelector('#pbdErr').textContent = x.message; box.querySelectorAll('[data-pack]').forEach(y => { y.disabled = false; }); }
        }));
      });
    }

    // "This will use about N credits" — skipped when the person turned it off.
    const askKey = 'pb-ask-spend';
    const askOn = () => { try { return localStorage.getItem(askKey) !== '0'; } catch { return true; } };
    async function confirmSpend(n, what) {
      if (!n || !askOn()) return true;
      const r = await dialog(`
        <h2>${esc(what)}</h2>
        <p class="pbd-p">${T(`This uses about <b>${n} credits</b>. You pay what it really costs, usually a bit less; a failed generation is refunded.`, `这一步大约用 <b>${n} credits</b>。按实际消耗扣费，通常会少一点；生成失败会退还。`)}</p>
        <p class="pbd-bal">${T('Balance', '余额')}: <b>${st.user?.balance ?? 0}</b> credits</p>
        <label class="pbd-chk"><input type="checkbox" id="pbdNoAsk"> ${T("Don't ask me again", '以后不再询问')}</label>
        <div class="pbd-acts"><button class="btn btn-accent" data-ok>${T('Go ahead', '确定')}</button><button class="btn" data-pbd-close>${T('Cancel', '取消')}</button></div>`,
      (box, close) => box.querySelector('[data-ok]').addEventListener('click', () => {
        if (box.querySelector('#pbdNoAsk').checked) { try { localStorage.setItem(askKey, '0'); } catch {} }
        close(true);
      }));
      return !!r;
    }

    async function signOut() {
      try { await req('/api/auth/signout', { method: 'POST' }); } catch {}
      setToken(null); st.user = null; emit(); toast?.(T('Signed out', '已退出'));
    }

    return {
      get user() { return st.user; }, get health() { return st.health; }, ready: st.ready, signedIn: () => !!st.user,
      req, getJSON, refresh, setBalance, signIn, topUp, confirmSpend, signOut, dialog,
      askOn, setAsk: v => { try { localStorage.setItem(askKey, v ? '1' : '0'); } catch {} },
      on(f) { subs.add(f); return () => subs.delete(f); },
    };
  }
})();
