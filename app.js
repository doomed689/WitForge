/* LIAM — AI Control Centre · conversational operating surface.
 * The server is authoritative (state, permissions, approvals, execution,
 * audit, ledger). The user's request grants permission; explicit approval
 * governs high-risk actions; nothing is ever simulated as success.
 */
'use strict';

/* ── Module registry ─────────────────────────────────────────────── */
const STATE = {
  operational: { pill: 'OPERATIONAL', cls: 'operational', eyebrow: 'READY' },
  config:      { pill: 'CONFIGURATION REQUIRED', cls: 'config', eyebrow: 'SETUP REQUIRED' },
  disconnected:{ pill: 'DISCONNECTED', cls: 'disconnected', eyebrow: 'NOT CONNECTED' },
  simulation:  { pill: 'SIMULATION', cls: 'simulation', eyebrow: 'SIMULATION MODE' }
};
function m(id, section, label, icon, state, source, sub, extra) {
  return Object.assign({ id, section, label, icon, state, source, sub, control: 'User controlled' }, extra || {});
}
const MODULES = [
  m('chat', 'CORE', 'Chat', '✦', 'operational', 'Local LIAM store', 'The primary control surface. Request anything — your request is the permission; high-risk actions queue for your approval.'),
  m('conversations', 'CORE', 'Conversations', '▣', 'operational', 'Local LIAM store', 'History, search, archive and project context.'),
  m('projects', 'CORE', 'Projects', '◇', 'operational', 'Local LIAM store', 'Persistent workspaces for goals, tasks and context.'),
  m('research', 'CORE', 'Research', '⌁', 'config', 'Configured provider required', 'Retrieval-backed research with attributable sources only.', {
    facetBlurb: 'Only retrieved, attributable sources should be presented as live research.',
    truthNote: 'This capability is intentionally shown as configuration-required until a real provider, credential and verification flow are connected. Use “fetch <url>” or “weather in <place>” in Chat for real guarded retrievals.'
  }),
  m('tasks', 'CORE', 'Tasks', '✓', 'operational', 'Local LIAM store', 'Create, track and verify work items — by UI or by asking LIAM.'),
  m('automations', 'CORE', 'Automations', '↻', 'operational', 'Built-in scheduler runtime', 'Server-ticked reminders and recurring schedules (15s tick, survives closed chat) — real, audited events.'),
  m('memory', 'CORE', 'Memory', '●', 'operational', 'Local LIAM store', 'Persistent records with provenance. Memory is information — not authority.'),
  m('files', 'CORE', 'Files', '▤', 'operational', 'Sandboxed filesystem', 'Real reads/writes inside the server userfiles sandbox, path-traversal protected, integrity-hashed.'),
  m('knowledge', 'AI', 'Knowledge', '✦', 'operational', 'Local LIAM store', 'Indexed records with provenance; untrusted until verified.'),
  m('agents', 'AI', 'Agents', '▣', 'operational', 'Local LIAM store', 'Explicit identities with bounded scope. Agents cannot elevate themselves.'),
  m('tools', 'AI', 'Tools', '◇', 'operational', 'Capability broker', 'Live adapter registry and the real tool executor: scoped FS, guarded HTTP, weather, allowlisted exec.'),
  m('models', 'AI', 'Models', '⌁', 'config', 'Configured provider required', 'Model discovery requires a live verified provider (Puter bridge or configured server).'),
  m('permissions', 'CONTROL', 'Permissions', '◉', 'operational', 'Local LIAM store', 'Capability grants. Requesting a capability in Chat grants it — audited.'),
  m('approvals', 'CONTROL', 'Approvals', '▣', 'operational', 'Local LIAM store', 'Your decisions on high-risk actions. Approve or stop, by button or by asking.'),
  m('device', 'CONTROL', 'Device', '◇', 'disconnected', 'Device bridge not connected', 'Trusted device capabilities appear once a real bridge is paired.'),
  m('termux', 'CONTROL', 'Termux', '⌁', 'disconnected', 'Termux runtime not detected', 'Termux execution is real only when a Termux runtime is detected.'),
  m('puter', 'CONTROL', 'Puter', '↻', 'config', 'Provider connection required', 'Optional Puter.js bridge: live model discovery and chat. External output stays untrusted.'),
  m('github', 'CONTROL', 'GitHub', '↻', 'config', 'Token / OAuth required', 'Real GitHub REST reads when GITHUB_TOKEN is configured on the server.'),
  m('security', 'SECURITY', 'Security', '◉', 'operational', 'Local LIAM store', 'Emergency states, SSRF shield events, permission and approval posture.'),
  m('audit', 'SECURITY', 'Audit', '≡', 'operational', 'Local LIAM store', 'Trace of what was requested, granted, executed, verified or blocked.'),
  m('profile', 'ACCOUNT', 'Profile', '✦', 'operational', 'Local LIAM store', 'Local identity record. Owner data stays on this device.'),
  m('subscription', 'ACCOUNT', 'Subscription', '▣', 'operational', 'Local LIAM store', 'Local plan record. No payment processing is active.'),
  m('organization', 'ACCOUNT', 'Organization', '◇', 'operational', 'Local LIAM store', 'Organization structure and roles (local record).'),
  m('billing', 'ACCOUNT', 'Billing', '⌁', 'config', 'Compliance-locked', 'Real-money billing stays disabled until legal and compliance review.'),
  m('ldcoins', 'COMMERCE', 'LD Coins', '✦', 'simulation', 'Simulation ledger', 'Balanced double-entry simulation ledger. 100 LD = A$1.00 reference. Self-test included.'),
  m('avatar', 'COMMERCE', 'Avatar Studio', '▣', 'operational', 'Local LIAM store', 'Create an avatar from 100 races of the Diablo & Skyrim lineage. Every avatar starts naked.'),
  m('inventory', 'COMMERCE', 'Inventory', '◇', 'operational', 'Local LIAM store', 'Arena loot inventory with provenance, per avatar.'),
  m('marketplace', 'COMMERCE', 'Marketplace', '⌁', 'simulation', 'Simulation economy', 'Listings and trades run in labelled simulation mode.'),
  m('auctions', 'COMMERCE', 'Auctions', '✓', 'simulation', 'Simulation economy', 'Auction flow with escrow in labelled simulation mode.'),
  m('arena', 'COMMERCE', 'Arena', '⚔', 'operational', 'Local arena engine', 'Server-authoritative PvP brawls. Diablo stats & loot, Skyrim skills. Wagers compliance-locked.'),
  m('notifications', 'SYSTEM', 'Notifications', '✦', 'operational', 'Local LIAM store', 'Local notification centre fed by audit events.'),
  m('documentation', 'SYSTEM', 'Documentation', '▣', 'operational', 'Legal + lineage records', 'Versioned legal documents, architecture lineage and truth rules.'),
  m('status', 'SYSTEM', 'Status', '◇', 'operational', 'Local LIAM store', 'Live runtime truth: adapters, emergency state, ledger mode, connectivity.'),
  m('spec', 'SYSTEM', 'Spec', '◈', 'operational', '168-section registry', 'Live coverage of the definitive WitForge specification with evidence probes.'),
  m('settings', 'SYSTEM', 'Settings', '⌁', 'operational', 'Local LIAM store', 'User-controlled preferences and data controls.')
];
const byId = id => MODULES.find(x => x.id === id);
const SECTIONS = ['CORE', 'AI', 'CONTROL', 'SECURITY', 'ACCOUNT', 'COMMERCE', 'SYSTEM'];
const LIVE = new Set(['chat', 'conversations', 'tasks', 'projects', 'agents', 'memory', 'knowledge', 'files', 'tools', 'permissions', 'approvals', 'security', 'audit', 'ldcoins', 'status', 'settings', 'spec', 'documentation', 'profile', 'puter', 'avatar', 'arena', 'marketplace', 'automations', 'notifications', 'inventory']);

/* ── Helpers ─────────────────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = ts => new Date(ts).toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + fmtTime(ts);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._h); toast._h = setTimeout(() => { t.hidden = true; }, 2800); }
let OFFLINE = false;
function showOfflineBanner() {
  if ($('#offlineBanner')) return;
  const b = document.createElement('div');
  b.id = 'offlineBanner';
  b.innerHTML = '⚠ <b>BACKEND OFFLINE — STATIC PREVIEW.</b> This page is hosted without the LIAM server. For live control run <code>node server.js</code> locally and open <code>http://127.0.0.1:5173</code>. Nothing here is simulated or faked — data panels stay empty until a real backend answers.';
  document.body.appendChild(b);
}
function enterOffline() { if (!OFFLINE) { OFFLINE = true; showOfflineBanner(); refreshStatus(); } }
async function api(path, opts) {
  try {
    const r = await fetch(path, opts);
    if (OFFLINE) { OFFLINE = false; const b = $('#offlineBanner'); if (b) b.remove(); refreshStatus(); }
    if (r.status === 401) { toast('Login required — say “login <password>” in Chat'); return { ok: false, error: 'auth-required' }; }
    return await r.json();
  }
  catch (e) { enterOffline(); return { ok: false, offline: true, error: 'offline' }; }
}
const post = (p, b) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) });

let S = null; // server state snapshot
async function refreshState() { const j = await api('/api/state'); if (j.ok) S = j; return S; }

/* ── Navigation ──────────────────────────────────────────────────── */
let currentView = 'conversations';
function renderNav() {
  $('#nav').innerHTML = SECTIONS.map(sec =>
    `<div class="workspace-label">${sec}</div>` +
    MODULES.filter(x => x.section === sec).map(x =>
      `<button class="nav ${x.id === currentView ? 'active' : ''}" data-view="${x.id}" title="${esc(x.label)}"><i class="navicon">${x.icon}</i><span class="navlabel">${esc(x.label)}</span></button>`).join('')).join('');
}
async function setView(id, opts) {
  const mod = byId(id); if (!mod) return;
  currentView = id;
  document.body.classList.remove('sidebar-open');
  renderNav();
  $('#crumbCurrent').textContent = mod.label;
  if (!S) await refreshState();
  if (LIVE.has(id)) await renderLive(id);
  else renderCapability(mod);
  if (!opts || !opts.silent) post('/api/audit', { type: 'nav', detail: 'Opened ' + mod.label });
  window.scrollTo({ top: 0 });
}

/* audit endpoint convenience */
api; // (noop reference keeps linters calm)

