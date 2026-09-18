/* LIAM — AI Control Centre · zero-dependency local server
 * Static hosting + truthful health + arena + full platform API.
 * The server is authoritative: state, permissions, approvals, execution,
 * audit and the ledger live here; the browser is a control surface.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const arena = require('./arena-engine.js');
const P = require('./platform.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5173);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8'
};

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw = (raw + c).slice(0, 1e6); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); } });
  });
}

const RL = new Map();
function rateLimited(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const e = RL.get(ip);
  if (!e || now - e.t > 60000) { RL.set(ip, { t: now, n: 1 }); return false; }
  e.n++;
  return e.n > 120;
}
function cookie(req, name) {
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

const server = http.createServer(async (req, res) => {
  // §57 application security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://js.puter.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://js.puter.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.github.com");
  if (req.method !== 'GET' && rateLimited(req)) {
    return json(res, 429, { ok: false, error: 'Rate limited (120 req/min)' });
  }
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);
  let m;
  // §58 owner session enforcement once an owner exists
  const authed = P.sessionValid(cookie(req, 'liam_session'));
  if (P.state.owner && !authed && req.method !== 'GET' && !p.startsWith('/api/auth')) {
    return json(res, 401, { ok: false, error: 'auth-required' });
  }

  /* ── platform: state & command router ── */
  if (p === '/api/audit' && req.method === 'POST') {
    const b = await body(req);
    P.audit(String(b.type || 'nav'), String(b.detail || '').slice(0, 200), 'user');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/admin/clear' && req.method === 'POST') {
    const b = await body(req);
    if (b.confirm !== 'WIPE') return json(res, 200, { ok: false, error: 'Confirmation word required (WIPE)' });
    P.state.conversations = []; P.state.tasks = []; P.state.projects = []; P.state.agents = [];
    P.state.memory = []; P.state.knowledge = []; P.state.approvals = []; P.state.permissions = {};
    P.state.emergency = 'NORMAL';
    P.audit('data', 'PLATFORM RESET by user with explicit confirmation', 'user');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/state') {
    const s = P.state;
    return json(res, 200, {
      ok: true,
      conversations: s.conversations, tasks: s.tasks, projects: s.projects, agents: s.agents,
      memory: s.memory, knowledge: s.knowledge, audit: s.audit, permissions: s.permissions,
      approvals: s.approvals, emergency: s.emergency, ledger: s.ledger,
      adapters: P.adaptersLive().map(a => ({ id: a.id, name: a.name, state: a.state, caps: a.caps })),
      creds: P.listCreds(), owner: !!P.state.owner, authed, autonomous: P.state.autonomous
    });
  }
  if (p === '/api/command' && req.method === 'POST') {
    const b = await body(req);
    const r = P.withCid(() => P.command(b.text));
    return json(res, 200, await r || { ok: false, unhandled: true });
  }
  if (p === '/api/auth/status') return json(res, 200, { ok: true, owner: !!P.state.owner, authed });
  if (p === '/api/auth/owner' && req.method === 'POST') {
    const b = await body(req);
    return json(res, 200, P.createOwner(b.name, b.password));
  }
  if (p === '/api/auth/login' && req.method === 'POST') {
    const b = await body(req);
    const r = P.login(b.password);
    if (r.ok) { res.setHeader('Set-Cookie', `liam_session=${r.token}; HttpOnly; SameSite=Strict; Path=/`); delete r.token; }
    return json(res, 200, r);
  }
  if (p === '/api/auth/logout' && req.method === 'POST') {
    const r = P.logout(cookie(req, 'liam_session'));
    res.setHeader('Set-Cookie', 'liam_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return json(res, 200, r);
  }
  if (p === '/api/legal') return json(res, 200, { ok: true, docs: P.state.legal });
  if (p === '/api/spec/compliance') return json(res, 200, { ok: true, coverage: P.compliance() });
  if (p === '/api/selftest') return json(res, 200, { ok: true, result: P.selftestAll() });

  /* ── conversations ── */
  if (p === '/api/conversations' && req.method === 'POST') {
    const b = await body(req);
    const c = { id: P.nid('c'), title: (b.title || 'New conversation').slice(0, 60), created: Date.now(), updated: Date.now(), messages: [] };
    P.state.conversations.unshift(c); P.save(); P.audit('chat', 'Conversation created: ' + c.title);
    return json(res, 200, { ok: true, conversation: c });
  }
  if ((m = p.match(/^\/api\/conversations\/([^/]+)\/message$/)) && req.method === 'POST') {
    const c = P.state.conversations.find(x => x.id === m[1]);
    if (!c) return json(res, 404, { ok: false, error: 'Not found' });
    const b = await body(req);
    c.messages.push({ role: b.role || 'local', text: String(b.text || '').slice(0, 4000), ts: Date.now() });
    c.updated = Date.now();
    if (b.role === 'user' && c.messages.filter(x => x.role === 'user').length === 1) c.title = String(b.text).slice(0, 42);
    P.save();
    return json(res, 200, { ok: true, conversation: c });
  }
  if ((m = p.match(/^\/api\/conversations\/([^/]+)$/)) && req.method === 'DELETE') {
    P.state.conversations = P.state.conversations.filter(x => x.id !== m[1]);
    P.save(); P.audit('data', 'Conversation deleted');
    return json(res, 200, { ok: true });
  }

  /* ── tasks / projects / agents / memory / knowledge ── */
  if (p === '/api/tasks' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.text || '').trim()) return json(res, 200, { ok: false, error: 'text required' });
    P.state.tasks.unshift({ id: P.nid('t'), text: String(b.text).slice(0, 140), done: false, created: Date.now() });
    P.save(); P.audit('task', 'Created task: ' + b.text);
    return json(res, 200, { ok: true });
  }
  if ((m = p.match(/^\/api\/tasks\/([^/]+)$/)) && req.method === 'POST') {
    const t = P.state.tasks.find(x => x.id === m[1]); if (!t) return json(res, 404, { ok: false });
    const b = await body(req);
    if (b.action === 'delete') P.state.tasks = P.state.tasks.filter(x => x.id !== t.id);
    else t.done = b.action === 'done';
    P.save(); P.audit('task', (b.action === 'done' ? 'Completed' : b.action === 'reopen' ? 'Reopened' : 'Deleted') + ' task: ' + t.text);
    return json(res, 200, { ok: true });
  }
  if (p === '/api/projects' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.name || '').trim()) return json(res, 200, { ok: false, error: 'name required' });
    P.state.projects.unshift({ id: P.nid('p'), name: String(b.name).slice(0, 80), created: Date.now() });
    P.save(); P.audit('project', 'Created project: ' + b.name);
    return json(res, 200, { ok: true });
  }
  if ((m = p.match(/^\/api\/projects\/([^/]+)$/)) && req.method === 'DELETE') {
    P.state.projects = P.state.projects.filter(x => x.id !== m[1]); P.save();
    return json(res, 200, { ok: true });
  }
  if (p === '/api/agents' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.name || '').trim()) return json(res, 200, { ok: false, error: 'name required' });
    P.state.agents.unshift({ id: P.nid('ag'), name: String(b.name).slice(0, 60), scope: 'local', status: 'active', delegations: 0, created: Date.now() });
    P.save(); P.audit('agent', 'Created agent: ' + b.name);
    return json(res, 200, { ok: true });
  }
  if (p === '/api/memory' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.text || '').trim()) return json(res, 200, { ok: false, error: 'text required' });
    P.state.memory.unshift({ id: P.nid('m'), text: String(b.text).slice(0, 240), ts: Date.now(), source: 'user-statement' });
    P.save(); P.audit('memory', 'Memory recorded');
    return json(res, 200, { ok: true });
  }
  if ((m = p.match(/^\/api\/memory\/([^/]+)$/)) && req.method === 'DELETE') {
    P.state.memory = P.state.memory.filter(x => x.id !== m[1]); P.save();
    return json(res, 200, { ok: true });
  }
  if (p === '/api/knowledge' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.text || '').trim()) return json(res, 200, { ok: false, error: 'text required' });
    P.state.knowledge.unshift({ id: P.nid('k'), title: String(b.text).slice(0, 60), text: String(b.text).slice(0, 500), ts: Date.now(), source: 'user', trusted: false });
    P.save(); P.audit('knowledge', 'Knowledge record added (untrusted)');
    return json(res, 200, { ok: true });
  }

  /* ── security / permissions / approvals ── */
  if (p === '/api/security/emergency' && req.method === 'POST') {
    const b = await body(req);
    return json(res, 200, P.setEmergency(String(b.state || ''), b.confirmed === true));
  }
  if (p === '/api/permissions/grant' && req.method === 'POST') {
    const b = await body(req); P.grant(String(b.cap || ''), 'user-request');
    return json(res, 200, { ok: true, permissions: P.state.permissions });
  }
  if (p === '/api/permissions/revoke' && req.method === 'POST') {
    const b = await body(req); P.revoke(String(b.cap || ''));
    return json(res, 200, { ok: true, permissions: P.state.permissions });
  }
  if ((m = p.match(/^\/api\/approvals\/([^/]+)$/)) && req.method === 'POST') {
    const b = await body(req);
    return json(res, 200, P.decideApproval(m[1], b.decision));
  }

  /* ── tools & economy ── */
  if (p === '/api/tools/run' && req.method === 'POST') {
    const b = await body(req);
    const r = await P.runTool(String(b.tool || ''), b.args || {}, { confirmed: b.confirmed === true });
    return json(res, 200, r);
  }
  if (p === '/api/economy') return json(res, 200, { ok: true, ledger: P.state.ledger, mode: P.state.economy.realMode ? 'REAL' : 'SIMULATION', realMode: P.state.economy.realMode, stripe: P.state.economy.stripeAccount });
  if (p === '/api/forge' && req.method === 'POST') { const b = await body(req); return json(res, 200, P.forgePiece(b.avatarId, b.slot, b.prompt, b.band, b.flavor)); }
  if (p === '/api/capabilities') return json(res, 200, { ok: true, adapters: P.adaptersLive() });
  if (p === '/api/export') return json(res, 200, { ok: true, manifest: P.exportManifest() });
  if (p === '/api/import' && req.method === 'POST') { const b = await body(req); return json(res, 200, P.importManifest(b.manifest, !!b.confirm)); }
  if (p === '/api/market') { P.seedMarket(); return json(res, 200, { ok: true, listings: P.marketList() }); }
  if (p === '/api/market/list' && req.method === 'POST') { const b = await body(req); return json(res, 200, P.listItem(b.avatarId, b.itemId, b.price)); }
  if (p === '/api/market/delist' && req.method === 'POST') { const b = await body(req); return json(res, 200, P.delist(b.listingId)); }
  if (p === '/api/market/buy' && req.method === 'POST') { const b = await body(req); return json(res, 200, P.buy(b.listingId, b.avatarId)); }
  if (p === '/api/economy/selftest') return json(res, 200, { ok: true, result: P.economySelfTest() });

  /* ── arena (unchanged) ── */
  if (p === '/api/races') return json(res, 200, { ok: true, races: arena.RACES });
  if (p === '/api/avatars' && req.method === 'GET') return json(res, 200, { ok: true, avatars: arena.list() });
  if (p === '/api/avatars' && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.createAvatar(b.name, b.raceId)); }
  if (p === '/api/arena/history') return json(res, 200, { ok: true, battles: arena.history() });
  if (p === '/api/arena/opponent') return json(res, 200, arena.makeRival(url.searchParams.get('for')));
  if (p === '/api/arena/battle' && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.battle(b.aId, b.bId, b.seed)); }
  if ((m = p.match(/^\/api\/avatars\/([^/]+)$/))) return json(res, 200, { ok: true, avatar: arena.get(m[1]) });
  if ((m = p.match(/^\/api\/avatars\/([^/]+)\/merge$/)) && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.mergePieces(m[1], b.ids)); }
  if ((m = p.match(/^\/api\/avatars\/([^/]+)\/pets$/)) && req.method === 'POST') { return json(res, 200, arena.createPet(m[1])); }
  if ((m = p.match(/^\/api\/avatars\/([^/]+)\/pets\/merge$/)) && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.mergePets(m[1], b.ids)); }
  if ((m = p.match(/^\/api\/avatars\/([^/]+)\/equip$/)) && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.equip(m[1], b.itemId)); }
  if ((m = p.match(/^\/api\/avatars\/([^/]+)\/unequip$/)) && req.method === 'POST') { const b = await body(req); return json(res, 200, arena.unequip(m[1], b.slot)); }

  if (p === '/api/health') {
    return json(res, 200, { status: 'ok', product: 'LIAM', version: '1.59.0', mode: 'local', time: new Date().toISOString() });
  }

  /* ── static files ── */
  const file = p === '/' ? '/index.html' : p;
  const resolved = path.normalize(path.join(ROOT, file));
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(resolved, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`LIAM control centre listening on http://0.0.0.0:${PORT}`));
