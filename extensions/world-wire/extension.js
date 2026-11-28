// World Wire: reads a few public RSS feeds plus crypto and stock quotes and publishes them in a hidden status bar item for cyberpunk-fx.js. Read only; no keys; https only; TLS is never relaxed.
// Sources: public RSS feeds (headlines only), CoinGecko simple price (crypto), Yahoo Finance chart endpoint (stocks and indices; unofficial, may change or block, then quotes just stay empty).
const vscode = require('vscode');
const https = require('https');

const UA = 'world-wire-vscode/0.1'; // a plain client name, never a browser look-alike
const PER_FEED = 6;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const CRY = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', dogecoin: 'DOGE', ripple: 'XRP', cardano: 'ADA', litecoin: 'LTC', binancecoin: 'BNB' };
const IDX = { '^GSPC': 'SPX', '^IXIC': 'IXIC', '^DJI': 'DJI', '^FTSE': 'FTSE', '^N225': 'N225', '^GDAXI': 'DAX' };

function get(url, accept, hops, bin) {
  hops = hops || 0;
  return new Promise((resolve, reject) => {
    const rq = https.get(url, { headers: { 'User-Agent': UA, Accept: accept || 'application/rss+xml, application/xml, text/xml' }, timeout: 10000 }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && hops < 3) {
        r.resume(); resolve(get(new URL(r.headers.location, url).toString(), accept, hops + 1, bin)); return;
      }
      if (r.statusCode !== 200) { r.resume(); reject(new Error('HTTP ' + r.statusCode)); return; }
      let n = 0; const parts = [];
      r.on('data', (c) => { n += c.length; if (n > 2e6) rq.destroy(new Error('too large')); else parts.push(c); });
      r.on('end', () => { const b = Buffer.concat(parts); resolve(bin ? b : b.toString('utf8')); });
    });
    rq.on('timeout', () => rq.destroy(new Error('timeout')));
    rq.on('error', reject);
  });
}

