# LIAM · v1.69 — plans 5+3, LD packages, social connectors, chat self-update

Local-first, security-first operating platform implementing the WitForge
master specification against the LIAM control-centre surface. The server is
authoritative; the browser is a control surface; the user's request grants
permission; explicit approval governs high-risk actions; nothing is simulated
as success.

## Run

```sh
cd WitForge
npm install             # truthful no-op: zero runtime dependencies
npm run dev             # = node server.js → http://localhost:8787 (PORT overrides)
```

Then open `http://localhost:8787`. Full installation validation, upgrade and
rollback procedures are in **INSTALL.md**.

Verification (every command below was executed on this tree):

```sh
npm run build           # source validation pass (no bundler)
npm run lint            # project lint rules, dependency-free
npm test                # all six suites
npm run selftest        # §126 self-test → PASS/FAIL/WARNING/NOT_TESTED
```

| Suite | Checks | What it proves |
|---|---|---|
| `spec-test.js` | 93 | §125 release areas: authentication → failure continuation |
| `adversarial-test.js` | 78 | §150 the 13 mandated attack classes + audit tampering |
| `platform-test.js` | 144 | ledger, SSRF, sandbox, allow-list, approvals, router, human gates, LLM, plans/LD packages/social/self-update |
| `arena-test.js` | 28 | races, naked starts, loadout gate, determinism |
| `engagement-test.js` | 117 | v1.65: LD costs, LD market, events, lotto, rewards, plans, guardian |
| `smoke-test.js` | 57 | boots the real server and renders every view; chat-over-HTTP replies and the human-gate round trip |

Requirement-level gap analysis against the 168-section master spec:
`node analysis/gap-scan.js` → **84/84 probed requirements present**.

## v1.69 — subscriptions reshaped, LD packages, social connectors, self-update

- **Plans are now 5 personal + 3 business.** Personal: free · plus · pro ·
  elite · **ultra** (new, rank 4). Business: business · business-plus ·
  enterprise (enterprise-max retired). Entitlements stay server-enforced;
  price labels stay reference-only until billing authority exists.
- **LD packages in the marketplace.** Five bundles — starter 500, value
  1,000+200, pro 2,500+600, elite 5,000+2,000, founder 12,000+5,000 LD —
  at notional A$5/10/25/50/100 with the bonus improving the effective rate.
  Real double-entry postings, `SIMULATION`-labelled, buyable from Chat
  (`buy ld package <id>`) or the Marketplace workspace. Billing stays
  compliance-locked.
- **Social connectors on official APIs.** x, facebook, reddit (postable) +
  instagram, linkedin, tiktok (verify-only, honest reasons). Your own
  developer credentials via the encrypted connect flow: `connect x with
  token <t>` → `verify x` (a real API round trip) → `post x <text>` —
  posting is high-risk, approval-gated, refuses without a proven-live
  credential, and is never simulated.
- **Chat-driven self-update.** `update check` compares this install with
  the audited public repo (read-only). `update apply` is high-risk and
  approval-gated: refuses downgrades/replacement, backs up every
  overwritten file to `data/update-backups/`, records per-file sha256 in
  audit, skips `data/` and `.git`, and never restarts itself — restart is
  always the owner's action.

## v1.68 — ask all: the ensemble mode

`ask all <question>` (or `ensemble <question>`) fans one question out to
**every connected provider simultaneously** — labelled answers come back
per provider with model and latency, and a provider failing (rate limit,
bad key, offline) is reported as a failure line without sinking the rest.
`llm.verify`, `llm.chat` and the ensemble all share one rule for local
models: if the requested model is not installed in Ollama, the first
installed model answers and is named truthfully in the response.

## v1.67 — Chat gets a brain: six LLM providers, free-first, truth-stated

Chat was a pure rule router; unmatched asks dead-ended. Now the platform has
a real AI layer (`llm.js`) with six providers behind one interface:

| Provider | Key | Free tier |
|---|---|---|
| `groq` | free, no card | ~30 req/min, 14,400/day (Llama 3.3 70B) |
| `gemini` | free, no card | Google AI Studio free tier |
| `openrouter` | free | `:free`-tagged models |
| `deepseek` | free grant | on signup |
| `mistral` | free tier | experiment plan |
| `ollama` | **no key** | fully local open-source models on 127.0.0.1:11434 |

