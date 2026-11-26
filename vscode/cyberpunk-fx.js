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
  setInterval(tick, 500);
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
  const SIZE = 16, FRAME = 70, STANDBY = 3 * 60000; // FRAME: ms between steps, about 14 fps
  let cv = null, ctx = null, host = null, tag = null, drops = [], w = 0, h = 0, last = 0, lastInput = Date.now();
  const stop = () => { if (cv) cv.remove(); if (tag) tag.remove(); cv = ctx = host = tag = null; };
  // mousemove counts here (wakes standby) but not for the humanity drift clock
  ['keydown', 'mousedown', 'mousemove', 'wheel'].forEach((e) => document.addEventListener(e, () => {
    lastInput = Date.now();
    if (tag) stop();
  }, { passive: true, capture: true }));
  setInterval(() => { // loading-screen style: a new line every 8 s while on standby
    if (!tag) return;
    const q = tag.querySelector('.cp-quote');
    if (q) q.replaceWith(window.cpQuote());
  }, 8000);
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
        tag = document.createElement('div'); tag.className = 'cp-standby';
        const title = document.createElement('div'); title.className = 't'; title.textContent = 'NEURAL LINK IDLE';
        tag.append(title, window.cpQuote());
        document.body.appendChild(tag);
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

// City rain: faint cyan streaks over the editor, denser at night by the real clock; cpRain(false) turns it off for good, cpRain(true) back on
try { (() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const KEY = 'cp-rain', FRAME = 33;
  window.cpRain = (on) => { localStorage.setItem(KEY, on ? '1' : '0'); };
  let cv = null, ctx = null, host = null, drops = [], w = 0, h = 0, last = 0;
  const density = () => { const hr = new Date().getHours(); return hr >= 19 || hr < 5 ? 1 : hr >= 17 || hr < 7 ? 0.8 : 0.6; };
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
      ctx.strokeStyle = far ? 'rgba(2,215,242,0.1)' : 'rgba(2,215,242,0.22)';
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
      cv.style.cssText = 'position:fixed;pointer-events:none;z-index:30;';
      document.body.appendChild(cv); ctx = cv.getContext('2d'); ctx.lineWidth = 1;
      requestAnimationFrame(loop);
    }
  }, 1000);
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
  setInterval(place, 1000);
  try { next(); } catch (e) { console.error('[cp-fx] ticker', e); }
  setInterval(next, EVERY);
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
  setInterval(() => {
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
      const t0 = Date.now(), iv = setInterval(() => {
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
  setInterval(() => {
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
    ['Mystery signal hijacks {D} screens', 'Every billboard in {D} shows static and one phrase. Technicians are tracing the source.']
  ];
  const A = ['AD: {S}: STAY COVERED, STAY ALIVE', 'AD: {C}: THE FUTURE RUNS ON US', 'AD: {S}: HERE IN {n} MINUTES OR THE NEXT RIDE IS FREE', 'AD: {C}: BUILT FOR THE CITY THAT NEVER SLEEPS', 'AD: {S} PLANS FROM {n}0 PER MONTH'];
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
      const ti = Math.floor(r() * T.length), t = T[ti], f = fill(t[0] + "|" + t[1], r).split("|"), h = f[0].toUpperCase();
      if (!seen.has(h)) { seen.add(h); out.push([h, f[1], CAT[ti]]); }
    }
    return out;
  };
  const mk = (tag, cls, text) => { const x = document.createElement(tag); x.className = cls; if (text) x.textContent = text; return x; };
  const CAT = []; // one [tag, colour] per template in T, in order
  [['CRIME', 5, 'red'], ['CORP', 5, 'cyan'], ['WEATHER', 2, 'stl'], ['TRAFFIC', 2, 'yel'], ['NET', 3, 'mag'], ['CULTURE', 4, 'mag'], ['HEALTH', 3, 'grn'], ['SPORT', 2, 'yel'], ['MONEY', 3, 'yel'], ['CITY', 4, 'stl']]
    .forEach((c) => { for (let i = 0; i < c[1]; i++) CAT.push([c[0], c[2]]); });
  const SYM = ['HLX', 'ORB', 'KST', 'SBL', 'VNT', 'NGS', 'LMN', 'HLC'];
  const lf = (cls, text) => mk('span', 'lf ' + cls, text);
  const fillRow = () => { // news with coloured tags, a made-up market segment every 8 stories, an ad every 5
    sp.textContent = '';
    const r = rng(hash(day() + 'ad')), news = batch('t', 30), ads = A.map((s) => fill(s, r).replace(/^AD: /, '').toUpperCase());
    const add = (tag, tagCls, ...rest) => { const it = mk('span', 'it'); it.append(lf('tg ' + tagCls, tag), ...rest); sp.append(it, mk('span', 'sp', '//')); };
    if (!news.length) news.push(['NIGHT CITY NEWS 24 STANDING BY', '', ['CITY', 'stl']]);
    news.forEach((x, k) => {
      add(x[2][0], x[2][1], lf('bd2', x[0]));
      if (k % 5 === 4) add('AD', 'ad', lf('bd2', ads[(k / 5 | 0) % ads.length]));
      if (k % 8 === 7) {
        const pool = SYM.slice(), parts = [];
        for (let n = 0; n < 4; n++) {
          const s = pool.splice(Math.floor(r() * pool.length), 1)[0], v = r() * 9 - 4.5;
          parts.push(lf('bd2', s), lf(v >= 0 ? 'up' : 'dn', (v >= 0 ? '\u25B2' : '\u25BC') + Math.abs(v).toFixed(1) + '%'));
        }
        add('MARKET', 'grn', ...parts);
      }
    });
    Array.from(sp.childNodes).forEach((n) => sp.appendChild(n.cloneNode(true))); // second copy: the loop never shows an empty row
  };

  // running text row: the layout is told the window is 22px shorter, so the row sits free under the status bar; if the layout ignores that, the row stays off
  const BH = 22, desc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  const realH = () => desc.get.call(window);
  const row = mk('div', 'cp-nrow'), run = mk('div', ''), sp = mk('span', 'run'), lab = mk('b', '', 'LIVE');
  run.appendChild(sp); row.append(mk('i', '', 'NCN'), lab, run);
  let shrink = false, rowDay = '';
  const resize = () => window.dispatchEvent(new Event('resize'));
  const setText = () => { rowDay = day(); fillRow(); sp.style.animationDuration = Math.round(sp.textContent.length * 0.11) + 's'; };
  const rowOn = () => {
    if (!desc || !desc.get || !desc.configurable) return;
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => realH() - (shrink ? BH : 0) });
    shrink = true; resize();
    setTimeout(() => {
      const sb = document.querySelector('.part.statusbar'), r = sb && sb.getBoundingClientRect();
      if (!r || r.bottom > realH() - BH + 3) { shrink = false; resize(); console.warn('[cp-fx] news row off: layout ignored the shorter window'); return; }
      document.body.appendChild(row);
    }, 900);
  };
  const rowOff = () => { shrink = false; row.remove(); resize(); };
  setText();
  let tries = 0;
  const wait = setInterval(() => {
    if (document.querySelector('.part.statusbar') && document.body) { clearInterval(wait); rowOn(); } else if (++tries > 60) clearInterval(wait);
  }, 500);
  setInterval(() => { if (rowDay !== day()) setText(); }, 30000);
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
