// Status line: caveman mode + context size + growth since last turn + plan usage limits (when Claude Code sends them).
const fs = require('fs');
const path = require('path');
const os = require('os');

const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const E = '\x1b[';
// Night City palette: old 16-colour codes map to truecolor neon (backup: statusline.js.bak-20261119)
const NEON = { '90': '38;2;110;110;134', '31': '38;2;255;0;60', '33': '38;2;252;238;10', '32': '38;2;2;215;242', '38;5;172': '38;2;252;238;10' };
const c = (code, s) => `${E}${NEON[code] || code}m${s}${E}0m`;

function caveman() {
  try {
    const f = path.join(dir, '.caveman-active');
    const st = fs.lstatSync(f);
    if (st.isSymbolicLink() || st.size > 64) return '';
    const mode = fs.readFileSync(f, 'utf8').split('\n')[0].trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const valid = ['off', 'lite', 'full', 'ultra', 'wenyan-lite', 'wenyan', 'wenyan-full', 'wenyan-ultra', 'commit', 'review', 'compress'];
    if (!valid.includes(mode)) return '';
    return c('38;5;172', mode === 'full' ? '[CAVEMAN]' : `[CAVEMAN:${mode.toUpperCase()}]`);
  } catch (e) { return ''; }
}

// newest of: last API usage, or a /compact marker written after it (the bar would otherwise show the pre-compact size until the next reply)
function transcriptTokens(file) {
  try {
    const size = fs.statSync(file).size, len = Math.min(size, 2000000), buf = Buffer.alloc(len);
    const fd = fs.openSync(file, 'r'); fs.readSync(fd, buf, 0, len, size - len); fs.closeSync(fd);
    for (const line of buf.toString('utf8').split('\n').reverse()) {
      if (line.includes('"compact_boundary"')) {
        try { const m = JSON.parse(line).compactMetadata; if (m?.postTokens) return { tokens: m.postTokens, compacted: true }; } catch (e) {}
      }
      if (!line.includes('"usage"')) continue;
      try {
        const u = JSON.parse(line).message?.usage;
        if (u) return { tokens: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) };
      } catch (e) {}
    }
  } catch (e) {}
  return {};
}

const pctColor = p => (p >= 80 ? '31' : p >= 50 ? '33' : '32');
const bar = (p, color, w = 5) => { const n = Math.max(0, Math.min(w, Math.round(p / 100 * w))); return c(color, '█'.repeat(n)) + c('90', '░'.repeat(w - n)); };
const when = (t, withDay) => { const d = new Date(typeof t === 'number' && t < 1e12 ? t * 1000 : t); if (isNaN(d)) return ''; const hm = d.toTimeString().slice(0, 5); return withDay ? d.toDateString().slice(0, 3) + ' ' + hm : hm; };

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  const parts = [caveman()];
  try {
    const input = JSON.parse(raw);
    try { fs.writeFileSync(path.join(dir, '.statusline-last.json'), raw); } catch (e) {}  // shows which fields this Claude Code version sends

    const cw = input.context_window || {};
    const tr = transcriptTokens(input.transcript_path);
    const tokens = tr.compacted ? tr.tokens : (cw.total_input_tokens || tr.tokens);
    if (tokens) {
      const state = path.join(dir, `.statusline-ctx-${input.session_id}`);
      // growth since this prompt started (prompt_id changes per user message), so the number is per turn, not per tool call
      let st = {}; try { st = JSON.parse(fs.readFileSync(state, 'utf8')); } catch (e) {}
      if (st.prompt !== input.prompt_id) { st = { prompt: input.prompt_id, start: st.cur || tokens }; }
      st.cur = tokens; fs.writeFileSync(state, JSON.stringify(st));
      const delta = tokens - st.start;
      const size = cw.context_window_size;
      const k = Math.round(tokens / 1000);
      const txt = ` ${k}k` + (tr.compacted ? ' (compacted)' : '');
      const cp = size ? tokens / size * 100 : 0;
      let s = c('90', 'CTX ') + (size ? bar(cp, pctColor(cp)) : '') + c(k >= 200 ? '33' : '90', txt);
      if (delta > 0) s += c('90', ` +${Math.round(delta / 1000)}k`);
      parts.push(s);
    }

    // limits are account-wide but each session only sees its own last reply: share the freshest reading across terminals
    const rl = input.rate_limits || {};
    const shared = path.join(dir, '.statusline-rl.json');
    let sh = {}; try { sh = JSON.parse(fs.readFileSync(shared, 'utf8')); } catch (e) {}
    for (const key of ['five_hour', 'seven_day']) {
      const a = rl[key], b = sh[key];
      if (!a || a.used_percentage == null) { if (b) rl[key] = b; continue; }
      if (!b) { sh[key] = a; continue; }
      const ra = +a.resets_at || 0, rb = +b.resets_at || 0;
      if (ra > rb + 60) sh[key] = a;                       // newer window
      else if (ra < rb - 60) rl[key] = b;                  // this session is on an old window
      else { const m = a.used_percentage >= b.used_percentage ? a : b; sh[key] = rl[key] = { ...m, resets_at: Math.max(ra, rb) || m.resets_at }; }
    }
    try { fs.writeFileSync(shared, JSON.stringify(sh)); } catch (e) {}
    for (const [key, label] of [['five_hour', '5h'], ['seven_day', '7d']]) {
      const r = rl[key];
      if (!r || r.used_percentage == null) continue;
      const p = Math.round(r.used_percentage);
      const reset = r.resets_at ? ` ↻ ${when(r.resets_at, key === 'seven_day')}` : '';
      parts.push(c('90', `${label.toUpperCase()} `) + bar(p, pctColor(p)) + c(pctColor(p), ` ${p}%`) + c('90', reset));
    }

    if (input.cost?.total_cost_usd != null) parts.push(c('33', `${input.cost.total_cost_usd.toFixed(2)} EB`));
  } catch (e) {}
  process.stdout.write(parts.filter(Boolean).join(c('90', ' // ')));
});
