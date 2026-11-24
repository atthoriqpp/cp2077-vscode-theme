// Night City HUD: district tag, REC timer and street cred (XP from Claude turns, saves, typing) in the status bar; local only.
const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DISTRICTS = ['City Center', 'Heywood', 'Pacifica', 'Santo Domingo', 'Watson', 'Westbrook'];
const BUSY = path.join(os.homedir(), '.claude', '.cc-busy');
const STALE = 10 * 60 * 1000;

const lvOf = (x) => Math.floor((1 + Math.sqrt(1 + x / 50)) / 2);
const base = (l) => 200 * l * (l - 1); // total XP needed to reach level l
const p2 = (n) => String(n).padStart(2, '0');

function pick(name) {
  if (!name) return 'Badlands'; // no folder open: out past the city limits
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return DISTRICTS[h % DISTRICTS.length];
}

function mkItem(id, priority) {
  try { return vscode.window.createStatusBarItem(id, vscode.StatusBarAlignment.Left, priority); }
  catch (e) { return vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority); }
}

function activate(context) {
  const item = mkItem('nc.district', -100);
  item.name = 'Night City District';
  item.color = '#02D7F2';
  const update = () => {
    const f = vscode.workspace.workspaceFolders;
    const district = pick(f && f.length ? f[0].name : (vscode.workspace.name || ''));
    item.text = 'DISTRICT // ' + district.toUpperCase();
    item.tooltip = 'Night City district assigned to this folder';
    item.show();
  };
  update();

  const rec = mkItem('nc.rec', -101);
  rec.name = 'Braindance Recorder';
  rec.color = '#FF003C';
  rec.tooltip = 'Time this window has been open';
  rec.show();

  const cred = mkItem('nc.cred', -102);
  cred.name = 'Street Cred';
  cred.color = '#FCEE0A';
  cred.show();

  const sig = mkItem('nc.lvl', -200);
  sig.name = 'Street Cred Level Signal';
  sig.text = '​';
  sig.show();

  let xp = Number(context.globalState.get('nc.xp', 0)) || 0;
  let lv = lvOf(xp), dirty = false, busy = false, since = 0, n = 0, last = Date.now();
  const today = () => new Date().toLocaleDateString('en-CA');
  let day = context.globalState.get('nc.day');
  if (!day || day.d !== today()) day = { d: today(), sec: 0, turns: 0, saves: 0 }; // REC counts Claude working time per day

  const addXp = (v) => {
    xp += v; dirty = true;
    const l = lvOf(xp);
    if (l > lv) { lv = l; sig.text = '​L' + l + '/' + Date.now(); } // cyberpunk-fx.js watches this hidden item and shows the level-up card
  };

  const draw = () => {
    const s = Math.floor(day.sec);
    rec.color = busy ? '#FF003C' : '#8FA3B0';
    rec.text = (busy ? '$(circle-filled)' : '$(circle-large-outline)') + ' REC ' + p2(Math.floor(s / 3600)) + ':' + p2(Math.floor(s / 60) % 60) + ':' + p2(s % 60);
    rec.tooltip = 'Braindance recorder: Claude working time today. ' + day.turns + ' turns, ' + day.saves + ' saves. Records while Claude is busy, resets each day.';
    const frac = (xp - base(lv)) / (base(lv + 1) - base(lv));
    const on = Math.max(0, Math.min(5, Math.floor(frac * 5)));
    cred.text = 'CRED LV ' + lv + ' ' + '▰'.repeat(on) + '▱'.repeat(5 - on);
    cred.tooltip = Math.floor(xp) + ' XP, ' + Math.ceil(base(lv + 1) - xp) + ' to level ' + (lv + 1) + '. Earned from finished Claude turns, saves and typing.';
  };

  const tick = () => {
    let now = false;
    try { now = Date.now() - fs.statSync(BUSY).mtimeMs < STALE; } catch (e) {}
    const t = Date.now(), dt = Math.min(5, (t - last) / 1000);
    last = t;
    if (day.d !== today()) day = { d: today(), sec: 0, turns: 0, saves: 0 };
    if (now && !busy) since = t;
    if (now) { day.sec += dt; dirty = true; }
    // flag deleted = turn ended (pays XP); flag gone stale = interrupted turn (pays nothing)
    if (!now && busy && !fs.existsSync(BUSY)) { day.turns++; addXp(Math.round(40 + Math.min(80, (t - since) / 3000))); }
    busy = now;
    draw();
    if (dirty && ++n % 5 === 0) { context.globalState.update('nc.xp', xp); context.globalState.update('nc.day', day); dirty = false; }
  };
  tick();
  const timer = setInterval(tick, 1000);

  context.subscriptions.push(
    item, rec, cred, sig,
    { dispose: () => { clearInterval(timer); if (dirty) { context.globalState.update('nc.xp', xp); context.globalState.update('nc.day', day); } } },
    vscode.workspace.onDidChangeWorkspaceFolders(update),
    vscode.workspace.onDidSaveTextDocument((d) => { if (d.uri.scheme === 'file') { day.saves++; addXp(10); } }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.scheme !== 'file' && e.document.uri.scheme !== 'untitled') return;
      for (const c of e.contentChanges) if (c.text.length > 0 && c.text.length <= 2 && c.rangeLength <= 2) addXp(0.2);
    })
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
