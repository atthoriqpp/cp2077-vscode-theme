// World Wire: reads a few public RSS feeds plus crypto and stock quotes and publishes them in a hidden status bar item for cyberpunk-fx.js. Read only; no keys; https only; TLS is never relaxed.
// Sources: public RSS feeds (headlines only), CoinGecko simple price (crypto), Yahoo Finance chart endpoint (stocks and indices; unofficial, may change or block, then quotes just stay empty).
const vscode = require('vscode');
const https = require('https');

const UA = 'world-wire-vscode/0.1'; // a plain client name, never a browser look-alike
const PER_FEED = 6;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const CRY = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', dogecoin: 'DOGE', ripple: 'XRP', cardano: 'ADA', litecoin: 'LTC', binancecoin: 'BNB' };
const IDX = { '^GSPC': 'SPX', '^IXIC': 'IXIC', '^DJI': 'DJI', '^FTSE': 'FTSE', '^N225': 'N225', '^GDAXI': 'DAX' };

function get(url, accept, hops) {
  hops = hops || 0;
  return new Promise((resolve, reject) => {
    const rq = https.get(url, { headers: { 'User-Agent': UA, Accept: accept || 'application/rss+xml, application/xml, text/xml' }, timeout: 10000 }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && hops < 3) {
        r.resume(); resolve(get(new URL(r.headers.location, url).toString(), accept, hops + 1)); return;
      }
      if (r.statusCode !== 200) { r.resume(); reject(new Error('HTTP ' + r.statusCode)); return; }
      let n = 0; const parts = [];
      r.on('data', (c) => { n += c.length; if (n > 2e6) rq.destroy(new Error('too large')); else parts.push(c); });
      r.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    });
    rq.on('timeout', () => rq.destroy(new Error('timeout')));
    rq.on('error', reject);
  });
}

function clean(s) { // CDATA, tags and entities out; plain ASCII punctuation in (the ticker font and the no dash rule)
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') { const c = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return c > 31 && c < 65535 ? String.fromCharCode(c) : ''; }
      return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : '';
    })
    .replace(/[\u2013\u2014]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
}

function titles(xml) {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []).map((it) => { const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(it); return m ? clean(m[1]) : ''; })
    .filter((t) => t.length > 12 && t.length <= 140);
}

function interleave(lists) { // one from each feed in turn, no duplicates
  const out = [], seen = new Set();
  for (let i = 0; i < PER_FEED; i++) for (const [src, ts] of lists) { const t = ts[i]; if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push([src, t]); } }
  return out;
}

function cryptoRows(j, ids) { // CoinGecko simple price: { bitcoin: { usd, usd_24h_change } }
  const rows = [];
  for (const id of ids) { const c = j && j[id]; if (c && Number.isFinite(c.usd) && Number.isFinite(c.usd_24h_change)) rows.push([CRY[id] || id.toUpperCase().slice(0, 5), +c.usd.toFixed(2), +c.usd_24h_change.toFixed(2)]); }
  return rows;
}

function quoteFrom(sym, j) { // Yahoo chart: price and day change from meta, or from the last two closes
  const r = j && j.chart && j.chart.result && j.chart.result[0]; if (!r || !r.meta) return null;
  const m = r.meta, price = m.regularMarketPrice; let pct = m.regularMarketChangePercent;
  if (!Number.isFinite(pct)) {
    const cl = ((r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || []).filter(Number.isFinite);
    if (cl.length >= 2) pct = (price / cl[cl.length - 2] - 1) * 100;
  }
  if (!Number.isFinite(price) || !Number.isFinite(pct)) return null;
  return [IDX[sym] || sym.replace(/^\^/, '').toUpperCase().slice(0, 6), +price.toFixed(2), +pct.toFixed(2)];
}

function cfg() { return vscode.workspace.getConfiguration('worldWire'); }
function feeds() {
  return (cfg().get('feeds') || []).filter((f) => f && typeof f.name === 'string' && typeof f.url === 'string' && /^https:\/\//i.test(f.url)).map((f) => [f.name.toUpperCase().slice(0, 14), f.url]);
}
function list(key, re) { return (cfg().get(key) || []).filter((s) => typeof s === 'string' && re.test(s)).slice(0, 12); }

function activate(context) {
  let item;
  try { item = vscode.window.createStatusBarItem('ww.wirefeed', vscode.StatusBarAlignment.Left, 0); }
  catch (e) { item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0); }
  item.name = 'World Wire';
  item.text = '​'; // zero width: present in the DOM, invisible to the eye
  context.subscriptions.push(item);
  let items = [], quotes = [], busy = false;

  const publish = (err) => {
    item.accessibilityInformation = { label: 'WIRE ' + JSON.stringify({ t: Date.now(), items, quotes, err }) };
    item.show();
  };
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      if (cfg().get('enabled') === false) { items = []; quotes = []; publish({}); return; }
      const err = {};
      const ids = list('crypto', /^[a-z0-9-]{1,30}$/), syms = list('stocks', /^[A-Za-z0-9.^=-]{1,12}$/);
      const [lists, cry, stk] = await Promise.all([
        Promise.all(feeds().map(async ([src, url]) => { try { return [src, titles(await get(url))]; } catch (e) { err[src] = String((e && e.message) || e).slice(0, 80); return [src, []]; } })),
        ids.length ? get('https://api.coingecko.com/api/v3/simple/price?ids=' + ids.map(encodeURIComponent).join(',') + '&vs_currencies=usd&include_24hr_change=true', 'application/json').then((t) => cryptoRows(JSON.parse(t), ids)).catch((e) => { err.CRYPTO = String((e && e.message) || e).slice(0, 80); return []; }) : [],
        Promise.all(syms.map((s) => get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?interval=1d&range=5d', 'application/json').then((t) => quoteFrom(s, JSON.parse(t))).catch((e) => { err[s] = String((e && e.message) || e).slice(0, 60); return null; }))),
      ]);
      const next = interleave(lists);
      if (next.length) items = next; // keep the last good set when every feed fails
      const q = [...stk.filter(Boolean), ...cry];
      if (q.length) quotes = q;
      publish(err);
    } finally { busy = false; }
  };
  publish({});
  refresh();
  const timer = setInterval(refresh, Math.max(5, cfg().get('refreshMinutes') || 10) * 60000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('worldWire')) refresh(); }));
}

function deactivate() {}
module.exports = { activate, deactivate, _t: { clean, titles, interleave, cryptoRows, quoteFrom, get } };
