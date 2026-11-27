const every = (f, ms) => setInterval(() => { if (!document.hidden) f(); }, ms); // all effect timers pause while the window is hidden
const cpStats = { t0: Date.now(), ice: 0, longest: 0, eb: 0 }; // session numbers for the standby lock screen: ICE runs, longest trace (s), fixer pay
// Cyberpunk effects: mouse pointer trail, glitches, save and error HUD. Loaded by the Custom CSS and JS Loader.
// Text cursor trail removed 2026-11-19 (too distracting when clicking around code); the mouse pointer trail stays.

// Random glitch: every 15-45 s one part of the window glitches; about 1 in 5 hits the whole window
try { (() => {
  const PARTS = ['.part.titlebar', '.part.statusbar', '.tabs-container .tab.active', '.part.sidebar', '.part.panel', '.part.activitybar'];
  const RATE = [1, 1.6, 3, 6]; // glitch frequency multiplier per instability level (window.cpLevel, set by the humanity drift block)
  const hit = () => {
    const lv = window.cpLevel || 0;
    const whole = Math.random() < 0.2 + 0.1 * lv;
    const el = document.querySelector(whole ? '.monaco-workbench' : PARTS[Math.floor(Math.random() * PARTS.length)]);
    if (el && !document.hidden) {
      el.classList.add('cp-glitching');
      setTimeout(() => el.classList.remove('cp-glitching'), 360);
    }
    setTimeout(hit, (15000 + Math.random() * 30000) / RATE[lv]);
  };
  setTimeout(hit, 4000);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Humanity drift: instability level 0-3 from time worked without a 5 min break and from the error count; sets cp-lv1..3 on the workbench
try { (() => {
  const IDLE = 5 * 60000, DRIFT = [30, 60, 90]; // minutes of work for levels 1, 2, 3
  let start = Date.now(), lastAct = Date.now(), forced = null, lv = 0, edge = null;
  const act = () => { lastAct = Date.now(); };
  ['keydown', 'mousedown', 'wheel'].forEach((e) => document.addEventListener(e, act, { passive: true, capture: true }));
  const errors = () => {
    const p = document.querySelector('[id="status.problems"]');
    const m = p && p.textContent.match(/\d+/);
    return m ? +m[0] : 0;
  };
  window.cpStage = (n) => { forced = n; setTimeout(() => { forced = null; }, 30000); }; // dev console test: cpStage(3) holds level 3 for 30 s
  every(() => {
    const wb = document.querySelector('.monaco-workbench');
    if (!wb) return;
    const now = Date.now();
    if (now - lastAct > IDLE) start = now;
    const mins = (now - start) / 60000;
    const drift = DRIFT.filter((d) => mins >= d).length;
    const e = errors();
    const err = e >= 5 ? 2 : e > 0 ? 1 : 0;
    const next = forced !== null ? forced : Math.max(drift, err);
    if (!edge || !edge.isConnected) { edge = document.createElement('div'); edge.className = 'cp-edge'; wb.appendChild(edge); }
    if (next !== lv) { wb.classList.remove('cp-lv1', 'cp-lv2', 'cp-lv3'); if (next) wb.classList.add('cp-lv' + next); lv = next; }
    window.cpLevel = lv;
  }, 1000);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Sandevistan mouse pointer, random encounter: every 2-5 min it engages for 8-12 s, then cools down
try { (() => {
  const COLS = ['#FCEE0A', '#FF2BD6', '#7B5CFF', '#02D7F2', '#00FF9C'];
  const STEP = 10; // px between afterimages
  const ARROW = 'polygon(0px 0px, 0px 16px, 4px 12px, 7px 18px, 9px 17px, 6px 11px, 11px 11px)';
  let lx = null, ly = null, n = 0, live = 0;
  let sande = false;
  const engage = () => {
    if (!document.hidden) {
      sande = true;
      const tag = document.createElement('div'); tag.className = 'cp-sande'; tag.textContent = 'SANDEVISTAN // ENGAGED';
      document.body.appendChild(tag); setTimeout(() => tag.remove(), 1600);
      setTimeout(() => { sande = false; }, 8000 + Math.random() * 4000);
    }
    setTimeout(engage, (2 + Math.random() * 3) * 60000);
  };
  setTimeout(engage, (1 + Math.random() * 2) * 60000);
  window.cpSande = () => { sande = true; setTimeout(() => { sande = false; }, 10000); };
  document.addEventListener('mousemove', (e) => {
    if (!sande) return;
    if (lx !== null && Math.hypot(e.clientX - lx, e.clientY - ly) < STEP) return;
    lx = e.clientX; ly = e.clientY;
    if (live > 24) return;
    const col = COLS[n++ % COLS.length];
    const g = document.createElement('div');
    g.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:12px;height:19px;background:${col};` +
      `clip-path:${ARROW};filter:drop-shadow(0 0 4px ${col});opacity:0.65;pointer-events:none;z-index:99999;transition:opacity 380ms ease-out;`;
    document.body.appendChild(g); live++;
    requestAnimationFrame(() => requestAnimationFrame(() => { g.style.opacity = '0'; }));
    setTimeout(() => { g.remove(); live--; }, 420);
  }, { passive: true });
})(); } catch (e) { console.error("[cp-fx]", e); }

// Tab encounters: opening, closing or switching a file has a 1 in 3 chance to glitch the editor
try { (() => {
  const CHANCE = 0.33, COOLDOWN = 1500;
  let sig = null, lastHit = 0;
  const tick = () => {
    const tabs = document.querySelectorAll('.tabs-container .tab');
    const act = document.querySelector('.editor-group-container.active .tab.active');
    const now = tabs.length + '|' + (act ? act.getAttribute('aria-label') : '');
    if (sig !== null && now !== sig && Date.now() - lastHit > COOLDOWN && Math.random() < CHANCE) {
      const el = document.querySelector('.editor-group-container.active') || document.querySelector('.part.editor');
      if (el) {
        lastHit = Date.now();
        el.classList.add('cp-glitching');
        setTimeout(() => el.classList.remove('cp-glitching'), 360);
      }
    }
    sig = now;
    setTimeout(tick, 200);
  };
  tick();
})(); } catch (e) { console.error("[cp-fx]", e); }

// Heartbeat gate: the cc-busy-bridge extension shows a hidden status-bar flag while Claude works; mirror it to a cp-busy class
try { (() => {
  const find = () => {
    for (const el of document.querySelectorAll('.part.statusbar .statusbar-item')) {
      if ((el.id && el.id.indexOf('busyflag') !== -1) || el.getAttribute('aria-label') === 'Claude Busy') {
        el.style.width = '0'; el.style.padding = '0'; el.style.margin = '0'; el.style.overflow = 'hidden';
        return el.offsetParent !== null ? (el.textContent.trim() || '1') : null;
      }
    }
    return null;
  };
  let was = false, stamp = null, killed = null;
  const tick = () => {
    const wb = document.querySelector('.monaco-workbench');
    if (!wb) return;
    stamp = find();
    const on = stamp !== null && stamp !== killed && !document.hidden;
    wb.classList.toggle('cp-busy', on);
    if (was && !on && !document.hidden) { // turn ended: one sweep across the terminal
      wb.classList.add('cp-done');
      setTimeout(() => wb.classList.remove('cp-done'), 1000);
    }
    was = on;
  };
  every(tick, 500);
  // Esc in the terminal while busy = interrupt (Stop hook does not fire): treat this flag stamp as over until a new prompt rewrites it
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || stamp === null) return;
    const a = document.activeElement;
    if (!(a && a.closest && a.closest('.terminal-wrapper, .xterm'))) return;
    killed = stamp; tick();
  }, true);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Loading-screen lines: original one-liners in the voice of Night City's cast; window.cpQuote() returns a fresh card element
try { (() => {
  const LINES = [
    ['V', 'Mercenary', 'Every gig is a bet that you walk away. So far the house has lost.'],
    ['V', 'Mercenary', 'Night City does not owe you a legend. You take one or you leave.'],
    ['Johnny Silverhand', 'Rockerboy', 'Rebellion is supposed to be loud. Turn it up, choom.'],
    ['Johnny Silverhand', 'Rockerboy', 'The corps own the skyline. We used to own the stage.'],
    ['Jackie Welles', 'Merc, Valentinos', 'Heywood taught me loyalty first and chrome second.'],
    ['Jackie Welles', 'Merc, Valentinos', 'Big dreams, bigger city. Keep your people close and the rest works itself out.'],
    ['Judy Alvarez', 'Braindance editor', 'Memory is the product. Edit with care, somebody has to live it.'],
    ['Judy Alvarez', 'Braindance editor', 'Everyone wants the clip. Nobody wants to know what it cost.'],
    ['Panam Palmer', 'Aldecaldo nomad', 'Out in the Badlands the family is the engine. Keep it fuelled.'],
    ['Panam Palmer', 'Aldecaldo nomad', 'A clan without wheels is just a crowd. Check the tyres.'],
    ['River Ward', 'NCPD detective', 'A badge is only as clean as the hand that carries it.'],
    ['River Ward', 'NCPD detective', 'Some cases close on paper. The streets keep their own file.'],
    ['Kerry Eurodyne', 'Rockstar, Samurai', 'Fame fades. The riff does not.'],
    ['Kerry Eurodyne', 'Rockstar, Samurai', 'Every stadium goes quiet eventually. Write something that outlasts the noise.'],
    ['Rogue Amendiares', 'Fixer, Afterlife', 'Afterlife keeps a table for every legend. Earn yours the hard way.'],
    ['Rogue Amendiares', 'Fixer, Afterlife', 'Reputation is the only currency the corps cannot print.'],
    ['Viktor Vektor', 'Ripperdoc', 'Chrome is a loan. The body always collects.'],
    ['Viktor Vektor', 'Ripperdoc', 'I can patch most things. Ask before you break the rest.'],
    ['Goro Takemura', 'Arasaka bodyguard', 'Honour is a quiet thing. Keep it that way.'],
    ['Misty Olszewski', 'Esoterica', 'The cards do not promise, they warn. Listen anyway.'],
    ['Wakako Okada', 'Fixer, Japantown', 'Every favour has a price. I only keep the receipts.'],
    ['Delamain', 'Taxi AI', 'Your destination is ready. A seatbelt is also advised.'],
    ['Alt Cunningham', 'Netrunner', 'Behind every firewall is something that wanted out.'],
    ['Adam Smasher', 'Arasaka cyborg', 'Flesh is a rounding error. Chrome is policy.'],
    ['Saburo Arasaka', 'Arasaka founder', 'Corporations outlive empires. Plan in centuries.'],
    ['Hanako Arasaka', 'Arasaka heir', 'Legacy is a blade. Mind which end you hold.'],
    ['Songbird', 'NUSA netrunner', 'Some signals are meant to stay lost.'],
    ['Solomon Reed', 'FIA agent', 'In Dogtown every ally is a debt in disguise.'],
    ['Rosalind Myers', 'NUSA president', 'Peace belongs to whoever outlasts the war.'],
    ['Kurt Hansen', 'Dogtown overlord', 'A wall is just a promise with guards.'],
    ['David Martinez', 'Edgerunner', 'Chrome is the way up, right until it is the only thing left.'],
    ['Lucy', 'Netrunner', 'Somewhere above the smog there is a quiet place. I am still looking for the way up.'],
    ['Maine', 'Edgerunner crew leader', 'A crew is a promise. Break it and no chrome will save you.'],
    ['Rebecca', 'Edgerunner', 'Small frame, big guns, zero patience.'],
    ['Kiwi', 'Netrunner', 'See the room before anyone walks into it. That is the whole job.'],
    ['Faraday', 'Fixer', 'Gigs pay when the phone rings. Keep it ringing.'],
  ];
  let last = -1;
  window.cpQuote = () => {
    let i; do { i = Math.floor(Math.random() * LINES.length); } while (i === last && LINES.length > 1);
    last = i;
    const [name, role, text] = LINES[i];
    const d = document.createElement('div'); d.className = 'cp-quote';
    const n = document.createElement('div'); n.className = 'n'; n.textContent = `${name.toUpperCase()} // ${role.toUpperCase()}`;
    const t = document.createElement('div'); t.className = 'q'; t.textContent = text;
    d.append(n, t);
    return d;
  };
})(); } catch (e) { console.error("[cp-fx]", e); }

// Boot sequence: a neural-link splash with one loading-screen line when the window loads
try { (() => {
  const mk = (cls, text) => { const d = document.createElement('div'); d.className = cls; if (text) d.textContent = text; return d; };
  const boot = mk('cp-boot');
  boot.append(mk('t', 'NEURAL LINK ESTABLISHED'), mk('s', '// NIGHT CITY OS'), mk('bar'), window.cpQuote());
  document.body.appendChild(boot);
  setTimeout(() => boot.remove(), 3000);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Data rain: falling glyphs fill an empty editor group (no file open), and the whole editor after 3 min idle (standby); removed on the next input
try { (() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789ABCDEF<>/|=+*';
  const SIZE = 16, FRAME = 120, STANDBY = 3 * 60000; // FRAME: ms between steps, about 14 fps
  let cv = null, ctx = null, host = null, tag = null, drops = [], acc = [], spd = [], w = 0, h = 0, last = 0, lastInput = Date.now(), force = false; // force: cpIdle() shows standby now, until the next click or key
  const stop = () => { if (cv) cv.remove(); if (tag) tag.remove(); cv = ctx = host = tag = null; };
  // a webview (markdown preview) is an iframe: its own clicks never reach this page, and VS Code re-dispatches its keys on window, not document
  const wvFocus = () => { const a = document.activeElement; return !!a && /^(IFRAME|WEBVIEW)$/i.test(a.tagName); };
  // mousemove counts here (wakes standby) but not for the humanity drift clock
  ['keydown', 'mousedown', 'mousemove', 'wheel'].forEach((e) => window.addEventListener(e, (ev) => {
    if (tag && (e === 'mousemove' || e === 'wheel')) return; // on standby only a click or a typed key wakes it, so alt tabbing or a nudge of the mouse does not
    if (tag && e === 'keydown' && ['Alt', 'Tab', 'Control', 'Shift', 'Meta', 'OS'].includes(ev.key)) return;
    lastInput = Date.now(); force = false;
    if (tag) stop();
  }, { passive: true, capture: true }));
  every(() => { // loading-screen style: a new line every 8 s while on standby
    if (!tag) return;
    const q = tag.querySelector('.cp-quote');
    if (q) q.replaceWith(window.cpQuote());
  }, 8000);
  // lock screen part of the standby card: clock, date with a made-up weather line, session stats, a glitch slice every few seconds
  const mkE = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text) x.textContent = text; return x; };
  const two = (n) => String(n).padStart(2, '0'), mmss = (s) => two(Math.floor(s / 60)) + ':' + two(Math.floor(s % 60));
  const SKY = ['RAIN', 'ACID RAIN', 'SMOG', 'FOG', 'CLEAR', 'STORM'];
  let L = null;
  const upd = () => {
    if (!L) return; const nt = document.querySelector('.cp-standby .nt'); if (nt) { nt.textContent = navigator.onLine ? 'NET LINK UP' : 'NET LINK DOWN'; nt.classList.toggle('dn', !navigator.onLine); }
    const n = new Date(), ct = n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    L.clock.textContent = ct; L.sls.textContent = ct;
    const seed = [...n.toLocaleDateString('en-CA')].reduce((a, c) => a + c.charCodeAt(0), 0);
    L.date.textContent = n.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).replace(',', '').toUpperCase() + ' // NIGHT CITY // ' + (window.cpWxData ? window.cpWxData.temp + 'C ' + String(window.cpWxData.sky).toUpperCase() : (8 + seed % 14) + 'C ' + SKY[seed % SKY.length]); // real weather when a location is set
    const s = (Date.now() - cpStats.t0) / 1000;
    L.cells[0].textContent = two(Math.floor(s / 3600)) + ':' + two(Math.floor(s % 3600 / 60));
    L.cells[1].textContent = cpStats.ice; L.cells[2].textContent = cpStats.longest ? mmss(cpStats.longest) : '--:--'; L.cells[3].textContent = cpStats.eb.toLocaleString('en-US');
    L.hx.textContent = '0x' + Array.from({ length: 3 }, () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  };
  const place = () => { // centre on the host (the editor part), not on the window
    if (!tag || !host) return; const r = host.getBoundingClientRect();
    tag.style.left = (r.left + r.width / 2) + 'px'; tag.style.top = (r.top + r.height / 2) + 'px'; tag.style.width = Math.min(520, Math.max(300, r.width - 32)) + 'px';
  };
  const lock = () => {
    const lk = mkE('div', 'lk'), mid = mkE('div', 'mid'), box = mkE('div', 'cb'), clock = mkE('div', 'ck'), sl = mkE('div', 'sl'), sls = mkE('span', '');
    sl.appendChild(sls); box.append(clock, sl); mid.appendChild(box);
    const date = mkE('div', 'dt'), st = mkE('div', 'st'), cells = [];
    ['SESSION', 'ICE RUNS', 'LONGEST TRACE', 'EB EARNED'].forEach((c, k) => { const dv = mkE('div', k === 3 ? 'y' : ''), b = mkE('b', ''); dv.append(b, mkE('span', '', c)); st.appendChild(dv); cells.push(b); });
    const ft = mkE('div', 'ft'), hx = mkE('span', '', ''); ft.append(mkE('i', 'bc'), mkE('span', 'w', 'CLICK TO RE-LINK'), hx);
    lk.append(mid, date, st, ft); L = { clock, sls, date, cells, hx }; upd(); return lk;
  };
  every(() => { // once a second: refresh the readouts, now and then a 170 ms glitch burst (class gl)
    if (!tag) { L = null; return; }
    if (wvFocus()) { lastInput = Date.now(); force = false; stop(); return; } // a click landed in a webview under the card
    upd(); place();
    if (Math.random() < 0.3) { tag.classList.add('gl'); const t = tag; setTimeout(() => t.classList.remove('gl'), 170); }
  }, 1000);
  window.cpIdle = () => { force = true; }; // test the standby card without waiting 3 minutes
  const findHost = () => {
    if (document.hidden) return null;
    const lim = wvFocus() && document.querySelector('.part.editor') && document.querySelector('.part.editor').contains(document.activeElement) ? 5 * STANDBY : STANDBY; // reading a preview sends no input we can see: wait 15 min there
    const idle = force || (Date.now() - lastInput > lim && !document.querySelector('.monaco-workbench.cp-busy'));
    if (idle) { // the editor part, or the panel when the editor is closed or hidden (a hidden part has no size and would be created and dropped every half second)
      const seen = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 2 && b.height > 2; };
      const ed = document.querySelector('.part.editor'), pn = document.querySelector('.part.panel');
      return seen(ed) ? ed : seen(pn) ? pn : null;
    }
    const g = document.querySelector('.part.editor .editor-group-container.empty');
    return g ? (g.querySelector('.editor-container') || g) : null;
  };
  const loop = (t) => {
    if (!cv) return;
    requestAnimationFrame(loop);
    if (t - last < (tag ? 33 : FRAME)) return; // standby: about 30 frames a second; a plain empty editor group stays light at 8
    const dt = Math.min((t - last) / 1000, 0.25); last = t;
    const r = host.getBoundingClientRect();
    if (!host.isConnected || r.width < 2 || r.height < 2) { stop(); return; }
    if (Math.round(r.width) !== w || Math.round(r.height) !== h) {
      w = Math.round(r.width); h = Math.round(r.height); cv.width = w; cv.height = h;
      drops = Array.from({ length: Math.ceil(w / SIZE) }, () => -Math.random() * (h / SIZE));
      acc = drops.map(() => 0); spd = drops.map(() => 10 + Math.random() * 14); // each column falls at its own speed, 10 to 24 cells a second
      ctx.fillStyle = '#0D0D12'; ctx.fillRect(0, 0, w, h);
    }
    cv.style.left = r.left + 'px'; cv.style.top = r.top + 'px';
    ctx.fillStyle = 'rgba(13,13,18,' + (tag ? 0.09 : 0.13) + ')'; ctx.fillRect(0, 0, w, h);
    ctx.font = SIZE + 'px "Share Tech Mono", monospace';
    drops.forEach((y, i) => {
      acc[i] += spd[i] * dt;
      while (acc[i] >= 1) { // one glyph per cell passed, so a slow frame still draws an unbroken trail
        acc[i] -= 1;
        if (y >= 0) {
          ctx.fillStyle = Math.random() < 0.03 ? 'rgba(252,238,10,0.85)' : 'rgba(2,215,242,0.5)';
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * SIZE, y * SIZE);
        }
        y = (y * SIZE > h && Math.random() > 0.96) ? -Math.random() * 10 : y + 1;
      }
      drops[i] = y;
    });
  };
  every(() => {
    const el = findHost();
    if (cv && el !== host) stop();
    if (el && !cv) {
      host = el; w = h = 0;
      cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;pointer-events:none;z-index:4;';
      document.body.appendChild(cv); ctx = cv.getContext('2d');
      if (el.classList.contains('part')) { // standby: whole editor part
        cv.style.pointerEvents = 'auto'; // the canvas catches the wake-up click, so it cannot fall into a webview below
        if (wvFocus()) document.activeElement.blur(); // a focused webview would count as a click on it and wake at once
        tag = document.createElement('div'); tag.className = 'cp-standby';
        const title = document.createElement('div'); title.className = 't'; title.textContent = 'NEURAL LINK IDLE';
        const hz = mkE('div', 'hz'), bar = mkE('div', 'bar'); bar.append(mkE('span', '', 'NCOS // SESSION LOCKED'), mkE('span', 'nt', ''));
        tag.append(hz, bar, title, window.cpQuote(), lock());
        document.body.appendChild(tag); place();
      }
      requestAnimationFrame(loop);
    }
  }, 500);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Target lock: a big cursor jump (go to definition, search hit, line jump) snaps cyan brackets onto the new line
try { (() => {
  const JUMP = 15, HOLD = 650; // lines moved at once, ms the lock shows
  let key = null, ln = null, ed = null, off = null, nav = 0;
  // plain PageUp/PageDown/arrow travel is not a jump
  document.addEventListener('keydown', (e) => { if (/^(Page|Arrow)/.test(e.key)) nav = Date.now(); }, { passive: true, capture: true });
  every(() => {
    const sel = document.querySelector('[id="status.editor.selection"]');
    const m = sel && sel.textContent.match(/(\d+)/);
    const tab = document.querySelector('.editor-group-container.active .tab.active');
    const k = tab ? tab.getAttribute('aria-label') : '';
    const n = m ? +m[1] : null;
    if (n !== null && ln !== null && key === k && Math.abs(n - ln) > JUMP && Date.now() - nav > 400) {
      if (ed) ed.classList.remove('cp-lock');
      ed = document.querySelector('.editor-group-container.active .monaco-editor');
      if (ed) { void ed.offsetWidth; ed.classList.add('cp-lock'); clearTimeout(off); off = setTimeout(() => ed && ed.classList.remove('cp-lock'), HOLD); }
    }
    key = k; ln = n;
  }, 100);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Link restored: coming back to the window after 3 s or more away sweeps a thin cyan bar across the top
try { (() => {
  const AWAY = 3000;
  let blurAt = null, cur = null;
  window.addEventListener('blur', () => { blurAt = Date.now(); });
  window.addEventListener('focus', () => {
    if (blurAt === null || Date.now() - blurAt < AWAY) return;
    blurAt = null;
    if (cur) cur.remove();
    const d = document.createElement('div'); d.className = 'cp-link';
    const s = document.createElement('span'); s.textContent = 'LINK RESTORED'; d.appendChild(s);
    document.body.appendChild(d); cur = d;
    setTimeout(() => d.remove(), 1100);
  });
})(); } catch (e) { console.error("[cp-fx]", e); }

// Panel focus flicker: moving focus between editor, terminal and sidebar flashes the new part's edge
try { (() => {
  let lastPart = null;
  document.addEventListener('focusin', (e) => {
    const p = e.target.closest ? e.target.closest('.part.editor, .part.panel, .part.sidebar, .part.auxiliarybar') : null;
    if (!p || p === lastPart) return;
    lastPart = p;
    p.classList.add('cp-focus');
    setTimeout(() => p.classList.remove('cp-focus'), 300);
  }, true);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Neon flicker: every 25-70 s the title or the active tab label stutters like a failing neon sign
try { (() => {
  const TARGETS = ['.part.titlebar .window-title', '.tabs-container .tab.active .label-name'];
  const hit = () => {
    if (!document.hidden) {
      const el = document.querySelector(TARGETS[Math.floor(Math.random() * TARGETS.length)]);
      if (el && !el.matches(':hover')) { // the title has its own hover glitch
        el.classList.add('cp-neon');
        setTimeout(() => el.classList.remove('cp-neon'), 1000);
      }
    }
    setTimeout(hit, 25000 + Math.random() * 45000);
  };
  setTimeout(hit, 9000);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Scanner chatter: every 1.5-4 min a short NCPD dispatch shows bottom left; cpScan() shows one now
try { (() => {
  // Districts and subdistricts as listed on the Night City map; category labels follow the game's scanner hustle types
  const PLACES = [
    ['City Center', ['Corpo Plaza', 'Downtown']], ['Heywood', ['Wellsprings', 'Vista del Rey', 'The Glen']],
    ['Pacifica', ['West Wind Estate', 'Coastview']], ['Santo Domingo', ['Arroyo', 'Rancho Coronado']],
    ['Watson', ['Little China', 'Kabuki', 'Northside', 'Arasaka Waterfront']], ['Westbrook', ['Japantown', 'North Oak', 'Charter Hill']],
  ];
  const CATS = {
    a: ['Assault in Progress', ['Armed subject threatening bystanders', 'Fight outside a noodle stand', 'Gang members harassing a street vendor', 'Civilian attacked near a transit stop', 'Shots reported inside a parking structure', 'Courier mugged for a cargo case']],
    r: ['Reported Crime', ['Break-in at a pawn shop', 'Stolen vehicle reported', 'Cyberware theft reported', 'Vandalism on a public billboard', 'Missing delivery drone', 'Smashed window at a ripperdoc clinic', 'Pickpocket working a night market']],
    o: ['Suspected Organized Crime Activity', ['Suspected gang meeting in a vacant warehouse', 'Suspected black-market cargo at the loading docks', 'Suspected braindance distribution ring', 'Suspected protection racket at a market stall', 'Suspected data courier handoff behind a laundromat', 'Suspected chop shop operating from a garage']],
    c: ['Cyberpsycho Sighting', ['Erratic augmented subject, civilians evacuating', 'Unregistered cyberware, possible psychosis', 'Subject tearing out street lights with bare hands', 'Heavily modified subject ignoring all commands', 'Augmented subject barricaded in a stairwell']],
    s: ['Suspicious Activity', ['Unmarked van idling outside a clinic for hours', 'Stranger photographing a corporate entrance', 'Drone circling a residential block without a signal', 'Person testing door handles along an alley', 'Abandoned bag left at a transit stop', 'Hooded figure tampering with a vending terminal']],
    t: ['Traffic Incident', ['Autonomous cab stopped in a live lane', 'Two-vehicle collision blocking an intersection', 'Motorcycle weaving through traffic at speed', 'Stalled truck leaking coolant on the overpass']],
    p: ['Public Disturbance', ['Crowd forming around a street preacher', 'Loud argument spilling out of a bar', 'Unlicensed street race gathering', 'Street performers blocking a market entrance']],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let cur = null;
  const show = () => {
    if (cur) cur.remove();
    const lv = window.cpLevel || 0;
    const key = Math.random() < (lv >= 2 ? 0.5 : 0.08) ? 'c' : pick(['a', 'a', 'r', 'r', 'o', 's', 's', 't', 'p']);
    const [label, subjects] = CATS[key];
    const [district, subs] = pick(PLACES);
    const d = document.createElement('div'); d.className = 'cp-scan cp-scan-' + key;
    const head = document.createElement('div'); head.className = 'h'; head.textContent = `NCPD // ${label.toUpperCase()}`;
    const loc = document.createElement('div'); loc.className = 'l'; loc.textContent = `${pick(subs)}, ${district}`;
    const body = document.createElement('div'); body.className = 'b';
    body.textContent = key === 'c' ? `${pick(subjects)}. MaxTac notified.` : `${pick(subjects)}. Units in ${district}, respond.`;
    const foot = document.createElement('div'); foot.className = 'f';
    foot.textContent = `CASE #${Math.floor(100000 + Math.random() * 900000)} // UNIT ${Math.floor(1 + Math.random() * 40)}-${pick(['A', 'B', 'C', 'D'])} // PRIORITY ${key === 'c' ? 1 : key === 'a' ? 2 : 3}`;
    d.append(head, loc, body, foot);
    document.body.appendChild(d); cur = d;
    setTimeout(() => d.classList.add('out'), 6300);
    setTimeout(() => d.remove(), 7200);
  };
  window.cpScan = show;
  const loop = () => setTimeout(() => { if (!document.hidden) show(); loop(); }, (1.5 + Math.random() * 2.5) * 60000);
  setTimeout(() => { if (!document.hidden) show(); loop(); }, (0.5 + Math.random() * 0.5) * 60000);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Fixer call: a rare incoming call card, bottom left, stacked above the NCPD dispatch when one is showing. First call 1-2 min after load, then every 4-8 min; skipped while Claude works or after 10 min without input. Accept logs the gig and adds the pay to a running total; cpFixer() rings now
try { (() => {
  const mk = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; return x; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const WHO = ['NO CALLER ID', 'BLOCKED NUMBER', 'UNKNOWN FIXER', 'BURNER LINE', 'ENCRYPTED LINE'];
  const GIG = [
    'Escort a data courier across {p}. Quiet hands only.', 'Pick up a sealed case in {p}. Do not open it.', 'A client in {p} wants a rival\'s drone fleet grounded.',
    'Lift a prototype from a loading dock in {p}.', 'Lean on a debtor in {p}. Talk first.', 'Watch a safehouse in {p} and report who walks in.',
    'Recover a stolen cyberdeck from a pawn shop in {p}.', 'Plant a listening device in a lobby in {p}.', 'Walk a nervous informant out of {p} before dawn.',
    'Wipe a camera feed in {p} for ten minutes.', 'Deliver a message to a runner crew in {p}. In person.', 'Find out who is selling counterfeit chips in {p}.',
  ];
  const PLACE = ['Watson', 'Westbrook', 'Heywood', 'Pacifica', 'Santo Domingo', 'City Center', 'Kabuki', 'Japantown', 'Little China', 'the Badlands'];
  const SECS = 20;
  let card = null, iv = null, total = 0, lastInput = Date.now();
  for (const ev of ['keydown', 'pointerdown', 'mousemove']) window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true });
  const stack = () => { const s = document.querySelector('.cp-scan'), i = document.querySelector('.cp-ice'); if (card) card.style.bottom = (54 + (i ? i.offsetHeight + 8 : 0) + (s ? s.offsetHeight + 8 : 0)) + 'px'; }; // sits above the ICE card and the dispatch
  const close = (msg) => {
    if (!card) return; const c = card; card = null; clearInterval(iv);
    if (msg) { c.classList.remove('ring'); c.querySelector('.bd').textContent = msg; c.querySelector('.bt').remove(); c.querySelector('.cd').style.visibility = 'hidden'; card = c; stack(); }
    setTimeout(() => c.classList.add('out'), msg ? 2600 : 0);
    setTimeout(() => { c.remove(); if (card === c) card = null; }, msg ? 3500 : 900);
  };
  const ring = () => {
    if (card) return; const pay = Math.round((1500 + Math.random() * 7500) / 100) * 100, left = { n: SECS };
    const c = mk('div', 'cp-call ring'), h = mk('div', 'h', 'INCOMING CALL'), cd = mk('span', 'cd', '00:' + SECS), who = mk('div', 'w', 'FIXER // ' + pick(WHO));
    h.appendChild(cd);
    const bd = mk('div', 'bd', pick(GIG).replace('{p}', pick(PLACE)) + ' Pay: ' + pay.toLocaleString('en-US') + ' eb'), bt = mk('div', 'bt');
    const yes = mk('span', 'y', 'ACCEPT'), no = mk('span', 'n', 'DECLINE'), bar = mk('span', 'bar');
    yes.addEventListener('click', () => { total += pay; cpStats.eb = total; close('GIG LOGGED // +' + pay.toLocaleString('en-US') + ' eb // TOTAL ' + total.toLocaleString('en-US') + ' eb'); });
    no.addEventListener('click', () => close());
    bt.append(yes, no); c.append(h, who, bd, bt, bar); document.body.appendChild(c); card = c; stack();
    iv = every(() => {
      stack(); left.n--; cd.textContent = '00:' + String(Math.max(left.n, 0)).padStart(2, '0');
      bar.style.transform = 'scaleX(' + (Math.max(left.n, 0) / SECS).toFixed(3) + ')';
      if (left.n <= 0) close();
    }, 1000);
  };
  window.cpFixer = ring;
  const loop = (min, span) => setTimeout(() => {
    if (!document.hidden && Date.now() - lastInput < 600000 && !document.querySelector('.monaco-workbench.cp-busy')) ring();
    loop(4, 4);
  }, (min + Math.random() * span) * 60000);
  loop(1, 1);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Weather alert: when the world-wire extension reports rain, a storm, snow, strong wind, heat or smog in the next 6 hours, a card shows bottom left, above the ICE card, dispatch and fixer call: hazard stripe in the kind's colour, a line icon, a threat meter, and short glitch bursts while it is up. Each kind shows at most once per 3 hours; cpWeather('rain') shows a demo (rain, storm, snow, wind, heat, smog). window.cpWxIcon(name, px) draws the line icons for the weather chip too
try { (() => {
  const COOL = 3 * 3600 * 1000, KIND = { storm: 'red', snow: 'cyan', rain: 'cyan', wind: 'yel', heat: 'red', smog: 'mag' }, KICON = { storm: 'storm', snow: 'snow', rain: 'rain', wind: 'wind', heat: 'sun', smog: 'fog' };
  const SVG = 'http://www.w3.org/2000/svg', CLOUD = 'M7 14h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.3A3 3 0 0 0 7 14z';
  const PATH = { // angular line icons on a 24 grid
    sun: ['M8.5 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1'],
    cloud: ['M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 18z'],
    rain: [CLOUD, 'M8 17l-1.4 3.5M12 17l-1.4 3.5M16 17l-1.4 3.5'],
    storm: [CLOUD, 'M12.8 14.5L10 18.5h3.4L11.4 22'],
    snow: ['M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9', 'M10 4.5l2 2 2-2M10 19.5l2-2 2 2'],
    wind: ['M3 9h11a2.5 2.5 0 1 0-2.5-2.5', 'M3 13h16a2.5 2.5 0 1 1-2.5 2.5', 'M3 17h8'],
    fog: ['M4 7h16M6 11h14M4 15h12M8 19h10'],
  };
  const icon = (name, px) => {
    const s = document.createElementNS(SVG, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', px); s.setAttribute('height', px);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.6'); s.setAttribute('stroke-linecap', 'square'); s.setAttribute('stroke-linejoin', 'miter');
    for (const dd of PATH[name] || PATH.cloud) { const p = document.createElementNS(SVG, 'path'); p.setAttribute('d', dd); s.appendChild(p); }
    return s;
  };
  window.cpWxIcon = icon;
  const mk = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; return x; };
  const hex = () => '0x' + Array.from({ length: 3 }, () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  let card = null, timers = []; const LS = 'cpWxShown'; let shown = {}; try { shown = JSON.parse(window.localStorage.getItem(LS)) || {}; } catch (e) { shown = {}; }
  const saveShown = () => { try { window.localStorage.setItem(LS, JSON.stringify(shown)); } catch (e) {} };
  const stack = () => { if (!card) return; const q = (s) => { const el = document.querySelector(s); return el ? el.offsetHeight + 8 : 0; }; card.style.bottom = (54 + q('.cp-ice') + q('.cp-scan') + q('.cp-call')) + 'px'; };
  const show = (al) => {
    if (card) { timers.forEach(clearTimeout); timers = []; card.remove(); card = null; }
    const c = mk('div', 'cp-wx cp-wx-' + KIND[al.kind]), lvl = al.kind === 'storm' || /HEAVY/.test(String(al.title)) ? 3 : 2;
    const hd = mk('div', 'hd'), lv = mk('span', 'lv'), row = mk('div', 'row'), ic = mk('div', 'ic'), tx = mk('div', 'tx'), ft = mk('div', 'ft');
    lv.appendChild(mk('em', '', 'THREAT')); for (let k = 0; k < 3; k++) lv.appendChild(mk('i', k < lvl ? 'on' : ''));
    hd.append(mk('span', '', 'NC WEATHER SERVICE'), lv);
    ic.appendChild(icon(KICON[al.kind], 28)); tx.append(mk('div', 'h', String(al.title).slice(0, 40)), mk('div', 'b', String(al.text).slice(0, 170))); row.append(ic, tx);
    ft.append(mk('span', '', 'OPEN-METEO // NEXT 6 HOURS'), mk('span', 'hx', hex()));
    c.append(mk('div', 'st'), hd, row, ft); document.body.appendChild(c); card = c; stack();
    timers.push(setTimeout(() => c.classList.add('out'), 9000), setTimeout(() => { c.remove(); if (card === c) card = null; }, 9900));
  };
  every(() => {
    stack();
    if (card && !card.classList.contains('out') && Math.random() < 0.4) { const c = card; c.classList.add('gl'); setTimeout(() => c.classList.remove('gl'), 170); } // a short glitch burst now and then
    const w = window.cpWxData, al = w && w.alert;
    if (!al || document.hidden || !KIND[al.kind] || typeof al.title !== 'string' || typeof al.text !== 'string') return;
    const last = Number(shown[al.kind]) || 0, nowT = Date.now(); if (last <= nowT && nowT - last < COOL) return;
    shown[al.kind] = nowT; saveShown(); show(al);
  }, 1000);
  const DEMO = { rain: ['RAIN WARNING', 'Rain between 15:00 and 17:00, up to 2.4 mm an hour. Chance 70 percent. Take cover.'], storm: ['STORM WARNING', 'Thunderstorm between 16:00 and 17:00. Gusts up to 72 km/h. Stay indoors.'], snow: ['SNOW WARNING', 'Snow between 07:00 and 09:00. Roads will turn slick. Dress warm.'], wind: ['HIGH WIND WARNING', 'Gusts up to 65 km/h in the next hours. Secure loose gear.'], heat: ['HEAT ALERT', 'It is 36 C outside. Drink water and stay out of the sun.'], smog: ['SMOG ALERT', 'Air quality index 170. Wear a mask outside.'] };
  window.cpWeather = (kind) => { const k = DEMO[kind] ? kind : 'rain'; show({ kind: k, title: DEMO[k][0], text: DEMO[k][1] }); };
})(); } catch (e) { console.error("[cp-fx]", e); }

// ICE trace: while Claude works, a card bottom left fills one segment per 10 percent of the trace (cyan, yellow, then red) with a percent readout, a hex stream and rare glitch bursts. The percent follows 100 * (1 - e^(-t/100)), so it keeps creeping up on a long turn and never sticks (99.9 after about 10 minutes); after 10 minutes the card stays still. DOM is only touched when a value changes. It shows after 10 s of work, and on finish reads JACKED OUT with the real run time, then glitches out. Reads the cp-busy flag once a second; cpIce(s) shows a demo
try { (() => {
  const mk = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; return x; };
  const T = { a: ['ROUTING THROUGH PROXY', 'NETWATCH SWEEP // LOW'], b: ['ICE ALERTED. KEEP MOVING.', 'NETWATCH SWEEP // MEDIUM'], c2: ['TRACE NEARLY COMPLETE', 'NETWATCH SWEEP // CRITICAL'] };
  const P = { a: 0.06, b: 0.15, c2: 0.25 }; // chance of a glitch burst per second
  const clock = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const hex = () => '0x' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  let card = null, segs = [], tm, pc, tx, ft, hx, t0 = 0, quiet = 0, timers = [], last = {}, ticks = 0, offV = '';
  const off = () => { const v = card ? card.offsetHeight + 8 + 'px' : '0px'; if (v !== offV) { offV = v; document.documentElement.style.setProperty('--cp-ice-off', v); } }; // dispatch and fixer stack above this card; set only when the height changes so the page is not restyled every second
  const kill = () => { timers.forEach(clearTimeout); timers = []; if (card) { card.remove(); card = null; } last = {}; off(); };
  const put = (k, el, v) => { if (last[k] !== v) { last[k] = v; el.textContent = v; } };
  const build = () => {
    last = {}; card = mk('div', 'cp-ice a'); const hd = mk('div', 'h'), mid = mk('div', 'mid'), sg = mk('div', 'segs');
    tm = mk('b', '', '00:00'); hd.append(mk('span', '', '\u25B2 ICE TRACE'), tm);
    pc = mk('span', 'pc', '00%'); segs = []; for (let k = 0; k < 10; k++) { const i = mk('i', ''); segs.push(i); sg.appendChild(i); }
    mid.append(pc, sg); tx = mk('div', 's'); ft = mk('div', 'f'); hx = mk('div', 'x');
    card.append(mk('div', 'st'), hd, mid, tx, ft, hx); document.body.appendChild(card);
  };
  const burst = (ms) => { if (!card) return; card.classList.add('gl'); const c = card; timers.push(setTimeout(() => c.classList.remove('gl'), ms || 170)); };
  const paint = (sec) => {
    const pct = Math.min(99.9, 100 * (1 - Math.exp(-sec / 100)));
    const lv = pct < 40 ? 'a' : pct < 75 ? 'b' : 'c2', n = Math.min(10, Math.max(1, Math.ceil(pct / 10)));
    const cls = 'cp-ice ' + lv + (card.classList.contains('gl') ? ' gl' : '');
    if (card.className !== cls) card.className = cls;
    put('tm', tm, clock(sec)); put('tx', tx, T[lv][0]); put('ft', ft, T[lv][1]);
    put('pc', pc, (pct < 90 ? String(Math.floor(pct)).padStart(2, '0') : pct.toFixed(1)) + '%');
    if (last.n !== n || last.lv !== lv) { last.n = n; last.lv = lv; segs.forEach((s, k) => { s.className = k < n ? 'on' : ''; }); }
    if (++ticks % 4 === 0) hx.textContent = hex();
    if (sec < 600 && Math.random() < P[lv]) burst(); // after 10 minutes the card stays still
  };
  const done = (sec) => {
    cpStats.ice++; cpStats.longest = Math.max(cpStats.longest, sec);
    const c = card; c.className = 'cp-ice d'; tm.textContent = clock(sec); pc.textContent = 'OUT'; tx.textContent = 'JACKED OUT. CONNECTION CLEAN.'; ft.textContent = 'RAN ' + clock(sec); hx.textContent = 'SESSION CLOSED';
    segs.forEach((s) => { s.className = 'on'; }); last = {}; burst(300);
    timers.push(setTimeout(() => c.classList.add('out'), 4000), setTimeout(() => { if (card === c) kill(); }, 4900));
  };
  every(() => {
    const busy = !!document.querySelector('.monaco-workbench.cp-busy');
    if (busy) {
      quiet = 0;
      if (!t0) t0 = Date.now();
      if (card && card.classList.contains('d')) { kill(); t0 = Date.now(); } // work resumed before the card faded
      const sec = (Date.now() - t0) / 1000;
      if (sec >= 10) { if (!card) build(); paint(sec); }
    } else if (t0 && ++quiet >= 2) { // 2 s of calm so a pause between steps does not end the run
      const sec = (Date.now() - t0) / 1000 - 2; t0 = 0;
      if (card) done(Math.max(sec, 0));
    }
    off();
  }, 1000);
  window.cpIce = (s) => { kill(); t0 = 0; build(); paint(s || 80); burst(); off(); }; // demo: cpIce(20), cpIce(80), cpIce(160); the card stays until the next call
})(); } catch (e) { console.error("[cp-fx]", e); }

// Status bar ticker: a new character line every 30 s, set in the widest empty gap of the status bar (hidden when the gap is under 260 px); cpTick() swaps now
try { (() => {
  const EVERY = 30000, MIN = 260;
  const el = document.createElement('div'); el.className = 'cp-ticker';
  const n = document.createElement('span'); n.className = 'n';
  const q = document.createElement('span'); q.className = 'q';
  el.append(n, q); document.body.appendChild(el);
  const next = () => {
    const c = window.cpQuote();
    el.classList.add('out');
    setTimeout(() => { n.textContent = c.querySelector('.n').textContent; q.textContent = c.querySelector('.q').textContent; el.classList.remove('out'); }, 260);
  };
  window.cpTick = next;
  let dbg = 'not run';
  const placeRaw = () => {
    const bar = document.querySelector('.part.statusbar');
    if (!bar || document.hidden) { el.style.display = 'none'; return; }
    const b = bar.getBoundingClientRect();
    const items = Array.from(bar.querySelectorAll('.statusbar-item')).map((i) => i.getBoundingClientRect()).filter((r) => r.width > 0);
    const edges = [b.left, ...items.flatMap((r) => [r.left, r.right]), b.right].sort((x, y) => x - y);
    let best = [0, 0];
    for (let i = 0; i + 1 < edges.length; i += 2) if (edges[i + 1] - edges[i] > best[1] - best[0]) best = [edges[i], edges[i + 1]];
    dbg = JSON.stringify({ best, items: items.length });
    if (best[1] - best[0] < MIN) { el.style.display = 'none'; return; }
    el.style.cssText = `display:block;left:${best[0] + 12}px;width:${best[1] - best[0] - 24}px;top:${b.top}px;height:${b.height}px;line-height:${b.height}px;`;
  };
  const place = () => { try { placeRaw(); } catch (e) { dbg = 'ERR ' + e.message; console.error('[cp-fx] place', e); } };
  // cpDebug() in the dev console: where the ticker thinks it goes
  window.cpDebug = () => JSON.stringify({ place: dbg, ticker: el.style.display, rect: el.getBoundingClientRect().toJSON() });
  every(place, 1000);
  try { next(); } catch (e) { console.error('[cp-fx] ticker', e); }
  every(next, EVERY);
  window.addEventListener('resize', place);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Typing overclock: a burst of fast typing tints the active editor line; clears 500 ms after you ease off
try { (() => {
  const WINDOW = 1000, NEED = 7, COOLDOWN = 500;
  let times = [], off = null, cur = null;
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key && e.key.length !== 1 && e.key !== 'Backspace' && e.key !== 'Enter') return;
    const ed = (document.activeElement && document.activeElement.closest) ? document.activeElement.closest('.monaco-editor') : null;
    const now = Date.now();
    times = times.filter((t) => now - t < WINDOW); times.push(now);
    if (times.length >= NEED && ed) {
      if (cur && cur !== ed) cur.classList.remove('cp-fast');
      cur = ed; ed.classList.add('cp-fast');
      clearTimeout(off);
      off = setTimeout(() => { if (cur) cur.classList.remove('cp-fast'); cur = null; }, COOLDOWN);
    }
  }, { passive: true });
})(); } catch (e) { console.error("[cp-fx]", e); }

// Upload complete on save, cyberpsychosis warning when errors go up, and the rare relic malfunction
try { (() => {
  // DOM building only: VS Code's Trusted Types policy rejects innerHTML strings
  const mk = (tag, cls, text) => { const d = document.createElement(tag); if (cls) d.className = cls; if (text) d.textContent = text; return d; };
  const el = (cls, ...kids) => { const d = mk('div', cls); kids.forEach((k) => d.appendChild(k)); document.body.appendChild(d); return d; };
  const hex = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'));

  // Save: a tab that was dirty (unsaved dot) and is now clean has just been written to disk
  let dirty = new Set(), upload = null;
  const showUpload = (name) => {
    if (upload) upload.remove();
    const h = hex(), k = Math.floor(Math.random() * 6);
    const grid = mk('div', 'g');
    h.forEach((x, i) => grid.appendChild(i === k ? mk('b', '', x + ' ') : document.createTextNode(x + ' ')));
    upload = el('cp-upload', mk('div', 't', 'UPLOAD COMPLETE'), mk('div', 'f', '// ' + name), grid, mk('div', 'bar'));
    const me = upload; setTimeout(() => me.remove(), 1700);
  };

  // Errors: the first number in the status bar problems item is the error count
  let errs = null, psycho = null;
  const readErrors = () => {
    const p = document.querySelector('[id="status.problems"]');
    const m = p && p.textContent.match(/\d+/);
    return m ? +m[0] : null;
  };
  // Flatline: an ECG line draws left to right above the status bar, goes flat, turns red
  let flat = null;
  const showFlat = () => {
    if (flat) flat.remove();
    const NS = 'http://www.w3.org/2000/svg', bar = document.querySelector('.part.statusbar');
    flat = mk('div', 'cp-flat'); flat.style.top = (bar ? bar.getBoundingClientRect().top - 44 : window.innerHeight - 70) + 'px';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 1000 40'); svg.setAttribute('preserveAspectRatio', 'none');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M0 20H150l10-5 8 5H250l8 7 12-27 12 36 8-16H360l14-9 14 9H520l8 7 12-27 12 36 8-16H640l10-3 8 3H760H1000');
    svg.appendChild(p); flat.append(svg, mk('div', 't', 'VITALS // FLATLINE')); document.body.appendChild(flat);
    const me = flat; setTimeout(() => me.remove(), 2700);
  };
  window.cpFlat = showFlat;
  const showPsycho = (n) => {
    showFlat();
    if (psycho) psycho.remove();
    psycho = el('cp-psycho', mk('div', 'tag', `SYS WARNING // ${n} ERROR${n === 1 ? '' : 'S'}`));
    const me = psycho; setTimeout(() => me.remove(), 1700);
  };

  const tick = () => {
    try {
      const now = new Set();
      document.querySelectorAll('.tabs-container .tab').forEach((t) => {
        const name = (t.querySelector('.label-name') || {}).textContent || '';
        if (t.classList.contains('dirty')) now.add(name);
        else if (dirty.has(name)) showUpload(name);
      });
      dirty = now;
      const e = readErrors();
      if (e !== null && errs !== null && e > errs) showPsycho(e);
      if (e !== null) errs = e;
    } catch (x) { console.warn('[cp-fx]', x); }
    setTimeout(tick, 250);
  };
  tick();

  // Relic malfunction: once every 1.5-2.5 hours; run cpRelic() in the dev console to see it now
  window.cpRelic = () => {
    const r = el('cp-relic', mk('span', '', 'RELIC MALFUNCTION'));
    document.querySelector('.monaco-workbench')?.classList.add('cp-glitching');
    setTimeout(() => { r.remove(); document.querySelector('.monaco-workbench')?.classList.remove('cp-glitching'); }, 1350);
  };
  const relicLoop = () => setTimeout(() => { if (!document.hidden) window.cpRelic(); relicLoop(); }, (90 + Math.random() * 60) * 60000);
  relicLoop();
})(); } catch (e) { console.error("[cp-fx]", e); }

// Ripperdoc install bar: while an extension installs (the Extensions list shows an "Installing" action) a cyan strip sweeps the top of the window, then INSTALL COMPLETE; cpRip() shows it for 4 s
try { (() => {
  let bar = null, label = null, was = false, off = 0, fake = 0;
  const installing = () => fake > Date.now() || Array.from(document.querySelectorAll('.extension-action.installing')).some((e) => e.offsetParent !== null);
  window.cpRip = () => { fake = Date.now() + 4000; };
  every(() => {
    const on = installing();
    if (on && !bar) {
      bar = document.createElement('div'); bar.className = 'cp-rip';
      label = document.createElement('div'); label.className = 't'; label.textContent = 'RIPPERDOC // INSTALLING CYBERWARE';
      bar.appendChild(label); document.body.appendChild(bar);
    }
    off = on ? 0 : off + 1;
    if (!on && bar && off >= 3) { // gone for 1.5 s: the install finished
      const me = bar; bar = null;
      me.classList.add('done'); label.textContent = 'RIPPERDOC // INSTALL COMPLETE';
      setTimeout(() => me.remove(), 1700);
    }
  }, 500);
})(); } catch (e) { console.error("[cp-fx]", e); }

// Street cred level-up: the nc-district extension flips a hidden status item to "L<level>/<stamp>"; show a centred level-up card; cpLvl(n) previews level n
try { (() => {
  const mk = (tag, cls, text) => { const d = document.createElement(tag); d.className = cls; if (text) d.textContent = text; return d; };
  const GL = '#%&@$01/|<>=+*';
  const decode = (el, text, start, dur) => { // random glyphs that resolve left to right
    const rnd = (from) => text.split('').map((c, i) => (i < from || c === ' ' ? c : GL[Math.floor(Math.random() * GL.length)])).join('');
    el.textContent = rnd(0);
    setTimeout(() => {
      const t0 = Date.now(), iv = every(() => {
        const p = (Date.now() - t0) / dur;
        if (p >= 1 || !el.isConnected) { el.textContent = text; clearInterval(iv); } else el.textContent = rnd(Math.floor(p * text.length));
      }, 40);
    }, start);
  };
  const show = (lv) => {
    document.querySelectorAll('.cp-lvl, .cp-lvl-scrim').forEach((e) => e.remove());
    const scrim = mk('div', 'cp-lvl-scrim'), wrap = mk('div', 'cp-lvl'), card = mk('div', 'card'), n = mk('div', 'n');
    n.append(mk('span', 'o', String(lv - 1)), mk('span', 'w', String(lv)));
    const k = mk('div', 'k'), u = mk('div', 'u'), s = mk('div', 's');
    card.append(k, n, u, s);
    wrap.appendChild(card); document.body.append(scrim, wrap);
    decode(k, 'STREET CRED', 600, 500); decode(u, 'LEVEL UP', 1600, 350); decode(s, 'RESPECT EARNED // NIGHT CITY TAKES NOTICE', 1700, 900);
    setTimeout(() => { scrim.remove(); wrap.remove(); }, 4100);
  };
  window.cpLvl = (n) => show(n || 2);
  let last = null;
  every(() => {
    const el = Array.from(document.querySelectorAll('.part.statusbar .statusbar-item')).find((e) => e.id && e.id.indexOf('nc.lvl') !== -1);
    if (!el) return;
    el.style.width = '0'; el.style.padding = '0'; el.style.margin = '0'; el.style.overflow = 'hidden';
    const t = el.textContent.trim(), m = /L(\d+)\//.exec(t);
    if (last !== null && t !== last && m) show(+m[1]);
    last = t;
  }, 500);
})(); } catch (e) { console.error("[cp-fx]", e); }

// News: a running text row under the status bar plus a rare BREAKING popup box. Headlines are built from original templates and slot lists, seeded by the local date, so each day reads differently; cpNews() shows a popup now, cpRow(false/true) hides or shows the row
try { (() => {
  const D = ['City Center', 'Heywood', 'Pacifica', 'Santo Domingo', 'Watson', 'Westbrook'];
  const L = ['the docks', 'the rail yard', 'the neon strip', 'the arcade', 'canal road', 'the night market', 'the overpass', 'old harbor', 'the tower plaza', 'the bus depot'];
  const G = ['Chrome Hounds', 'Neon Vipers', 'Rust Saints', 'Ash Wolves', 'Glass Jackals', 'Static Kings', 'Red Lanterns', 'Iron Moths'];
  const C = ['Helix Dynamics', 'Orbital Freight', 'Kestrel Biotech', 'Sable Logistics', 'Vantage Media', 'Northgate Systems', 'Lumen Power', 'Halcyon Foods'];
  const S = ['Medi-Drone', 'Noodle Express', 'Safe Cab', 'Deck Care', 'Chrome Check', 'Night Shield'];
  const W = [['acid rain', 'rain'], ['thick fog', 'fog'], ['heat haze', 'heat'], ['strong winds', 'wind'], ['smog alert', 'smog'], ['cold snap', 'cold']];
  const V = ['truck', 'cab', 'tram', 'drone carrier', 'water van', 'tow rig'];
  const T = [
    ['{G} claim {L} after late standoff', 'Patrols found {n} abandoned vehicles near {L}. No arrests yet. Residents are told to stay in after dark.'],
    ['Police seal {L} for {n} hours', 'Officers closed the area after a tip about a stolen shipment. {D} traffic is rerouted.'],
    ['{D} shops report protection racket', '{n} stalls say {G} demand weekly fees. Police say they are looking into it.'],
    ['Chase ends at {L}', 'A speeding van linked to {G} hit a barrier. The driver fled on foot.'],
    ['{G} and {G2} trade threats on the net', 'Both crews posted warnings in {D}. Local cops raise patrols for the weekend.'],
    ['{C} opens new {D} campus', 'The firm promises {n} new jobs. Neighbours worry about rent and noise.'],
    ['{C} shares drop after audit leak', 'Analysts say the leak shows missing funds. The firm calls it a clerical matter.'],
    ['{C} recalls {n}00 units', 'A faulty battery pack may overheat. Customers can swap at any {D} outlet.'],
    ['{C} sponsors free rides in {D}', 'Cabs run free until midnight with a logo on every door. Drivers like the tips.'],
    ['{C} says delivery fleet back on time', 'After a week of delays, parcels reach {D} on schedule. Customers stay unconvinced.'],
    ['{w0} across {D} tonight', 'Expect {w1} until late. Carry a coat and keep your gear sealed.'],
    ['{w0} slows {D} streets', 'Visibility is poor near {L}. Drivers are told to slow down and keep lights on.'],
    ['{L} jammed after {v} stalls', 'Delays of {n} minutes. Drivers are asked to use {L2} instead.'],
    ['Tram line to {D} suspended', 'A power fault near {L} halts service. Shuttle buses run every {n} minutes.'],
    ['Net outage hits {D}', 'Connections dropped for {n} minutes. Techs blame a cut line near {L}.'],
    ['{C} pushes update to {n}K devices', 'Users report slower decks and new login screens. A fix is promised soon.'],
    ['Free wifi trial opens in {D}', 'Coverage reaches {L}. Experts warn it logs more than it admits.'],
    ['{D} night market draws record crowd', 'Over {n}00 visitors by midnight. Noodle stalls sold out within the hour.'],
    ['New braindance arcade opens in {D}', 'Queues stretch around the block. Reviewers call the lights intense.'],
    ['Street artist paints {n}-story mural in {D}', 'The wall near {L} shows a rainy skyline. Neighbours leave tips in a jar.'],
    ['Live music returns to {L}', 'Three bands play until dawn. Noise complaints expected, earplugs on sale.'],
    ['Clinics in {D} run on half staff', 'Wait times hit {n} hours. Officials promise extra crews by morning.'],
    ['{S} adds {n} units to {D}', 'Faster pickup for plan holders. Everyone else waits for city cabs.'],
    ['Flu wave reaches {D}', '{n} clinics report full waiting rooms. Doctors advise rest and clean air.'],
    ['{D} racers set new lap record', '{n}:{m} on the harbor loop. Judges check the rules before confirming.'],
    ['Cage fight at {L} sells out', 'The main bout lasted {m} seconds. Fans demand a rematch.'],
    ['Rent up {n} percent in {D}', 'Tenant groups call it too much. Landlords cite rising power prices.'],
    ['Gig work demand up in {D}', 'Couriers report {n} extra orders per shift. Pay stays flat.'],
    ['Power prices climb for {D} blocks', '{C} blames fuel costs. Residents turn off lights and complain loudly.'],
    ['Stray cat becomes {D} celebrity', 'A one-eyed cat asleep on a vending machine has {n}K followers.'],
    ['Noodle stall near {L} wins best late snack', 'Locals vote it the city favorite for year {m}.'],
    ['Rooftop garden grows in {D}', 'Volunteers plant {n} beds above {L}. Tomatoes are the first harvest.'],
    ['Lost drone found on {L}', 'A parcel drone sat on a roof for {n} days. Its owner has been called.']
  ];
  const BIG = [
    ['Blackout takes {D} dark', 'Power fails across {D}. Crews race to bring back {n} blocks before dawn. Stay off the streets near {L}.'],
    ['Explosion rocks {L} in {D}', 'Smoke over {L}. Emergency crews are on scene. Avoid the area until further notice.'],
    ['Standoff at {L}', 'Police surround a {G} hideout in {D}. Traffic is closed for {n} blocks around.'],
    ['{C} tower evacuated in {D}', 'An alarm clears {n}00 workers into the rain. The firm blames a faulty sensor.'],
    ['Superstorm shuts roads out of {D}', 'Wind and flooding close every route. Shelters open at {L}. Do not drive.'],
    ['Drone swarm grounds all flights', 'A rogue fleet blocks the sky over {D}. {C} says its units are not involved.'],
    ['Net outage in all six districts', 'Services are down city wide. Techs have no estimate. Cash only at most stalls.'],
    ['{G} and {G2} war spills into {D}', 'Shots fired near {L}. Police urge everyone to shelter in place.'],
    ['Water main bursts under {D}', 'Streets flood around {L}. Repair crews need {n} hours. Boil all tap water.'],
    ['Cyberpsycho on the loose in {D}', 'Police seal {L}. A heavily modded attacker is said to be a former runner. Stay indoors.'],
    ['Corp strike team hits {L}', 'Armoured units storm a hideout in {D}. Residents report a blur of speed and gunfire. Avoid the area.'],
    ['Heist crew escapes tower in {D}', 'Alarms ring after a daring night job. Corp security says it is under control. Nobody believes them.'],
    ['Mystery signal hijacks {D} screens', 'Every billboard in {D} shows static and one phrase. Technicians are tracing the source.']
  ];
  BIG.push(...[
    ['Netrunners crash {D} traffic grid', 'Signals fail across {D}. Police urge drivers to leave cars and walk. Avoid {L}.'],
    ['Fire races through {L} in {D}', 'Crews fight flames near {L}. {n} blocks are evacuated. Stay clear.'],
    ['Convoy attack on the {D} highway', 'Gunfire along the road as cargo trucks scatter. Traffic is halted for {n} blocks.'],
    ['Chemical leak closes {L}', 'A tank cracked at {L}. Residents of {D} are told to seal their windows.'],
    ['Rolling blackout hits {D}', 'Utilities blame demand. Hospitals switch to backup power. Candles sell out.'],
    ['Gang parade turns violent in {D}', '{G} and {G2} clash near {L}. Medics treat {n} people on the street.'],
    ['Hostage standoff at {L}', 'Police close {D} streets. Negotiators are on the line. Stay home.'],
    ['Rogue transit drones hit {L}', 'A fleet lost control over {D}. {C} says a patch is on the way.'],
    ['Armoured giant walks through {D}', 'Witnesses say bullets did not slow it. Max-Tac is called. Stay indoors.'],
    ['Speed freak runner tears through {L}', 'A blur on camera. Police lose track in seconds. Doctors fear for the runner.'],
    ['Moon launch rumour empties {D} bars', 'Crowds gather at {L} to watch the sky. Officials call it a prank. Nobody leaves.'],
    ['Tower assault rocks {D}', 'A small crew hits a corp tower in {D}. Alarms echo and the lights go out. Stay clear of {L}.'],
    ['Cyberpsycho squad deployed to {L}', 'Max-Tac arrives in {D} within minutes. Streets are sealed until further notice.']
  ]);
  const E = [ // [tag, colour, headline, body]: quiet nods to the Edgerunners anime, all original wording
    ['STREET', 'red', 'Edgerunner crews lose another member in {D}', 'Fixers say {n} runners went missing this month. Most crews stay quiet about it.'],
    ['STREET', 'red', 'Teen with new Sandevistan breaks track record near {L}', 'Doctors warn the implant can burn out a body. The kid says it was worth it.'],
    ['HEALTH', 'grn', 'Cyberpsychosis cases up {n} percent in {D}', 'Clinics see more people who stopped talking and started cutting. Max-Tac stays on call.'],
    ['CORP', 'cyan', 'Arasaka Academy opens scholarship lottery', 'Thousands of street kids apply. Parents say the odds favour the rich.'],
    ['STREET', 'red', 'Crew pulls midnight cargo job at {L}', 'A clean heist and a lot of questions. Corp security says nothing was missed.'],
    ['CULTURE', 'mag', 'Moon trip tickets sell out within minutes', 'Dreamers queue at {L}. Only the wealthiest get a seat. Everyone else watches the sky.'],
    ['CULTURE', 'mag', 'Afterlife night pass sells fast', 'Mercs and fixers pack the floor. Table prices triple after midnight.'],
    ['CITY', 'stl', 'Night nurse in {D} treats {n} street cases for free', 'Locals call her a saint. The hospital has asked her to slow down.'],
    ['NET', 'mag', 'Netrunner crew blamed for {D} signal drop', 'A lone runner is said to have cut the grid for {n} minutes. Techs found no trace.'],
    ['STREET', 'red', 'Gorilla arm brawl closes {L}', 'Two men with oversized chrome fists wrecked a stall. Neither has paid for the damage.'],
    ['STREET', 'red', 'Mantis blade duel ends in a draw', 'Two runners traded cuts near {L}. Doctors patched both. Neither will talk.'],
    ['CORP', 'cyan', 'Militech and Arasaka trade barbs over {D} contract', 'Both firms want the same port deal. Lawyers are already in the rain.'],
    ['CORP', 'cyan', 'Kang Tao unveils lighter smart pistols', 'Reviewers say the aim assist feels like cheating. Buyers say that is the point.'],
    ['MONEY', 'yel', 'Sandevistan upgrade sale ends tonight', 'Prices drop {n} percent. Clinics warn about back alley copies.'],
    ['HEALTH', 'grn', 'Ripperdoc raided in {D}', 'Police find {n} unlicensed implants in a back room. The doc vanished.'],
    ['CITY', 'stl', 'Tall armoured figure spotted near {L}', 'Residents say it never stopped walking. Police call it a prank.'],
    ['CULTURE', 'mag', 'Sad ballad about a lost love tops the charts', 'It has led {D} request lists for {n} days. Radio hosts are tired of it.'],
    ['STREET', 'red', 'Runner crew buys a round for the whole bar at {L}', 'Cash from a late job. The bartender did not ask where it came from.'],
    ['NET', 'mag', 'Old username shows online after {n} years', 'Friends say it is a prank. The account has not posted yet.'],
    ['HEALTH', 'grn', 'Free implant checks offered in {D}', 'Doctors want to catch overloaded nerves before they fail. The queue passes {L}.'],
    ['STREET', 'red', 'Crew member returns with a new cyberarm', 'The upgrade was paid with one last job. Old friends mark the date quietly.'],
    ['CITY', 'stl', 'Rooftop party for a missing friend draws {n}00 people', 'Music, neon and one empty chair. Organisers promise to do it every year.'],
    ['CORP', 'cyan', 'Academy graduate promoted to security lead', 'Born in {D}, now guarding a tower. Neighbours are proud and worried.'],
    ['SPORT', 'yel', 'Underground bike race on {L} draws record crowd', 'Street kids on rewired bikes beat the favourites. Betting stalls pay out until dawn.'],
    ['CRIME', 'red', 'Stolen implant crates found empty at {L}', 'Police believe a crew took only the best units. Insurers refuse to pay.'],
    ['CITY', 'stl', 'Night market sells fake moon rocks', 'Hawkers claim each stone came from orbit. Buyers say it is still a nice souvenir.'],
    ['CRIME', 'red', 'Cyberpsycho alert closes {L}', 'Police set a perimeter. Neighbours stay indoors. The suspect is said to be a former runner.'],
    ['CULTURE', 'mag', 'Street musician plays one song for {n} hours', 'The song is sad. The crowd is bigger every night.'],
    ['HEALTH', 'grn', 'Brain load warning issued for speed implants', 'A study says {n} in 100 users overheat. Dealers say it is exaggerated.'],
    ['STREET', 'red', 'Runners dispute payment with fixer at {L}', 'A crew says it was shorted. The fixer says the job was not clean.'],
    ['NET', 'mag', 'Netwatch warns of stray signals over {D}', 'Techs link them to an old cyberdeck. Residents are told to unplug.'],
    ['CITY', 'stl', 'Lunar dreamers sign petition for cheaper flights', 'Backers fill {L} with paper moons. The airline has not replied.']
  ];
  E.push(...[
    ['STREET', 'red', 'Rookie crew takes first job in {D}', 'Three teenagers and a borrowed gun. The fixer says they will either learn fast or not at all.'],
    ['HEALTH', 'grn', 'Clinic in {D} turns away patients without credit', 'Parents queue at {L} with sick kids. Doctors say the rules are not theirs.'],
    ['NET', 'mag', 'Billboard in {D} shows the moon for ten seconds', 'Hackers claim it. A girl in the crowd cried. Techs have no trace.'],
    ['CORP', 'cyan', 'Arasaka lab implant leaks to the street', 'Military grade speed hardware sells for {n}0 times its price. Clinics warn about the risks.'],
    ['STREET', 'red', 'Fixer retires after {n} years', 'The last call came at dawn. Crews at {L} drank to the end of an era.'],
    ['CITY', 'stl', 'Memorial wall at {L} grows by {n} names', 'Runners add faces from every crew. Neighbours bring flowers and keep the lights on.'],
    ['CRIME', 'red', 'Corp debt collectors repossess implants in {D}', 'Late payers were left in the street half blind. Police take no complaints.'],
    ['NET', 'mag', 'Netrunner found unresponsive with deck still running', 'Medics at {L} could not wake the runner. The deck was playing a loop of rain.'],
    ['STREET', 'red', 'Nomad convoy parks outside {D}', 'Dusty trucks and loud music. Locals sell them water, noodles and parts.'],
    ['CULTURE', 'mag', 'Afterlife bar names a drink after a legendary runner', 'It burns, glows and costs a week of pay. Sales are strong.'],
    ['CORP', 'cyan', 'Academy student wins top marks in {D}', 'Raised on {L}, trained in a tower. The family says it hurts to be proud.'],
    ['STREET', 'red', 'Runner crew steals a corp prototype and loses it', 'The crates were empty. Sources say the real cargo left an hour earlier.'],
    ['HEALTH', 'grn', 'Chrome sickness ward fills in {D}', 'Doctors say users ignored the early signs. Beds go to the worst cases first.'],
    ['CITY', 'stl', 'Kid with a wrecked bike gets a free ride from strangers', 'The {L} crowd chips in for parts. Another crew offers to pay for the paint.'],
    ['MONEY', 'yel', 'Street cred now counts as collateral in {D}', 'Lenders ask for a name and a rumour. Some crews fear their rep is worth more than they are.'],
    ['SPORT', 'yel', 'Speed trial ends without a winner at {L}', 'Both runners hit the finish at once. The judges called it a tie and blinked.'],
    ['NET', 'mag', 'Girl in a grey hood tops the netrunner rankings', 'Nobody has seen her. Rumour puts her on the moon. Forums are on fire.'],
    ['CORP', 'cyan', 'Tower security doubles after a daring rooftop raid', 'Guards in {D} now carry heavier gear. Residents notice the quiet on {L}.'],
    ['STREET', 'red', 'Small gunner wins range tournament in {D}', 'The shortest competitor with the loudest shotgun. The crowd chanted her name.'],
    ['CRIME', 'red', 'Kitchen table surgery goes wrong in {D}', 'A neighbour tried an implant without a licence. Police found the tools, not the patient.'],
    ['CITY', 'stl', 'Neighbours feed a sleeping runner for a week', 'Nobody asked questions. The runner left a note and a jar of eddies.'],
    ['CULTURE', 'mag', 'Street band plays a sad song for a fallen friend', 'The crowd at {L} sang the last line. The singer cried quietly.'],
    ['STREET', 'red', 'Crew leader seen with a chrome arm in {D}', 'Neighbours say he stopped smiling after the upgrade. The kids still follow him.'],
    ['CORP', 'cyan', 'Leak shows a corp counts runner deaths as a cost line', 'The memo called it attrition. Activists plan a vigil at {L}.'],
    ['NET', 'mag', 'Dead account posts a single heart in {D}', 'Friends say it is a prank. The log shows it was sent at 3 AM.'],
    ['HEALTH', 'grn', 'Speed implant users report memory gaps', 'A study of {n} users found fast reflexes and slow forgiveness. Dealers deny everything.'],
    ['STREET', 'red', 'Gang buries their own at {L}', 'Smoke, music and one last toast. Rival crews stay away out of respect.'],
    ['CITY', 'stl', 'Mother and son open a noodle stall in {D}', 'Their sign shows a tiny moon. Regulars say the broth tastes like home.'],
    ['MONEY', 'yel', 'Black market price for military implants hits record', 'Buyers at {L} pay {n}0 percent over last week. Sellers say stock is dry.'],
    ['CRIME', 'red', 'Biker gang robs a corp convoy near {D}', 'Ten bikes, one clean getaway. Insurers say the cargo was medical.'],
    ['CULTURE', 'mag', 'Braindance of a runner crew sells out in {D}', 'Fans relive a fatal last job in high detail. Critics call it ghoulish. Sales say otherwise.'],
    ['STREET', 'red', 'Teenager steals a speed unit from a lab truck', 'He hit top speed on the way out. Guards are still counting the seconds.'],
    ['HEALTH', 'grn', 'Ripperdoc warns kids about cheap implants in {D}', 'She says half of her night patients are under {n}. Her clinic stays open until dawn.'],
    ['NET', 'mag', 'Cyberpsychosis early warning app hits {D} decks', 'It watches your heart and your language. Critics say it watches everything.'],
    ['CORP', 'cyan', 'Max-Tac recruits at the {D} job fair', 'Booths promise pay and pride. Applicants ask how long past recruits lasted.'],
    ['CITY', 'stl', 'Lost bag with a pair of mantis blades returned at {L}', 'The owner said thanks and walked away fast. The clerk still has the receipt.'],
    ['STREET', 'red', 'Crew splits over a job gone wrong at {L}', 'Two friends stopped talking. A third was left with the bill.'],
    ['CULTURE', 'mag', 'Rooftop concert for a lost friend returns to {D}', 'The poster shows a smiling face. The crowd wears matching jackets.'],
    ['MONEY', 'yel', 'Cheap chrome clinics undercut licensed ones in {D}', 'Prices drop {n} percent. Complications are not included in the quote.'],
    ['CORP', 'cyan', 'Corp scholar program offers a ticket out of {D}', 'Applicants line up on {L}. The contract is long and the exit is not.'],
    ['SPORT', 'yel', 'Street kids race rewired bikes across {L}', 'The winner got a trophy made of scrap. The loser got a free repair.'],
    ['NET', 'mag', 'Black box signal draws runners to a derelict tower', 'Techs warn of traps. Crews bet on who gets in first.'],
    ['CRIME', 'red', 'Arms deal collapses at the {L} docks', 'Two crews and a fixer left empty handed. A shipping crate sits unopened.'],
    ['CITY', 'stl', 'Night shift nurse refuses a corp offer in {D}', 'She says her patients need her more than a title. The clinic gave her a day off.'],
    ['STREET', 'red', 'Veteran runner teaches kids street rules', 'Rule one, never trust a perfect job. Rule two, buy the good armour.'],
    ['CULTURE', 'mag', 'Rain soaked busker plays for the moon at {L}', 'The crowd looks up with him. A drone circles and hovers closer.'],
    ['HEALTH', 'grn', 'Cooling baths offered to overloaded runners', 'Patients shake for hours. The nurse hands out blankets and warnings.'],
    ['CORP', 'cyan', 'Rival firm launches a youth recruitment drive in {D}', 'Posters promise a future and fast pay. Parents compare the fine print.']
  ]);
  const A = ['AD: {S}: STAY COVERED, STAY ALIVE', 'AD: {C}: THE FUTURE RUNS ON US', 'AD: {S}: HERE IN {n} MINUTES OR THE NEXT RIDE IS FREE', 'AD: {C}: BUILT FOR THE CITY THAT NEVER SLEEPS', 'AD: {S} PLANS FROM {n}0 PER MONTH'];
  L.push(...['the ferry pier','the scrapyard','clinic row','arcade alley','the stairwell market','the sky bridge','the container maze','the gutter bar','the transit hub','the cemetery wall','the laundromat strip','the old billboard lot']);
  G.push(...['Neon Reapers','Copper Foxes','Dust Kings','Blue Lotus','Grim Wheels','Static Wolves']);
  C.push(...['Quantum Freight','Ironclad Medical','Silver Arc','Nova Retail','Pioneer Grid','Mirage Labs']);
  S.push(...['Quick Doc','Rain Cab','Night Bites','Spark Repair']);
  V.push(...['rail cart','bus','scooter convoy','garbage truck']);
  W.push(...[['dust storm','dust'],['black rain','rain'],['sticky heat','heat'],['neon haze','haze']]);
  const T2 = [
    ['CRIME', 'red', 'Pawn shop in {D} hit by smash and grab', 'Thieves took {n} decks in under a minute. The owner says the shelves were already half empty.'],
    ['CRIME', 'red', 'Courier robbed near {L}', 'A rider lost a sealed case and a bike. Police ask anyone with footage to come forward.'],
    ['CRIME', 'red', 'Fake ID ring busted in {D}', '{n} forged cards found in a laundromat. Officers say the printer was better than theirs.'],
    ['CRIME', 'red', '{G} tag every wall on {L}', 'Fresh paint in crew colours appeared overnight. Shop owners say washing it off costs more than the rent.'],
    ['CRIME', 'red', 'Car thief leaves a thank you note at {L}', 'The owner found the tank full and a note on the seat. Police are not amused.'],
    ['CRIME', 'red', 'Drone theft spree hits {D} rooftops', '{n} parcel drones vanished this week. Sellers are already offering them online.'],
    ['CRIME', 'red', 'Witnesses go silent after shooting at {L}', 'Officers knocked on {n} doors and got no answers. A candle burns at the corner.'],
    ['CORP', 'cyan', '{C} unveils pocket sized cyberdeck', 'It fits in a coat and heats up like a stove. Preorders in {D} sold out by noon.'],
    ['CORP', 'cyan', '{C} cuts {n}0 jobs in {D}', 'Workers were told by message at dawn. The firm calls it a smart restructure.'],
    ['CORP', 'cyan', '{C} buys a small rival for {n} million', 'The deal closed overnight. Staff at the old firm learned the news from their badges.'],
    ['CORP', 'cyan', '{C} security drones now patrol {L}', 'Residents say they hum all night. The firm says it is for their safety.'],
    ['CORP', 'cyan', '{C} offers free implant checks', 'Clinics in {D} line up to sign up. Critics say the fine print hands them every scan.'],
    ['CORP', 'cyan', 'Quarterly profits at {C} jump {n} percent', 'Investors cheer. Street vendors outside the tower say they have not seen the benefit.'],
    ['WEATHER', 'stl', 'Neon smog trapped over {D}', 'Air readings climb after a still night. Masks sell out at {L}.'],
    ['WEATHER', 'stl', 'First frost on {L}', 'Water on the road turned to ice by dawn. Cab drivers swap tyres and complain.'],
    ['WEATHER', 'stl', 'Warm rain brings crowds to {L}', 'Kids danced in the street until the power went out. Nobody minded.'],
    ['WEATHER', 'stl', 'Dust storm rolls in from the badlands', 'Visibility drops across {D}. Air filters are on sale at every stall.'],
    ['TRAFFIC', 'yel', 'Cab strike slows {D}', 'Drivers parked at {L} demanding fair rates. Rides cost {n} percent more.'],
    ['TRAFFIC', 'yel', 'Bike lane opens along {L}', 'Couriers cheer. Truck drivers say the lane is too narrow and too popular.'],
    ['TRAFFIC', 'yel', 'Overpass repairs close {L}', 'Work crews need {n} days. Drivers detour through {L2} and honk about it.'],
    ['NET', 'mag', 'Hacker group defaces {C} homepage', 'A neon skull replaced the logo for {n} minutes. Techs call it harmless, then restart everything.'],
    ['NET', 'mag', 'Rogue ad bot spams {D} decks', 'Users get the same ad {n} times an hour. Blockers sell out fast.'],
    ['NET', 'mag', 'Deck repair shop in {D} wins loyal fans', 'Quick fixes, honest prices and free tea. The queue starts at dawn.'],
    ['NET', 'mag', 'Old forum thread about {L} goes viral', 'Locals swap stories from years back. The oldest post is now a minor legend.'],
    ['CULTURE', 'mag', 'Braindance review show returns to {D}', 'The host rates {n} new clips a week. Fans argue about every score.'],
    ['CULTURE', 'mag', 'Street poets take over {L}', 'Rhymes about rent, rain and chrome. The crowd snaps along and the cops watch.'],
    ['CULTURE', 'mag', 'Movie night under the overpass', 'A projector, a bedsheet and {n}0 neighbours. Popcorn sells for a day of pay.'],
    ['CULTURE', 'mag', 'Night market adds a karaoke corner', 'Bad singing, loud cheers. Stall owners say sales are up {n} percent.'],
    ['HEALTH', 'grn', 'Ripperdoc offers a free checkup day in {D}', 'Appointments fill within the hour. The doc says bring a friend and a clean towel.'],
    ['HEALTH', 'grn', 'Smog clinic opens near {L}', 'Breathing tests are free this week. Doctors expect a long line.'],
    ['HEALTH', 'grn', 'Nurses in {D} ask for night pay', 'A short walkout is planned. Officials say talks start next week.'],
    ['SPORT', 'yel', 'Cage league names a new champion', 'The title changed hands after {m} seconds. The old champ asks for a rematch.'],
    ['SPORT', 'yel', 'Rooftop soccer returns to {D}', 'Wire fences, no referee and a ball that has seen better days. Fans love it.'],
    ['SPORT', 'yel', 'Bike gang challenges rivals to a charity race', 'Prize money goes to a clinic in {D}. Betting is allowed, ethics are not mentioned.'],
    ['MONEY', 'yel', 'Noodle prices rise {n} percent', 'Stall owners blame supply costs. Regulars keep ordering anyway.'],
    ['MONEY', 'yel', 'Pawn rates jump in {D}', 'Lenders cite risk. Borrowers cite lenders.'],
    ['MONEY', 'yel', 'Cheap cab pass launches in {D}', 'Unlimited rides for a week, within one zone. The fine print is longer than the ride.'],
    ['CITY', 'stl', 'Rooftop beekeeper sells honey in {D}', 'Jars labelled by block sell out. The taste changes with the street.'],
    ['CITY', 'stl', 'Neighbours rebuild burned stall on {L}', 'Volunteers raised {n}00 eddies in one night. The stall reopens Friday.'],
    ['CITY', 'stl', 'Old arcade cabinet found behind a wall in {D}', 'It still works. The high score is {n}00 and nobody knows who set it.'],
    ['CITY', 'stl', 'Street dog adopts a night shift nurse', 'It waits at the clinic gate every dawn. Staff named it Chrome.'],
    ['CITY', 'stl', 'City lights flicker for {n} seconds across {D}', 'Power says it was a test. Residents say it felt like a wink.'],
    ['CITY', 'stl', 'Tram driver sings every stop in {D}', 'Commuters record it. The operator says there have been no complaints so far.'],
    ['CITY', 'stl', 'Locals paint a lane on {L} for runners', 'Joggers get a neon stripe and clean air for one block. A start.']
  ]; // more regular stories, each [tag, colour, headline, body]
  T2.forEach((x) => T.push([x[2], x[3]]));
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const day = () => new Date().toLocaleDateString('en-CA');
  const fill = (s, r) => {
    const w = W[Math.floor(r() * W.length)], pk = (a) => a[Math.floor(r() * a.length)];
    const g = pk(G); let g2 = pk(G); if (g2 === g) g2 = G[(G.indexOf(g) + 1) % G.length];
    const l = pk(L); let l2 = pk(L); if (l2 === l) l2 = L[(L.indexOf(l) + 1) % L.length];
    return s.replace('{G2}', g2).replace('{L2}', l2).replace(/[{]G[}]/g, g).replace(/[{]L[}]/g, l)
      .replace(/[{]D[}]/g, () => pk(D)).replace(/[{]C[}]/g, () => pk(C)).replace(/[{]S[}]/g, () => pk(S)).replace(/[{]v[}]/g, () => pk(V))
      .replace('{w0}', w[0]).replace('{w1}', w[1])
      .replace(/[{]n[}]/g, () => 3 + Math.floor(r() * 94)).replace(/[{]m[}]/g, () => 2 + Math.floor(r() * 57));
  };
  const batch = (salt, n) => { // n distinct stories for this date and salt
    const r = rng(hash(day() + salt)), out = [], seen = new Set();
    for (let k = 0; out.length < n && k < n * 8; k++) {
      const e = r() < 0.15, ti = Math.floor(r() * (e ? E.length : T.length)), t = e ? E[ti].slice(2) : T[ti], f = fill(t[0] + "|" + t[1], r).split("|"), h = f[0].toUpperCase();
      if (!seen.has(h)) { seen.add(h); out.push([h, f[1], e ? E[ti] : CAT[ti]]); }
    }
    return out;
  };
  const mk = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; return x; };
  const CAT = []; // one [tag, colour] per template in T, in order
  [['CRIME', 5, 'red'], ['CORP', 5, 'cyan'], ['WEATHER', 2, 'stl'], ['TRAFFIC', 2, 'yel'], ['NET', 3, 'mag'], ['CULTURE', 4, 'mag'], ['HEALTH', 3, 'grn'], ['SPORT', 2, 'yel'], ['MONEY', 3, 'yel'], ['CITY', 4, 'stl']]
    .forEach((c) => { for (let i = 0; i < c[1]; i++) CAT.push([c[0], c[2]]); });
  T2.forEach((x) => CAT.push([x[0], x[1]]));
  const SYM = ['HLX', 'ORB', 'KST', 'SBL', 'VNT', 'NGS', 'LMN', 'HLC'];
  const lf = (cls, text) => mk('span', 'lf ' + cls, text);
  // real world headlines: the world-wire extension (not in this sandbox) fetches public RSS feeds and leaves them in the aria-label of a hidden status bar item as WIRE {json}; shown with their own white tag and italic text so they never pass for Night City news
  const wireRead = () => {
    for (const el of document.querySelectorAll('.part.statusbar .statusbar-item')) {
      const lab = el.getAttribute('aria-label') || '';
      if ((el.id && el.id.indexOf('wirefeed') !== -1) || lab.indexOf('WIRE ') === 0) { try { const p = JSON.parse(lab.replace(/^WIRE /, '')); return p && Array.isArray(p.items) ? p : null; } catch (e) { return null; } }
    }
    return null;
  };
  let wire = [], quotes = [], wx = null, wireT = 0, wxSeen = false, wxErr = '', paintWx = () => {};
  const okn = Number.isFinite, wxLine = () => [String(wx.sky).toUpperCase().slice(0, 16), wx.temp + 'C', 'WIND ' + wx.wind + ' KPH', wx.aqi !== null ? 'SMOG INDEX ' + wx.aqi : '', wx.uv !== null ? 'RAD ' + wx.uv : ''].filter(Boolean).join(' // ');
  const fmtPrice = (p) => (p >= 1000 ? Math.round(p).toLocaleString('en-US') : p >= 100 ? p.toFixed(1) : p.toFixed(2));
  every(() => { // a new set arrives every 20 minutes at most; redraw the row only then
    const p = wireRead();
    if (p && p.t !== wireT) { wireT = p.t; wire = p.items.filter((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string').slice(0, 40).map((x) => [x[0].slice(0, 14), x[1].slice(0, 140)]); quotes = (Array.isArray(p.quotes) ? p.quotes : []).filter((x) => Array.isArray(x) && typeof x[0] === 'string' && Number.isFinite(x[1]) && Number.isFinite(x[2])).slice(0, 24).map((x) => [x[0].slice(0, 8), x[1], x[2]]); const w = p.wx; // real weather from the extension; null when no location is set
    wx = w && typeof w === 'object' && okn(w.temp) && okn(w.wind) && typeof w.sky === 'string' ? { temp: Math.round(w.temp), wind: Math.round(w.wind), sky: w.sky.slice(0, 16), aqi: okn(w.aqi) ? Math.round(w.aqi) : null, uv: okn(w.uv) ? Math.round(w.uv) : null, rise: typeof w.rise === 'string' ? w.rise.slice(0, 5) : null, set: typeof w.set === 'string' ? w.set.slice(0, 5) : null, alert: w.alert && typeof w.alert === 'object' ? w.alert : null } : null;
    window.cpWxData = wx; wxSeen = true; wxErr = p.err && typeof p.err.WEATHER === 'string' ? p.err.WEATHER.slice(0, 60) : ''; paintWx();
    if (wire.length || quotes.length || wx) setText(); }
  }, 20000);
  window.cpWire = () => { const p = wireRead(); return JSON.stringify({ shown: wire.length, quotes: quotes.length, weather: !!wx, stamp: wireT, errors: p ? p.err : 'no hidden item found (extension not loaded?)' }); };
  const fillRow = () => { // news with coloured tags, a made-up market segment every 8 stories, an ad every 5
    sp.textContent = '';
    const r = rng(hash(day() + 'ad')), news = batch('t', 20), ads = A.map((s) => fill(s, r).replace(/^AD: /, '').toUpperCase());
    const add = (tag, tagCls, ...rest) => { const it = mk('span', 'it'); it.append(lf('tg ' + tagCls, tag), ...rest); sp.append(it, mk('span', 'sp', '//')); };
    if (!news.length) news.push(['NIGHT CITY NEWS 24 STANDING BY', '', ['CITY', 'stl']]);
    let wi = 0, qi = 0;
    news.forEach((x, k) => {
      add(x[2][0], x[2][1], lf('bd2', x[0]));
      if (wire.length && k % 3 === 2) { const w = wire[wi++ % wire.length]; add(w[0], 'wr wr-' + w[0].toLowerCase().replace(/[^a-z0-9]+/g, ''), lf('bd2 wt', w[1].toUpperCase())); } // every third story is a real one
      if (quotes.length && k % 10 === 5) { // a real prices segment: four symbols, the next four on the next one
        const o = (qi++ * 4) % quotes.length, parts = [];
        for (let n = 0; n < Math.min(4, quotes.length); n++) {
          const q = quotes[(o + n) % quotes.length], up = q[2] >= 0, g = mk('span', 'mk');
          g.append(lf('bd2 wt', q[0] + ' ' + fmtPrice(q[1])), mk('span', 'ar ' + (up ? 'up' : 'dn')), lf(up ? 'up' : 'dn', Math.abs(q[2]).toFixed(1) + '%')); parts.push(g);
        }
        add('LIVE MKT', 'wr wr-mkt', ...parts);
      }
      if (wx && k === 11) add('LIVE WX', 'wr wr-wx', lf('bd2 wt', wxLine())); // one real weather line per row
      if (k % 5 === 4) add('AD', 'ad', lf('bd2', ads[(k / 5 | 0) % ads.length]));
      if (k % 8 === 7) {
        const pool = SYM.slice(), parts = [];
        for (let n = 0; n < 4; n++) {
          const s = pool.splice(Math.floor(r() * pool.length), 1)[0], v = r() * 9 - 4.5;
          const up = v >= 0, g = mk('span', 'mk'); // triangle drawn with borders so it centres exactly
          g.append(lf('bd2', s), mk('span', 'ar ' + (up ? 'up' : 'dn')), lf(up ? 'up' : 'dn', Math.abs(v).toFixed(1) + '%')); parts.push(g);
        }
        add('MARKET', 'grn', ...parts);
      }
    });
    Array.from(sp.childNodes).forEach((n) => sp.appendChild(n.cloneNode(true))); // second copy: the loop never shows an empty row
  };

  // running text row: the layout is told the window is 22px shorter, so the row sits free under the status bar; if the layout ignores that, the row stays off
  const BH = 26, desc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  const realH = () => desc.get.call(window);
  const row = mk('div', 'cp-nrow'), run = mk('div', ''), sp = mk('span', 'run'), lab = mk('b', '', 'LIVE');
  run.appendChild(sp); const sg = mk('span', 'sg'); sg.append(mk('span', ''), mk('span', ''), mk('span', '')); // broadcast signal bars
  row.append(mk('i', '', 'NCN'), sg, lab, run);
  let shrink = false, rowDay = '';
  const resize = () => window.dispatchEvent(new Event('resize'));
  const setText = () => { rowDay = day(); fillRow(); const dur = Math.round(sp.textContent.length * 0.11); sp.style.animationDuration = dur + 's'; sp.style.animationTimingFunction = 'steps(' + Math.max(1, dur * 30) + ', end)'; }; // 30 steps a second: half the frames, same speed
  const rowOn = () => {
    if (!desc || !desc.get || !desc.configurable) return;
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => realH() - (shrink ? BH : 0) });
    shrink = true; resize();
    let n = 0;
    const chk = () => {
      const sb = document.querySelector('.part.statusbar'), r = sb && sb.getBoundingClientRect();
      if (!r || r.bottom > realH() - BH + 3) { if (++n < 14) { resize(); setTimeout(chk, 700); } else { shrink = false; resize(); console.warn('[cp-fx] news row off: layout ignored the shorter window'); } return; }
      document.body.appendChild(row);
    };
    setTimeout(chk, 900);
  };
  const rowOff = () => { shrink = false; row.remove(); resize(); };
  setText();
  let tries = 0;
  const wait = every(() => {
    if (document.querySelector('.part.statusbar') && document.body) { clearInterval(wait); rowOn(); } else if (++tries > 60) clearInterval(wait);
  }, 500);
  every(() => { if (rowDay !== day()) setText(); }, 30000);
  // random glitch: about 8% of the characters turn to noise for a moment while the row jumps and splits
  const GLY = '#%&@$01/|<>=+*';
  const glitchRow = () => {
    if (!row.isConnected) return;
    const lv = Array.from(sp.querySelectorAll('.lf')), orig = lv.map((e) => e.textContent);
    lv.forEach((e) => { e.textContent = orig[lv.indexOf(e)].split('').map((c) => (c !== ' ' && Math.random() < 0.08 ? GLY[Math.floor(Math.random() * GLY.length)] : c)).join(''); });
    row.classList.add('g');
    setTimeout(() => { lv.forEach((e, i) => { e.textContent = orig[i]; }); row.classList.remove('g'); }, 420);
  };
  const glLater = () => setTimeout(() => { glitchRow(); if (Math.random() < 0.3) setTimeout(glitchRow, 700); glLater(); }, 15000 + Math.random() * 60000);
  glLater();
  window.cpRow = (on) => { if (on === false) rowOff(); else if (!shrink) rowOn(); };

  // Radio chip: the real in-game stations and tracks (titles only, as listed in public track guides after update 2.0) at the right end of the row. The track follows the clock (3.5 minute slots, order shuffled by date). Click tunes to the next station through a burst of static, right click mutes, hover shows the queue. Each station has its own colour, the bars run hard while Claude works, an ad break comes every few tracks, and a thin line shows how far the track is. cpRadio() skips a track
  const R = [
    ["88.9", "PACIFIC DREAMS", [["Quantum Lovers","Isometric Air"], ["Quantum Lovers","Practical Heart"], ["Quantum Lovers","Real Window"], ["Pacific Avenue","Antagonistic"], ["Jänsens","Simple Pleasures"], ["Flatlander Woman","Lithium"], ["Flatlander Woman","Slag"], ["Muchomorr","Chooze"], ["Lick Switch","Midnight Eye"], ["Lick Switch","Blurred"], ["Lick Switch","The Other Room"], ["Sonoris Causa","La Stessa Causa"], ["Left Unsaid","Retrogenesis"], ["Talk To Us","Miami Suicide"], ["Talk To Us","Slippery Stabs"], ["Wormview","Ashes and Diamonds"], ["Mona Mitchell","Ice Maddox"]]],
    ["89.3", "RADIO VEXELSTROM", [["The Cartesian Duelists","Resist and Disorder"], ["The Cartesian Duelists","Kill the Messenger"], ["Slavoj McAllister","Makes Me Feel Better"], ["Keine","Dead Pilot"], ["Keine","Come Close"], ["Upgrade","Black Terminal"], ["Alexei Brayko","Reaktion"], ["Ego Affliction","With Her"], ["Den of Degenerates","Never Stop Me"], ["The Red Glare","Violence"], ["The Red Glare","Pain"], ["Homeschool Dropouts","Night City Aliens"], ["Tainted Overlord","Selva Pulsátil"], ["Tainted Overlord","A Caça"]]],
    ["89.7", "GROWL FM", [["Coeur Noir","Let The Stars Die"], ["Red Dead Roadkill","Flatline"], ["Spirit Machines","Candy Shell"], ["NoWorld","Do or Die"], ["Entolim","LIT"], ["Skin on Flesh","El Tiempo"], ["Frost, Justtjokay, Dubbygotbars, and Knyvez","Killshot"], ["HARU NEMURI","Let It Go As If You Wander"], ["Kiba","Slipstream"], ["Aleyna Moon and Shrinjay Ghosh","Fumes"], ["D.O.H. Dollahz Ova Hoez","Look Through My Kiroshi's (The Solo Life)"], ["St. Aurora","Going to Heaven"], ["ESAI and Pure 100%","Nebula"], ["Thai McGrath ft. JustCosplaySings","Afterlife"]]],
    ["91.9", "ROYAL BLUE RADIO", [["Miles Davis","Black Satin"], ["Miles Davis","What If"], ["Miles Davis","Agharta Prelude Dub"], ["Miles Davis","Bitches Brew"], ["Miles Davis","Générique (from Ascenseur pour L'Échafaud)"], ["John Coltrane","Impressions"], ["Charles Mingus","Solo Dancer"], ["Dexter Gordon","Laura"], ["Chet Baker","You Don't Know What Love Is"], ["Thelonious Monk","Round Midnight"], ["Trio of Doom","Dark Prince"]]],
    ["92.9", "NIGHT FM", [["Perilous Futur","Dirty Roses"], ["The Unresolved","Worlds"], ["The Unresolved","X"], ["Doctor Berserk","Maniak"], ["Generating Dependencies","Me Machine"], ["Lick Switch","Like a Miracle"], ["Kings of Collapse","Run"], ["Reviscerator","Glitched Revelation"], ["Reviscerator","Yellow Box"], ["The Bait","Kill Kill"], ["Ashes Potts","Flying Heads"], ["Yards of the Moon","Volcano The Sailor"], ["Cyber Coorayber","Brain-Damaged"]]],
    ["95.2", "SAMIZDAT RADIO", [["Bara Nova","Pilling in My Head"], ["Bara Nova","Delirium 2"], ["Bara Nova","Harm Sweaty Pit"], ["Bara Nova","My Lullaby for You"], ["Bara Nova","Surprise Me, I'm Surprised Today"]]],
    ["96.1", "RITUAL FM", [["V3RM1N","Finis"], ["Dread Soul","The Accursed"], ["Bacillus","Adaptive Manipulator"], ["Bacillus","March 30"], ["Forlorn Scourge","Acid Breather"], ["Nuclear Aura","Witches of the Harz Mountains"], ["Weles","The Loop"], ["Hysteria","Scrum"], ["Inferno Crops","Fuelled By Poison"], ["Inferno Crops","Kevin"], ["Hexxxer","Future Drugs"], ["Wydech","Żurawie"], ["Fist of Satan","Abandoned Land"], ["Fist of Satan","Black Concrete"], ["Shattered Void","I Won't Let You Go"]]],
    ["98.7", "BODY HEAT RADIO", [["Clockwork Venus","BM"], ["Neon Haze","Circus Minimus"], ["Window Weather","Major Crimes"], ["Artemis Delta","Night City"], ["Hallie Coggins","I Really Want to Stay at Your House"], ["Point Break Candy","Hole In The Sun"], ["American Medical Association","Blind"], ["Trash Generation","History"], ["Lizzy Wizzy","4ÆM"], ["Lizzy Wizzy","Delicate Weapon"], ["Us Cracks","Ponpon Sh*t"], ["Us Cracks","User Friendly cover"], ["Us Cracks ft. Kerry Eurodyne","Off the Leash"], ["IBDY","Crustpunk"], ["IBDY","Here's a Thought"]]],
    ["99.9", "IMPULSE", [["Mr. Kipper","Walk Of Shame"], ["Private Press","Dreamy"], ["Private Press","DEEEEEEP"], ["Private Press","Black Labyrinth"], ["Private Press","Feed Your Soul"], ["Private Press","Liquid Disco"], ["Private Press","Sleepy Dust"], ["Private Press","Sparkling Frequency"], ["Private Press","Undeniably Changes"], ["Private Press","Void"], ["Private Press","Woozee"], ["Private Press","GREEEEEENHOUSE"], ["Private Press","BESTPL"], ["Private Press","ENERGEEHOUSE"]]],
    ["101.9", "THE DIRGE", [["Kill Trigger ft. Paul Senai and Krakow","The God Machines"], ["NC3","Blouses Blue"], ["Young Kenny","Problem Kids"], ["Droox","Bigger Man"], ["DNE ft. G'Natt","Go Blaze"], ["Ichibanchi","Dishonor"], ["Yamete","Frost"], ["UMVN ft. IMP RA","High School Bully"], ["Dapxflem","NBOM"], ["Code 137","Suicide"], ["Haps","Day of Dead"], ["Knixit","Bruzez"], ["Sugarcoob ft. Anak Konda","Clip Boss"], ["Triple-B ft. Gun-Fu","Pluck U"], ["Pazoozu","Hello Good Morning"], ["Bez Tatami ft. Gully Foyle","Run The Block"], ["Kyubik","GR4VES"], ["Laputan Machine","Warning Shots"], ["Gorgon Madonna","Metamorphosis"], ["Yankee and the Brave","No Save Point"], ["Telo$","Flacko Locko"]]],
    ["103.5", "RADIO PEBKAC", [["Error","Bios"], ["Sao Mai","Drained"], ["Spoon Eater","Subvert"], ["Nablus","Follow the White Crow"], ["IOshrine","Fake Spook"], ["[flesh]reactor","Move Dat"], ["Bullet in the Head","CANNIBALISMUS"], ["culteX","La Canopée"], ["Skin<>Drifter","Undertow Velocity"], ["Yards of the Moon","IIOI Break"], ["Retinal Scam","Across the Floor"], ["Retinal Scam","Gridflow"], ["Tar Hawk","Vascular"], ["Tinnitus","On My Way to Hell"], ["Clockwork OS","Stackoverflow"], ["Dukes of Azure","Darkretro"]]],
    ["106.9", "30 PRINCIPALES", [["Kartel Sonoro","Bamo"], ["Kartel Sonoro","Dagga"], ["7 Facas","Dinero"], ["7 Facas","Serpant"], ["Don Mara","Tatted on my Face"], ["Big Machete","Barrio"], ["Chickychickas","Hood"], ["Chickychickas","Only Son"], ["Papito Gringo","Muévelo"], ["Papito Gringo","Cumbia"], ["FKXU","Muerto Trash"], ["DJ Choloz","Westcoast Til I Die"]]],
    ["107.3", "MORRO ROCK RADIO", [["Brutus Backlash","Suffer Me"], ["XerzeX","Heave Ho"], ["Beached Tarantula","I Will Follow"], ["IBDY","Who's Ready for Tomorrow"], ["IBDY","Likewise"], ["Rubicones","Friday Night Fire Fight"], ["Rubicones","Trauma"], ["Blood and Ice","Summer of 2069"], ["Krushchev's Ghosts","Testmaster"], ["Cutthroat","Sustain/Decay"], ["Artificial Kids","To the Fullest"], ["Fingers and The Outlaws","So It Goes"], ["Samurai","Never Fade Away"], ["Samurai","Black Dog"], ["Samurai","Chippin' In"], ["Samurai","The Ballad of Buck Ravers"]]],
    ["107.5", "DARK STAR", [["Mr. Kipper","Choke Hold"], ["BADPANNINI","Headrush"], ["No Strings Attached","Orbital Insertion"], ["BWANA MUNGU","Cyko Arctic"], ["OLO Y","Pierwszy raz naprawdę"], ["DJ papergekko","NUCLEAR DREAMLAND"], ["Mr. Kipper","Rolla Coaster"], ["ECKO FREQUENCY","IKARI"], ["Her Mashewsky","fabrica KOSMOS"], ["Walt Air","dRk"], ["Mightonauts","Minion Sex"], ["DJ papergekko","Bigger Crimes"], ["Łotr","Memories of Mzuzu"]]]
  ];
  const CL = { '88.9': '#2DE6C5', '89.3': '#7C7CFF', '89.7': '#FF003C', '91.9': '#4F8CFF', '92.9': '#FF2BD6', '95.2': '#FFB000', '96.1': '#B8B8C8', '98.7': '#FF7AC8', '99.9': '#3CFF9A', '101.9': '#FCEE0A', '103.5': '#8FA3B0', '106.9': '#FF5A36', '107.3': '#FF9F1C', '107.5': '#B14DFF' };
  const col = (f) => CL[f] || '#02D7F2';
  const AD = ['{S}: STAY COVERED', '{C}: POWER YOU CAN TRUST', '{S}: HERE IN {n} MIN OR FREE', '{C}: THE FUTURE RUNS ON US', '{S}: PLANS FROM {n}0 A MONTH', '{C}: BUILT FOR THE NIGHT'];
  const SLOT = 210000;
  let st = Math.floor(rng(hash(day() + 'radio'))() * R.length), off = 0, shown = '', rpop = null, tuning = false, muted = false, adUntil = 0, plays = 0;
  const rd = mk('span', 'rd'), eq = mk('span', 'rd-eq'), fm = mk('span', 'rd-fm'), ttl = mk('span', 'rd-t'), inn = mk('span', ''), pg = mk('span', 'rd-pg'), gh = mk('span', 'rd-t rd-gh'); let tw = 250, fw = 0; // gh: hidden twin used to measure a title
  for (let k = 0; k < 5; k++) eq.appendChild(mk('span', ''));
  ttl.appendChild(inn); rd.append(eq, fm, ttl, pg, gh); row.appendChild(rd);
  // weather chip, left of the radio: real temperature and sky when a location is set, SET WEATHER when not (shown once the world-wire extension is seen). A click presses the extension's hidden status bar item, which opens the location box; hover lists the details
  const wc = mk('span', 'wxc'), wci = mk('span', 'wxc-i'), wct = mk('span', 'wxc-t'); wc.append(wci, wct); wc.style.display = 'none'; row.insertBefore(wc, rd);
  let wpop = null;
  const skyIcon = (s) => (/STORM/.test(s) ? 'storm' : /SNOW/.test(s) ? 'snow' : /RAIN|DRIZZLE/.test(s) ? 'rain' : /FOG/.test(s) ? 'fog' : /CLEAR/.test(s) ? 'sun' : 'cloud');
  const wxClose = () => { if (wpop) { wpop.remove(); wpop = null; } };
  paintWx = () => { wc.style.display = wxSeen ? '' : 'none'; wc.className = 'wxc' + (wx ? (wx.alert ? ' al' : '') : wxErr ? ' off err' : ' off'); wct.textContent = wx ? wx.temp + 'C ' + String(wx.sky).toUpperCase() : wxErr ? 'WEATHER ERROR' : 'SET WEATHER'; wci.textContent = ''; if (window.cpWxIcon) wci.appendChild(window.cpWxIcon(wx ? skyIcon(String(wx.sky).toUpperCase()) : 'cloud', 13)); };
  const wxHover = () => {
    wxClose(); if (!document.body) return;
    wpop = mk('div', 'cp-rpop'); wpop.style.setProperty('--rc', wx && wx.alert ? '#FCEE0A' : '#E6E6EA');
    const row2 = (a, b) => { const r = mk('div', ''); r.append(mk('span', '', a), mk('span', 't', b)); wpop.appendChild(r); };
    if (!wx) { wpop.appendChild(mk('h4', '', wxErr ? 'WEATHER // ERROR' : 'WEATHER // OFF')); row2(wxErr ? wxErr.toUpperCase() : 'CLICK TO SET YOUR CITY', ''); const f = mk('div', 'ft'); f.append(mk('span', '', 'ONLY THE CITY TEXT IS SENT'), mk('span', '', 'OPEN-METEO')); wpop.appendChild(f); }
    else {
      wpop.appendChild(mk('h4', '', 'WEATHER // NOW'));
      row2('SKY', String(wx.sky).toUpperCase() + ' ' + wx.temp + 'C'); row2('WIND', wx.wind + ' KPH');
      if (wx.aqi !== null) row2('SMOG INDEX', String(wx.aqi)); if (wx.uv !== null) row2('RAD', String(wx.uv));
      if (wx.set) row2('NEON ON', wx.set); if (wx.rise) row2('DAWN', wx.rise);
      row2('WARNING', wx.alert && typeof wx.alert.title === 'string' ? wx.alert.title.slice(0, 30) : 'NONE');
      const f = mk('div', 'ft'); f.append(mk('span', '', 'CLICK: CHANGE LOCATION'), mk('span', '', 'OPEN-METEO')); wpop.appendChild(f);
    }
    document.body.appendChild(wpop);
  };
  wc.addEventListener('mouseenter', wxHover); wc.addEventListener('mouseleave', wxClose);
  wc.addEventListener('click', () => { wxClose(); const it = Array.from(document.querySelectorAll('.part.statusbar .statusbar-item')).find((x) => x.id && x.id.indexOf('wirefeed') !== -1); const a = it && (it.querySelector('a') || it); if (a) a.click(); });
  const paint = () => { rd.style.setProperty('--rc', col(R[st][0])); };
  const queue = () => { // today's shuffled order for this station, and where the clock is in it
    const s = R[st], r = rng(hash(day() + s[0])), o = s[2].map((t) => [r(), t]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    return [o, Math.floor((Date.now() + off) / SLOT) % o.length];
  };
  const label = (t) => t[1] + ' // ' + t[0];
  const size = (text) => { gh.textContent = text; const w = Math.ceil(gh.getBoundingClientRect().width); if (!w) return; fw = w; tw = Math.min(w + 2, 250); ttl.style.width = tw + 'px'; }; // box follows the title up to 250px, eased by css
  const fit = () => { // a long title slides back and forth inside the fixed box
    inn.classList.remove('mq'); const ov = fw - tw;
    if (ov > 4) { inn.style.setProperty('--ov', -ov + 'px'); inn.style.setProperty('--d', Math.round(ov / 16 + 4) + 's'); inn.classList.add('mq'); }
  };
  const scramble = (text) => { // random glyphs that resolve left to right
    size(text); inn.classList.remove('mq'); const t0 = Date.now(), iv = every(() => {
      const p = (Date.now() - t0) / 420;
      if (p >= 1 || !rd.isConnected) { inn.textContent = text; rd.classList.remove('g'); clearInterval(iv); fit(); return; }
      inn.textContent = text.split('').map((c, i) => (i < p * text.length || c === ' ' ? c : GLY[Math.floor(Math.random() * GLY.length)])).join('');
    }, 40);
  };
  const play = (anim) => { const [o, i] = queue(); fm.textContent = R[st][0]; paint(); if (anim) { rd.classList.add('g'); scramble(label(o[i])); } else { size(label(o[i])); inn.textContent = label(o[i]); fit(); } };
  const ad = () => {
    const text = fill(AD[Math.floor(Math.random() * AD.length)], rng(hash(String(Date.now())))).toUpperCase();
    adUntil = Date.now() + 8000; rd.classList.add('ad'); fm.textContent = 'AD'; scramble('AD BREAK // ' + text);
    setTimeout(() => { adUntil = 0; rd.classList.remove('ad'); shown = ''; tune(); }, 8000);
  };
  const tune = (natural) => {
    if (tuning || Date.now() < adUntil) return;
    const [o, i] = queue(), key = R[st][0] + '/' + i;
    if (key === shown) return;
    const first = shown === ''; shown = key;
    if (first) play(false); else if (natural && ++plays % 4 === 0) ad(); else play(true);
  };
  const tuneTo = (n) => { // sweep the dial: random frequencies and static, then lock on
    if (tuning) return; tuning = true; closePop(); rd.classList.add('tn'); rd.classList.remove('ad'); adUntil = 0; let k = 0;
    const iv = every(() => {
      if (++k > 10 || !rd.isConnected) {
        clearInterval(iv); st = n; off = 0; tuning = false; rd.classList.remove('tn'); shown = ''; paint();
        const [o, i] = queue(); shown = R[st][0] + '/' + i; play(true); return;
      }
      fm.textContent = (88 + Math.random() * 20).toFixed(1); rd.style.setProperty('--rc', col(R[Math.floor(Math.random() * R.length)][0]));
      inn.classList.remove('mq'); inn.textContent = Array.from({ length: 24 }, () => '#%&@01/|<>=+*'.charAt(Math.floor(Math.random() * 13))).join('');
    }, 60);
  };
  function closePop() { if (rpop) { rpop.remove(); rpop = null; } }
  const openPop = () => {
    closePop(); if (!document.body || tuning) return;
    const [o, i] = queue(); rpop = mk('div', 'cp-rpop'); rpop.style.setProperty('--rc', col(R[st][0])); rpop.appendChild(mk('h4', '', R[st][0] + ' ' + R[st][1] + ' // TODAY'));
    for (let k = 0; k < Math.min(4, o.length); k++) { const t = o[(i + k) % o.length], li = mk('div', k ? '' : 'on'); li.append(mk('span', '', label(t)), mk('span', 't', k ? '+' + k : 'NOW')); rpop.appendChild(li); }
    const ft = mk('div', 'ft'); ft.append(mk('span', '', 'CLICK: NEXT   RIGHT CLICK: MUTE'), mk('span', '', R.length + ' STATIONS')); rpop.appendChild(ft);
    document.body.appendChild(rpop);
  };
  rd.addEventListener('mouseenter', openPop); rd.addEventListener('mouseleave', closePop);
  rd.addEventListener('click', () => tuneTo((st + 1) % R.length));
  rd.addEventListener('contextmenu', (e) => { e.preventDefault(); muted = !muted; rd.classList.toggle('mt', muted); });
  paint();
  every(() => {
    if (!rd.isConnected) { shown = ''; return; } // measuring needs the row on the page; replay the title once it is back
    tune(true);
    pg.style.transform = 'scaleX(' + (((Date.now() + off) % SLOT) / SLOT).toFixed(3) + ')';
    rd.classList.toggle('busy', !!document.querySelector('.monaco-workbench.cp-busy'));
  }, 1000);
  window.cpRadio = () => { off += SLOT - ((Date.now() + off) % SLOT) + 50; tune(); };

  // BREAKING popup: a box with a glitch in and out at random times (first after 3-8 min, then every 20-45 min)
  const box = mk('div', 'cp-news'), scr = mk('div', 'scr'), nn = mk('div', 'nn'), hd = mk('div', 'hd'), bd = mk('div', 'bd');
  nn.append(mk('span', '', 'BREAKING // NIGHT CITY NEWS 24'), mk('b', '', 'LIVE')); scr.append(mk('div', 'sl'), nn, hd, bd); box.appendChild(scr);
  let up = false;
  const pop = () => {
    if (up || !document.body) return; up = true;
    const r = rng(hash(String(Date.now()))), t = BIG[Math.floor(r() * BIG.length)], f = fill(t[0] + '|' + t[1], r).split('|');
    hd.textContent = f[0].toUpperCase(); bd.textContent = f[1];
    box.className = 'cp-news'; document.body.appendChild(box); row.classList.add('al'); lab.textContent = 'BREAKING';
    setTimeout(() => box.classList.add('out'), 9300);
    setTimeout(() => { box.remove(); up = false; row.classList.remove('al'); lab.textContent = 'LIVE'; }, 10200);
  };
  const later = () => setTimeout(() => { pop(); later(); }, (20 + Math.random() * 25) * 60000);
  setTimeout(() => { pop(); later(); }, (3 + Math.random() * 5) * 60000);
  window.cpNews = pop;
})(); } catch (e) { console.error("[cp-fx]", e); }
