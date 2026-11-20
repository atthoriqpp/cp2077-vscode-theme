// Claude Busy Bridge: shows an invisible (zero-width) status-bar flag while ~/.claude/.cc-busy exists. Read-only.
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BUSY = path.join(os.homedir(), '.claude', '.cc-busy');
const STALE = 10 * 60 * 1000; // ignore a flag older than this (leftover from a crash)

function activate(context) {
  let item;
  try { item = vscode.window.createStatusBarItem('cc.busyflag', vscode.StatusBarAlignment.Left, 0); }
  catch (e) { item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0); }
  item.name = 'Claude Busy';
  item.text = '​'; // zero-width: present in the DOM for cyberpunk-fx.js, invisible to the eye
  context.subscriptions.push(item);

  const tick = () => {
    let busy = false;
    try { const m = fs.statSync(BUSY).mtimeMs; busy = Date.now() - m < STALE; if (busy) item.text = String(Math.round(m)); } catch (e) {} // text = flag stamp, hidden by zero width; changes on each new prompt
    if (busy) item.show(); else item.hide();
  };
  tick();
  const timer = setInterval(tick, 800);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
}

function deactivate() {}
module.exports = { activate, deactivate };