**Use it:** `connect groq with token <your-free-key>` then `verify groq`, and
ask anything: `ask explain what LD is` → the reply is labelled
`🤖 [provider · model]` so the rule engine and the AI are never confused.
`ai provider <id>` picks the default (deterministic fallback order:
groq → gemini → openrouter → deepseek → mistral → ollama). When no rule
intent matches, the connected brain answers automatically; with nothing
connected the reply lists every free option with the exact connect command —
it never guesses and never pretends.

**Truth and safety rules kept:** a missing key is `UNAVAILABLE` with the
free-key path, never faked; keys travel in headers (never URLs) and are
masked in audit; the AI answers and advises but never executes — commands
still run through the audited router; Ollama is the only loopback traffic,
validated to `127.0.0.1:11434` and nothing else (not a general SSRF
exemption). Tools: `llm.status` / `llm.chat` / `llm.verify`; HTTP: the same
through `/api/command` and the fallback path. 18 new platform checks cover
wire formats (dry), truthful errors, loopback validation and a full local
round trip against a live local endpoint.

## v1.66 — human gates belong to the human (and the chat rail actually answers)

Two things landed in this release, one by design and one by discovery.

**1. Human-in-the-loop steps (requirement #169 in the registry, `LIVE`).**
When any tool meets a human gate — a captcha, a 2FA prompt, a consent
screen, a credential box — the platform now pauses as `WAITING_FOR_HUMAN`
instead of failing or pretending. The step appears in Chat and in the
Approvals view with kind, service and instructions. You complete the gate
*yourself*, then say:

```
resolve <step-id> with <your answer>
```

and repeat the original command. Your answer is injected into the paused
tool exactly once, then the step is closed (`pending → resolved → consumed`)
— single-use, masked in audit, never stored as a permission, never reused.
`stop <step-id>` cancels a pending step. The platform itself completes no
captcha and defeats no human gate: a human acts, the machine waits and
remembers. This is the honest version of “act on my behalf” — the same
rule the spec already states (§130–§139: *human-required steps are
completed by the user*), now executable end to end. Tools declare gates by
returning `{ needsHuman: { kind, service, instructions, fields } }`; the
`mock.hitl` adapter exercises the full round trip through the real
pipeline (17 new platform checks, 4 new smoke checks, plus
`POST /api/human-steps/:id/resolve|cancel`).

**2. Chat over HTTP lost every reply — fixed.** The server called the
async `command()` router without `await`, so the JSON response serialized
the pending Promise as `{}`: state changes landed, but no reply text ever
reached the browser. The smoke suite only ever asserted state, so it never
caught it. It now asserts the reply body too, and the route awaits. One
line, found by end-to-end testing of the new gate flow.

Also: the requirement registry now carries **170 entries** — the 168
master sections plus #169 (human gates) and #170 (real-money LD economy,
`LOCKED`, unlock path documented in `ROADMAP-REAL-MONEY.md`).

## v1.65 — chat controls the economy, and the owner is protected

Everything below is reachable in plain language from Chat. Nothing here was in
the 168-section master specification (grep-verified): it is additive, and it
keeps the same rules — simulation only, LD never invented, every action audited,
no claim that the build cannot back.

- **Chat is the control surface for all of it.** `help` prints the catalogue of
  what can be said; `preview <command>` shows what a command would do without
  doing it. An intent the platform does not have is answered with guidance, not
  silence, and never with a guess.
- **Every avatar piece costs LD.** One price table (`engagement.PIECE_COST`)
  drives forging (Common 25 → Mythic 2000), loadout provisioning (Common price
  per missing slot), pets (40 LD) and merges (30 → 2400 by band). If a wallet
  cannot pay, the action is refused and the reply names the price and the
  balance. Battle drops stay free and the price list says so.
- **LD is bought and sold in the app.** `buy 500 ld` / `sell 500 ld` post real
  double-entry movements at A$0.01 buy and A$0.0095 sell — a disclosed 5%
  spread, minimum 100 LD, multiples of 10 LD, settlement recorded with the mode
  `SIMULATION`. Real-money purchase, payout and arena settlement remain
  COMPLIANCE-LOCKED behind verified payment authority, licensing and identity
  checks; the refusal says exactly that.
