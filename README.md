# LIAM · v1.59 — live connectors, payment rails, prompt-forged gear, 42-slot avatars

Local-first, security-first operating platform implementing the WitForge
master specification against the LIAM control-centre surface. The server is
authoritative; the browser is a control surface; the user's request grants
permission; explicit approval governs high-risk actions; nothing is simulated
as success.

## Run

```sh
cd liam
node server.js          # zero-dependency server, http://127.0.0.1:5173
```

Then open `http://127.0.0.1:5173`.

Verification:

```sh
node --check app.js && node --check server.js
node smoke-test.js      # 45 checks: every module view, palette, chat
node platform-test.js   # 71 checks: ledger, SSRF, sandbox, auth, forge, market, payment gates
node arena-test.js      # 20 checks: races, naked starts, 42-slot architecture, battles
```

## v1.60 — UI overhaul (ground-up design system)

- **Ground-up visual system rebuilt (`styles.css` rewritten ~10×)**: design tokens (surfaces, lines, elevations, radii, type/mono stacks, accent gradients), ambient scene (violet orbs + blueprint grid, fixed-layer pseudo elements), consistent 12–24px radius/9–70px shadow scales.
- **Sidebar**: glass panel with edge-light, pulsing brand mark, icon-tile nav items with glow-active state and gradient indicator, section labels with hairlines, elevated mode/status strip card.
- **Topbar**: frosted glass with gradient hairline, elevated search pill, avatar with gradient ring.
- **Content**: page heads with gradient display type + eyebrow marker; stat cards with hover lift and edge border animation; pills with glowing dots; module cards with lift + shadow sweep.
- **Chat**: 600px card with header strip, violet gradient user bubbles (tailed), dark local bubbles, notice styling, elevated composer with focus ring + gradient send button, uppercase hint footer.
- **Overlays/toast**: palette with deep blur + glow shadow and icon tiles; facet panel refined; toast becomes a pill with slide-up animation; offline banner restyled amber gradient.
- **Avatar Studio/Arena**: race cards, stat bars (animated gradient fills), avatar hero with radial accent, fight button gradient, battle log line treatments.
- **System touches**: violet `::selection`, custom scrollbars, kbd styling, entrance animation on page content (reduced-motion respected), responsive grid refinement, favicon added.
- Zero functional regressions: platform 71, arena 20, smoke 45 — all green. Version bump: 1.60.0.

## v1.59 — live connectors, verified-state persistence, export/import

- **4 new LIVE connectors (key-free, real data)**: Frankfurter FX (`convert 100 aud to usd`), Wikipedia research (`research <topic>`), Cloudflare DNS-over-HTTPS (`dns <domain>`), local utilities (`hash`, `uuid`, base64, time) — all routed through the guarded SSRF-safe fetch layer.
- **Adapters: 14 → 18**, truth-stated via new `/api/capabilities` endpoint.
- **Connector verification persists**: `verify github` records evidence in state; the github adapter reports `VERIFIED (doomed689)` instead of reverting to CONFIGURED_UNVERIFIED after restarts.
- **Export/import manifests**: `/api/export` emits a `liam.export` manifest (state snapshot + counts; credentials never leave the encrypted store in plaintext); `/api/import` restores only behind explicit `confirm`.
- **`/api/selftest` now reports an `allPass` aggregate** alongside the 7 checks.
- **Hosted on GitHub Pages**: https://doomed689.github.io/WitForge/ serves the static frontend with the honest offline banner when no backend answers.
- Tests: platform 62 → **71** (util round-trips, adapter registry, export/import safety gates). Arena 20, smoke 45 unchanged — nothing removed, only added.

## v1.58 — real Stripe rails, prompt-forged unique gear, 42-slot avatars

- **Real payments, reality-gated**: “connect stripe with token sk_…” stores
  the key AES-256-GCM; “verify stripe” proves it against the real
  `GET /v1/account`; only then can “enable real payments confirm” flip
  REAL-MONEY MODE. Purchases create genuine Stripe Checkout sessions
  (`POST /v1/checkout/sessions`, 1 LD = A$0.01) and LD is credited **only**
  when `GET /v1/checkout/sessions/{id}` returns `payment_status: "paid"`
  (idempotent per session). Until every gate passes, LD stays labelled
  SIMULATION and “create payment” is refused. No fabrication, ever.
- **Proton, told truthfully**: Proton publishes no payment/wallet merchant
  API. “connect proton” answers `NO PUBLIC API` and never simulates a
  connection (spec §165).
- **42-slot avatar architecture**: sided limbs (upper/lower arm, upper/lower
  leg, hands, feet, shoulders — each L and R a separate piece), jewellery
  (necklace, rings, earrings), piercings (brow/nose/lip), tattoos
  (head/torso/arms/legs), plus wings/back/aura/cloak extras. Combat loadout
  gate: weapon, head, torso, both hands, both feet.
