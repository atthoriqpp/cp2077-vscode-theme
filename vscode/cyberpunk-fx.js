// Cyberpunk effects: mouse pointer trail, glitches, save and error HUD. Loaded by the Custom CSS and JS Loader.
// Text cursor trail removed 2026-11-19 (too distracting when clicking around code); the mouse pointer trail stays.

// Random glitch: every 15-45 s one part of the window glitches; about 1 in 5 hits the whole window
(() => {
  const PARTS = ['.part.titlebar', '.part.statusbar', '.tabs-container .tab.active', '.part.sidebar', '.part.panel', '.part.activitybar'];
  const hit = () => {
    const whole = Math.random() < 0.2;
    const el = document.querySelector(whole ? '.monaco-workbench' : PARTS[Math.floor(Math.random() * PARTS.length)]);
    if (el && !document.hidden) {
      el.classList.add('cp-glitching');
      setTimeout(() => el.classList.remove('cp-glitching'), 360);
    }
    setTimeout(hit, 15000 + Math.random() * 30000);
  };
  setTimeout(hit, 4000);
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