- **Events** (`events`, `join event <id>`, `event progress <id>`, `close event
  <id> winner <name>`) — timed windows, entry fees that land in an Events Pool,
  and a settlement that pays the winner the pool less the disclosed 1% Treasury
  rule.
- **Lotto** (`open lotto round`, `buy 3 lotto tickets`, `draw lotto confirm`,
  `verify lotto`) — 6 from 49, 5 LD a ticket. The server publishes
  `sha256(seed)` when the round opens and reveals the seed only at the draw, so
  the numbers cannot change after tickets are sold; `verify lotto` recomputes
  numbers, lines, sales and allocation from the revealed seed. Sales split 50%
  prize tiers / 30% jackpot / 15% community / the remainder to Treasury, and an
  unwon jackpot or tier carries into the next round. Settlement refuses to post
  unless every LD of sales lands somewhere.
- **Sign-in gifts and task boards** (`sign in`, `daily tasks`, `weekly tasks`,
  `claim task <id>`) — a seven-day cycle of 10/20/35/50/75/110/200 LD that keeps
  a streak across a missed day but restarts after a long gap, plus four daily
  and four weekly tasks drawn deterministically per day/week so the board cannot
  be re-rolled for an easier one. Rewards are paid from funded pools
  (`Rewards Pool`, `Events Pool`, `Lotto Pool`, `Community Pool`, `Jackpot
  Rollover`) and every payment is an audited issuance from `LD Issuance` — no
  silent minting.
- **Multi-tiered subscriptions, personal and business** (`plans`, `upgrade to
  pro`, `change plan business-plus`) — four personal tiers (Free, Plus, Pro,
  Elite) and four business tiers (Business, Business Plus, Enterprise,
  Enterprise Max) with rank, price label, a plain-language blurb and
  entitlements (agents, storage, AI calls/day, seats, API access, guardian
  level, lotto tickets/day, support). Selecting a tier records a local plan and
  changes what the platform *allows*; prices are reference labels, billing is
  not chargeable, and an unknown tier is refused rather than silently becoming
  Free.
- **Owner protection (`owner-security.js` + the Guardian workspace)** — TOTP
  second factor implemented on Node crypto against RFC 6238 (verified against
  the published test vector), recovery codes, session inventory and revocation,
  login/security alerts, re-authentication for sensitive changes, four security
  levels (BASIC → MAXIMUM) with prerequisites, and drills.
- **The guardian charter** — ten published duties every agent owes the owner
  (serve the owner's interest, never self-authorize, protect secrets, report
  honestly, respect boundaries, never act covertly, treat untrusted content as
  data, escalate threats, prefer reversible steps, never leave the charter).
  Every agent action is screened and recorded; an instruction smuggled in from
  external content is refused with the duty named.
- **What protection does not promise.** The threat matrix ships inside the
  product as a named list — 8 COVERED, 4 PARTIAL, 2 OUT-OF-SCOPE — and the
  out-of-scope entries are stated in the product's own words: a compromised
  operating system or hardware, and physical coercion of the owner. The platform
  says plainly that it cannot defend what it does not control, and that real
  money remains compliance-locked rather than merely switched off.

New surfaces: six live workspaces (Events, Lotto, Rewards, LD Market, Plans,
Guardian) and the HTTP endpoints `/api/engagement`, `/api/events`, `/api/lotto`,
`/api/signin`, `/api/quests`, `/api/ldmarket`, `/api/plans`,
`/api/security/owner`, `/api/guardian`.

## v1.64 — specification-completeness tranche

The master specification's normative systems that were previously approximated
(or absent) are now implemented as real, tested subsystems. Nothing was removed
and no capability was faked; where a legitimate bridge does not exist the state
is reported as unavailable.

- **Security kernel (`kernel.js`)** — §9 nine permission states with legal
  transitions, §10 five delegation levels (a non-human actor can never raise its
  own level), §11 bounded act-on-my-behalf delegation, §12 autonomous mode as a
  bounded policy object (never a boolean), §44 twelve ordered policies, §46 signed
  expiring capability tokens bound to agent/device/account/resource/purpose/policy
  version, §51 twelve-factor risk scorer → LOW/MEDIUM/HIGH/CRITICAL/PROHIBITED,
  §52 approval matrix, §55 seven emergency-stop scopes, §56 four emergency levels,
  §96 structured audit records, §118 evidence vault, §148 eight-level authority order.