- **Prompt forging**: “forge wings at legendary: storm-glass folded from a
  dying aurora” spends LD (Common 25 · Magic 60 · Rare 150 · Legendary 400 ·
  Set 900 · Mythic 2000, debited to a Forge Sink) and produces a piece whose
  SHA-256 fingerprint embeds your prompt — every piece is unique per person.
  Works from Chat or the Avatar Studio Forge console.
- **Marketplace**: fixed-price LD listings with double-entry escrow
  settlement (buyer → seller, ledger sum invariant tested), vendor seed stock,
  delist returns the item. Chat: “market”, “sell <item> for <n>”,
  “buy <id>”, “delist <id>”.
- **Ledger**: LD Issuance (1,000,000), Forge Sink, Marketplace Sink sinks;
  all economy entries double-entry balanced; sum invariant enforced in tests.

## v1.57 — 168-section coverage + plain-language account & connector control

- **Specification Coverage workspace** (`Spec` in SYSTEM): all 168 sections of
  the WitForge master spec with truthful statuses (LIVE / PARTIAL / EXTERNAL /
  LOCKED / POLICY) plus live evidence probes (audit hash-chain, rarity scale,
  legal records, adapter states). `/api/spec/compliance`, `/api/selftest`.
- **Accounts by conversation**: “create owner account NAME password PASS”,
  “login PASS”, “logout”. Owner uses scrypt (N=16384) + HttpOnly SameSite
  sessions; first-run creation closes after the first owner; mutations require
  the session once an owner exists; throttled, audited logins.
- **Connectors by conversation**: “connect <service> with token …” stores the
  secret AES-256-GCM encrypted at rest (never returned by APIs), flips the
  adapter to CONFIGURED_UNVERIFIED, and “verify github” proves it with a real
  API call. “connections” lists services without secrets; “disconnect …”
  destroys the credential.
- **Asset depth**: 1–100 rarity scale with band mapping, piece merging
  (3 same-slot same-band → higher, consumed atomically), pets with generation
  and merging, SHA-256 asset fingerprints with anti-duplication.
- **Hardening**: tamper-evident hash-chained audit with correlation ids,
  scoped expiring HMAC capability tokens, evidence vault, action preview
  (“preview …”), autonomous mode (confirmation-gated), security headers
  (CSP/nosniff/DENY), 120 req/min rate limiting, SUCCEEDED/FAILED/BLOCKED
  result states, 15 versioned legal document records.

## v1.56 — every system live, controlled by conversation

- **Server-authoritative state** (`platform.js` + `data/platform.json`):
  conversations, tasks, projects, agents, memory, knowledge, audit,
  permissions, approvals, emergency state and the LD ledger all live on the
  server. Browser refresh loses nothing.
- **Conversational control surface**: Chat routes UI intents locally and
  platform intents server-side (`/api/command`). “help” lists the surface:
  create/complete tasks, projects, agents, memory, recall, knowledge,
  status/capabilities/security, grant/revoke, emergency states, approve/stop,
  balance/wager/selftest, weather, fetch, file read/write, allowlisted exec.
- **Permission model**: requesting a low/medium-risk capability grants it,
  attributed `user-request` and audited. High-risk actions and LOCKDOWN queue
  in Approvals; `… confirm` or “approve <id>” is your explicit authorization.
- **Real tools / adapters / connectors** (`/api/tools/run`, `/api/state`):
  scoped filesystem (traversal-blocked, SHA-256 evidence), SSRF-guarded HTTP
  (private/loopback/metadata + DNS-rebind blocking, 8s timeout, 20KB cap),
  Open-Meteo weather (real retrieval), allowlisted shell:false executor,
  GitHub REST (real only with GITHUB_TOKEN), Puter.js bridge (browser-loaded,
  output labelled EXTERNAL · UNTRUSTED), Termux/device/Google truthfully
  UNAVAILABLE until genuinely connected.
- **Security shield**: NORMAL/ELEVATED/HIGH/LOCKDOWN with propagation to the
  executor; SSRF and allowlist blocks raise security events; full audit trail.
- **LD economy**: balanced double-entry simulation ledger; wagers escrow with
  1% Treasury; self-test verifies 100+100=200, 198+2, sum invariant,
  negative-balance and unbalanced-entry rejection. Real money stays
  compliance-locked.
- **Live workspaces** for conversations, tasks, projects, agents, memory,
  knowledge, files, tools/adapters, permissions, approvals, security, audit,
  LD coins, status, settings, puter — plus Avatar Studio & Arena (100 races,
  naked starts, server-authoritative battles).

## What was implemented previously (still true)

- **Control-centre shell** matching the screenshots: purple/black theme, LIAM brand
  tile, breadcrumb header, Search (Ctrl K), avatar, `Local mode` status strip.
