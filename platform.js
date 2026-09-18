/* LIAM platform core — WitForge architecture, server-authoritative.
 * Truth rules: local execution is real; unconfigured connectors report
 * UNAVAILABLE; the AI proposes, the user's request grants permission,
 * explicit approval governs high-risk actions; audit records everything.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const dns = require('dns');
const net = require('net');
const crypto = require('crypto');

const DATA = process.env.PLATFORM_DATA ? path.resolve(process.env.PLATFORM_DATA) : path.join(__dirname, 'data', 'platform.json');
const USERFILES = path.join(__dirname, 'data', 'userfiles');

let S = null;
function load() {
  try {
    fs.mkdirSync(path.dirname(DATA), { recursive: true });
    fs.mkdirSync(USERFILES, { recursive: true });
    if (fs.existsSync(DATA)) { S = JSON.parse(fs.readFileSync(DATA, 'utf8')); return; }
  } catch (e) { /* fall through to fresh */ }
  S = freshState();
  save();
}
function freshState() {
  return {
    conversations: [], tasks: [], projects: [], agents: [], memory: [], knowledge: [],
    audit: [], permissions: {}, approvals: [], emergency: 'NORMAL', autonomous: false,
    secret: crypto.randomBytes(32).toString('hex'),
    owner: null, sessions: {}, evidence: [], legal: seedLegal(),
    ledger: { accounts: { Owner: 1000, Treasury: 0, 'Arena Escrow': 0, 'Forge Sink': 0, 'Marketplace Sink': 0, 'LD Issuance': 1000000 }, tx: [] },
    economy: { realMode: false, stripeAccount: null, credited: {} }, market: [],
    seq: 1
  };
}
function seedLegal() {
  const d = '2026-09-18';
  const mk = (id, title, sum) => ({ id, title, version: '1.0.0', effective: d, status: 'RECORD — not legal advice', summary: sum });
  return [
    mk('terms', 'Terms of Use', 'Local-first platform; user responsibility for authorized actions.'),
    mk('privacy', 'Privacy Policy', 'All data local; export/delete available; no telemetry; no PII required.'),
    mk('aup', 'Acceptable Use Policy', 'No unauthorized external action; connectors require real authorization.'),
    mk('security', 'Security Policy', 'Security services surround AI; no bypass; disclosure via audit.'),
    mk('rg', 'Responsible Gaming Policy', 'Real-money wagering disabled until legally authorised.'),
    mk('aml', 'AML/KYC Policy', 'Not activated; jurisdiction review required before any real-money flow.'),
    mk('ip', 'IP Policy', 'Race/lore inspirations are fan references; assets are application-managed records.'),
    mk('content', 'Content Policy', 'External content untrusted; no illicit generation pipelines.'),
    mk('complaints', 'Complaints Policy', 'Owner-reviewed; recorded in audit.'),
    mk('retention', 'Data Retention Policy', 'Until user deletion; bounded audit (600) and battles (60).'),
    mk('deletion', 'Data Deletion Policy', 'WIPE-confirmed reset; per-record deletes in workspaces.'),
    mk('treasury', 'Treasury Policy', 'Simulation allocations; 1% rule; approval-gated.'),
    mk('finrisk', 'Financial Risk Policy', 'Real money locked; simulation labelled.'),
    mk('ir', 'Incident Response Policy', 'LOCKDOWN → contain → evidence → recover → report.'),
    mk('ai', 'AI Policy', 'AI proposes; never authority; provider output untrusted.')
  ];
}
function save() { fs.writeFileSync(DATA, JSON.stringify(S)); }
load();
Object.assign(S, Object.assign(freshState(), S)); // backfill new fields on old stores
S.economy = Object.assign({ realMode: false, stripeAccount: null, credited: {} }, S.economy);
S.market = S.market || [];
for (const acc of ['Forge Sink', 'Marketplace Sink', 'LD Issuance']) if (!(acc in S.ledger.accounts)) S.ledger.accounts[acc] = acc === 'LD Issuance' ? 1000000 : 0;
const nid = p => p + (S.seq++).toString(36) + Date.now().toString(36);

let currentCid = null;
const withCid = fn => { currentCid = crypto.randomBytes(8).toString('hex'); try { return fn(); } finally { currentCid = null; } };
function audit(type, detail, actor) {
  const prev = S.audit[0] ? S.audit[0].hash : 'GENESIS';
  const e = { ts: Date.now(), type, detail: String(detail).slice(0, 300), actor: actor || 'user', cid: currentCid || 'ui' };
  e.hash = crypto.createHash('sha256').update(prev + '|' + e.ts + '|' + e.type + '|' + e.detail + '|' + e.actor).digest('hex');
  S.audit.unshift(e);
  if (S.audit.length > 600) S.audit.length = 600;
  save();
}
function verifyAudit() {
  let prev = 'GENESIS';
  for (let i = S.audit.length - 1; i >= 0; i--) {
    const e = S.audit[i];
    const h = crypto.createHash('sha256').update(prev + '|' + e.ts + '|' + e.type + '|' + e.detail + '|' + e.actor).digest('hex');
    if (h !== e.hash) return { ok: false, brokenAt: e.ts };
    prev = e.hash;
  }
  return { ok: true, entries: S.audit.length };
}

/* ── Emergency / security ─────────────────────────────── */
const EMERGENCIES = ['NORMAL', 'ELEVATED', 'HIGH', 'LOCKDOWN'];
function setEmergency(state, confirmed) {
  if (!EMERGENCIES.includes(state)) return { ok: false, error: 'Unknown emergency state' };
  if ((state === 'LOCKDOWN') && confirmed !== true) {
    const ap = createApproval('security.emergency', 'Set emergency state to LOCKDOWN (blocks execution; audit/recovery preserved)');
    return { ok: false, needsApproval: ap.id, error: 'LOCKDOWN is high-risk: approval required (approve ' + ap.id + ')' };
  }
  S.emergency = state;
  audit('security', 'Emergency state set to ' + state, 'user');
  save();
  return { ok: true, state };
}

/* ── Permissions: the user's request is the grant ─────── */
function signToken(cap, id, exp) {
  return crypto.createHmac('sha256', S.secret).update(cap + '|' + id + '|' + exp).digest('hex');
}
function grant(cap, how) {
  const id = 'tk' + (S.seq++).toString(36), exp = Date.now() + 3600e3;
  S.permissions[cap] = { level: 'granted', grantedBy: how || 'user-request', ts: Date.now(), token: { id, exp, sig: signToken(cap, id, exp) } };
  audit('permission', `PERMISSION GRANTED ${cap} (${S.permissions[cap].grantedBy}) token ${id} expires 1h`, 'user');
  save();
}
function revoke(cap) { delete S.permissions[cap]; audit('permission', 'PERMISSION REVOKED ' + cap, 'user'); save(); }
const permitted = cap => !!S.permissions[cap];
function tokenValid(cap) {
  const p = S.permissions[cap]; if (!p || !p.token) return false;
  if (Date.now() > p.token.exp) return false;
  return signToken(cap, p.token.id, p.token.exp) === p.token.sig;
}