// ---- source logos: each feed's own icon file, fetched once and sent as a small data URI (the page cannot fetch images itself) ----
const LOGO_MAX = 24000;
function mimeOf(b) { // the server's content type is not trusted (one site serves a JPEG as .ico); the first bytes decide
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return 'image/x-icon';
  if (b.length > 4 && b.slice(0, 4).toString() === 'GIF8') return 'image/gif';
  return null; // HTML error pages and anything else are dropped
}
async function logoOf(feedUrl, icon) {
  const u = icon && /^https:\/\//i.test(icon) ? icon : new URL('/favicon.ico', feedUrl).toString();
  const b = await get(u, 'image/*', 0, true), m = mimeOf(b);
  if (!m) throw new Error('not an image');
  if (b.length > LOGO_MAX) throw new Error('logo too large (' + b.length + ' bytes)');
  return 'data:' + m + ';base64,' + b.toString('base64');
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

// ---- weather (Open-Meteo, no key). Only runs when worldWire.location is set; only that text or its coordinates leave the machine ----
const WET = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
const SNOW = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86;
function sky(c) {
  if (c === 0) return 'CLEAR'; if (c <= 2) return 'PARTLY CLOUDY'; if (c === 3) return 'OVERCAST'; if (c === 45 || c === 48) return 'FOG';
  if (c >= 95) return 'STORM'; if (SNOW(c)) return 'SNOW'; if (c === 66 || c === 67) return 'FREEZING RAIN'; if (c >= 51 && c <= 57) return 'DRIZZLE'; if (WET(c)) return 'RAIN'; return 'CLOUDY';
}
const hhmm = (iso) => String(iso).slice(11, 16);
const nz = (x) => (Number.isFinite(x) ? x : 0);

function planAlert(h, cur, aqi) { // h: next hours { time, prob, rain, code, gust }; one alert at most, worst first
  const n = (h.time || []).length;
  const span = (f) => { let a = -1, b = -1; for (let i = 0; i < n; i++) if (f(i)) { if (a < 0) a = i; b = i; } return a < 0 ? null : { a, b }; };
  const endH = (iso) => String((Number(hhmm(iso).slice(0, 2)) + 1) % 24).padStart(2, '0') + ':00'; // each hourly slot runs to the next full hour
  const when = (r) => 'between ' + hhmm(h.time[r.a]) + ' and ' + endH(h.time[r.b]);
  const gust = Math.max(0, ...(h.gust || []).map(nz));
  let r = span((k) => nz(h.code[k]) >= 95);
  if (r) return { kind: 'storm', title: 'STORM WARNING', text: 'Thunderstorm ' + when(r) + '. Gusts up to ' + Math.round(gust) + ' km/h. Stay indoors.' };
  r = span((k) => SNOW(nz(h.code[k])));
  if (r) return { kind: 'snow', title: 'SNOW WARNING', text: 'Snow ' + when(r) + '. Roads will turn slick. Dress warm.' };
  // real rain only: drizzle codes (51-57) and light chances stay off the popup, the news row still shows them
  const wet = (k) => (WET(nz(h.code[k])) && nz(h.code[k]) >= 61) || (nz(h.rain[k]) >= 1.5 && nz(h.prob[k]) >= 60);
  r = span(wet);
  if (r) {
    let mm = 0, p = 0; for (let k = r.a; k <= r.b; k++) if (wet(k)) { mm = Math.max(mm, nz(h.rain[k])); p = Math.max(p, nz(h.prob[k])); }
    return { kind: 'rain', title: mm >= 4 ? 'HEAVY RAIN WARNING' : 'RAIN WARNING', text: 'Rain ' + when(r) + ', up to ' + mm.toFixed(1) + ' mm an hour. Chance ' + Math.round(p) + ' percent. Take cover.' };
  }
  if (gust >= 60) return { kind: 'wind', title: 'HIGH WIND WARNING', text: 'Gusts up to ' + Math.round(gust) + ' km/h in the next hours. Secure loose gear.' };
  if (cur && cur.temp >= 35) return { kind: 'heat', title: 'HEAT ALERT', text: 'It is ' + Math.round(cur.temp) + ' C outside. Drink water and stay out of the sun.' };
  if (Number.isFinite(aqi) && aqi >= 151) return { kind: 'smog', title: 'SMOG ALERT', text: 'Air quality index ' + Math.round(aqi) + '. Wear a mask outside.' };
  return null;
}

function buildWx(f, aqi, uv) { // Open-Meteo forecast JSON -> the small object the news row and the popup read
  const c = f && f.current, h = f && f.hourly; if (!c || !h || !Array.isArray(h.time) || !Number.isFinite(c.temperature_2m)) return null;
  const cur = { temp: c.temperature_2m, code: nz(c.weather_code) };
  const alert = planAlert({ time: h.time, prob: h.precipitation_probability || [], rain: h.precipitation || [], code: h.weather_code || [], gust: h.wind_gusts_10m || [] }, cur, aqi);
  const dly = f.daily || {};
  return { temp: Math.round(cur.temp), code: cur.code, sky: sky(cur.code), wind: Math.round(nz(c.wind_speed_10m)), aqi: Number.isFinite(aqi) ? Math.round(aqi) : null, uv: Number.isFinite(uv) ? Math.round(uv) : null,
    rise: dly.sunrise && dly.sunrise[0] ? hhmm(dly.sunrise[0]) : null, set: dly.sunset && dly.sunset[0] ? hhmm(dly.sunset[0]) : null, alert };
}

async function searchCities(q, fetch) { // up to 8 matches from Open-Meteo's geocoder
  const j = JSON.parse(await (fetch || get)('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=8&language=en&format=json', 'application/json'));
  return (j.results || []).filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}
const COORD = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
function pickLocation(fetch) {
  const qp = vscode.window.createQuickPick(), cur = String(cfg().get('location') || '').trim(); let timer = null, seq = 0;
  qp.title = 'World Wire location'; qp.placeholder = 'Type a city (2 or more letters) or lat,lon'; qp.ignoreFocusOut = true; qp.matchOnDescription = false;
  const base = () => (cur ? [{ label: '$(location) Keep: ' + cur.slice(0, 50), description: 'current', alwaysShow: true, value: cur }, { label: '$(circle-slash) Turn weather off', description: 'no weather requests', alwaysShow: true, value: '' }] : []);
  const search = async (text) => {
    const t = text.trim(), my = ++seq;
    if (t.length < 2) { qp.items = base(); qp.busy = false; return; }
    const m = COORD.exec(t);
    if (m) {
      const la = +m[1], lo = +m[2];
      qp.items = Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? [{ label: '$(globe) ' + la + ', ' + lo, description: 'coordinates', alwaysShow: true, value: la + ',' + lo }] : [{ label: '$(warning) Coordinates out of range', description: 'latitude -90 to 90, longitude -180 to 180', alwaysShow: true }];
      qp.busy = false; return;
    }
    qp.busy = true; let items;
    try {
      const rs = await searchCities(t, fetch); if (my !== seq) return; // a newer search is already running
      items = rs.map((r) => ({ label: '$(globe) ' + r.name, description: [r.admin1, r.country].filter(Boolean).join(', '), detail: r.latitude.toFixed(2) + ', ' + r.longitude.toFixed(2), alwaysShow: true, value: (r.name + (r.country ? ', ' + r.country : '')).slice(0, 45) + ' (' + r.latitude.toFixed(3) + ',' + r.longitude.toFixed(3) + ')' }));
      if (!items.length) items = [{ label: '$(warning) No city found for "' + t.slice(0, 30) + '"', description: 'try a larger nearby city, or type lat,lon', alwaysShow: true }];
    } catch (x) { if (my !== seq) return; items = [{ label: '$(error) Could not search', description: String((x && x.message) || x).slice(0, 60), alwaysShow: true }]; }
    qp.items = items; qp.busy = false;
  };
  qp.onDidChangeValue((v) => { clearTimeout(timer); timer = setTimeout(() => search(v), 350); });
  qp.onDidAccept(async () => {
    const s = qp.selectedItems && qp.selectedItems[0]; if (!s || s.value === undefined) return; // warning and error rows are not choices
    qp.hide(); await cfg().update('location', s.value, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(s.value ? 'World Wire weather location set: ' + s.value.replace(/\s*\(.*\)$/, '') + '.' : 'World Wire weather turned off.');
  });
  qp.onDidHide(() => { clearTimeout(timer); qp.dispose(); });
  qp.items = base(); qp.show();
}

async function geocode(loc, fetch) { // the full text first, then fewer words, so "Springfield Heights" still finds Springfield
  fetch = fetch || get; const words = loc.split(/[\s,]+/).filter(Boolean);
  for (let n = words.length; n >= 1; n--) {
    const q = words.slice(0, n).join(' ');
    const j = JSON.parse(await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=1&language=en&format=json', 'application/json')), r = j.results && j.results[0];
    if (r) return { pos: [r.latitude, r.longitude], query: q, label: r.name + (r.country ? ', ' + r.country : '') };
  }
  return null;
}
const geoCache = {};
async function place(loc) {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(loc);
  if (m) { const la = +m[1], lo = +m[2]; if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return [la, lo]; throw new Error('bad coordinates'); }
  const pm = /\(\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*\)\s*$/.exec(loc);
  if (pm) { const la = +pm[1], lo = +pm[2]; if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return [la, lo]; throw new Error('bad coordinates'); }
  if (geoCache[loc]) return geoCache[loc];
  const g = await geocode(loc); if (!g) throw new Error('city not found');
  return (geoCache[loc] = g.pos);
}

async function getWx(err) { // null = no location set (feature off); undefined = failed this time (keep the last good one)
  const loc = String(cfg().get('location') || '').trim().slice(0, 100); if (!loc) return null;
  try {
    const [la, lo] = await place(loc);
    const f = JSON.parse(await get('https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo + '&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation,weather_code,wind_gusts_10m&daily=sunrise,sunset&forecast_hours=6&forecast_days=1&timezone=auto', 'application/json'));
    let aqi = null, uv = null;
    try { const a = JSON.parse(await get('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + la + '&longitude=' + lo + '&current=us_aqi,uv_index&timezone=auto', 'application/json')); aqi = a.current.us_aqi; uv = a.current.uv_index; } catch (x) { err.AIR = String((x && x.message) || x).slice(0, 60); }
    const w = buildWx(f, aqi, uv); if (!w) throw new Error('unexpected reply'); return w;
  } catch (x) { err.WEATHER = String((x && x.message) || x).slice(0, 80); return undefined; }
}

function cfg() { return vscode.workspace.getConfiguration('worldWire'); }
function feeds() {
  return (cfg().get('feeds') || []).filter((f) => f && typeof f.name === 'string' && typeof f.url === 'string' && /^https:\/\//i.test(f.url)).map((f) => [f.name.toUpperCase().slice(0, 14), f.url, typeof f.icon === 'string' ? f.icon : '']);
}
function list(key, re) { return (cfg().get(key) || []).filter((s) => typeof s === 'string' && re.test(s)).slice(0, 12); }

function activate(context) {
  let item;
  try { item = vscode.window.createStatusBarItem('ww.wirefeed', vscode.StatusBarAlignment.Left, 0); }
  catch (e) { item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0); }
  item.name = 'World Wire';
  item.command = 'worldWire.setLocation'; // the weather chip in the news row presses this item, which opens the location box
  item.text = '​'; // zero width: present in the DOM, invisible to the eye
  context.subscriptions.push(item);
  let items = [], quotes = [], wx = null, busy = false;
  const logos = {}, logoTried = {}; // one try per source and session, so a site without an icon is not hit every refresh

  const publish = (err) => {
    item.accessibilityInformation = { label: 'WIRE ' + JSON.stringify({ t: Date.now(), items, quotes, wx, logos, err }) };
    item.show();
  };
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      if (cfg().get('enabled') === false) { items = []; quotes = []; wx = null; publish({}); return; }
      const err = {};
      const ids = list('crypto', /^[a-z0-9-]{1,30}$/), syms = list('stocks', /^[A-Za-z0-9.^=-]{1,12}$/);
      const [lists, cry, stk, wxn] = await Promise.all([
        Promise.all(feeds().map(async ([src, url, icon]) => {
          if (!logoTried[src]) { logoTried[src] = 1; try { logos[src] = await logoOf(url, icon); } catch (e) { err['LOGO ' + src] = String((e && e.message) || e).slice(0, 60); } }
          try { return [src, titles(await get(url))]; } catch (e) { err[src] = String((e && e.message) || e).slice(0, 80); return [src, []]; } })),
        ids.length ? get('https://api.coingecko.com/api/v3/simple/price?ids=' + ids.map(encodeURIComponent).join(',') + '&vs_currencies=usd&include_24hr_change=true', 'application/json').then((t) => cryptoRows(JSON.parse(t), ids)).catch((e) => { err.CRYPTO = String((e && e.message) || e).slice(0, 80); return []; }) : [],
        Promise.all(syms.map((s) => get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?interval=1d&range=5d', 'application/json').then((t) => quoteFrom(s, JSON.parse(t))).catch((e) => { err[s] = String((e && e.message) || e).slice(0, 60); return null; }))),
        getWx(err),
      ]);
      const next = interleave(lists);
      if (next.length) items = next; // keep the last good set when every feed fails
      const q = [...stk.filter(Boolean), ...cry];
      if (q.length) quotes = q;
      if (wxn !== undefined) wx = wxn;
      publish(err);
    } finally { busy = false; }
  };
  publish({});
  refresh();
  context.subscriptions.push(vscode.commands.registerCommand('worldWire.setLocation', () => pickLocation()));
  const timer = setInterval(refresh, Math.max(5, cfg().get('refreshMinutes') || 10) * 60000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('worldWire')) refresh(); }));
}

function deactivate() {}
module.exports = { activate, deactivate, _t: { mimeOf, logoOf, clean, titles, interleave, cryptoRows, quoteFrom, get, sky, planAlert, buildWx, place, geocode, pickLocation, searchCities } };