/* ── Capability page (non-live modules) ──────────────────────────── */
const FACETS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'configuration', label: 'Configuration', icon: '✳' },
  { id: 'permissions', label: 'Permissions', icon: '◉' },
  { id: 'activity', label: 'Activity', icon: '◌' },
  { id: 'history', label: 'History', icon: '▤' },
  { id: 'documentation', label: 'Documentation', icon: '?' }
];
function renderCapability(mod) {
  const st = STATE[mod.state];
  const facets = FACETS.map(f => {
    const blurb = mod.facetBlurb || `${f.label} for ${mod.label}, backed by the configured LIAM data model.`;
    return `<button class="module-card" data-facet="${f.id}" data-module="${mod.id}"><span class="module-icon">${f.icon}</span><span class="module-body"><h3>${f.label}</h3><p>${esc(blurb)}</p></span><span class="module-open">Open ↗</span></button>`;
  }).join('');
  const truth = mod.truthNote ? `<div class="truth-card"><b>Truth &amp; safety</b><p>${esc(mod.truthNote)}</p></div>` : '';
  $('#main').innerHTML = `<div class="page-head"><div><p class="eyebrow">${st.eyebrow}</p><h1>${esc(mod.label)}</h1><p class="page-sub">${esc(mod.sub)}</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><p class="stat-label">Capability state</p><span class="pill ${st.cls}">${st.pill}</span></div>
    <div class="stat-card"><p class="stat-label">Data source</p><p class="stat-value">${esc(mod.source)}</p></div>
    <div class="stat-card"><p class="stat-label">Control model</p><p class="stat-value">${esc(mod.control)}</p></div>
  </div><div class="module-list">${facets}</div>${truth}`;
}
function kv(rows) { return rows.map(r => `<div class="kv"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join(''); }
function card(title, inner) { return `<div class="facet-card"><h4>${esc(title)}</h4>${inner}</div>`; }
function openFacet(moduleId, facetId) {
  const mod = byId(moduleId), f = FACETS.find(x => x.id === facetId);
  if (!mod || !f || !S) return;
  $('#facetEyebrow').textContent = mod.section + ' / ' + mod.label.toUpperCase();
  $('#facetTitle').textContent = f.label;
  $('#facetSub').textContent = mod.sub;
  const st = STATE[mod.state];
  let html = '';
  if (facetId === 'overview') html = card('About', `<p>${esc(mod.sub)}</p>`) + card('State', kv([['Capability state', st.pill], ['Data source', mod.source], ['Control model', mod.control], ['Emergency', S.emergency]]));
  else if (facetId === 'configuration') html = card('Configuration', kv([['Data source', mod.source], ['Control model', mod.control], ['Persistence', 'Server data store (data/platform.json)'], ['External telemetry', 'None']]));
  else if (facetId === 'permissions') html = card('Effective permissions', kv([['Local read/write', 'GRANTED — user controlled'], ['External network', 'Granted per-request via Chat or Permissions workspace'], ['High-risk actions', 'Approval-gated'], ['Emergency', S.emergency]]));
  else if (facetId === 'activity') {
    const evts = S.audit.filter(a => (a.detail || '').toLowerCase().includes(mod.label.toLowerCase()) || a.type === mod.id).slice(0, 20);
    html = card('Recent events', evts.length ? evts.map(e => `<div class="row-item"><span class="t">${fmtTime(e.ts)}</span><span class="d">[${esc(e.type)}] ${esc(e.detail)}</span></div>`).join('') : `<p class="empty-note">No activity recorded for ${esc(mod.label)} yet.</p>`);
  } else if (facetId === 'history') {
    const evts = S.audit.slice(0, 10);
    html = card('History', `<p class="empty-note">Historical records live in the Audit workspace; latest ${evts.length} events shown.</p>` + evts.map(e => `<div class="row-item"><span class="t">${fmtDate(e.ts)}</span><span class="d">[${esc(e.type)}] ${esc(e.detail)}</span></div>`).join(''));
  } else html = card(mod.label, `<p>${esc(mod.sub)}</p>`) + card('Truth boundary', `<p>${esc(mod.label)} reports ${st.pill.toLowerCase()} truthfully. External execution requires a real provider, credential and verification flow; provider output never grants authority.</p>`);
  $('#facetBody').innerHTML = html;
  $('#facetOverlay').hidden = false;
}

/* ── Live workspaces ─────────────────────────────────────────────── */
async function renderLive(id) {
  await refreshState();
  ({ chat: renderChat, conversations: renderConversations, tasks: renderTasks, projects: renderProjects, agents: renderAgents, memory: renderMemory, knowledge: renderKnowledge, files: renderFiles, tools: renderTools, permissions: renderPermissions, approvals: renderApprovals, security: renderSecurity, audit: renderAudit, ldcoins: renderLD, status: renderStatus, settings: renderSettings, puter: renderPuter, avatar: renderAvatarStudio, arena: renderArena, spec: renderSpec, documentation: renderDocs, profile: renderProfile, marketplace: renderMarket, automations: renderAutomations, notifications: renderNotifications, inventory: renderInventory })[id]();
}
function head(eyebrow, title, sub, right) {
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${esc(title)}</h1><p class="page-sub">${esc(sub)}</p></div>${right || ''}</div>`;
}
const row = (t, d, btns) => `<div class="row-item"><span class="t">${esc(t)}</span><span class="d">${d}</span>${btns || ''}</div>`;

/* Chat — the primary control surface */
let chatConvoId = null;
function renderChat() {
  let c = S.conversations.find(x => x.id === chatConvoId) || S.conversations[0];
  $('#main').innerHTML = head('COMMAND SURFACE', 'Chat', 'Ask LIAM to do anything in the app. Your request grants permission; high-risk actions queue for your explicit approval.',
    `<div style="display:flex;gap:8px"><button class="mini-btn" id="chatHistoryBtn">History</button><button class="mini-btn" id="chatNewBtn">＋ New</button></div>`) +
  `<div class="chat-card"><div class="chat-head"><div><b>${c ? esc(c.title) : 'New conversation'}</b><span class="subhead">REQUEST = PERMISSION · HIGH-RISK = APPROVAL · EMERGENCY ${esc(S.emergency)}</span></div></div>
   <div class="chat-log" id="chatLog"></div>
   <div class="composer-wrap"><div class="composer"><textarea id="chatInput" placeholder='Try: “create task review audit” · “weather in Perth” · “fetch https://example.com” · “balance” · “open security” · “help”'></textarea><button class="send" id="chatSend" aria-label="Send">↑</button></div>
   <div class="composer-footer"><span>SERVER-AUTHORITATIVE EXECUTION</span><span>PROVIDER OUTPUT STAYS UNTRUSTED</span></div></div></div>`;
  paintLog(c);
  $('#chatSend').onclick = sendChat;
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  $('#chatNewBtn').onclick = async () => { const j = await post('/api/conversations', { title: 'New conversation' }); chatConvoId = j.conversation.id; renderChat(); };
  $('#chatHistoryBtn').onclick = () => setView('conversations');
}
function paintLog(c) {
  const log = $('#chatLog'); if (!log) return;
  log.innerHTML = (c ? c.messages : []).map(msg => `<div class="msg ${msg.role}"><div class="who">${msg.role === 'user' ? 'YOU' : msg.role === 'external' ? 'EXTERNAL · UNTRUSTED' : 'LIAM'}</div><p>${esc(msg.text)}</p></div>`).join('') || '<p class="empty-note">No messages yet. LIAM obeys real commands only.</p>';
  log.scrollTop = log.scrollHeight;
}
async function pushMsg(convoId, role, text) {
  const j = await post(`/api/conversations/${convoId}/message`, { role, text });
  return j.conversation;
}
async function sendChat() {
  const input = $('#chatInput'); const text = input.value.trim(); if (!text) return;
  input.value = '';
  let c = S.conversations.find(x => x.id === chatConvoId) || S.conversations[0];
  if (!c) { const j = await post('/api/conversations', { title: text.slice(0, 42) }); c = j.conversation; }
  chatConvoId = c.id;
  c = await pushMsg(c.id, 'user', text);
  paintLog(c);
  const reply = await routeCommand(text);
  c = await pushMsg(c.id, reply.role || 'local', reply.text);
  paintLog(c);
  if (reply.action) setTimeout(reply.action, 200);
  refreshState();
}
/* Router: UI intents → server platform intents → Puter (opt-in) → honest fallback */
async function routeCommand(text) {
  if (OFFLINE) return { text: 'Backend offline — I cannot act without the LIAM server. This hosted page is a static preview: run “node server.js” in the liam folder locally, then open http://127.0.0.1:5173 for full control. Truth rule intact: I will not pretend to execute anything.' };
  const low = text.toLowerCase().trim();
  let m;
  if ((m = low.match(/^(?:open|go to|show|switch to)\s+(.+)$/))) {
    const t = MODULES.find(x => x.label.toLowerCase() === m[1].trim()) || MODULES.find(x => x.label.toLowerCase().startsWith(m[1].trim()));
    if (t) return { text: 'Opening ' + t.label + '.', action: () => setView(t.id) };
  }
  if (low.includes('new chat')) return { text: 'Started a new conversation.', action: async () => { const j = await post('/api/conversations', { title: 'New conversation' }); chatConvoId = j.conversation.id; renderChat(); } };
  if (low.includes('collapse')) return { text: 'Toggling navigation.', action: toggleCollapse };
  if (low.includes('help') || low.includes('what can you do')) return { text:
`I control every workspace on your request — the request is the permission grant (audited); high-risk actions queue in Approvals.
• UI: “open security”, “new chat”, “collapse”
• Work: “create task X”, “complete task 0”, “create project X”, “create agent X”, “remember X”, “recall X”, “add knowledge X”
• Tools: “list files”, “write file notes.txt …”, “fetch <url>”, “weather in <city>”, “run date”, “github”
• Control: “status”, “capabilities”, “security”, “grant http.get”, “revoke http.get”, “set emergency HIGH”, “lockdown confirm”, “approve <id>”, “stop <id>”
• Economy: “balance”, “wager 100 between A and B”, “economy selftest”
• Arena: “forge avatar <race>”, “fight” (in Arena workspace)
• Accounts & connectors: “create owner account NAME password PASS”, “login PASS”, “logout”, “connect github with token …”, “verify github”, “connections”, “disconnect github”
• Forge & market: “forge wings at legendary: <your imaginative prompt>”, “forge cost”, “market”, “buy <id>”, “sell <itemId> for <n>”, “delist <id>”
• Real payments: “connect stripe with token sk_…”, “verify stripe”, “enable real payments confirm”, “create payment 500 ld”, “confirm payment <id>” · Proton has NO public API — never simulated
• Connectors (live, key-free): “weather <city>”, “convert 100 aud to usd”, “research <topic>”, “dns <domain>”, “hash <text>”, “uuid”, “capabilities”
• v1.61: “news top”, “country Australia”, “remind me in 20 minutes stretch”, “reminders”, “github list”, “github read file README.md”, “github write notes.md | hello” (approval-gated)
• v1.62: “every 2 hours stand up” (recurring), “schedules”, “stop schedule <id>”, “talents”, “unlock talent body for <avatar>”
• Preview & autonomy: “preview fetch <url>”, “autonomous on confirm”, “autonomous off”
• Optional external: “ask puter <question>” (only if the Puter bridge loads; output labelled untrusted)` };
  if ((m = low.match(/^(?:create|make)(?: an?)? owner(?: account)?(?: called| named)? ([a-z0-9_-]+) (?:with )?password (.+)$/))) {
    const r = await post('/api/auth/owner', { name: m[1], password: m[2] });
    return r.ok ? { text: 'Owner account created for ' + r.owner + '. You can now say “login <password>”. The first-run open mode is closed.' } : { role: 'notice', text: r.error || 'Owner creation failed.' };
  }
  if ((m = low.match(/^(?:log ?in|sign in)(?: with| password)? (.+)$/))) {
    const r = await post('/api/auth/login', { password: m[1] });
    return r.ok ? { text: 'Logged in. Session cookie set (HttpOnly, SameSite). Mutations now require this session.' } : { role: 'notice', text: r.error || 'Login failed.' };
  }
  if (low === 'logout' || low === 'log out') { await post('/api/auth/logout', {}); return { text: 'Logged out; session invalidated server-side.' }; }
  const cmd = await post('/api/command', { text });
  if (cmd && cmd.ok && cmd.reply) return { text: cmd.reply };
  if (cmd && cmd.unhandled && low.startsWith('ask puter')) return puterAsk(text.replace(/^ask puter\s*/i, ''));
  if (/^(hi|hello|hey|yo)\b/.test(low)) return { text: 'Hey — LIAM, fully operational on your local server. Every system is live: type “help”.' };
  if (low.includes('who are you') || low.includes('your name')) return { text: 'I am LIAM, the conversational control layer of this platform. I propose and execute; you authorize by asking; the server enforces and audits.' };
  if (low.includes('time') || low.includes('date')) return { text: 'Local device time: ' + new Date().toString() };
  return { role: 'notice', text: 'Not a recognised command and no provider is connected for open questions. Type “help” for the full command surface, or “ask puter …” to opt into the external bridge.' };
}

/* Puter bridge (optional, truthful) */
let puterState = { loaded: false, models: [] };
function loadPuterScript() {
  return new Promise(resolve => {
    if (window.puter) { puterState.loaded = true; return resolve(true); }
    const s = document.createElement('script');
    s.src = 'https://js.puter.com/v2/';
    s.onload = () => { puterState.loaded = !!window.puter; resolve(puterState.loaded); };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
    setTimeout(() => resolve(!!window.puter), 6000);
  });
}
async function puterAsk(q) {
  const ok = await loadPuterScript();
  if (!ok || !window.puter || !window.puter.ai) return { role: 'notice', text: 'Puter.js could not load in this environment — external model access UNAVAILABLE (not faked).' };
  try {
    if (!puterState.models.length && window.puter.ai.listModels) {
      try { puterState.models = (await window.puter.ai.listModels()) || []; } catch (e) { puterState.models = []; }
    }
    const resp = await window.puter.ai.chat(q);
    const txt = typeof resp === 'string' ? resp : (resp && resp.message && resp.message.content) || (resp && resp.text) || JSON.stringify(resp).slice(0, 600);
    return { role: 'external', text: String(txt).slice(0, 1500) };
  } catch (e) {
    return { role: 'notice', text: 'Puter request failed: ' + (e.message || e) + '. External access remains UNAVAILABLE.' };
  }
}
async function renderPuter() {
  $('#main').innerHTML = head('OPTIONAL EXTERNAL BRIDGE', 'Puter', 'Live model discovery and chat only if the browser can load Puter.js. Output is always labelled EXTERNAL · UNTRUSTED and grants no authority.') +
  `<div class="facet-card"><h4>Bridge state</h4><p id="puterStatus">Checking…</p><div class="input-line"><button class="mini-btn" id="puterLoad">Load bridge</button><button class="mini-btn" id="puterModels">List models</button></div></div>
   <div class="facet-card"><h4>Ask (opt-in)</h4><div class="input-line"><input id="puterQ" placeholder="ask puter …"><button class="mini-btn" id="puterSend">Ask</button></div><p class="empty-note" id="puterOut" style="margin-top:10px">No external output this session.</p></div>`;
  const st = $('#puterStatus');
  st.textContent = window.puter ? 'Loaded in this browser.' : 'Not loaded. External model access UNAVAILABLE until loaded.';
  $('#puterLoad').onclick = async () => { const ok = await loadPuterScript(); st.textContent = ok ? 'Loaded. Live discovery available.' : 'Load failed — UNAVAILABLE (truthfully).'; };
  $('#puterModels').onclick = async () => {
    const ok = await loadPuterScript();
    if (!ok || !window.puter || !window.puter.ai) { st.textContent = 'UNAVAILABLE.'; return; }
    try { const ms = await window.puter.ai.listModels(); puterState.models = ms || []; st.textContent = `Models discovered: ${puterState.models.length}` + (puterState.models.length ? ' — ' + puterState.models.slice(0, 8).map(x => x.id || x.name).join(', ') : ''); }
    catch (e) { st.textContent = 'Discovery failed: ' + (e.message || e); }
  };
  $('#puterSend').onclick = async () => { const r = await puterAsk($('#puterQ').value || 'hello'); $('#puterOut').textContent = (r.role === 'external' ? '[EXTERNAL · UNTRUSTED] ' : '[NOTICE] ') + r.text; };
}

/* Conversations */
function renderConversations() {
  $('#main').innerHTML = head('READY', 'Conversations', 'History, search, archive and project context.', '') +
  `<div class="facet-card"><h4>Search</h4><div class="input-line" style="margin-top:0"><input id="convoSearch" placeholder="Filter by title…"></div></div>
   <div class="facet-card"><h4>Conversations (${S.conversations.length})</h4><div id="convoList"></div></div>`;
  const paint = q => {
    const list = S.conversations.filter(c => !q || c.title.toLowerCase().includes(q));
    $('#convoList').innerHTML = list.length ? list.map(c => row(fmtDate(c.updated), `${esc(c.title)} · ${c.messages.length} msg`, `<button class="mini-btn" data-open="${c.id}">Open</button><button class="mini-btn danger" data-del="${c.id}">Delete</button>`)).join('') : '<p class="empty-note">No conversations.</p>';
  };
  paint('');
  $('#convoSearch').oninput = e => paint(e.target.value.toLowerCase());
  $('#convoList').onclick = async e => {
    const o = e.target.closest('[data-open]'); if (o) { chatConvoId = o.dataset.open; setView('chat'); return; }
    const d = e.target.closest('[data-del]'); if (d) { await api(`/api/conversations/${d.dataset.del}`, { method: 'DELETE' }); refreshState().then(() => renderConversations()); }
  };
}
/* Tasks */
function renderTasks() {
  const done = S.tasks.filter(t => t.done).length;
  $('#main').innerHTML = head('OPERATIONS', 'Tasks', 'Create, track and verify work items — by UI or by asking LIAM in Chat.') +
  `<div class="stat-grid"><div class="stat-card"><p class="stat-label">Open / Done</p><p class="stat-value">${S.tasks.length - done} / ${done}</p></div><div class="stat-card"><p class="stat-label">Control</p><p class="stat-value">User controlled</p></div></div>
   <div class="facet-card"><h4>Record a task</h4><div class="input-line" style="margin-top:0"><input id="taskInput" placeholder="e.g. Review audit trail"><button class="mini-btn" id="taskAdd">Add</button></div></div>
   <div class="facet-card"><h4>Tasks</h4>${S.tasks.length ? S.tasks.map((t, i) => row(t.done ? '✓' : '◌', `${esc(t.text)} <small>#${i}</small>`, `<button class="mini-btn" data-t="toggle" data-id="${t.id}">${t.done ? 'Reopen' : 'Done'}</button><button class="mini-btn danger" data-t="del" data-id="${t.id}">Delete</button>`)).join('') : '<p class="empty-note">No tasks yet — or say “create task …” in Chat.</p>'}</div>`;
  $('#taskAdd').onclick = async () => { await post('/api/tasks', { text: $('#taskInput').value }); setView('tasks', { silent: true }); };
  $('#main').onclick = async e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    await post(`/api/tasks/${b.dataset.id}`, { action: b.dataset.t === 'del' ? 'delete' : (S.tasks.find(t => t.id === b.dataset.id).done ? 'reopen' : 'done') });
    setView('tasks', { silent: true });
  };
}
/* Projects / Agents / Memory / Knowledge */
function renderProjects() {
  $('#main').innerHTML = head('WORK MANAGEMENT', 'Projects', 'Persistent workspaces for goals, tasks, agents and audit history.') +
  `<div class="facet-card"><h4>Create</h4><div class="input-line" style="margin-top:0"><input id="projInput" placeholder="Project name"><button class="mini-btn" id="projAdd">Create</button></div></div>
   <div class="facet-card"><h4>Projects (${S.projects.length})</h4>${S.projects.length ? S.projects.map(p => row(fmtDate(p.created), esc(p.name), `<button class="mini-btn danger" data-del="${p.id}">Delete</button>`)).join('') : '<p class="empty-note">No projects — or say “create project …” in Chat.</p>'}</div>`;
  $('#projAdd').onclick = async () => { await post('/api/projects', { name: $('#projInput').value }); setView('projects', { silent: true }); };
  $('#main').onclick = async e => { const d = e.target.closest('[data-del]'); if (d) { await api(`/api/projects/${d.dataset.del}`, { method: 'DELETE' }); setView('projects', { silent: true }); } };
}
function renderAgents() {
  $('#main').innerHTML = head('DELEGATED INTELLIGENCE', 'Agents', 'Explicit identities with bounded scope. Agents cannot elevate, bypass security or forge approval.') +
  `<div class="facet-card"><h4>Register</h4><div class="input-line" style="margin-top:0"><input id="agentInput" placeholder="Agent name"><button class="mini-btn" id="agentAdd">Register</button></div></div>
   <div class="facet-card"><h4>Registry (${S.agents.length})</h4>${S.agents.length ? S.agents.map(a => row(fmtDate(a.created), `${esc(a.name)} · scope ${a.scope} · <span class="pill operational">ACTIVE</span>`, '')).join('') : '<p class="empty-note">No agents — or say “create agent …” in Chat.</p>'}</div>`;
  $('#agentAdd').onclick = async () => { await post('/api/agents', { name: $('#agentInput').value }); setView('agents', { silent: true }); };
}
function renderMemory() {
  $('#main').innerHTML = head('KNOWLEDGE INTEGRITY', 'Memory', 'Persistent records with provenance. Memory is information — not authority.') +
  `<div class="facet-card"><h4>Record</h4><div class="input-line" style="margin-top:0"><input id="memInput" placeholder="Fact or note (stays local)"><button class="mini-btn" id="memAdd">Add</button></div></div>
   <div class="facet-card"><h4>Memory (${S.memory.length})</h4>${S.memory.length ? S.memory.map(r => row(fmtDate(r.ts), esc(r.text), `<button class="mini-btn danger" data-del="${r.id}">Delete</button>`)).join('') : '<p class="empty-note">Empty. “remember …” in Chat also records here.</p>'}</div>`;
  $('#memAdd').onclick = async () => { await post('/api/memory', { text: $('#memInput').value }); setView('memory', { silent: true }); };
  $('#main').onclick = async e => { const d = e.target.closest('[data-del]'); if (d) { await api(`/api/memory/${d.dataset.del}`, { method: 'DELETE' }); setView('memory', { silent: true }); } };
}
function renderKnowledge() {
  $('#main').innerHTML = head('UNTRUSTED UNTIL VERIFIED', 'Knowledge', 'Indexed records with provenance. External or user content never grants authority.') +
  `<div class="facet-card"><h4>Add record</h4><div class="input-line" style="margin-top:0"><input id="knowInput" placeholder="Knowledge statement"><button class="mini-btn" id="knowAdd">Add</button></div></div>
   <div class="facet-card"><h4>Records (${S.knowledge.length})</h4>${S.knowledge.length ? S.knowledge.map(k => row(fmtDate(k.ts), `${esc(k.title)} <small>source:${k.source} trusted:${k.trusted}</small>`, '')).join('') : '<p class="empty-note">Empty. “add knowledge …” in Chat also records here.</p>'}</div>`;
  $('#knowAdd').onclick = async () => { await post('/api/knowledge', { text: $('#knowInput').value }); setView('knowledge', { silent: true }); };
}
/* Files — real sandboxed FS through the tool pipeline */
async function renderFiles() {
  const list = await post('/api/tools/run', { tool: 'fs.list', args: {} });
  $('#main').innerHTML = head('SANDBOXED FILESYSTEM', 'Files', 'Real reads/writes inside the server userfiles sandbox. Path traversal blocked; writes return SHA-256 evidence.') +
  `<div class="facet-card"><h4>Write a file</h4><div class="input-line" style="margin-top:0"><input id="fileName" placeholder="name.txt"><input id="fileContent" placeholder="content…"><button class="mini-btn" id="fileWrite">Write</button></div></div>
   <div class="facet-card"><h4>Sandbox contents</h4>${list.ok ? (list.evidence.files.length ? list.evidence.files.map(f => row(String(f.size) + 'B', esc(f.name), `<button class="mini-btn" data-read="${esc(f.name)}">Read</button>`)).join('') : '<p class="empty-note">Sandbox empty.</p>') : `<p class="empty-note">${esc(list.error || 'unavailable')}</p>`}</div>
   <div class="facet-card"><h4>Read output</h4><pre class="studio-output" id="fileOut" style="white-space:pre-wrap">(none)</pre></div>`;
  $('#fileWrite').onclick = async () => {
    const r = await post('/api/tools/run', { tool: 'fs.write', args: { path: $('#fileName').value, content: $('#fileContent').value } });
    toast(r.ok ? `Wrote ${r.evidence.path} · sha256 ${String(r.evidence.sha256).slice(0, 12)}…` : (r.error || (r.evidence && r.evidence.error)));
    setView('files', { silent: true });
  };
  $('#main').onclick = async e => {
    const b = e.target.closest('[data-read]'); if (!b) return;
    const r = await post('/api/tools/run', { tool: 'fs.read', args: { path: b.dataset.read } });
    $('#fileOut').textContent = r.ok ? r.evidence.text : (r.error || r.evidence.error);
  };
}
/* Tools & adapters */
const TOOL_HINTS = { 'sys.info': '{}', 'fs.list': '{}', 'fs.read': '{"path":"notes.txt"}', 'fs.write': '{"path":"notes.txt","content":"hello"}', 'http.get': '{"url":"https://example.com"}', 'weather.get': '{"location":"Perth"}', 'exec.run': '{"op":"date"}', 'github.status': '{}', 'economy.selftest': '{}' };
async function renderTools() {
  $('#main').innerHTML = head('CAPABILITY BROKER', 'Tools', 'Live adapter registry and the real executor. Discovery grants nothing; your request grants low/medium risk; high risk queues for approval; LOCKDOWN blocks execution.') +
  `<div class="module-list">${S.adapters.map(a => `<div class="module-card" style="cursor:default"><span class="module-icon">${a.state === 'AVAILABLE' ? '◈' : a.state === 'UNAVAILABLE' ? '' : '◌'}</span><span class="module-body"><h3>${esc(a.name)}</h3><p>${a.caps.map(c => `${esc(c.id)} (${c.risk})`).join(' · ')} — <b>${esc(a.state)}</b></p></span></div>`).join('')}</div>
   <div class="facet-card" style="margin-top:16px"><h4>Run a tool</h4>
     <div class="input-line" style="margin-top:0"><select id="toolSel" class="chip">${Object.keys(TOOL_HINTS).map(t => `<option>${t}</option>`).join('')}</select><input id="toolArgs" value="{}"></div>
     <div class="input-line"><button class="mini-btn" id="toolRun">Execute (permission by request)</button></div>
     <pre class="studio-output" id="toolOut" style="white-space:pre-wrap;margin-top:10px">Evidence appears here.</pre></div>`;
  $('#toolSel').onchange = () => { $('#toolArgs').value = TOOL_HINTS[$('#toolSel').value] || '{}'; };
  $('#toolRun').onclick = async () => {
    let args; try { args = JSON.parse($('#toolArgs').value || '{}'); } catch (e) { $('#toolOut').textContent = 'Invalid JSON args'; return; }
    const r = await post('/api/tools/run', { tool: $('#toolSel').value, args });
    if (r.needsApproval) { $('#toolOut').textContent = 'QUEUED FOR APPROVAL: ' + r.error + '\nSay “approve ' + r.needsApproval + '” in Chat or use the Approvals workspace.'; }
    else $('#toolOut').textContent = JSON.stringify(r.evidence || r, null, 2).slice(0, 3000);
  };
}
/* Permissions */
function renderPermissions() {
  const caps = S.adapters.flatMap(a => a.caps.map(c => Object.assign({}, c, { adapter: a.id })));
  $('#main').innerHTML = head('AUTHORITY BOUNDARY', 'Permissions', 'Requesting a capability grants it (audited). Revocation is immediate. High-risk capabilities always require approval.') +
  `<div class="facet-card"><h4>Capability grants</h4>${caps.map(c => row(c.risk, `${esc(c.id)} — ${esc(c.desc)} <small>${S.permissions[c.id] ? 'GRANTED via ' + S.permissions[c.id].grantedBy : 'not granted'}</small>`, `<button class="mini-btn" data-g="${c.id}">Grant</button><button class="mini-btn danger" data-r="${c.id}">Revoke</button>`)).join('')}</div>`;
  $('#main').onclick = async e => {
    const g = e.target.closest('[data-g]'); if (g) { await post('/api/permissions/grant', { cap: g.dataset.g }); setView('permissions', { silent: true }); return; }
    const r = e.target.closest('[data-r]'); if (r) { await post('/api/permissions/revoke', { cap: r.dataset.r }); setView('permissions', { silent: true }); }
  };
}
/* Approvals */
function renderApprovals() {
  const pend = S.approvals.filter(a => a.status === 'pending');
  $('#main').innerHTML = head('HUMAN DECISIONS', 'Approvals', 'High-risk actions wait here until you approve or stop them — by button or by asking in Chat.') +
  `<div class="facet-card"><h4>Pending (${pend.length})</h4>${pend.length ? pend.map(a => row(fmtTime(a.ts), `${esc(a.desc)} <small>${a.id}</small>`, `<button class="mini-btn" data-d="approve" data-id="${a.id}">Approve</button><button class="mini-btn danger" data-d="stop" data-id="${a.id}">Stop</button>`)).join('') : '<p class="empty-note">Nothing pending.</p>'}</div>
   <div class="facet-card"><h4>Decided</h4>${S.approvals.filter(a => a.status !== 'pending').slice(0, 12).map(a => row(fmtTime(a.ts), `${esc(a.desc)} → <b>${a.status.toUpperCase()}</b>`)).join('') || '<p class="empty-note">None yet.</p>'}</div>`;
  $('#main').onclick = async e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    await post(`/api/approvals/${b.dataset.id}`, { decision: b.dataset.d });
    setView('approvals', { silent: true });
  };
}
/* Security */
function renderSecurity() {
  const evts = S.audit.filter(a => a.type === 'security' || a.type === 'permission' || a.type === 'approval').slice(0, 20);
  $('#main').innerHTML = head('SECURITY SHIELD', 'Security', 'AI proposes. Policy, permission, risk and the approval gate decide what may execute.', `<span class="pill ${S.emergency === 'NORMAL' ? 'operational' : S.emergency === 'LOCKDOWN' ? 'disconnected' : 'config'}">${esc(S.emergency)}</span>`) +
  `<div class="facet-card"><h4>Emergency controls</h4><div class="input-line" style="margin-top:0">
     ${['NORMAL', 'ELEVATED', 'HIGH'].map(s => `<button class="mini-btn" data-em="${s}">${s}</button>`).join('')}
     <button class="mini-btn danger" data-em="LOCKDOWN">LOCKDOWN (approval-gated)</button></div>
   <p class="empty-note">Lockdown blocks execution; audit and recovery preserved. “lockdown confirm” in Chat engages immediately with your explicit confirmation.</p></div>
   <div class="facet-card"><h4>Security / permission / approval events</h4>${evts.length ? evts.map(e => row(fmtTime(e.ts), `[${esc(e.type)}] ${esc(e.detail)}`)).join('') : '<p class="empty-note">No events yet.</p>'}</div>`;
  $('#main').onclick = async e => {
    const b = e.target.closest('[data-em]'); if (!b) return;
    const r = await post('/api/security/emergency', { state: b.dataset.em });
    if (r.needsApproval) toast('Approval queued: ' + r.needsApproval + ' — approve it in Approvals or Chat.');
    else toast('Emergency state: ' + (r.state || r.error));
    setView('security', { silent: true });
  };
}
/* Audit */
function renderAudit() {
  let filter = 'all';
  const paint = () => {
    const list = S.audit.filter(a => filter === 'all' || a.type === filter || (filter === 'task' && ['task', 'tool', 'command'].includes(a.type))).slice(0, 80);
    $('#auditBody').innerHTML = list.length ? list.map(e => row(fmtDate(e.ts), `[${esc(e.type)}] ${esc(e.detail)} <small>${esc(e.actor)}</small>`)).join('') : '<p class="empty-note">Empty.</p>';
  };
  $('#main').innerHTML = head('EVIDENCE', 'Audit', 'What was requested, granted, executed, verified or blocked.', '') +
  `<div class="chip-row">${['all', 'security', 'permission', 'approval', 'tool', 'task', 'chat', 'nav'].map(f => `<button class="chip ${f === filter ? 'on' : ''}" data-f="${f}">${f}</button>`).join('')}</div>
   <div class="facet-card"><h4>Timeline</h4><div id="auditBody"></div></div>`;
  paint();
  $('#main').onclick = e => { const c = e.target.closest('[data-f]'); if (!c) return; filter = c.dataset.f; [...document.querySelectorAll('.chip')].forEach(x => x.classList.toggle('on', x === c)); paint(); };
}
/* LD Coins */
async function renderLD() {
  const eco = await api('/api/economy');
  $('#main').innerHTML = head('SIMULATION ECONOMY', 'LD Coins', 'Balanced double-entry ledger. Real-money functions stay compliance-locked until legal review.', '<span class="pill simulation">SIMULATION</span>') +
  `<div class="stat-grid">${Object.entries(eco.ledger.accounts).map(([k, v]) => `<div class="stat-card"><p class="stat-label">${esc(k)}</p><p class="stat-value">${v} LD</p></div>`).join('')}</div>
   <div class="facet-card"><h4>Controls</h4><div class="input-line" style="margin-top:0"><button class="mini-btn" id="ecoTest">Run economic self-test</button></div><p class="empty-note">Checks 100+100=200 pool, 198+2 settlement, sum invariant, negative-balance and unbalanced-entry rejection.</p></div>
   <div class="facet-card"><h4>Real-money receiving (Stripe)</h4>
     <p class="empty-note">Stripe: <b>${eco.stripe ? 'VERIFIED (' + esc(eco.stripe.id) + ')' : 'not verified'}</b> · Mode: <b>${eco.realMode ? 'REAL' : 'SIMULATION'}</b>. Proton: NO PUBLIC API (never simulated).</p>
     <div class="input-line"><button class="mini-btn" id="stVerify">verify stripe</button><button class="mini-btn" id="stEnable">enable real payments (confirm)</button><button class="mini-btn danger" id="stDisable">disable real payments</button></div>
     <p class="empty-note">In Chat: “connect stripe with token sk_…”, “verify stripe”, “enable real payments confirm”, “create payment 500 ld”, “confirm payment <id>”. LD is credited only on Stripe paid-status evidence.</p></div>
   <div class="facet-card"><h4>Transactions</h4>${eco.ledger.tx.slice(0, 14).map(t => row(fmtTime(t.ts), `${esc(t.memo)} · ${t.entries.map(e => `${esc(e.account)} ${e.delta > 0 ? '+' : ''}${e.delta}`).join(', ')}`)).join('') || '<p class="empty-note">No transactions.</p>'}</div>`;
  $('#stVerify').onclick = async () => { const r = await post('/api/tools/run', { tool: 'stripe.verify', args: {} }); toast(r.ok ? 'Stripe verified: ' + r.evidence.stripeAccount : ((r.evidence && r.evidence.error) || r.error || 'failed')); renderLD(); };
  $('#stEnable').onclick = async () => { const r = await post('/api/command', { text: 'enable real payments confirm' }); toast(r.reply || r.error); renderLD(); };
  $('#stDisable').onclick = async () => { const r = await post('/api/command', { text: 'disable real payments' }); toast(r.reply || r.error); renderLD(); };
  $('#ecoTest').onclick = async () => {
    const r = await api('/api/economy/selftest');
    toast(r.ok ? 'Self-test: ' + r.result.checks.map(c => (c.pass ? '✓' : '✗') + ' ' + c.check).join(' · ') : 'failed');
    renderLD();
  };
}
/* Status */
function renderStatus() {
  const av = S.adapters.filter(a => a.state === 'AVAILABLE').length;
  const un = S.adapters.filter(a => a.state === 'UNAVAILABLE').length;
  $('#main').innerHTML = head('LIVE TRUTH', 'Status', 'Runtime facts only — no adapter is connected merely because it exists.') +
  `<div class="stat-grid">
    <div class="stat-card"><p class="stat-label">Emergency state</p><p class="stat-value">${esc(S.emergency)}</p></div>
    <div class="stat-card"><p class="stat-label">Adapters</p><p class="stat-value">${av} available · ${un} unavailable</p></div>
    <div class="stat-card"><p class="stat-label">Permissions granted</p><p class="stat-value">${Object.keys(S.permissions).length}</p></div>
    <div class="stat-card"><p class="stat-label">Pending approvals</p><p class="stat-value">${S.approvals.filter(a => a.status === 'pending').length}</p></div>
    <div class="stat-card"><p class="stat-label">Conversations / Tasks</p><p class="stat-value">${S.conversations.length} / ${S.tasks.length}</p></div>
    <div class="stat-card"><p class="stat-label">Audit events</p><p class="stat-value">${S.audit.length}</p></div>
  </div>
  <div class="facet-card"><h4>Adapter truth table</h4>${S.adapters.map(a => row(a.id, `${esc(a.name)} → <b>${esc(a.state)}</b>`)).join('')}</div>
   <div class="facet-card"><h4>Diagnostics</h4><div class="input-line" style="margin-top:0"><button class="mini-btn" id="stRun">Run full self-test</button></div><div id="stOut" class="empty-note" style="margin-top:8px">Aggregates economy, audit-chain, SSRF, token and allowlist probes.</div></div>`;
  $('#stRun').onclick = async () => {
    const r = await api('/api/selftest');
    $('#stOut').innerHTML = r.ok ? r.result.checks.map(c => row(c.pass ? '✓' : '✗', esc(c.check))).join('') : 'selftest unavailable';
  };
}
/* Settings */
function renderSettings() {
  $('#main').innerHTML = head('USER CONTROLLED', 'Settings', 'Preferences and data controls. Destructive actions require your explicit confirmation word.') +
  `<div class="facet-card"><h4>Data</h4><div class="input-line" style="margin-top:0"><button class="mini-btn" id="setExport">Export all platform data</button></div>
   <div class="input-line"><input id="wipeWord" placeholder="type WIPE to enable"><button class="mini-btn danger" id="setWipe" disabled>Reset platform (high-risk)</button></div></div>
   <div class="facet-card"><h4>Navigation</h4><div class="input-line" style="margin-top:0"><button class="mini-btn" id="setCollapse">Toggle collapsed sidebar (Ctrl+B)</button></div></div>`;
  $('#setExport').onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'liam-platform-export.json'; a.click();
  };
  $('#wipeWord').oninput = e => { $('#setWipe').disabled = e.target.value !== 'WIPE'; };
  $('#setWipe').onclick = async () => { await post('/api/admin/clear', { confirm: 'WIPE' }); location.reload(); };
  $('#setCollapse').onclick = toggleCollapse;
}