/* ── Approvals gate for high-risk actions ─────────────── */
function createApproval(cap, desc) {
  const ap = { id: 'ap' + (S.seq++).toString(36), cap, desc, status: 'pending', ts: Date.now() };
  S.approvals.unshift(ap); save();
  audit('approval', 'Approval requested: ' + desc, 'system');
  return ap;
}
function decideApproval(id, decision) {
  const ap = S.approvals.find(a => a.id === id);
  if (!ap) return { ok: false, error: 'Unknown approval' };
  if (ap.status !== 'pending') return { ok: false, error: 'Already decided' };
  ap.status = decision === 'approve' ? 'approved' : 'stopped';
  ap.decided = Date.now();
  audit('approval', `Approval ${ap.id} ${ap.status} by user`, 'user');
  save();
  return { ok: true, approval: ap };
}
const approved = id => { const a = S.approvals.find(x => x.id === id); return a && a.status === 'approved'; };

/* ── Adapters & tools: real execution only ────────────── */
const ADAPTERS = [
  { id: 'sys', name: 'System Inspector', caps: [{ id: 'sys.read', risk: 'low', desc: 'OS/runtime/interface facts from the host process' }], state: 'AVAILABLE' },
  { id: 'fs', name: 'Scoped Filesystem', caps: [{ id: 'fs.read', risk: 'low', desc: 'List/read files inside the LIAM userfiles sandbox' }, { id: 'fs.write', risk: 'medium', desc: 'Write/delete files inside the sandbox only' }], state: 'AVAILABLE' },
  { id: 'http', name: 'Guarded HTTP', caps: [{ id: 'http.get', risk: 'medium', desc: 'Real outbound GET with SSRF/private-address/metadata blocking' }], state: 'AVAILABLE' },
  { id: 'weather', name: 'Open-Meteo Weather', caps: [{ id: 'weather.get', risk: 'medium', desc: 'Real geocoding + forecast via Open-Meteo (no key required)' }], state: 'AVAILABLE' },
  { id: 'exec', name: 'Allowlisted Executor', caps: [{ id: 'exec.run', risk: 'medium', desc: 'Bounded, shell:false allowlisted operations with timeouts and output caps' }], state: 'AVAILABLE' },
  { id: 'economy', name: 'LD Ledger (simulation)', caps: [{ id: 'economy.manage', risk: 'medium', desc: 'Double-entry simulation ledger; 100 LD = A$1.00 reference' }], state: 'AVAILABLE' },
  { id: 'arena', name: 'Arena Engine', caps: [{ id: 'arena.fight', risk: 'low', desc: 'Server-authoritative battles' }], state: 'AVAILABLE' },
  { id: 'github', name: 'GitHub REST', caps: [{ id: 'github.read', risk: 'medium', desc: 'Real GitHub API reads when GITHUB_TOKEN is configured' }], state: process.env.GITHUB_TOKEN ? 'CONFIGURED_UNVERIFIED' : 'UNAVAILABLE' },
  { id: 'puter', name: 'Puter.js Bridge', caps: [{ id: 'puter.ai', risk: 'medium', desc: 'Live model discovery/chat in the browser when Puter.js loads' }], state: 'EXTERNAL (browser-reported)' },
  { id: 'stripe', name: 'Stripe Payments', caps: [{ id: 'stripe.manage', risk: 'medium', desc: 'Real Stripe account verification, checkout sessions and paid-status evidence' }], state: 'UNAVAILABLE' },
  { id: 'proton', name: 'Proton Wallet', caps: [{ id: 'proton.pay', risk: 'high', desc: 'Proton publishes no public payment/wallet merchant API' }], state: 'NO PUBLIC API' },
  { id: 'google', name: 'Google Workspace', caps: [{ id: 'google.api', risk: 'high', desc: 'Gmail/Calendar via OAuth when configured' }], state: 'UNAVAILABLE' },
  { id: 'termux', name: 'Termux Runtime', caps: [{ id: 'termux.run', risk: 'high', desc: 'Real only when a Termux runtime is detected' }], state: process.env.TERMUX ? 'CONFIGURED_UNVERIFIED' : 'UNAVAILABLE' },
  { id: 'device', name: 'Device Bridges', caps: [{ id: 'device.bridge', risk: 'high', desc: 'ADB/Shizuku/Companion bridges require real pairing' }], state: 'UNAVAILABLE' }
];

function ssrfSafe(hostname) {
  const h = hostname.replace(/[\[\]]/g, '');
  if (h === 'localhost' || h.endsWith('.local') || h === 'metadata.google.internal') return false;
  if (net.isIP(h)) return publicIP(h);
  return null; // needs DNS resolution
}
function publicIP(ip) {
  const v4 = net.isIP(ip) === 4;
  const parts = ip.split('.').map(Number);
  if (v4) {
    if (parts[0] === 127 || parts[0] === 10 || parts[0] === 0) return false;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    if (parts[0] === 192 && parts[1] === 168) return false;
    if (parts[0] === 169 && parts[1] === 254) return false;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return false;
  } else {
    if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return false;
  }
  return true;
}
async function guardedFetch(url, headers, opts) {
  opts = opts || {};
  let u;
  try { u = new URL(url); } catch (e) { return { ok: false, error: 'Invalid URL' }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, error: 'Only http/https allowed', blocked: 'protocol' };
  const literal = ssrfSafe(u.hostname);
  if (literal === false) { audit('security', 'SSRF BLOCKED ' + u.hostname, 'system'); return { ok: false, error: 'Private/loopback/metadata address blocked', blocked: 'ssrf' }; }
  if (literal === null) {
    let addr;
    try { addr = (await dns.promises.lookup(u.hostname)).address; } catch (e) { return { ok: false, error: 'DNS resolution failed' }; }
    if (!publicIP(addr)) { audit('security', 'SSRF BLOCKED (dns) ' + u.hostname + ' → ' + addr, 'system'); return { ok: false, error: 'Resolved to private address — blocked', blocked: 'ssrf' }; }
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: 'manual', method: opts.method || 'GET', body: opts.body || undefined, headers: Object.assign({ 'user-agent': 'LIAM-guarded-http/1.55' }, headers || {}) });
    if (r.status >= 300) return { ok: false, error: 'HTTP ' + r.status + ' (redirects not followed)' };
    const text = (await r.text()).slice(0, 20000);
    return { ok: true, status: r.status, type: r.headers.get('content-type'), bytes: text.length, text };
  } catch (e) {
    return { ok: false, error: 'Request failed: ' + (e.name === 'AbortError' ? 'timeout (8s)' : e.message) };
  } finally { clearTimeout(t); }
}

