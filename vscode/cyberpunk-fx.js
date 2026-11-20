// Cyberpunk effects: mouse pointer trail, glitches, save and error HUD. Loaded by the Custom CSS and JS Loader.
// Text cursor trail removed 2026-11-19 (too distracting when clicking around code); the mouse pointer trail stays.

// Random glitch: every 15-45 s one part of the window glitches; about 1 in 5 hits the whole window
(() => {
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
})();

// Humanity drift: instability level 0-3 from time worked without a 5 min break and from the error count; sets cp-lv1..3 on the workbench
(() => {
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
  setInterval(() => {
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
})();

// Sandevistan mouse pointer, random encounter: every 2-5 min it engages for 8-12 s, then cools down
(() => {
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
})();

// Tab encounters: opening, closing or switching a file has a 1 in 3 chance to glitch the editor
(() => {
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
})();

// Heartbeat gate: the cc-busy-bridge extension shows a hidden status-bar flag while Claude works; mirror it to a cp-busy class
(() => {
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
  setInterval(tick, 500);
  // Esc in the terminal while busy = interrupt (Stop hook does not fire): treat this flag stamp as over until a new prompt rewrites it
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || stamp === null) return;
    const a = document.activeElement;
    if (!(a && a.closest && a.closest('.terminal-wrapper, .xterm'))) return;
    killed = stamp; tick();
  }, true);
})();

// Boot sequence: a short neural-link splash when the window loads
(() => {
  const mk = (cls, text) => { const d = document.createElement('div'); d.className = cls; if (text) d.textContent = text; return d; };
  const boot = mk('cp-boot');
  boot.append(mk('t', 'NEURAL LINK ESTABLISHED'), mk('s', '// NIGHT CITY OS'), mk('bar'));
  document.body.appendChild(boot);
  setTimeout(() => boot.remove(), 2000);
})();

// Data rain: falling glyphs fill an empty editor group (no file open), and the whole editor after 3 min idle (standby); removed on the next input
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789ABCDEF<>/|=+*';
  const SIZE = 16, FRAME = 70, STANDBY = 3 * 60000; // FRAME: ms between steps, about 14 fps
  let cv = null, ctx = null, host = null, tag = null, drops = [], w = 0, h = 0, last = 0, lastInput = Date.now();
  const stop = () => { if (cv) cv.remove(); if (tag) tag.remove(); cv = ctx = host = tag = null; };
  // mousemove counts here (wakes standby) but not for the humanity drift clock
  ['keydown', 'mousedown', 'mousemove', 'wheel'].forEach((e) => document.addEventListener(e, () => {
    lastInput = Date.now();
    if (tag) stop();
  }, { passive: true, capture: true }));
  const findHost = () => {
    if (document.hidden) return null;
    const idle = Date.now() - lastInput > STANDBY && !document.querySelector('.monaco-workbench.cp-busy');
    if (idle) return document.querySelector('.part.editor');
    const g = document.querySelector('.part.editor .editor-group-container.empty');
    return g ? (g.querySelector('.editor-container') || g) : null;
  };
  const loop = (t) => {
    if (!cv) return;
    requestAnimationFrame(loop);
    if (t - last < FRAME) return;
    last = t;
    const r = host.getBoundingClientRect();
    if (!host.isConnected || r.width < 2 || r.height < 2) { stop(); return; }
    if (Math.round(r.width) !== w || Math.round(r.height) !== h) {
      w = Math.round(r.width); h = Math.round(r.height); cv.width = w; cv.height = h;
      drops = Array.from({ length: Math.ceil(w / SIZE) }, () => -Math.random() * (h / SIZE));
      ctx.fillStyle = '#0D0D12'; ctx.fillRect(0, 0, w, h);
    }
    cv.style.left = r.left + 'px'; cv.style.top = r.top + 'px';
    ctx.fillStyle = 'rgba(13,13,18,0.13)'; ctx.fillRect(0, 0, w, h);
    ctx.font = SIZE + 'px "Share Tech Mono", monospace';
    drops.forEach((y, i) => {
      if (y >= 0) {
        ctx.fillStyle = Math.random() < 0.03 ? 'rgba(252,238,10,0.85)' : 'rgba(2,215,242,0.5)';
        ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * SIZE, y * SIZE);
      }
      drops[i] = (y * SIZE > h && Math.random() > 0.96) ? -Math.random() * 10 : y + 1;
    });
  };
  setInterval(() => {
    const el = findHost();
    if (cv && el !== host) stop();
    if (el && !cv) {
      host = el; w = h = 0;
      cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;pointer-events:none;z-index:4;';
      document.body.appendChild(cv); ctx = cv.getContext('2d');
      if (el.classList.contains('part')) { // standby: whole editor part
        tag = document.createElement('div'); tag.className = 'cp-standby'; tag.textContent = 'NEURAL LINK IDLE';
        document.body.appendChild(tag);
      }
      requestAnimationFrame(loop);
    }
  }, 500);
})();