/* ── Marketplace ─────────────────────────────────────────────────── */
async function renderMarket() {
  const j = await api('/api/market');
  const avs = await api('/api/avatars');
  const avatars = avs.ok ? avs.avatars : [];
  const eco = await api('/api/economy');
  $('#main').innerHTML = head('SIMULATION MARKETPLACE', 'Marketplace', 'Fixed-price listings with LD escrow. Real-money settlement stays compliance-locked; LD mode: ' + (eco.mode || 'SIMULATION') + '.', '<span class="pill simulation">' + esc(eco.mode || 'SIMULATION') + '</span>') +
  `<div class="facet-card"><h4>Listings (${(j.listings || []).length})</h4>${(j.listings || []).map(l => row(l.price + ' LD', `<span style="color:${l.item.color}">${esc(l.item.name)}</span> <small>${l.item.rarity} R${l.item.rlevel} ${l.item.slot} · ${esc(l.seller)}</small>`, l.seller === 'Vendor' ? (avatars.length ? `<button class="mini-btn" data-buy="${l.id}">Buy</button>` : '') : `<button class="mini-btn danger" data-delist="${l.id}">Delist</button>`)).join('') || '<p class="empty-note">Empty.</p>'}</div>
  <div class="facet-card"><h4>List one of your items</h4>${avatars.length ? `<div class="input-line" style="margin-top:0"><select id="mkItem" class="chip">${avatars[0].inventory.map(i => `<option value="${i.id}">${esc(i.name)} (${i.rarity})</option>`).join('')}</select><input id="mkPrice" placeholder="price LD" style="max-width:110px"><button class="mini-btn" data-list="1">List</button></div>` : '<p class="empty-note">Forge an avatar first.</p>'}</div>`;
  $('#main').onclick = async e => {
    const b = e.target.closest('[data-buy]');
    if (b) { const r = await post('/api/market/buy', { listingId: b.dataset.buy, avatarId: avatars[0].id }); toast(r.ok ? 'Bought ' + r.item.name : (r.error || 'failed')); renderMarket(); return; }
    const d = e.target.closest('[data-delist]');
    if (d) { const r = await post('/api/market/delist', { listingId: d.dataset.delist }); toast(r.ok ? 'Delisted' : (r.error || 'failed')); renderMarket(); return; }
    const l = e.target.closest('[data-list]');
    if (l) { const r = await post('/api/market/list', { avatarId: avatars[0].id, itemId: $('#mkItem').value, price: $('#mkPrice').value }); toast(r.ok ? 'Listed for ' + r.listing.price + ' LD' : (r.error || 'failed')); renderMarket(); }
  };
}
/* ── Spec Coverage / Documentation / Profile ─────────────────────── */
async function renderSpec() {
  const j = await api('/api/spec/compliance');
  if (!j.ok) { $('#main').innerHTML = head('SPEC', 'Spec', 'Compliance registry unavailable.'); return; }
  const c = j.coverage;
  const counts = c.counts;
  $('#main').innerHTML = head('DEFINITIVE ARCHITECTURE', 'Specification Coverage', 'All 168 sections of the WitForge master specification with truthful status and live evidence probes.', '<span class="pill operational">' + c.total + ' SECTIONS</span>') +
  `<div class="stat-grid">
    <div class="stat-card"><p class="stat-label">LIVE</p><p class="stat-value">${counts.LIVE || 0}</p></div>
    <div class="stat-card"><p class="stat-label">PARTIAL</p><p class="stat-value">${counts.PARTIAL || 0}</p></div>
    <div class="stat-card"><p class="stat-label">EXTERNAL</p><p class="stat-value">${counts.EXTERNAL || 0}</p></div>
    <div class="stat-card"><p class="stat-label">LOCKED / POLICY</p><p class="stat-value">${(counts.LOCKED || 0) + (counts.POLICY || 0)}</p></div>
  </div>
  <div class="facet-card"><h4>Live probes</h4>
    ${row('audit', `tamper-evident chain → <b>${c.probes.auditChain.ok ? 'VERIFIED' : 'BROKEN'}</b> (${c.probes.auditChain.entries} entries)`)}
    ${row('assets', `rarity scale → <b>${c.probes.rarityLevels} levels</b>`)}
    ${row('legal', `versioned legal records → <b>${c.probes.legalDocs}</b>`)}
    ${row('auth', `owner auth → <b>${c.probes.ownerAuth ? 'ACTIVE' : 'first-run open'}</b> · evidence vault → <b>${c.probes.evidenceRecords}</b>`)}
    ${c.probes.adapters.map(a => row(a.id, esc(a.state))).join('')}
  </div>
  <div class="chip-row" id="specFilter">${['ALL', 'LIVE', 'PARTIAL', 'EXTERNAL', 'LOCKED', 'POLICY'].map((f, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-sf="${f}">${f}</button>`).join('')}</div>
  <div class="facet-card"><h4>Sections</h4><div id="specList"></div></div>`;
  const paint = f => {
    const list = c.sections.filter(x => f === 'ALL' || x.status === f);
    $('#specList').innerHTML = list.map(x => row(String(x.n).padStart(3, '0'), `<b>${esc(x.t)}</b> <small>[${esc(x.area)}]</small> — ${esc(x.note)}`, `<span class="pill ${x.status === 'LIVE' ? 'operational' : x.status === 'EXTERNAL' ? 'disconnected' : x.status === 'LOCKED' ? 'config' : x.status === 'PARTIAL' ? 'simulation' : 'operational'}" style="${x.status === 'POLICY' ? 'opacity:.7' : ''}">${x.status}</span>`)).join('');
  };
  paint('ALL');
  $('#specFilter').onclick = e => { const b = e.target.closest('[data-sf]'); if (!b) return; [...$('#specFilter').children].forEach(x => x.classList.toggle('on', x === b)); paint(b.dataset.sf); };
}
async function renderDocs() {
  const j = await api('/api/legal');
  const docs = j.ok ? j.docs : [];
  $('#main').innerHTML = head('GOVERNANCE', 'Documentation', 'Versioned legal records with effective dates, architecture lineage and the absolute truth rules. Records are not legal advice.') +
  `<div class="facet-card"><h4>Legal documents (${docs.length})</h4>${docs.map(d => row(d.effective, `<b>${esc(d.title)}</b> v${esc(d.version)} — ${esc(d.summary)} <small>${esc(d.status)}</small>`)).join('')}</div>
   <div class="facet-card"><h4>Architecture lineage</h4><p>LIAM v16–v20 → WitForge v1.0–v1.54 → IcyT master spec → this build (v1.59). Historical defects are lessons, not features.</p></div>
   <div class="facet-card"><h4>Absolute rules</h4><p>§162 Security never bypassable · §163 Ledger authoritative · §164 Engine authoritative over assets · §165 Unavailable is reported as unavailable · §143 No universal security bypass.</p></div>`;
}
async function renderProfile() {
  const st = await api('/api/auth/status');
  $('#main').innerHTML = head('ACCOUNT', 'Profile', 'Owner account with scrypt hashing and HttpOnly sessions. Owner data is protected; no PII is required or stored.') +
  (!st.owner ? `
   <div class="facet-card"><h4>First-run Owner creation</h4>
     <div class="input-line" style="margin-top:0"><input id="ownerName" placeholder="Owner name"><input id="ownerPass" type="password" placeholder="Password (8+ chars)"><button class="mini-btn" id="ownerCreate">Create Owner</button></div>
     <p class="empty-note">The first account becomes Owner server-side. Until created, local development mode allows mutations without login.</p></div>`
  : !st.authed ? `
   <div class="facet-card"><h4>Owner login</h4>
     <div class="input-line" style="margin-top:0"><input id="loginPass" type="password" placeholder="Password"><button class="mini-btn" id="ownerLogin">Log in</button></div>
     <p class="empty-note">Sessions use HttpOnly SameSite cookies. Failures are throttled and audited.</p></div>`
  : `
   <div class="facet-card"><h4>Session</h4>${row('owner', 'Authenticated session active.')}${row('role', 'OWNER — highest application-level administrative role.')}<div class="input-line"><button class="mini-btn" id="ownerLogout">Log out</button></div></div>`) +
  `<div class="facet-card"><h4>Plain-language account control</h4><p>In Chat: “create owner account NAME password PASS” · “login PASS” · “logout” · “connect github with token …” · “connections” · “disconnect github”. Everything is also available here by button.</p></div>`;
  if ($('#ownerCreate')) $('#ownerCreate').onclick = async () => {
    const r = await post('/api/auth/owner', { name: $('#ownerName').value, password: $('#ownerPass').value });
    toast(r.ok ? 'Owner created: ' + r.owner : (r.error || 'failed'));
    renderProfile();
  };
  if ($('#ownerLogin')) $('#ownerLogin').onclick = async () => {
    const r = await post('/api/auth/login', { password: $('#loginPass').value });
    toast(r.ok ? 'Logged in.' : (r.error || 'failed'));
    renderProfile();
  };
  if ($('#ownerLogout')) $('#ownerLogout').onclick = async () => { await post('/api/auth/logout', {}); renderProfile(); };
}
async function renderStatusExtra() {} // placeholder
/* ── Avatar Studio + Arena (Diablo & Skyrim lineage) ─────────────── */
let RACES = null, studioRace = null, studioSelAvatar = null;
let arenaChampion = null, arenaRival = null, arenaBusy = false;
async function loadRaces() { if (!RACES) { const j = await api('/api/races'); if (j.ok) RACES = j.races; } return RACES || []; }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = x => Math.max(0, Math.min(255, x + amt));
  return '#' + [c(n >> 16), c(n >> 8 & 255), c(n & 255)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function avatarSVG(r, size) {
  size = size || 120;
  const L = r.look || {}, skin = r.skin, dark = shade(skin, -34), lite = shade(skin, 22);
  const eye = L.blind ? '#666' : (L.eyes || '#20202a');
  let p = '';
  if (L.glow) p += `<circle cx="60" cy="82" r="50" fill="${L.glow}" opacity="0.12"/><circle cx="60" cy="82" r="34" fill="${L.glow}" opacity="0.10"/>`;
  if (L.wings) p += `<path d="M40 70 Q14 52 20 24 Q40 42 46 62 Z" fill="${dark}" opacity=".9"/><path d="M80 70 Q106 52 100 24 Q80 42 74 62 Z" fill="${dark}" opacity=".9"/>`;
  if (L.tail) p += `<path d="M62 116 Q92 122 88 146" stroke="${dark}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  p += `<rect x="46" y="104" width="11" height="40" rx="5" fill="${dark}"/><rect x="63" y="104" width="11" height="40" rx="5" fill="${dark}"/>`;
  p += `<rect x="30" y="66" width="9" height="38" rx="4.5" fill="${dark}" transform="rotate(8 34 66)"/><rect x="81" y="66" width="9" height="38" rx="4.5" fill="${dark}" transform="rotate(-8 86 66)"/>`;
  p += `<path d="M42 64 Q60 56 78 64 L74 106 Q60 113 46 106 Z" fill="${skin}"/>`;
  p += `<circle cx="60" cy="42" r="17" fill="${lite}"/>`;
  if (L.ears === 'point') p += `<path d="M43 40 L33 34 L44 30 Z" fill="${lite}"/><path d="M77 40 L87 34 L76 30 Z" fill="${lite}"/>`;
  if (L.ears === 'cat') p += `<path d="M46 30 L42 16 L54 26 Z" fill="${skin}"/><path d="M74 30 L78 16 L66 26 Z" fill="${skin}"/>`;
  if (L.ears === 'round') p += `<circle cx="44" cy="34" r="5" fill="${lite}"/><circle cx="76" cy="34" r="5" fill="${lite}"/>`;
  if (L.ears === 'frill') p += `<path d="M44 34 Q32 30 36 44 Q42 44 45 40 Z" fill="${dark}"/><path d="M76 34 Q88 30 84 44 Q78 44 75 40 Z" fill="${dark}"/>`;
  if (L.horns === 'short') p += `<path d="M48 28 L45 18 L52 24 Z" fill="${dark}"/><path d="M72 28 L75 18 L68 24 Z" fill="${dark}"/>`;
  if (L.horns === 'ram') p += `<path d="M46 32 Q34 30 36 44 Q40 50 46 46" stroke="${dark}" stroke-width="5" fill="none"/><path d="M74 32 Q86 30 84 44 Q80 50 74 46" stroke="${dark}" stroke-width="5" fill="none"/>`;
  if (L.horns === 'goat') p += `<path d="M48 28 Q40 20 42 12" stroke="${dark}" stroke-width="5" fill="none"/><path d="M72 28 Q80 20 78 12" stroke="${dark}" stroke-width="5" fill="none"/>`;
  if (L.horns === 'antler') p += `<path d="M48 28 L44 14 M46 20 L40 16 M72 28 L76 14 M74 20 L80 16" stroke="${dark}" stroke-width="4" fill="none"/>`;
  if (L.horns === 'dragon') p += `<path d="M46 30 L40 16 L50 24 L54 12 L60 22 L66 12 L70 24 L80 16 L74 30 Z" fill="${dark}"/>`;
  if (L.horns === 'tiger') p += `<circle cx="46" cy="27" r="5" fill="${skin}"/><circle cx="74" cy="27" r="5" fill="${skin}"/><path d="M52 34 h16" stroke="${dark}" stroke-width="2"/>`;
  if (L.horns === 'crab') p += `<path d="M46 30 Q36 24 40 14 Q48 18 50 26 Z" fill="${dark}"/><path d="M74 30 Q84 24 80 14 Q72 18 70 26 Z" fill="${dark}"/>`;
  if (L.tusks) p += `<path d="M52 52 L50 58 L55 54 Z" fill="#f5f2e8"/><path d="M68 52 L70 58 L65 54 Z" fill="#f5f2e8"/>`;
  if (L.fangs) p += `<path d="M54 52 L53 56 L56 53 Z" fill="#fff"/><path d="M66 52 L67 56 L64 53 Z" fill="#fff"/>`;
  if (L.beard) p += `<path d="M50 52 Q60 64 70 52 L70 58 Q60 68 50 58 Z" fill="${dark}"/>`;
  p += `<circle cx="53" cy="40" r="2.4" fill="${eye}"/><circle cx="67" cy="40" r="2.4" fill="${eye}"/>`;
  return `<svg class="avatar-svg" width="${size}" height="${size * 1.33}" viewBox="0 0 120 160" aria-label="${esc(r.name)}">${p}</svg>`;
}
function statBar(label, v) {
  return `<div class="statbar"><span>${label}</span><div class="bar"><i style="width:${Math.min(100, v / 15 * 100)}%"></i></div><b>${v}</b></div>`;
}
/* ── v1.63: Automations (scheduler runtime), Notifications, Inventory ── */
function renderAutomations() {
  const rems = (S.reminders || []).filter(r => !r.done).sort((a, b) => a.dueTs - b.dueTs);
  const schs = (S.schedules || []).filter(r => !r.done);
  const span = r => r.everyMs >= 86400000 ? Math.round(r.everyMs / 86400000) + ' d' : r.everyMs >= 3600000 ? Math.round(r.everyMs / 3600000) + ' h' : r.everyMs >= 60000 ? Math.round(r.everyMs / 60000) + ' min' : Math.round(r.everyMs / 1000) + ' s';
  $('#main').innerHTML = head('SCHEDULER RUNTIME', 'Automations', 'Server-ticked reminders and recurring schedules — fires every 15s even with the chat closed. All events are real and audited.',
    `<span class="pill operational">RUNTIME LIVE</span>`) +
  `<div class="stat-grid">
    <div class="stat-card"><p class="stat-label">Recurring schedules</p><p class="stat-value">${schs.length}</p></div>
    <div class="stat-card"><p class="stat-label">Pending reminders</p><p class="stat-value">${rems.length}</p></div>
    <div class="stat-card"><p class="stat-label">Total fires</p><p class="stat-value">${(S.schedules || []).reduce((a, r) => a + r.fired, 0) + (S.reminders || []).filter(r => r.done).length}</p></div>
  </div>
  <div class="facet-card"><h4>Arm in plain language</h4>
    <div class="input-line"><input id="autoIn" placeholder="remind me in 20 minutes stretch  ·  every 2 hours stand up"><button class="mini-btn" id="autoAdd">Arm</button></div>
    <p class="empty-note">Same sentence works in Chat — the scheduler is a real server runtime, not a simulation.</p></div>
  <div class="facet-card"><h4>Active schedules (${schs.length})</h4>
    ${schs.length ? schs.map(r => `<div class="row-item"><span class="t">${esc(r.id)}</span><span class="d" title="next ${new Date(r.nextTs).toLocaleString()}">${esc(r.text)} <small class="muted">— every ${span(r)} · fired ${r.fired}× · next ${new Date(r.nextTs).toLocaleTimeString()}</small></span><button class="mini-btn danger" data-stop-sch="${r.id}">stop</button></div>`).join('') : '<p class="empty-note">No recurring schedules.</p>'}
  </div>
  <div class="facet-card"><h4>Pending reminders (${rems.length})</h4>
    ${rems.length ? rems.map(r => `<div class="row-item"><span class="t">${esc(r.id)}</span><span class="d">${esc(r.text)} <small class="muted">— ${new Date(r.dueTs).toLocaleString()}</small></span></div>`).join('') : '<p class="empty-note">No pending reminders.</p>'}
    ${rems.length ? '<div class="input-line"><button class="mini-btn danger" id="autoClearRem">Clear all reminders</button></div>' : ''}
  </div>`;
  $('#autoAdd').onclick = async () => {
    const t = $('#autoIn').value.trim(); if (!t) return;
    const j = await post('/api/command', { text: t });
    toast((j.reply || j.error || '').split('\n')[0].slice(0, 100));
    await refreshState(); renderAutomations();
  };
  $('#main').onclick = async e => {
    const sb = e.target.closest('[data-stop-sch]');
    if (sb) { await post('/api/command', { text: 'stop schedule ' + sb.dataset.stopSch }); toast('Schedule ' + sb.dataset.stopSch + ' stopped'); await refreshState(); renderAutomations(); return; }
    if (e.target.closest('#autoClearRem')) { await post('/api/command', { text: 'clear reminders' }); await refreshState(); renderAutomations(); }
  };
}
function renderNotifications() {
  const items = S.notifications || [];
  $('#main').innerHTML = head('EVENT FEED', 'Notifications', 'Real events from reminders, schedules and system ticks — newest first.',
    `<span class="pill ${items.length ? 'config' : 'operational'}">${items.length} EVENTS</span>`) +
  `<div class="facet-card"><h4>Feed</h4>
    ${items.length ? items.map(n => `<div class="row-item"><span class="t">${new Date(n.ts).toLocaleTimeString()}</span><span class="d"><b class="pill ${n.kind === 'schedule' ? 'simulation' : 'config'}" style="margin-right:8px">${esc(n.kind || 'event')}</b>${esc(n.text || '')}</span></div>`).join('') : '<p class="empty-note">Nothing yet — arm a reminder or schedule to see events here.</p>'}
  </div>
  <div class="truth-card"><b>TRUTH BOUNDARY</b><p>Notifications are generated by the local server scheduler only. No push service, SMS or email is connected — external delivery would be labelled CONFIGURATION REQUIRED.</p></div>`;
}
async function renderInventory() {
  const av = (S.avatars || [])[0];
  if (!av) {
    $('#main').innerHTML = head('LOOT VAULT', 'Inventory', 'Arena loot with provenance.') +
      `<div class="facet-card"><p class="empty-note">No avatar yet — forge one in Avatar Studio first.</p></div>`;
    return;
  }
  const items = av.inventory || [];
  $('#main').innerHTML = head('LOOT VAULT', 'Inventory', `${esc(av.name)} — every item has forged/battle provenance. Sell straight to the marketplace from here.`,
    `<button class="mini-btn" data-open-avatar>OPEN STUDIO</button>`) +
  `<div class="stat-grid"><div class="stat-card"><p class="stat-label">Items owned</p><p class="stat-value">${items.length}</p></div>
  <div class="stat-card"><p class="stat-label">Top rarity</p><p class="stat-value">${items.reduce((m, i) => Math.max(m, i.rlevel || 0), 0)} R</p></div>
  <div class="stat-card"><p class="stat-label">Wallet (Owner)</p><p class="stat-value">${S.ledger && S.ledger.accounts ? S.ledger.accounts['Owner'] : 0} LD</p></div></div>
  <div class="facet-card"><h4>Sell to marketplace</h4>
    ${items.length ? items.map(i => `<div class="row-item"><span class="t" style="color:${i.color}">R${i.rlevel}</span><span class="d" style="color:${i.color}">${esc(i.name)} <small>(${i.slot} · ${i.rarity} · pwr ${i.power})</small></span><input class="inv-price" data-price-for="${i.id}" placeholder="LD" style="width:64px;background:rgba(6,3,10,.85);border:1px solid var(--line-hi);border-radius:8px;padding:6px 8px;color:var(--text);font-size:12px" value="100"><button class="mini-btn" data-sell="${i.id}">Sell</button></div>`).join('') : '<p class="empty-note">Empty — win battles or forge a piece.</p>'}
  </div>
  <div class="truth-card"><b>TRUTH BOUNDARY</b><p>Sales settle inside the labelled simulation ledger (100 LD = A$1.00 reference) until real payment rails pass the compliance gates.</p></div>`;
  $('#main').onclick = async e => {
    if (e.target.closest('[data-open-avatar]')) { setView('avatar'); return; }
    const b = e.target.closest('[data-sell]');
    if (b) {
      const price = (document.querySelector(`[data-price-for="${b.dataset.sell}"]`) || {}).value || '100';
      const j = await post('/api/command', { text: `sell ${b.dataset.sell} for ${price}` });
      toast((j.reply || j.error || '').slice(0, 100));
      await refreshState(); renderInventory();
    }
  };
}