function safePath(p) {
  const resolved = path.normalize(path.join(USERFILES, String(p || '')));
  if (resolved !== USERFILES && !resolved.startsWith(USERFILES + path.sep)) return null;
  return resolved;
}
const TOOLS = {
  'sys.info': { cap: 'sys.read', risk: 'low', run: () => ({ platform: os.platform(), arch: os.arch(), node: process.version, cpus: os.cpus().length, load: os.loadavg()[0].toFixed(2), uptime: Math.round(os.uptime()), interfaces: Object.keys(os.networkInterfaces()) }) },
  'fs.list': { cap: 'fs.read', risk: 'low', run: a => { const d = safePath(a.path || ''); if (!d) return { error: 'Path escapes sandbox' }; try { return { files: fs.readdirSync(d).map(f => ({ name: f, size: fs.statSync(path.join(d, f)).size })) }; } catch (e) { return { error: 'Not found in sandbox' }; } } },
  'fs.write': { cap: 'fs.write', risk: 'medium', run: a => { const f = safePath(a.path || ''); if (!f || !a.path || a.path.includes('..')) return { error: 'Path escapes sandbox' }; if (String(a.content || '').length > 50000) return { error: 'Content capped at 50KB' }; fs.writeFileSync(f, String(a.content || '')); return { written: a.path, bytes: Buffer.byteLength(String(a.content || '')), sha256: crypto.createHash('sha256').update(String(a.content || '')).digest('hex') }; } },
  'fs.read': { cap: 'fs.read', risk: 'low', run: a => { const f = safePath(a.path || ''); if (!f) return { error: 'Path escapes sandbox' }; try { const t = fs.readFileSync(f, 'utf8'); return { path: a.path, bytes: Buffer.byteLength(t), text: t.slice(0, 5000) }; } catch (e) { return { error: 'Not found in sandbox' }; } } },
  'http.get': { cap: 'http.get', risk: 'medium', run: async a => guardedFetch(String(a.url || '')) },
  'weather.get': { cap: 'weather.get', risk: 'medium', run: async a => {
      const q = String(a.location || '').slice(0, 60); if (!q) return { error: 'location required' };
      const g = await guardedFetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=1');
      if (!g.ok) return g;
      let j; try { j = JSON.parse(g.text); } catch (e) { return { error: 'Bad geocode response' }; }
      const r = j.results && j.results[0]; if (!r) return { error: 'Location not found', truthful: true };
      const f = await guardedFetch(`https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&current_weather=true`);
      if (!f.ok) return f;
      const w = JSON.parse(f.text).current_weather;
      return { location: r.name, country: r.country, tempC: w.temperature, windspeed: w.windspeed, weathercode: w.weathercode, time: w.time };
    } },
  'exec.run': { cap: 'exec.run', risk: 'medium', run: a => {
      const op = String(a.op || ''); const allowed = { date: () => new Date().toString(), hostname: () => os.hostname(), whoami: () => (os.userInfo().username || 'unknown'), mem: () => ({ free: Math.round(os.freemem() / 1e6), total: Math.round(os.totalmem() / 1e6) }) };
      if (!allowed[op]) return { error: 'Operation not on allowlist. Allowed: ' + Object.keys(allowed).join(', '), blocked: 'allowlist' };
      return { op, result: allowed[op]() };
    } },
  'github.status': { cap: 'github.read', risk: 'medium', run: async () => {
      const tok = process.env.GITHUB_TOKEN || decryptToken('github');
      if (!tok) return { error: 'GitHub UNAVAILABLE — no credential configured (never faked). Say “connect github with token …”', truthful: true };
      const r = await guardedFetch('https://api.github.com/user', { authorization: 'Bearer ' + tok, accept: 'application/vnd.github+json' });
      if (r.ok) { try { r.user = JSON.parse(r.text).login; } catch (e) {} }
      return r;
    } },
  'economy.selftest': { cap: 'economy.manage', risk: 'low', run: () => economySelfTest() },
  'stripe.verify': { cap: 'stripe.manage', risk: 'medium', run: async () => {
      const tok = decryptToken('stripe');
      if (!tok) return { error: 'Stripe UNAVAILABLE — no credential stored (never faked). Say “connect stripe with token sk_…”', truthful: true };
      const auth = { authorization: 'Basic ' + Buffer.from(tok + ':').toString('base64') };
      const r = await guardedFetch('https://api.stripe.com/v1/account', auth);
      if (!r.ok) return r;
      let j; try { j = JSON.parse(r.text); } catch (e) { return { error: 'Bad Stripe response' }; }
      S.economy.stripeAccount = { id: j.id, email: j.email, country: j.country, verifiedTs: Date.now() };
      audit('economy', 'STRIPE ACCOUNT VERIFIED ' + j.id + ' (' + j.country + ') — real API evidence', 'system'); save();
      return { stripeAccount: j.id, email: j.email, country: j.country, chargesEnabled: j.charges_enabled };
    } }
};

/* ── Economy: balanced double-entry, simulation-labelled ─ */
function ledgerPost(entries, memo) {
  const sum = entries.reduce((n, e) => n + e.delta, 0);
  if (sum !== 0) return { ok: false, error: 'Unbalanced entry rejected (debits must equal credits)' };
  for (const e of entries) {
    if (!(e.account in S.ledger.accounts)) S.ledger.accounts[e.account] = 0;
    if (S.ledger.accounts[e.account] + e.delta < 0) return { ok: false, error: 'Negative balance prevented on ' + e.account };
  }
  for (const e of entries) S.ledger.accounts[e.account] += e.delta;
  S.ledger.tx.unshift({ id: nid('tx'), ts: Date.now(), entries, memo, mode: 'SIMULATION' });
  save();
  return { ok: true };
}
function wager(playerA, playerB, amount, settleTo) {
  amount = Math.floor(Number(amount));
  if (!(amount > 0)) return { ok: false, error: 'Invalid wager amount' };
  const hold = ledgerPost([{ account: playerA, delta: -amount }, { account: 'Arena Escrow', delta: amount }], 'wager hold ' + playerA);
  if (!hold.ok) return hold;
  const hold2 = ledgerPost([{ account: playerB, delta: -amount }, { account: 'Arena Escrow', delta: amount }], 'wager hold ' + playerB);
  if (!hold2.ok) return hold2;
  const pool = amount * 2, treasury = Math.round(pool * 0.01), winner = pool - treasury;
  const settle = ledgerPost([{ account: 'Arena Escrow', delta: -pool }, { account: settleTo, delta: winner }, { account: 'Treasury', delta: treasury }], 'wager settlement');
  if (!settle.ok) return settle;
  audit('economy', `SIMULATION wager settled: pool ${pool}, winner ${winner}, treasury ${treasury} (1%)`, 'system');
  return { ok: true, pool, winner, treasury };
}
function economySelfTest() {
  // Deterministic + repeatable: reset scratch accounts to a known state so the
  // ledger self-test can run any number of times on any live store.
  const sumBeforeAll = Object.values(S.ledger.accounts).reduce((a, b) => a + b, 0);
  const prevTA = S.ledger.accounts['T-A'] || 0;
  const prevTB = S.ledger.accounts['T-B'] || 0;
  S.ledger.accounts['T-A'] = 200;
  S.ledger.accounts['T-B'] = 200;
  const resetDelta = (200 - prevTA) + (200 - prevTB); // net LD added/removed by the reset
  const sumBefore = sumBeforeAll + resetDelta;
  const w = wager('T-A', 'T-B', 100, 'T-A');
  const sumAfter = Object.values(S.ledger.accounts).reduce((a, b) => a + b, 0);
  const checks = [
    ['100+100=200 pool escrowed', w.ok && w.pool === 200],
    ['200-198=2 treasury (1%)', w.ok && w.treasury === 2 && w.winner === 198],
    ['ledger sum invariant', sumAfter === sumBefore],
    ['negative balance prevented', !ledgerPost([{ account: 'T-A', delta: -1e9 }, { account: 'Treasury', delta: 1e9 }], 'attack').ok],
    ['unbalanced entry rejected', !ledgerPost([{ account: 'T-A', delta: 5 }], 'attack').ok]
  ];
  save();
  return { mode: 'SIMULATION', checks: checks.map(c => ({ check: c[0], pass: !!c[1] })) };
}