// Target lock: a big cursor jump (go to definition, search hit, line jump) snaps cyan brackets onto the new line
(() => {
  const JUMP = 15, HOLD = 650; // lines moved at once, ms the lock shows
  let key = null, ln = null, ed = null, off = null, nav = 0;
  // plain PageUp/PageDown/arrow travel is not a jump
  document.addEventListener('keydown', (e) => { if (/^(Page|Arrow)/.test(e.key)) nav = Date.now(); }, { passive: true, capture: true });
  setInterval(() => {
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
})();

// Link restored: coming back to the window after 3 s or more away sweeps a thin cyan bar across the top
(() => {
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
})();

// Panel focus flicker: moving focus between editor, terminal and sidebar flashes the new part's edge
(() => {
  let lastPart = null;
  document.addEventListener('focusin', (e) => {
    const p = e.target.closest ? e.target.closest('.part.editor, .part.panel, .part.sidebar, .part.auxiliarybar') : null;
    if (!p || p === lastPart) return;
    lastPart = p;
    p.classList.add('cp-focus');
    setTimeout(() => p.classList.remove('cp-focus'), 300);
  }, true);
})();

// Neon flicker: every 25-70 s the title or the active tab label stutters like a failing neon sign
(() => {
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
})();

// City rain: faint cyan streaks over the editor, denser at night by the real clock; cpRain(false) turns it off for good, cpRain(true) back on
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const KEY = 'cp-rain', FRAME = 33;
  window.cpRain = (on) => { localStorage.setItem(KEY, on ? '1' : '0'); };
  let cv = null, ctx = null, host = null, drops = [], w = 0, h = 0, last = 0;
  const density = () => { const hr = new Date().getHours(); return hr >= 19 || hr < 5 ? 1 : hr >= 17 || hr < 7 ? 0.55 : 0.3; };
  const stop = () => { if (cv) cv.remove(); cv = ctx = host = null; };
  const loop = (t) => {
    if (!cv) return;
    requestAnimationFrame(loop);
    if (t - last < FRAME) return;
    last = t;
    const r = host.getBoundingClientRect();
    if (!host.isConnected || r.width < 2 || r.height < 2) { stop(); return; }
    if (Math.round(r.width) !== w || Math.round(r.height) !== h) {
      w = Math.round(r.width); h = Math.round(r.height); cv.width = w; cv.height = h;
      const n = Math.min(220, Math.round(w * h / 12000 * density()));
      drops = Array.from({ length: n }, () => ({ x: Math.random() * (w + 60), y: Math.random() * h, len: 10 + Math.random() * 14, v: 14 + Math.random() * 10, far: Math.random() < 0.5 }));
    }
    cv.style.left = r.left + 'px'; cv.style.top = r.top + 'px';
    ctx.clearRect(0, 0, w, h);
    [true, false].forEach((far) => {
      ctx.strokeStyle = far ? 'rgba(2,215,242,0.07)' : 'rgba(2,215,242,0.14)';
      ctx.beginPath();
      drops.forEach((d) => {
        if (d.far !== far) return;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * 0.25, d.y - d.len);
        d.y += d.v; d.x += d.v * 0.25;
        if (d.y - d.len > h) { d.y = -d.len; d.x = Math.random() * (w + 60); }
      });
      ctx.stroke();
    });
  };
  setInterval(() => {
    const el = (!document.hidden && localStorage.getItem(KEY) !== '0' && !document.querySelector('.cp-standby')) ? document.querySelector('.part.editor') : null;
    if (cv && el !== host) stop();
    if (el && !cv) {
      host = el; w = h = 0;
      cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;pointer-events:none;z-index:3;';
      document.body.appendChild(cv); ctx = cv.getContext('2d'); ctx.lineWidth = 1;
      requestAnimationFrame(loop);
    }
  }, 1000);
})();