- **Full cumulative navigation**: CORE · AI · CONTROL · SECURITY · ACCOUNT ·
  COMMERCE · SYSTEM (34 workspaces), persisted collapse (`Ctrl+B`, hamburger),
  icon-only collapsed mode with tooltips, responsive mobile drawer.
- **Capability pages**: truthful state cards — `Capability state`
  (OPERATIONAL / CONFIGURATION REQUIRED / DISCONNECTED / SIMULATION),
  `Data source`, `Control model` — plus the six module surfaces
  (Overview, Configuration, Permissions, Activity, History, Documentation)
  and the Research `Truth & safety` boundary card.
- **Local LIAM store** (browser localStorage): conversations, tasks, projects,
  memory records, audit trail, recent commands, settings. Export and clear
  controls live under Settings → Configuration.
- **Chat**: deterministic local responder (greetings, identity, help, time,
  `open <workspace>`, `new chat`). Anything requiring a model is honestly
  refused and recorded — no fabricated model output.
- **Command palette (Ctrl+K)** with ranked operations, recent-commands surface,
  full keyboard navigation (↑ ↓ ↵ esc).
- **Audit**: every navigation, inspection, chat, config and data action is
  recorded and surfaced in Activity/History facets and the Audit workspace.
- **Server**: static hosting + truthful `/api/health`; the status strip reports
  `linked` / `online` / `offline` from real checks only.

## Growth tranche 51–100 increments covered by this build

- 6  `Ctrl+B` taskbar toggle (persisted).
- 4  Icon-only collapsed navigation with page tooltips.
- 81 Global command search palette with ranked operations.
- 82 Recent commands surface (palette empty state).
- 83 Per-page command actions (module facet controls).
- 84 Universal status strip (Local mode / connectivity / build tag).
- 90 Keyboard-first navigation (palette keys, focus-visible states, esc handling,
     reduced-motion support).

## Truth boundary (unchanged from the lineage)

- No integration is reported connected merely because its adapter exists.
- Research, Models, Puter, GitHub, Termux, Device and Automations remain
  CONFIGURATION REQUIRED / DISCONNECTED until a real provider, credential or
  bridge is connected.
- LD Forge and Marketplace run as visibly labelled SIMULATION until a
  verified Stripe account exists AND the Owner explicitly confirms real
  mode; even then, LD is only credited on Stripe paid-status evidence.
- Proton Wallet: NO PUBLIC API — never simulated, never claimed.
- Provider or model output never grants authority; high-risk actions remain
  approval-gated; the server/local store controls authoritative state.

## Avatar Studio + Arena (Diablo & Skyrim lineage)

- **100 selectable races** (`races.js`) drawn from Skyrim's playable ten, every
  Diablo version's classes/bloodlines, and wider TES/Diablo lore (Akaviri,
  daedra, lycanthropes, atronachs, demons, angels, Dovah…). Each race carries
  base stats, elemental resistances (Dunmer fire 50, Nord frost 50…) and one
  innate racial gift.
- **Naked start**: every avatar is forged with zero equipment and zero items;
  all 42 slots (sided limbs, accessories, piercings, tattoos, extras) show
  empty, grouped in the studio as Body / Arms (L/R) / Legs (L/R) / Jewellery /
  Piercings / Tattoos / Extras / Combat. The `NAKED — UNEQUIPPED` state is displayed
  until loot is found and equipped.
- **Battle engine** (`arena-engine.js`, server-authoritative):
  - Diablo layer — Strength/Dexterity/Intelligence/Vitality, crits, dodge,
    elemental damage & resistances, loot in five rarities
    (Common/Magic/Rare/Legendary/Set) with affix-generated names.
  - Skyrim layer — Health/Magicka/Stamina resources, heavy attacks, use-based
    skill growth (Unarmed, Destruction), racial resistances.
  - Rounds capped at 30 with explicit draw handling; no settlement on draws.
  - Seeded determinism verified on identical fresh state.
- **Loadout gate**: practice brawls are always allowed (naked starts); the
  completeness gate (`weapon/head/torso/hand_l/hand_r/foot_l/foot_r`) is exposed for future
  wager matches, which remain COMPLIANCE-LOCKED per the master spec.
- Avatar display renders a stylised SVG base body per race (ears, horns, tails,
  wings, glow) with no clothing layer until items are equipped.

Tests: `node smoke-test.js` (UI) and `node arena-test.js` (engine: 100 races,
naked starts, loadout gate, equip lifecycle, determinism, termination).

## Not yet implemented (next tranche candidates)

- Real provider bridges (Puter.js, GitHub OAuth, Ollama discovery).
- 52–57, 60–80, 85–89, 92–100 from GROWTH-50-NEXT (command synonyms, preview
  records, idempotency keys, authorization decision records, retry budgets,
  checkpoint browser, traces, export/import manifests, contract health reports).
- Android companion pairing against this build's `/api/health` surface.
