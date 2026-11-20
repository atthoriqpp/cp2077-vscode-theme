// Night City District: a status bar tag naming a district picked from the open folder's name. Read-only.
const vscode = require('vscode');

const DISTRICTS = ['City Center', 'Heywood', 'Pacifica', 'Santo Domingo', 'Watson', 'Westbrook'];

function pick(name) {
  if (!name) return 'Badlands'; // no folder open: out past the city limits
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return DISTRICTS[h % DISTRICTS.length];
}

function activate(context) {
  let item;
  try { item = vscode.window.createStatusBarItem('nc.district', vscode.StatusBarAlignment.Left, -100); }
  catch (e) { item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100); }
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
  context.subscriptions.push(item, vscode.workspace.onDidChangeWorkspaceFolders(update));
}

function deactivate() {}
module.exports = { activate, deactivate };