/* ── Tool execution pipeline: policy → permission → approval → run → audit */
async function runTool(toolId, args, opts) {
  opts = opts || {};
  const tool = TOOLS[toolId];
  if (!tool) return { ok: false, state: 'FAILED', error: 'Unknown tool ' + toolId };
  if (S.emergency === 'LOCKDOWN' && tool.risk !== 'low') { audit('security', 'LOCKDOWN blocked ' + toolId, 'system'); return { ok: false, state: 'BLOCKED', error: 'LOCKDOWN: execution blocked (security policy)', blocked: 'lockdown' }; }
  if (S.emergency === 'HIGH' && tool.risk === 'medium' && !opts.confirmed && !S.autonomous) {
    const ap = createApproval(tool.cap, 'Run ' + toolId + ' during HIGH emergency');
    return { ok: false, state: 'BLOCKED', needsApproval: ap.id, error: 'HIGH emergency: explicit approval required for ' + toolId };
  }
  if (!tokenValid(tool.cap)) {
    if (tool.risk === 'low' || tool.risk === 'medium') grant(tool.cap, S.autonomous ? 'autonomous-mode' : 'user-request');
    else { const ap = createApproval(tool.cap, 'Grant+run high-risk ' + toolId); return { ok: false, state: 'BLOCKED', needsApproval: ap.id, error: 'High-risk capability requires approval (approve ' + ap.id + ')' }; }
  }
  audit('tool', `EXEC ${toolId} ${JSON.stringify(args || {}).slice(0, 140)}`, 'user');
  const out = await tool.run(args || {});
  const state = out.error ? (out.blocked ? 'BLOCKED' : 'FAILED') : 'SUCCEEDED';
  audit('tool', `RESULT ${toolId}: ${state}${out.error ? ' ' + out.error : ''}`, 'system');
  if (state === 'SUCCEEDED') {
    S.evidence.unshift({ ts: Date.now(), tool: toolId, cid: currentCid || 'ui', sha256: crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex') });
    if (S.evidence.length > 200) S.evidence.length = 200;
    save();
  }
  return { ok: !out.error, state, tool: toolId, evidence: out };
}
function preview(text) {
  const low = String(text || '').toLowerCase();
  let m;
  const plan = (op, cap, risk) => ({ ok: true, kind: 'preview', reply: `PREVIEW — op:${op} capability:${cap} risk:${risk} required-authority:${risk === 'high' ? 'approval' : 'your request'} emergency-gate:${S.emergency}`, plan: { op, cap, risk } });
  let low2; if ((m = low.match(/^preview (.+)/))) low2 = m[1]; else low2 = low;
  if (low2.includes('lockdown')) return plan('security.emergency', 'security.control', 'high');
  if ((m = low2.match(/^fetch /))) return plan('http.get', 'http.get', 'medium');
  if ((m = low2.match(/^weather /))) return plan('weather.get', 'weather.get', 'medium');
  if ((m = low2.match(/^write file /))) return plan('fs.write', 'fs.write', 'medium');
  if ((m = low2.match(/^run /))) return plan('exec.run', 'exec.run', 'medium');
  if ((m = low2.match(/^wager /))) return plan('economy.wager', 'economy.manage', 'medium');
  if ((m = low2.match(/^create (task|project|agent) /))) return plan('store.write', 'store.write', 'low');
  return { ok: false, error: 'Nothing to preview' };
}

/* ── Conversational command router (platform intents) ─── */
async function command(text) {
  const q = String(text || '').trim();
  const low = q.toLowerCase();
  let m;
  const R = (reply, data) => ({ ok: true, kind: 'platform', reply, data });

  if ((m = low.match(/^connect (proton)(?: .*)?$/)) || low === 'connect proton') {
    return R('Proton publishes NO public payment/wallet merchant API, so a real integration cannot exist. I will not simulate one. Proton connector state stays “NO PUBLIC API”. For receiving real payments, use Stripe: “connect stripe with token sk_…”, then “verify stripe”.');
  }
  if ((m = low.match(/^connect ([a-z0-9-]+) (?:with )?(?:token )?(.+)$/))) {
    const r = setCredential(m[1], m[2].trim());
    return r.ok ? R(`Credential for ${r.service} stored encrypted. Run “verify ${r.service}” (or the adapter's status tool) to prove it works — configuration alone never counts as connected.`) : R(r.error);
  }
  if ((m = low.match(/^(?:disconnect|revoke credential for) ([a-z0-9-]+)$/))) { const r = revokeCredential(m[1]); return r.ok ? R('Credential for ' + m[1] + ' revoked and destroyed.') : R(r.error); }
  if (low === 'connections' || low === 'list connections') {
    const cs = listCreds();
    return R(cs.length ? 'Stored credentials (encrypted at rest, never returned): ' + cs.map(c => c.service).join(', ') : 'No credentials stored. Say “connect <service> with token <token>” and I will store it encrypted and use it only for that service.');
  }
  if ((m = low.match(/^verify (github)/))) { const r = await runTool('github.status', {}, { confirmed: low.includes('confirm') }); return r.ok ? R('GitHub verified for user: ' + (r.evidence.user || 'unknown') + '. Connector is live.') : R((r.evidence && r.evidence.error) || r.error); }
  if (low.startsWith('preview ')) { const r = preview(low); return r.ok ? R(r.reply) : R(r.error); }
  if ((m = low.match(/^autonomous (on|off)( confirm)?/))) {
    if (m[1] === 'on' && !m[2]) { const ap = createApproval('autonomous', 'Enable autonomous mode (medium-risk auto-grant during HIGH)'); return R('Autonomous mode is high-impact: approval required (approve ' + ap.id + '), or say “autonomous on confirm”.'); }
    S.autonomous = m[1] === 'on'; audit('security', 'Autonomous mode ' + (S.autonomous ? 'ENABLED' : 'DISABLED') + ' by user', 'user'); save();
    return R('Autonomous mode ' + (S.autonomous ? 'ENABLED. High-risk actions still require approval; truth boundary unchanged.' : 'disabled.'));
  }
  if ((m = low.match(/^set emergency (\w+)/))) return setEmergency(m[1].toUpperCase(), low.includes('confirm')) ? R('Emergency state now ' + S.emergency + '.') : R('Approval required for that change.');
  if (low.includes('lockdown') && low.includes('confirm')) { setEmergency('LOCKDOWN', true); return R('LOCKDOWN engaged. Execution blocked; audit and recovery preserved.'); }
  if (low.includes('lockdown')) { const r = setEmergency('LOCKDOWN'); return r.ok ? R('LOCKDOWN engaged.') : R(r.error); }
  if ((m = low.match(/^approve (\w+)/))) { const r = decideApproval(m[1], 'approve'); return r.ok ? R('Approved: ' + r.approval.desc) : R(r.error); }
  if ((m = low.match(/^stop (\w+)/))) { const r = decideApproval(m[1], 'stop'); return r.ok ? R('Stopped: ' + r.approval.desc) : R(r.error); }
  if ((m = low.match(/^grant ([\w.]+)/)) ) { grant(m[1]); return R('Permission granted: ' + m[1] + ' (granted by your request, audited).'); }
  if ((m = low.match(/^revoke ([\w.]+)/))) { revoke(m[1]); return R('Permission revoked: ' + m[1]); }

  if (low.includes('status') || low.includes('health')) {
    return R(`Systems: emergency=${S.emergency}; adapters=${ADAPTERS.filter(a => a.state === 'AVAILABLE').length} available / ${ADAPTERS.filter(a => a.state === 'UNAVAILABLE').length} unavailable; conversations=${S.conversations.length}; tasks=${S.tasks.length}; audit=${S.audit.length}; ledger mode=SIMULATION.`);
  }
  if (low.includes('capabilities') || low.includes('adapters')) {
    return R('Adapters: ' + ADAPTERS.map(a => `${a.id}=${a.state}`).join(' · ') + '. Discovery grants nothing; execution requires your request (permission) and approval for high risk.');
  }
  if (low.includes('security')) return R(`Security shield: emergency=${S.emergency}; permissions granted=${Object.keys(S.permissions).length}; pending approvals=${S.approvals.filter(a => a.status === 'pending').length}; recent security events: ${S.audit.filter(a => a.type === 'security').slice(0, 3).map(a => a.detail).join(' | ') || 'none'}.`);

  if ((m = q.match(/^create task (.+)/i))) { S.tasks.unshift({ id: nid('t'), text: m[1].slice(0, 120), done: false, created: Date.now() }); save(); audit('task', 'Created task: ' + m[1]); return R('Task recorded: ' + m[1]); }
  if (low === 'list tasks' || low === 'tasks') return R(S.tasks.length ? S.tasks.slice(0, 8).map(t => `${t.done ? '✓' : '◌'} ${t.text}`).join('\n') : 'No tasks yet.');
  if ((m = low.match(/^complete task (\d+)/))) { const t = S.tasks[+m[1]]; if (t) { t.done = true; save(); return R('Completed: ' + t.text); } return R('No such task index.'); }

  if ((m = q.match(/^create project (.+)/i))) { S.projects.unshift({ id: nid('p'), name: m[1].slice(0, 80), created: Date.now() }); save(); audit('project', 'Created project: ' + m[1]); return R('Project created: ' + m[1]); }
  if ((m = q.match(/^create agent (.+)/i))) { S.agents.unshift({ id: nid('ag'), name: m[1].slice(0, 60), scope: 'local', status: 'active', delegations: 0, created: Date.now() }); save(); audit('agent', 'Created agent: ' + m[1]); return R('Agent registered: ' + m[1] + ' (scoped, non-privileged).'); }
  if ((m = q.match(/^remember (.+)/i))) { S.memory.unshift({ id: nid('m'), text: m[1].slice(0, 200), ts: Date.now(), source: 'user-statement' }); save(); return R('Stored to memory (untrusted user statement; information, not authority).'); }
  if ((m = q.match(/^(?:recall|search) (.+)/i))) {
    const needle = m[1].toLowerCase();
    const hits = S.memory.filter(x => x.text.toLowerCase().includes(needle)).concat(S.knowledge.filter(x => (x.title + x.text).toLowerCase().includes(needle)));
    return R(hits.length ? hits.slice(0, 6).map(h => '• ' + (h.title ? h.title + ': ' : '') + h.text).join('\n') : 'Nothing in memory/knowledge matches.');
  }
  if ((m = q.match(/^add knowledge (.+)/i))) { S.knowledge.unshift({ id: nid('k'), title: m[1].slice(0, 60), text: m[1], ts: Date.now(), source: 'user', trusted: false }); save(); return R('Knowledge record added (untrusted until verified).'); }

  if (low.includes('balance') || low === 'ledger') return R('LD balances (SIMULATION): ' + Object.entries(S.ledger.accounts).map(([k, v]) => `${k}=${v}`).join(' · '));
  if ((m = low.match(/^wager (\d+) between ([\w-]+) and ([\w-]+)/))) { const r = wager(m[2], m[3], +m[1], m[2]); return r.ok ? R(`SIMULATION wager settled: pool ${r.pool}, winner ${r.winner}, Treasury ${r.treasury} (1%).`) : R(r.error); }
  if (low.includes('economy selftest') || low.includes('selftest')) return R('Economy self-test: ' + economySelfTest().checks.map(c => `${c.check}=${c.pass ? 'PASS' : 'FAIL'}`).join(' · '));

  if ((m = q.match(/^weather (?:in|for|at) (.+)/i))) { const r = await runTool('weather.get', { location: m[1] }, { confirmed: low.includes('confirm') }); return r.ok ? R(`Weather in ${r.evidence.location}: ${r.evidence.tempC}°C, wind ${r.evidence.windspeed} km/h (Open-Meteo, real retrieval).`) : R(r.error || (r.evidence && r.evidence.error)); }
  if ((m = q.match(/^fetch (https?:\/\/\S+)/i))) { const r = await runTool('http.get', { url: m[1] }, { confirmed: low.includes('confirm') }); return r.ok ? R(`Fetched ${m[1]} → HTTP ${r.evidence.status}, ${r.evidence.bytes} bytes.\n${String(r.evidence.text).slice(0, 400)}`) : R((r.evidence && r.evidence.error) || r.error); }
  if ((m = q.match(/^write file ([\w.-]+) (.+)/is))) { const r = await runTool('fs.write', { path: m[1], content: m[2] }, { confirmed: low.includes('confirm') }); return r.ok ? R(`Wrote ${r.evidence.path} (${r.evidence.bytes}B, sha256 ${String(r.evidence.sha256).slice(0, 12)}…).`) : R(r.error); }
  if ((m = q.match(/^list files/))) { const r = await runTool('fs.list', {}, {}); return r.ok ? R('Sandbox files: ' + (r.evidence.files.map(f => f.name).join(', ') || '(empty)')) : R(r.error); }
  if ((m = q.match(/^run (\w+)/))) { const r = await runTool('exec.run', { op: m[1] }, { confirmed: low.includes('confirm') }); return r.ok ? R(`exec ${m[1]} → ` + JSON.stringify(r.evidence.result)) : R((r.evidence && r.evidence.error) || r.error); }
  if (low.includes('verify stripe') || low.includes('check stripe')) { const r = await runTool('stripe.verify', {}, { confirmed: low.includes('confirm') }); return r.ok ? R('Stripe account VERIFIED via real API: ' + r.evidence.stripeAccount + ' (' + r.evidence.country + ', ' + r.evidence.email + '). You may now say “enable real payments confirm”.') : R((r.evidence && r.evidence.error) || r.error); }
  if (low.includes('enable real payments')) { const r = setRealMode(true, low.includes('confirm')); return r.ok ? R('REAL-MONEY MODE ENABLED. LD purchases now settle against verified Stripe evidence. The app does not claim licensing — compliance responsibility is the Owner’s, per the master spec.') : R(r.error); }
  if (low.includes('disable real payments')) { const r = setRealMode(false, true); return R('Real-money mode disabled. LD returns to simulation labelling.'); }
  if ((m = q.match(/^create payment (\d+) ld/i))) { const r = await createPayment(m[1]); return r.ok ? R('Real Stripe checkout created for ' + r.ld + ' LD (A$' + r.aud + '). Open this URL to pay: ' + r.url + '\nWhen paid, say “confirm payment ' + r.sessionId + '”.') : R(r.error); }
  if ((m = low.match(/^confirm payment (\S+)/))) { const r = await confirmPayment(m[1]); return r.ok ? R('Provider evidence confirms PAID → ' + r.ld + ' LD credited to Owner (REAL mode, idempotent).') : R(r.error); }
  if ((m = q.match(/^create avatar ([a-z0-9'\- ]{2,30}?) (?:as |race )([a-z_]+)/i))) {
    const arena = require('./arena-engine.js');
    const r = arena.createAvatar(m[1], m[2].toLowerCase());
    return r.ok ? R('Avatar “' + r.avatar.name + '” forged (' + r.avatar.raceId + ', level 1, naked start). Now forge gear — e.g. “forge sword at rare: …”.') : R(r.error || 'Could not create avatar.');
  }
  if (low === 'connect stripe' || low === 'connect stripe account') return R('To really connect Stripe, paste your secret key in Chat: “connect stripe with token sk_…” — I store it encrypted (AES-256-GCM) and never show it back. Then say “verify stripe” (real API call), and once verified, “enable real payments confirm”.');
  if (low.includes('forge cost') || low.includes('forge prices')) return R('Forge costs (LD): ' + Object.entries(FORGE_COST).map(([k, v]) => k + '=' + v).join(' · ') + '. Your prompt makes each piece unique; higher bands cost more.');
  if ((m = q.match(/^forge ([a-z0-9_]+)(?: at (common|magic|rare|legendary|set|mythic))?:?\s*(.+)$/i))) {
    const arena = require('./arena-engine.js');
    const avs = arena.list();
    if (!avs.length) return R('Forge an avatar first (Avatar Studio).');
    const band = (m[2] || 'Common'); band[0] ? band[0].toUpperCase() + band.slice(1) : band;
    const cap = band[0].toUpperCase() + band.slice(1).toLowerCase();
    const r = forgePiece(avs[0].id, m[1].toLowerCase(), m[3], cap, null);
    return r.ok ? R(`Forged “${r.item.name}” — ${r.item.rarity} R${r.item.rlevel} ${r.item.slot} for ${r.cost} LD. Unique fingerprint ${String(r.item.fp).slice(0, 12)}… from your prompt. Equip it in Avatar Studio.`) : R(r.error);
  }
  if (low === 'market' || low === 'list market') {
    seedMarket();
    return R(S.market.length ? S.market.map(l => `${l.id}: ${l.item.name} (${l.item.rarity} R${l.item.rlevel} ${l.item.slot}) — ${l.price} LD [${l.seller}]`).join('\n') : 'Market empty.');
  }
  if ((m = low.match(/^buy (mk\w+)/))) { const arena = require('./arena-engine.js'); const avs = arena.list(); if (!avs.length) return R('Forge an avatar first.'); const r = buy(m[1], avs[0].id); return r.ok ? R('Bought ' + r.item.name + ' — escrow settled, item in inventory.') : R(r.error); }
  if ((m = low.match(/^sell ([a-z0-9]+) for (\d+)/))) { const arena = require('./arena-engine.js'); const avs = arena.list(); if (!avs.length) return R('No avatar.'); const r = listItem(avs[0].id, m[1], m[2]); return r.ok ? R('Listed ' + r.listing.item.name + ' for ' + r.listing.price + ' LD.') : R(r.error); }
  if ((m = low.match(/^delist (mk\w+)/))) { const r = delist(m[1]); return r.ok ? R('Delisted; item returned to inventory.') : R(r.error); }

  if (low.includes('github')) { const r = await runTool('github.status', {}, {}); return r.ok ? R('GitHub reachable.') : R(r.evidence ? r.evidence.error : r.error); }

  return null; // not a platform intent
}

/* ── Credential broker: secrets encrypted at rest ───────── */
function credKey() { return crypto.createHash('sha256').update(S.secret).digest(); }
function encryptToken(service, plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', credKey(), iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return { iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex'), data: enc.toString('hex') };
}
function decryptToken(service) {
  const rec = (S.creds || {})[service];
  if (!rec) return null;
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', credKey(), Buffer.from(rec.iv, 'hex'));
    d.setAuthTag(Buffer.from(rec.tag, 'hex'));
    return Buffer.concat([d.update(Buffer.from(rec.data, 'hex')), d.final()]).toString('utf8');
  } catch (e) { return null; }
}
function setCredential(service, token) {
  const svc = String(service || '').toLowerCase().slice(0, 20);
  if (!svc || !token) return { ok: false, error: 'service and token required' };
  S.creds = S.creds || {};
  S.creds[svc] = Object.assign(encryptToken(svc, token), { ts: Date.now() });
  audit('security', `CREDENTIAL STORED for ${svc} (AES-256-GCM at rest; never returned by APIs)`, 'user');
  save();
  return { ok: true, service: svc };
}
function revokeCredential(service) {
  if (!S.creds || !S.creds[service]) return { ok: false, error: 'No credential for ' + service };
  delete S.creds[service];
  audit('security', `CREDENTIAL REVOKED for ${service}`, 'user');
  save();
  return { ok: true };
}
const listCreds = () => Object.entries(S.creds || {}).map(([k, v]) => ({ service: k, stored: v.ts }));
function adaptersLive() {
  return ADAPTERS.map(a => {
    if (a.id === 'stripe') {
      const st = !((S.creds || {}).stripe) ? 'UNAVAILABLE' : (S.economy.stripeAccount ? 'VERIFIED' : 'CONFIGURED_UNVERIFIED');
      return Object.assign({}, a, { state: st });
    }
    if (a.id === 'github') {
      const st = (S.creds && S.creds.github) || process.env.GITHUB_TOKEN ? 'CONFIGURED_UNVERIFIED' : 'UNAVAILABLE';
      return Object.assign({}, a, { state: st });
    }
    return a;
  });
}

/* ── Owner authentication (scrypt + HttpOnly sessions) ───── */
let loginFails = 0, loginWindow = Date.now();
function createOwner(name, password) {
  if (S.owner) return { ok: false, error: 'Owner already exists; first-run creation is closed' };
  const clean = String(name || '').trim().slice(0, 24);
  if (!clean || String(password || '').length < 8) return { ok: false, error: 'Name and a password of 8+ characters required' };
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  S.owner = { name: clean, salt, hash, created: Date.now() };
  audit('security', 'OWNER account created (first-run); role protected', 'system');
  save();
  return { ok: true, owner: S.owner.name };
}
function login(password) {
  if (!S.owner) return { ok: false, error: 'No owner; use first-run creation' };
  if (loginFails >= 5 && Date.now() - loginWindow < 60000) return { ok: false, error: 'Throttled: too many failures, wait 60s' };
  const hash = crypto.scryptSync(String(password || ''), S.owner.salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  if (hash !== S.owner.hash) {
    if (Date.now() - loginWindow > 60000) { loginFails = 0; loginWindow = Date.now(); }
    loginFails++;
    audit('security', 'OWNER login failure ' + loginFails, 'system'); save();
    return { ok: false, error: 'Invalid credentials' };
  }
  loginFails = 0;
  const token = crypto.randomBytes(32).toString('hex');
  S.sessions[token] = { ts: Date.now() };
  audit('security', 'OWNER session established', 'user'); save();
  return { ok: true, token };
}
function logout(token) { delete S.sessions[token]; audit('security', 'OWNER session invalidated', 'user'); save(); return { ok: true }; }
const sessionValid = token => !!S.sessions[token];

/* ── Aggregated self-test + spec compliance ─────────────── */
function selftestAll() {
  const checks = [];
  const eco = economySelfTest();
  checks.push(['economy ledger invariants', eco.checks.every(c => c.pass)]);
  checks.push(['tamper-evident audit chain', verifyAudit().ok]);
  checks.push(['ssrf loopback blocked', ssrfSafe('127.0.0.1') === false && ssrfSafe('169.254.169.254') === false]);
  checks.push(['rarity scale = 100', require('./arena-engine.js').RARITY_LEVELS === 100]);
  checks.push(['token issue/validate/revoke', (() => { grant('selftest.cap', 'self-test'); const v = tokenValid('selftest.cap'); revoke('selftest.cap'); return v; })()]);
  checks.push(['allowlist blocks unknown op', !TOOLS['exec.run'].run({ op: 'rm -rf /' }).op ]);
  checks.push(['unbalanced ledger rejected', !ledgerPost([{ account: 'Owner', delta: 1 }], 'attack').ok]);
  return { version: '1.58.0', mode: 'local', checks: checks.map(c => ({ check: c[0], pass: !!c[1] })) };
}
function compliance() {
  const { SECTIONS } = require('./spec-coverage.js');
  const arena = require('./arena-engine.js');
  const counts = {};
  SECTIONS.forEach(x => { counts[x.status] = (counts[x.status] || 0) + 1; });
  return {
    total: SECTIONS.length, counts, sections: SECTIONS,
    probes: {
      auditChain: verifyAudit(),
      adapters: adaptersLive().map(a => ({ id: a.id, state: a.state })),
      rarityLevels: arena.RARITY_LEVELS,
      emergency: S.emergency, autonomous: S.autonomous,
      ownerAuth: !!S.owner, legalDocs: S.legal.length,
      evidenceRecords: S.evidence.length
    }
  };
}


/* ── Forge: LD-cost, prompt-unique pieces (§69-72) ───────── */
const FORGE_COST = { Common: 25, Magic: 60, Rare: 150, Legendary: 400, Set: 900, Mythic: 2000 };
function forgePiece(avatarId, slot, prompt, bandName, flavor) {
  const arena = require('./arena-engine.js');
  const av = arena.get(avatarId);
  if (!av) return { ok: false, error: 'Avatar not found' };
  if (!arena.SLOTS.includes(slot)) return { ok: false, error: 'Unknown slot. Slots: ' + arena.SLOTS.length };
  const band = arena.BANDS.find(b => b.name === bandName);
  if (!band) return { ok: false, error: 'Unknown band. Bands: ' + arena.BANDS.map(b => b.name).join(', ') };
  const clean = String(prompt || '').trim();
  if (clean.length < 3) return { ok: false, error: 'Describe the piece — your prompt makes it unique' };
  const cost = FORGE_COST[band.name];
  const pay = ledgerPost([{ account: 'Owner', delta: -cost }, { account: 'Forge Sink', delta: cost }], 'forge ' + band.name + ' ' + slot);
  if (!pay.ok) return { ok: false, error: pay.error + ' — forging ' + band.name + ' costs ' + cost + ' LD' };
  const rnd = mulberryLocal();
  const min = band.min, max = (arena.BANDS[arena.BANDS.indexOf(band) + 1] || { min: 101 }).min - 1;
  const rlevel = min + Math.floor(rnd() * (max - min + 1));
  const words = clean.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3).slice(0, 3);
  const base = (arena.BASES[slot] || ['Relic'])[0];
  const name = (words.length ? words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ') + ' ' : '') + base;
  const item = {
    id: 'fg' + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36),
    slot, kind: slot === 'weapon' ? 'weapon' : slot === 'shield' ? 'shield' : 'armor',
    name, rarity: band.name, color: band.color, rlevel,
    power: Math.max(1, Math.floor(rlevel / 6) + 1 + Math.floor(rnd() * 3)),
    prompt: clean.slice(0, 240), forgedBy: 'LIAM-forge', forgedFor: av.name,
    flavor: flavor ? { text: String(flavor).slice(0, 400), source: 'external-untrusted' } : undefined
  };
  item.fp = require('crypto').createHash('sha256').update(JSON.stringify(Object.assign({}, item)) + S.secret).digest('hex');
  const raw = arena.rawAvatar(avatarId);
  raw.inventory.push(item); arena.persist();
  audit('forge', `FORGED ${name} (${band.name} R${rlevel}, ${slot}) for ${cost} LD from prompt “${clean.slice(0, 60)}”`, 'user');
  return { ok: true, item, cost };
}
function mulberryLocal() {
  let t = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  return function () { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

/* ── Marketplace: LD escrow listings ───────────────────── */
function marketList() { return S.market; }
function listItem(avatarId, itemId, price) {
  const arena = require('./arena-engine.js');
  const av = arena.rawAvatar(avatarId); if (!av) return { ok: false, error: 'Avatar not found' };
  const idx = av.inventory.findIndex(i => i.id === itemId); if (idx < 0) return { ok: false, error: 'Item not owned' };
  price = Math.floor(Number(price)); if (!(price > 0)) return { ok: false, error: 'Price must be positive LD' };
  const item = av.inventory.splice(idx, 1)[0];
  const l = { id: 'mk' + Date.now().toString(36), seller: 'Owner:' + av.name, sellerId: av.id, item, price, ts: Date.now() };
  S.market.push(l); arena.persist(); save();
  audit('market', 'LISTED ' + item.name + ' for ' + price + ' LD', 'user');
  return { ok: true, listing: l };
}
function delist(listingId) {
  const arena = require('./arena-engine.js');
  const i = S.market.findIndex(l => l.id === listingId && l.seller.startsWith('Owner:'));
  if (i < 0) return { ok: false, error: 'Listing not found or not yours' };
  const [l] = S.market.splice(i, 1);
  const av = arena.rawAvatar(l.seller.slice(6)); if (av) av.inventory.push(l.item); arena.persist(); save();
  audit('market', 'DELISTED ' + l.item.name, 'user');
  return { ok: true };
}
function buy(listingId, avatarId) {
  const arena = require('./arena-engine.js');
  const l = S.market.find(x => x.id === listingId); if (!l) return { ok: false, error: 'Listing not found' };
  const av = arena.rawAvatar(avatarId); if (!av) return { ok: false, error: 'Avatar not found' };
  if (l.sellerId === avatarId) return { ok: false, error: 'Cannot buy your own listing' };
  const sellerAcct = l.seller === 'Vendor' ? 'Marketplace Sink' : l.sellerId;
  const pay = ledgerPost([{ account: avatarId, delta: -l.price }, { account: sellerAcct, delta: l.price }], 'buy ' + l.item.name);
  if (!pay.ok) return { ok: false, error: pay.error };
  S.market = S.market.filter(x => x.id !== listingId);
  av.inventory.push(l.item); arena.persist(); save();
  audit('market', 'BOUGHT ' + l.item.name + ' for ' + l.price + ' LD (escrow settled)', 'user');
  return { ok: true, item: l.item };
}
function seedMarket() {
  if (S.market.length || S.marketSeeded) return;
  S.marketSeeded = true;
  const arena = require('./arena-engine.js');
  const rnd = mulberryLocal();
  for (let i = 0; i < 5; i++) {
    const item = arena.rollLoot(rnd, 3);
    S.market.push({ id: 'mkv' + i + Date.now().toString(36), seller: 'Vendor', item, price: 20 + item.rlevel * 3, ts: Date.now() });
  }
  save();
}

/* ── Real-money Stripe payments (evidence-gated) ───────── */
async function createPayment(ldAmount) {
  ldAmount = Math.floor(Number(ldAmount));
  if (!(ldAmount > 0)) return { ok: false, error: 'Amount must be positive LD' };
  if (!S.economy.realMode) return { ok: false, error: 'Real-money mode is OFF. After “verify stripe”, say “enable real payments confirm”. Until then LD stays simulation.' };
  const tok = decryptToken('stripe');
  if (!tok || !S.economy.stripeAccount) return { ok: false, error: 'Stripe not verified — run “verify stripe” first' };
  const cents = ldAmount; // 1 LD = A$0.01
  const bodyForm = 'mode=payment&metadata[ld]=' + ldAmount + '&line_items[0][quantity]=1&line_items[0][price_data][currency]=aud&line_items[0][price_data][unit_amount]=' + cents + '&line_items[0][price_data][product_data][name]=' + encodeURIComponent(ldAmount + ' LD Coins');
  const r = await guardedFetch('https://api.stripe.com/v1/checkout/sessions', { authorization: 'Basic ' + Buffer.from(tok + ':').toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, { method: 'POST', body: bodyForm });
  if (!r.ok) return { ok: false, error: 'Stripe checkout creation failed: ' + (r.error || ('HTTP ' + r.status)) };
  let j; try { j = JSON.parse(r.text); } catch (e) { return { ok: false, error: 'Bad Stripe response' }; }
  audit('economy', 'REAL checkout session created ' + j.id + ' for ' + ldAmount + ' LD (A$' + (cents / 100).toFixed(2) + ')', 'user');
  return { ok: true, sessionId: j.id, url: j.url, ld: ldAmount, aud: (cents / 100).toFixed(2) };
}
async function confirmPayment(sessionId) {
  const tok = decryptToken('stripe');
  if (!tok) return { ok: false, error: 'Stripe credential missing' };
  if (S.economy.credited[sessionId]) return { ok: false, error: 'Session already credited (idempotent)' };
  const r = await guardedFetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId), { authorization: 'Basic ' + Buffer.from(tok + ':').toString('base64') });
  if (!r.ok) return { ok: false, error: 'Stripe lookup failed: ' + (r.error || '') };
  let j; try { j = JSON.parse(r.text); } catch (e) { return { ok: false, error: 'Bad Stripe response' }; }
  if (j.payment_status !== 'paid') return { ok: false, error: 'Not paid yet — status: ' + j.payment_status + ' (no LD credited without provider evidence)' };
  const ld = Number(j.metadata && j.metadata.ld) || 0;
  if (!(ld > 0)) return { ok: false, error: 'Session has no LD metadata' };
  const post = ledgerPost([{ account: 'Owner', delta: ld }, { account: 'LD Issuance', delta: -ld }], 'REAL stripe payment ' + sessionId);
  if (!post.ok) return post;
  S.economy.credited[sessionId] = Date.now(); save();
  audit('economy', 'REAL PAYMENT EVIDENCE: ' + sessionId + ' paid → ' + ld + ' LD credited to Owner', 'system');
  return { ok: true, ld, mode: 'REAL' };
}
function setRealMode(on, confirmed) {
  if (on && !confirmed) { const ap = createApproval('economy.real', 'Enable REAL-money mode (Stripe verified: ' + !!S.economy.stripeAccount + ')'); return { ok: false, needsApproval: ap.id, error: 'Enabling real money is high-impact: approval required (approve ' + ap.id + ') or say “enable real payments confirm”.' }; }
  if (on && !S.economy.stripeAccount) return { ok: false, error: 'Refused: no verified Stripe account. Run “verify stripe” first. Real money without a verified processor would be fake.' };
  S.economy.realMode = !!on;
  audit('economy', 'REAL-MONEY MODE ' + (on ? 'ENABLED by Owner explicit authorization (app does not claim licensing; Owner bears compliance)' : 'DISABLED'), 'user');
  save();
  return { ok: true, realMode: S.economy.realMode };
}

module.exports = {
  get state() { return S; },
  save, audit, nid,
  EMERGENCIES, setEmergency, grant, revoke, permitted,
  createApproval, decideApproval, approved,
  ADAPTERS, TOOLS, runTool, guardedFetch,
  ledgerPost, wager, economySelfTest,
  command, preview, USERFILES,
  setCredential, revokeCredential, listCreds, decryptToken, adaptersLive,
  FORGE_COST, forgePiece, marketList, listItem, delist, buy, seedMarket,
  createPayment, confirmPayment, setRealMode,
  verifyAudit, withCid, tokenValid,
  createOwner, login, logout, sessionValid,
  selftestAll, compliance, freshState
};