async function renderAvatarStudio() {
  const [races, avs] = await Promise.all([loadRaces(), api('/api/avatars')]);
  const avatars = avs.ok ? avs.avatars : [];
  const hd = head('CHARACTER FORGE', 'Avatar Studio', '100 races from the Diablo & Skyrim lineage. Every avatar begins naked — only racial gifts.');
  if (!avatars.length) { $('#main').innerHTML = hd + wizardHTML(races); wireWizard(races); return; }
  const sel = avatars.find(a => a.id === studioSelAvatar) || avatars[0];
  studioSelAvatar = sel.id;
  const race = races.find(r => r.id === sel.raceId) || races[0];
  const groups = [
    ['Combat', ['weapon', 'shield']],
    ['Head & body', ['head', 'face', 'hair', 'eyes', 'ears', 'torso', 'belt', 'shoulder_l', 'shoulder_r']],
    ['Arms (L/R)', ['arm_upper_l', 'arm_upper_r', 'arm_lower_l', 'arm_lower_r', 'hand_l', 'hand_r']],
    ['Legs (L/R)', ['leg_upper_l', 'leg_upper_r', 'leg_lower_l', 'leg_lower_r', 'foot_l', 'foot_r']],
    ['Jewellery', ['neck', 'necklace', 'ring_l', 'ring_r', 'earring_l', 'earring_r']],
    ['Piercings', ['piercing_brow', 'piercing_nose', 'piercing_lip']],
    ['Tattoos', ['tattoo_head', 'tattoo_torso', 'tattoo_arm_l', 'tattoo_arm_r', 'tattoo_leg_l', 'tattoo_leg_r']],
    ['Extras', ['wings', 'back', 'aura', 'cloak']]
  ];
  const slotCell = sl => { const it = sel.equipment[sl]; return `<div class="kv"><span>${sl}</span><b>${it ? `<span style="color:${it.color}">${esc(it.name)}</span> <button class="mini-btn" data-unequip="${sl}">remove</button>` : '— empty —'}</b></div>`; };
  const equipRows = groups.map(g => `<h4 style="margin:10px 0 4px;color:var(--muted2);font-size:10px;letter-spacing:.12em">${g[0]}</h4>` + g[1].map(slotCell).join('')).join('');
  const invRows = sel.inventory.length ? sel.inventory.map(i =>
    `<div class="row-item"><span class="t" style="color:${i.color}">R${i.rlevel}</span><span class="d" style="color:${i.color}">${esc(i.name)} <small>(${i.slot}, ${i.rarity}, pwr ${i.power}${i.element ? ', ' + i.element : ''})</small></span><button class="mini-btn" data-equip="${i.id}">Equip</button></div>`).join('')
    : `<p class="empty-note">No items. Victory in the Arena drops loot on a 1–100 rarity scale.</p>`;
  const petRows = (sel.pets || []).length ? sel.pets.map(pt =>
    `<div class="row-item"><span class="t" style="color:${pt.color}">R${pt.rlevel}</span><span class="d" style="color:${pt.color}">${esc(pt.name)} the ${esc(pt.species)} <small>${pt.rarity}</small></span></div>`).join('')
    : '<p class="empty-note">No companions yet.</p>';
  $('#main').innerHTML = hd + `
    <div class="chip-row">${avatars.map(a => `<button class="chip ${a.id === sel.id ? 'on' : ''}" data-pick="${a.id}">${esc(a.name)}</button>`).join('')}<button class="chip" data-pick="__new">＋ New avatar</button></div>
    <div class="avatar-grid">
      <div class="card avatar-hero">${avatarSVG(race, 170)}<h3>${esc(sel.name)}</h3><p class="muted">${esc(sel.race)} · Level ${sel.level}</p>
        <p class="muted small">W ${sel.record.wins} · L ${sel.record.losses} · D ${sel.record.draws} · XP ${sel.xp}/${sel.level * 100}</p>
        <p class="pill ${sel.loadoutComplete ? 'operational' : 'config'}">${sel.loadoutComplete ? 'LOADOUT COMPLETE' : 'NAKED — UNEQUIPPED'}</p>
        <div class="input-line"><button class="mini-btn" data-view-arena="1">⚔ Enter the Arena</button></div></div>
      <div class="avatar-side">
        <div class="facet-card"><h4>Attributes (Diablo)</h4>${statBar('STR', sel.stats.str)}${statBar('DEX', sel.stats.dex)}${statBar('INT', sel.stats.int)}${statBar('VIT', sel.stats.vit)}
          <div class="kv" style="margin-top:8px"><span>Health / Magicka / Stamina</span><b>${sel.derived.maxHP} / ${sel.derived.maxMP} / ${sel.derived.maxStam}</b></div>
          <div class="kv"><span>Dodge / Crit</span><b>${sel.derived.dodge}% / ${sel.derived.crit}%</b></div>
          <div class="kv"><span>Unarmed / Destruction</span><b>${sel.skills.unarmed.level} / ${sel.skills.destruction.level}</b></div>
          <div class="kv"><span>Resists (fire/cold/shock/poison)</span><b>${race.r.join('/')}%</b></div>
          <div class="kv"><span>Racial gift</span><b>${esc(race.fl)}</b></div></div>
        <div class="facet-card"><h4>⚒ Talents (${(sel.talents||[]).length} unlocked · ${sel.talentPoints||0} point${(sel.talentPoints||0) === 1 ? '' : 's'})</h4>
          ${(S.talentTree || []).map(t => { const has = (sel.talents||[]).includes(t.id); const gated = (sel.talents||[]).length < t.tier - 1; const nop = !(sel.talentPoints > 0);
            return `<div class="row-item"><span class="t">T${t.tier}</span><span class="d">${esc(t.name)} <small class="muted">${esc(t.desc)}</small></span>${has ? '<span class="pill operational">OWNED</span>' : gated || nop ? `<span class="pill config">${gated ? 'TIER-GATED' : 'NO POINTS'}</span>` : `<button class="mini-btn" data-unlock-talent="${t.id}">Unlock</button>`}</div>`; }).join('')}
          <p class="empty-note">1 point per level — win battles in the Arena. Chat: “unlock talent body for ${esc(sel.name.toLowerCase())}”.</p></div>
        <div class="facet-card"><h4>Equipment slots</h4>${equipRows}</div>
        <div class="facet-card"><h4>Inventory (${sel.inventory.length})</h4>${invRows}
          <div class="input-line"><button class="mini-btn" data-merge-items="1">⚒ Auto-merge best triple</button></div></div>
        <div class="facet-card"><h4>Companions (${(sel.pets || []).length})</h4>${petRows}
          <div class="input-line"><button class="mini-btn" data-gen-pet="1">Generate pet</button><button class="mini-btn" data-merge-pets="1">⚒ Auto-merge pets</button></div></div>
        <div class="facet-card"><h4>⚒ Forge a unique piece (costs LD)</h4>
          <p class="empty-note">Describe it imaginatively — your prompt + identity makes every piece unique. Or say in Chat: “forge wings at legendary: …”.</p>
          <div class="input-line"><select id="forgeSlot" class="chip">${SLOT_GROUPS_FLAT.map(x => `<option>${x}</option>`).join('')}</select>
          <select id="forgeBand" class="chip">${['Common', 'Magic', 'Rare', 'Legendary', 'Set', 'Mythic'].map(b => `<option>${b}</option>`).join('')}</select></div>
          <div class="input-line"><input id="forgePrompt" placeholder="e.g. wings of storm-glass folded from a dying aurora"><button class="mini-btn" data-forge="1">Forge (LD)</button></div>
          <p class="empty-note" id="forgeCostNote"></p></div>
        <div class="facet-card"><h4>Truth</h4><p>Assets are application-managed digital records — not on-chain NFTs. Battles resolve only on the server.</p></div>
      </div></div>`;
  $('#forgeCostNote').textContent = 'Costs: ' + Object.entries(FORGE_COST_UI).map(([k, v]) => k + ' ' + v + ' LD').join(' · ');
  $('#main').onclick = async e => {
    const pk = e.target.closest('[data-pick]');
    if (pk) { if (pk.dataset.pick === '__new') { $('#main').innerHTML = hd + wizardHTML(races); wireWizard(races); } else { studioSelAvatar = pk.dataset.pick; renderAvatarStudio(); } return; }
    const eq = e.target.closest('[data-equip]');
    if (eq) { const j = await post(`/api/avatars/${sel.id}/equip`, { itemId: eq.dataset.equip }); if (j.ok) renderAvatarStudio(); return; }
    const un = e.target.closest('[data-unequip]');
    if (un) { await post(`/api/avatars/${sel.id}/unequip`, { slot: un.dataset.unequip }); renderAvatarStudio(); return; }
    if (e.target.closest('[data-view-arena]')) { setView('arena'); return; }
    const tl = e.target.closest('[data-unlock-talent]');
    if (tl) { const j = await post('/api/command', { text: 'unlock talent ' + tl.dataset.unlockTalent + ' for ' + sel.name.toLowerCase() }); toast((j.reply || j.error || '').slice(0, 100)); await refreshState(); renderAvatarStudio(); return; }
    const fb = e.target.closest('[data-forge]');
    if (fb) {
      const r = await post('/api/forge', { avatarId: sel.id, slot: $('#forgeSlot').value, band: $('#forgeBand').value, prompt: $('#forgePrompt').value });
      toast(r.ok ? 'Forged ' + r.item.name + ' (R' + r.item.rlevel + ' ' + r.item.rarity + ') for ' + r.cost + ' LD' : (r.error || 'forge failed'));
      if (r.ok) renderAvatarStudio();
      return;
    }
    if (e.target.closest('[data-gen-pet]')) { const r = await post(`/api/avatars/${sel.id}/pets`, {}); toast(r.ok ? 'Companion: ' + r.pet.name + ' the ' + r.pet.species + ' (R' + r.pet.rlevel + ')' : (r.error || 'failed')); renderAvatarStudio(); return; }
    if (e.target.closest('[data-merge-items]')) {
      const triple = findTriple(sel.inventory, i => i.slot + '|' + i.rarity);
      if (!triple) { toast('Need 3 same-slot, same-band pieces to merge.'); return; }
      const r = await post(`/api/avatars/${sel.id}/merge`, { ids: triple });
      toast(r.ok ? 'Merged into ' + r.merged.name + ' (R' + r.merged.rlevel + ' ' + r.merged.rarity + ')' : (r.error || 'merge failed'));
      renderAvatarStudio(); return;
    }
    if (e.target.closest('[data-merge-pets]')) {
      const triple = findTriple(sel.pets || [], p => p.rarity);
      if (!triple) { toast('Need 3 same-band pets to merge.'); return; }
      const r = await post(`/api/avatars/${sel.id}/pets/merge`, { ids: triple });
      toast(r.ok ? 'Pet merged: ' + r.merged.name + ' (R' + r.merged.rlevel + ')' : (r.error || 'merge failed'));
      renderAvatarStudio(); return;
    }
  };
}
const SLOT_GROUPS_FLAT = ['weapon', 'shield', 'head', 'face', 'hair', 'eyes', 'ears', 'torso', 'belt', 'shoulder_l', 'shoulder_r', 'arm_upper_l', 'arm_upper_r', 'arm_lower_l', 'arm_lower_r', 'hand_l', 'hand_r', 'leg_upper_l', 'leg_upper_r', 'leg_lower_l', 'leg_lower_r', 'foot_l', 'foot_r', 'neck', 'necklace', 'ring_l', 'ring_r', 'earring_l', 'earring_r', 'piercing_brow', 'piercing_nose', 'piercing_lip', 'tattoo_head', 'tattoo_torso', 'tattoo_arm_l', 'tattoo_arm_r', 'tattoo_leg_l', 'tattoo_leg_r', 'wings', 'back', 'aura', 'cloak'];
const FORGE_COST_UI = { Common: 25, Magic: 60, Rare: 150, Legendary: 400, Set: 900, Mythic: 2000 };
function findTriple(list, keyFn) {
  const g = {};
  for (const x of list) { const k = keyFn(x); (g[k] = g[k] || []).push(x.id); }
  for (const k in g) if (g[k].length >= 3) return g[k].slice(0, 3);
  return null;
}
function wizardHTML(races) {
  return `<div class="wizard card"><div class="wizard-left">
    <div class="facet-card"><h4>Name your avatar</h4><div class="input-line" style="margin-top:0"><input id="avatarName" placeholder="e.g. Talvash" maxlength="24"></div></div>
    <div class="facet-card"><h4>Choose a race — ${races.length}</h4>
      <div class="input-line" style="margin-top:0"><input id="raceSearch" placeholder="Search races…"></div>
      <div class="chip-row" id="originChips">${['All', 'Skyrim', 'TES Lore', 'Diablo', 'Diablo IV'].map((o, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-origin="${o}">${o}</button>`).join('')}</div>
      <div class="race-grid" id="raceGrid"></div></div></div>
    <div class="wizard-right facet-card" id="racePreview"><h4>Preview</h4><p class="empty-note">Select a race to preview your naked base avatar.</p></div></div>`;
}
function wireWizard(races) {
  let origin = 'All', query = '';
  const paint = () => {
    const list = races.filter(r => (origin === 'All' || r.origin === origin) && (!query || r.name.toLowerCase().includes(query)));
    $('#raceGrid').innerHTML = list.map(r => `<button class="race-card ${studioRace === r.id ? 'on' : ''}" data-race="${r.id}" title="${esc(r.fl)}">${avatarSVG(r, 44)}<span>${esc(r.name)}</span><small>${esc(r.origin)}</small></button>`).join('') || '<p class="empty-note">No races match.</p>';
  };
  paint();
  $('#raceSearch').oninput = e => { query = e.target.value.toLowerCase(); paint(); };
  $('#originChips').onclick = e => { const c = e.target.closest('[data-origin]'); if (!c) return; origin = c.dataset.origin; [...$('#originChips').children].forEach(x => x.classList.toggle('on', x === c)); paint(); };
  $('#raceGrid').onclick = e => {
    const b = e.target.closest('[data-race]'); if (!b) return;
    studioRace = b.dataset.race;
    [...$('#raceGrid').children].forEach(x => x.classList.toggle('on', x.dataset.race === studioRace));
    const r = races.find(x => x.id === studioRace);
    $('#racePreview').innerHTML = `<h4>Preview</h4>${avatarSVG(r, 150)}<h3 style="margin:8px 0 2px">${esc(r.name)}</h3><p class="muted small">${esc(r.origin)} · ${esc(r.family)}</p>
      <div style="margin-top:10px">${statBar('STR', r.s[0])}${statBar('DEX', r.s[1])}${statBar('INT', r.s[2])}${statBar('VIT', r.s[3])}</div>
      <div class="kv"><span>Resists (fire/cold/shock/poison)</span><b>${r.r.join('/')}%</b></div>
      <p class="muted small" style="margin-top:8px">${esc(r.fl)}</p>
      <div class="input-line"><button class="mini-btn" id="createAvatarBtn">Forge avatar (naked start)</button></div>`;
    $('#createAvatarBtn').onclick = async () => {
      const name = ($('#avatarName') || {}).value || '';
      const j = await post('/api/avatars', { name, raceId: studioRace });
      if (j.ok) { studioSelAvatar = j.avatar.id; toast(j.avatar.name + ' enters the world with nothing but ' + j.avatar.race + ' blood.'); renderAvatarStudio(); }
      else toast(j.error || 'Creation failed');
    };
  };
}
async function renderArena() {
  const [races, avs] = await Promise.all([loadRaces(), api('/api/avatars')]);
  const avatars = avs.ok ? avs.avatars : [];
  const hd = head('PVP BRAWL PIT', 'Arena', 'Server-authoritative combat: Diablo stats, crits & loot; Skyrim resources, use-based skills & racial resists.');
  if (!avatars.length) {
    $('#main').innerHTML = hd + `<div class="facet-card"><h4>No champion</h4><p class="empty-note">Forge an avatar first — every champion starts naked.</p><div class="input-line"><button class="mini-btn" id="goStudio">Open Avatar Studio</button></div></div>`;
    $('#goStudio').onclick = () => setView('avatar');
    return;
  }
  arenaChampion = avatars.find(a => a.id === arenaChampion) || avatars[0];
  const champ = arenaChampion;
  const champRace = races.find(r => r.id === champ.raceId);
  const hist = await api('/api/arena/history');
  const histRows = (hist.ok && hist.battles.length) ? hist.battles.slice(0, 12).map(b =>
    `<div class="row-item"><span class="t">${fmtTime(b.ts)}</span><span class="d">${esc(b.aName)} vs ${esc(b.bName)} → ${b.draw ? 'DRAW' : esc(b.winnerId === b.aId ? b.aName : b.bName)} (${b.rounds}r)</span></div>`).join('')
    : '<p class="empty-note">No battles yet. The pit is quiet.</p>';
  $('#main').innerHTML = hd + `
    <div class="chip-row">${avatars.map(a => `<button class="chip ${a.id === champ.id ? 'on' : ''}" data-champ="${a.id}">${esc(a.name)}</button>`).join('')}</div>
    <div class="arena-grid">
      <div class="card fighter-card">${avatarSVG(champRace, 120)}<h3>${esc(champ.name)}</h3><p class="muted small">${esc(champ.race)} · Lv ${champ.level} · ${champ.derived.maxHP} HP</p><span class="pill operational">YOUR CHAMPION</span></div>
      <div class="arena-mid"><button class="new-chat-side" id="summonRival">☠ Summon rival</button><button class="new-chat-side fight-btn" id="fightBtn" disabled>⚔ Begin battle</button>
      <p class="muted small">Wagering: COMPLIANCE-LOCKED. Practice brawls are free; the ledger wager simulator lives in LD Coins.</p></div>
      <div class="card fighter-card" id="rivalCard"><p class="empty-note">No opponent summoned.</p></div></div>
    <div class="card battle-card"><div class="cardhead"><b>Battle log</b><span class="subhead" id="battleStatus">AWAITING COMBATANTS</span></div><div class="battle-log" id="battleLog"><p class="empty-note">Server-resolved rounds appear here.</p></div></div>
    <div class="facet-card"><h4>Recent battles</h4>${histRows}</div>`;
  $('#main').onclick = async e => {
    const ch = e.target.closest('[data-champ]');
    if (ch) { arenaChampion = ch.dataset.champ; renderArena(); return; }
    if (e.target.closest('#summonRival')) {
      const j = await api('/api/arena/opponent?for=' + encodeURIComponent(champ.id));
      if (!j.ok) return;
      arenaRival = j.rival;
      const rr = races.find(r => r.id === arenaRival.raceId);
      $('#rivalCard').innerHTML = `${avatarSVG(rr, 120)}<h3>${esc(arenaRival.name)}</h3><p class="muted small">${esc(arenaRival.race)} · Lv ${arenaRival.level} · ${arenaRival.derived.maxHP} HP</p><span class="pill disconnected">RIVAL — NAKED</span>`;
      $('#fightBtn').disabled = false;
      $('#battleStatus').textContent = 'COMBATANTS READY';
      return;
    }
    if (e.target.closest('#fightBtn') && arenaRival && !arenaBusy) runBattle(champ.id, arenaRival);
  };
}
async function runBattle(champId, rival) {
  arenaBusy = true;
  $('#fightBtn').disabled = true; $('#summonRival').disabled = true;
  $('#battleStatus').textContent = 'RESOLVING ON SERVER…';
  $('#battleLog').innerHTML = '';
  const j = await post('/api/arena/battle', { aId: champId, bId: rival.id });
  if (!j.ok) { $('#battleStatus').textContent = 'ERROR'; toast(j.error || 'Battle failed'); arenaBusy = false; return; }
  const logEl = $('#battleLog');
  for (const line of j.battle.log) {
    logEl.insertAdjacentHTML('beforeend', `<div class="log-line ${line.crit ? 'crit' : ''}"><span class="t">R${line.r}</span><span class="d">${esc(line.text)}</span></div>`);
    logEl.scrollTop = logEl.scrollHeight;
    await sleep(90);
  }
  const win = j.battle.winnerId;
  logEl.insertAdjacentHTML('beforeend', `<div class="log-line result">${win ? `☠ ${esc(win === champId ? j.avatars[0].name : j.avatars[1].name)} WINS` : '⚑ DRAW — no settlement'}</div>`);
  const rw = j.rewards && j.rewards[champId];
  if (rw) {
    let txt = `Rewards: +${rw.xp} XP` + (rw.levelUps ? `, ${rw.levelUps} level-up(s)` : '');
    if (rw.loot) txt += ` · Loot: <span style="color:${rw.loot.color}">${esc(rw.loot.name)}</span> (${rw.loot.rarity}, ${rw.loot.slot})`;
    logEl.insertAdjacentHTML('beforeend', `<div class="log-line reward">${txt}</div>`);
  }
  $('#battleStatus').textContent = win ? 'SETTLED' : 'DRAW';
  arenaRival = null; arenaBusy = false;
}

/* ── Palette ─────────────────────────────────────────────────────── */
const ACTIONS = [
  { id: 'act-new-chat', icon: '＋', label: 'New chat', hint: 'ACTION', run: async () => { const j = await post('/api/conversations', { title: 'New conversation' }); chatConvoId = j.conversation.id; setView('chat'); } },
  { id: 'act-collapse', icon: '☰', label: 'Toggle sidebar', hint: 'ACTION', run: toggleCollapse },
  { id: 'act-eco', icon: '✦', label: 'Economic self-test', hint: 'ECONOMY', run: async () => { const r = await api('/api/economy/selftest'); toast('Self-test: ' + r.result.checks.map(c => (c.pass ? '✓' : '✗')).join(' ')); } },
  { id: 'act-status', icon: '✓', label: 'Run local self-check', hint: 'SYSTEM', run: () => setView('status') }
];
let paletteSel = 0, paletteItems = [];
function paletteEntries(query) {
  const pages = MODULES.map(x => ({ id: 'page-' + x.id, icon: x.icon, label: x.label, hint: x.section, run: () => setView(x.id) }));
  const all = ACTIONS.concat(pages);
  const q = query.trim().toLowerCase();
  if (!q) return { list: all, recentCount: 0 };
  const scored = all.map(a => { const l = a.label.toLowerCase(); return { a, s: l.startsWith(q) ? 0 : l.includes(q) ? 1 : 2 }; }).filter(x => x.s < 2).sort((x, y) => x.s - y.s || x.a.label.localeCompare(y.a.label));
  return { list: scored.map(x => x.a), recentCount: 0 };
}
function openPalette() { $('#paletteOverlay').hidden = false; const i = $('#paletteInput'); i.value = ''; i.focus(); paintPalette(); }
function closePalette() { $('#paletteOverlay').hidden = true; }
function paintPalette() {
  const { list } = paletteEntries($('#paletteInput').value);
  paletteItems = list; paletteSel = 0;
  $('#paletteHint').textContent = list.length + ' results';
  $('#paletteList').innerHTML = list.map((a, i) => `<button class="palette-item ${i === 0 ? 'sel' : ''}" data-idx="${i}"><i class="navicon">${a.icon}</i><span>${esc(a.label)}</span><small>${esc(a.hint)}</small></button>`).join('') || '<div class="empty-note" style="padding:16px">No matches.</div>';
}
function runPalette(idx) { const a = paletteItems[idx]; if (!a) return; closePalette(); a.run(); }

/* ── Status strip ────────────────────────────────────────────────── */
function refreshStatus() {
  const el = $('#modeState');
  if (!navigator.onLine) { el.textContent = 'offline'; return; }
  el.textContent = window.__liamApi === 'linked' ? 'linked' : (window.__liamApi === 'failed' ? 'online' : 'checking…');
}
function probeHealth() {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const to = ctl ? setTimeout(() => ctl.abort(), 3000) : null;
  fetch('/api/health', ctl ? { signal: ctl.signal } : {}).then(r => r.json()).then(j => {
    clearTimeout(to); const ok = j && j.status === 'ok';
    window.__liamApi = ok ? 'linked' : 'failed';
    if (ok) { OFFLINE = false; const b = $('#offlineBanner'); if (b) b.remove(); } else enterOffline();
    refreshStatus();
  }).catch(() => { if (to) clearTimeout(to); window.__liamApi = 'failed'; enterOffline(); });
}
probeHealth(); setInterval(probeHealth, 8000);
window.addEventListener('online', refreshStatus);
window.addEventListener('offline', refreshStatus);

/* ── reminder/notification poller ───────────────────────── */
let lastNotifTs = Date.now();
async function pollNotifications() {
  if (OFFLINE) return;
  const j = await api('/api/notifications');
  if (!j.ok || !j.notifications) return;
  const newest = j.notifications.filter(n => n.ts > lastNotifTs);
  lastNotifTs = Math.max(lastNotifTs, ...j.notifications.map(n => n.ts), 0);
  if (newest.length === 0) return;
  newest.reverse().forEach(n => {
    toast('⏰ Reminder: ' + (n.text || '').slice(0, 80));
    const log = $('#chatLog');
    if (log) log.insertAdjacentHTML('beforeend', `<div class="msg notice"><div class="who">REMINDER</div><p>${esc(n.text || '')}</p></div>`);
  });
  if (S && $('#chatLog')) { const c = S.conversations.find(x => x.id === chatConvoId); if (c) $('#chatLog').scrollTop = $('#chatLog').scrollHeight; }
}
setInterval(pollNotifications, 10000);

/* ── Collapse / mobile ───────────────────────────────────────────── */
function toggleCollapse() {
  if (window.innerWidth <= 960) { document.body.classList.toggle('sidebar-open'); return; }
  const collapsed = !document.body.classList.contains('sidebar-collapsed');
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  try { localStorage.setItem('liam.ui', JSON.stringify({ collapsed })); } catch (e) {}
}

/* ── Global wiring ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  try { const ui = JSON.parse(localStorage.getItem('liam.ui') || '{}'); if (ui.collapsed && window.innerWidth > 960) document.body.classList.add('sidebar-collapsed'); } catch (e) {}
  $('#buildTag').textContent = 'LIAM v1.63.0 · 168-SECTION COVERAGE';
  await refreshState();
  renderNav();
  refreshStatus();
  await setView('conversations', { silent: true });

  $('#nav').addEventListener('click', e => { const b = e.target.closest('.nav'); if (b) setView(b.dataset.view); });
  $('#main').addEventListener('click', e => { const c = e.target.closest('.module-card[data-facet]'); if (c) openFacet(c.dataset.module, c.dataset.facet); });
  $('#collapseBtn').onclick = toggleCollapse;
  $('#mobileNavBtn').onclick = () => document.body.classList.toggle('sidebar-open');
  $('#newChatBtn').onclick = async () => { const j = await post('/api/conversations', { title: 'New conversation' }); chatConvoId = j.conversation.id; setView('chat'); };
  $('#searchBtn').onclick = openPalette;
  $('#avatarBtn').onclick = () => setView('profile');
  $('#facetClose').onclick = () => { $('#facetOverlay').hidden = true; };
  $('#facetOverlay').addEventListener('click', e => { if (e.target === $('#facetOverlay')) $('#facetOverlay').hidden = true; });
  $('#paletteOverlay').addEventListener('click', e => { if (e.target === $('#paletteOverlay')) closePalette(); });
  $('#paletteInput').addEventListener('input', paintPalette);
  $('#paletteList').addEventListener('click', e => { const b = e.target.closest('.palette-item'); if (b) runPalette(+b.dataset.idx); });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#paletteOverlay').hidden ? openPalette() : closePalette(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleCollapse(); }
    if (e.key === 'Escape') { closePalette(); $('#facetOverlay').hidden = true; document.body.classList.remove('sidebar-open'); }
    if (!$('#paletteOverlay').hidden) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        paletteSel = (paletteSel + (e.key === 'ArrowDown' ? 1 : -1) + paletteItems.length) % Math.max(1, paletteItems.length);
        [...$('#paletteList').children].forEach((el, i) => el.classList.toggle('sel', i === paletteSel));
        const sel = $('#paletteList').children[paletteSel]; if (sel) sel.scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') { e.preventDefault(); runPalette(paletteSel); }
    }
  });
});