// Scanner chatter: every 4-9 min a short NCPD dispatch shows bottom left; cpScan() shows one now
(() => {
  // Districts and subdistricts as listed on the Night City map; category labels follow the game's scanner hustle types
  const PLACES = [
    ['City Center', ['Corpo Plaza', 'Downtown']], ['Heywood', ['Wellsprings', 'Vista del Rey', 'The Glen']],
    ['Pacifica', ['West Wind Estate', 'Coastview']], ['Santo Domingo', ['Arroyo', 'Rancho Coronado']],
    ['Watson', ['Little China', 'Kabuki', 'Northside', 'Arasaka Waterfront']], ['Westbrook', ['Japantown', 'North Oak', 'Charter Hill']],
  ];
  const CATS = {
    a: ['Assault in Progress', ['Armed subject threatening bystanders', 'Fight outside a noodle stand', 'Gang members harassing a street vendor', 'Civilian attacked near a transit stop']],
    r: ['Reported Crime', ['Break-in at a pawn shop', 'Stolen vehicle reported', 'Cyberware theft reported', 'Vandalism on a public billboard', 'Missing delivery drone']],
    o: ['Suspected Organized Crime Activity', ['Suspected gang meeting in a vacant warehouse', 'Suspected black-market cargo at the loading docks', 'Suspected braindance distribution ring', 'Suspected protection racket at a market stall']],
    c: ['Cyberpsycho Sighting', ['Erratic augmented subject, civilians evacuating', 'Unregistered cyberware, possible psychosis']],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let cur = null;
  const show = () => {
    if (cur) cur.remove();
    const lv = window.cpLevel || 0;
    const key = Math.random() < (lv >= 2 ? 0.5 : 0.08) ? 'c' : pick(['a', 'a', 'r', 'r', 'o']);
    const [label, subjects] = CATS[key];
    const [district, subs] = pick(PLACES);
    const d = document.createElement('div'); d.className = 'cp-scan cp-scan-' + key;
    const head = document.createElement('div'); head.className = 'h'; head.textContent = `NCPD // ${label.toUpperCase()}`;
    const loc = document.createElement('div'); loc.className = 'l'; loc.textContent = `${pick(subs)}, ${district}`;
    const body = document.createElement('div'); body.className = 'b';
    body.textContent = key === 'c' ? `${pick(subjects)}. MaxTac notified.` : `${pick(subjects)}. Units in ${district}, respond.`;
    d.append(head, loc, body);
    document.body.appendChild(d); cur = d;
    setTimeout(() => d.remove(), 7000);
  };
  window.cpScan = show;
  const loop = () => setTimeout(() => { if (!document.hidden) show(); loop(); }, (4 + Math.random() * 5) * 60000);
  setTimeout(() => { if (!document.hidden) show(); loop(); }, (1 + Math.random()) * 60000);
})();

// Typing overclock: a burst of fast typing tints the active editor line; clears 500 ms after you ease off
(() => {
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
})();

// Upload complete on save, cyberpsychosis warning when errors go up, and the rare relic malfunction
(() => {
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
  const showPsycho = (n) => {
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
})();