- **Tool execution pipeline (`platform.runTool`)** — every call now returns its
  §122 manifest, §51 risk assessment, §44 policy decision, §122/§123 structured
  result state, evidence hash, correlation id, §6 failure class and §147 correction
  plan; HIGH/CRITICAL actions stop at the approval gate; PROHIBITED never executes.
  Emergency-stop scopes are enforced per tool before anything runs.
- **Capability & adapter layer (`capabilities.js`)** — §8 capability catalogue,
  §15 eight-method adapter contract, §34–§39 communications/radio/media/screen/
  location/credential systems, §35 sensitive-path classification, §67 provider
  registry, §122/§123 manifests + result contracts, §124 five labelled mock
  adapters (simulation only, `countsAsConnected: false`).
- **Task engine (`task-engine.js`)** — §151 15-state durable task machine, §99
  thirteen result states kept distinct from lifecycle states, §6 nine failure
  classes, §147 correction plans, §149 containment, §101 transaction framework
  (snapshot-or-refuse for irreversible work, verify-before-commit, rollback),
  §153/§160 checkpoints + continuation, §154 human handoff, §5 eleven
  problem-solving stages, §102–§160 eight runnable workflow playbooks.
- **Platform services (`platform-services.js`)** — §40/§104 six device trust states
  with pairing that grants nothing by itself, §41 nine-field replayed-protected
  command envelopes, §105 cross-platform handoff, §107 offline queue, §130–§139
  account lifecycle with fail-closed account resolution and human-required
  boundaries refused, §113 organisations, §114 five plans with server-side
  entitlements (billing refused until billing authority exists), §110 asset
  registry with sha256 provenance + RARITY-100 approval rule, §112 anti-fraud
  (duplicate detection, tx monitoring, rate limits, anomaly signals), §119 metrics/
  spans/correlation ids with OpenTelemetry-shaped export, §126 self-test states,
  §129 release metadata, §117 ten recovery actions.
- **Now genuinely testable systems, not promises**: 44 registry sections carry an
  explicit evidence pointer; `npm test` is the release gate; `npm run build` and
  `npm run lint` are real validation passes with no dependency toolchain.
- **Conversational control added** for all of it: `permissions`, `risk <tool>`,
  `policy <tool>`, `stop network` / `resume network`, `pair device <name>`,
  `trust device …`, `record account service:user`, `plan pro`, `mint asset …`,
  `vault`, `metrics`, `trace <cid>`, `release`, `playbooks`, `run playbook dev-fix`,
  `new task …`, `provision loadout <avatar>`, `arena wager A vs B confirm`.
- **UI:** new live **Devices** and **Evidence** workspaces; Security gained the
  stop-scope controls, risk matrix and policy-decision tester; Permissions shows
  the nine states with suspend/resume/revoke; Status shows release metadata and the
  four-state self-test; Profile carries accounts, organisations and entitlements;
  Spec lists per-section evidence.
- **Economy truthfulness:** `LD_ECONOMY_MODE=simulation`, `LD_AUD_VALUE=0.01`,
  `REAL_MONEY_WAGERING_ENABLED=false`, `ARENA_WAGER_ENABLED=false` are the shipping
  configuration; simulated arena wagers settle 100+100 → winner 198 / treasury 2
  and are labelled SIMULATION. `economyConfig()` exposes the live state.

## v1.63 — UI panels for the new systems + loot selling

- **Automations view (module state flipped truthfully)**: the built-in scheduler runtime means "Connected runtime required" was no longer honest — the module is now `operational` with a live panel: stats, arm-in-plain-language box, active schedules with stop buttons (cadence/fired/next), pending reminders with clear-all.
- **Notifications view**: real event feed (reminder/schedule fires), truth boundary card for external delivery (none connected).
- **Inventory view**: avatar loot with rarity colours, sell-to-marketplace with inline price entry (settles in the labelled simulation ledger).
- **Talents panel in Avatar Studio**: per-avatar talent tree with OWNED / TIER-GATED / NO POINTS / Unlock states, one-click unlock through the audited chat pipeline.
- `/api/state` now carries `reminders`, `schedules`, `notifications`, `avatars`, `talentTree` (additive only).
- Tests: platform 86, arena 28, smoke 45 — all green (a `querySelectorAll` incompatibility with the smoke DOM harness was caught and fixed with delegated click handling).

## v1.62 — recurring cron schedules + avatar talent trees

- **Recurring schedules (real cron)**: `every 2 hours stand up` arms a server-ticked recurring task (30s+ cadences require `confirm`); fires via notification; `schedules` lists cadence/fired-count/next-fire; `stop schedule <id>` cancels. Ticker runs server-side every 15s alongside reminders.
- **Avatar talent trees** (arena-engine): 9 talents in 3 tiers — T1 Hardened Body/Sharpened Mind/Fleetfoot → T2 Bulwark/Wellspring/Hawk Eye → T3 Warlord/Sage/Phoenix. One point per level; tier gating (T2 needs a T1, T3 needs two); effects (`str/vit/int/dex`, `hpFlat`, `mpFlat`, `critBoost`) applied in `derived()` — **server-authoritative, raw stats never mutated (guarded against compounding)**. Public avatars report talents + points; chat intents `talents`, `unlock talent <name> for <avatar>`.
- Battle rewards already grant XP/loot (+/0.6 roll) — talent points flow from real level-ups.
- Intent-order fix: `stop schedule <id>` placed above the generic approval `stop` matcher.
- Tests: platform 81 → **86** (schedule fire/re-arm/cancel), arena 20 → **28** (points math, tier gating, derived-effects, no-mutation, idempotency). Smoke 45 unchanged.

## v1.61 — scheduler, repo file-ops, more live connectors

- **Reminder/notification system**: `remind me in 20 minutes stretch` schedules server-side reminders that tick every 15s even with the chat closed; due reminders become notifications, surfaced in the UI via toast + chat notice (10s poller, watermark-guarded). `reminders` / `clear reminders` intents.
- **GitHub file-ops from chat** (through the LIVE adapter, real Contents API): `github list [path]`, `github read file <path>`, and high-risk `github write <path> | <content>` — approval-gated, SSRF-guarded, audited; shipped end-to-end proof (commit 502dcf23).
- **Approval pipeline completion (bugfix)**: `approve <id>` now actually grants the capability it approved — high-risk commands previously re-queued forever after approval.
- **Hacker News connector**: `news top [n]` via the official API. **Countries connector**: `country <name>` via countries.dev (REST Countries v3.1 deprecated in 2026 and v5 is key-gated — adapter renamed truthfully).
- **Adapters: 18 → 20**; `/api/notifications` endpoint; intent reorder so connector commands beat the broad `status` matcher.
- Tests: platform 71 → **81** (reminder lifecycle, approve-grants-capability, truthful github states). Arena 20, smoke 45 unchanged — all green.

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
- **Loadout gate**: practice brawls are always allowed (naked starts); wager
  matches require both participants to be fully equipped
  (`weapon/head/torso/hand_l/hand_r/foot_l/foot_r`) before any LD moves.
- **Wager matches (v1.64)**: 100 LD each → 200 LD pool → winner 198 LD, treasury
  2 LD (1%), deterministic seed, auditable decision rule at the round cap, true
  draws settle nothing. Real-money wagering stays COMPLIANCE-LOCKED.
- Avatar display renders a stylised SVG base body per race (ears, horns, tails,
  wings, glow) with no clothing layer until items are equipped.

Tests: `node smoke-test.js` (UI) and `node arena-test.js` (engine: 100 races,
naked starts, loadout gate, equip lifecycle, determinism, termination).

## Not yet implemented (next tranche candidates)

These remain truthfully **not implemented** — they require either a real bridge
or a release process this build does not yet have:

- Real provider bridges (Puter.js model runtime, GitHub OAuth device flow,
  Ollama discovery) and the corresponding `EXTERNAL` registry sections.
- OS/device bridges: Android companion, ADB, Shizuku, Accessibility, Apple,
  Windows, ChromeOS, Bluetooth/USB/NFC radio access.
- Chargeable billing and any real-money economy path (COMPLIANCE-LOCKED).
- Multi-user organisation membership (needs the multi-account auth expansion).
- Wrapping *every* tool execution in the transaction framework (the framework
  exists and is tested; it is applied to atomic operations today).
- Browser-engine UI testing and an Android companion integration test.
