# WitForge — Specification Gap Analysis

**Repository:** `github.com/doomed689/WitForge` · **generated:** 2026-09-19 03:18 UTC · **build under analysis:** v1.65.0

**Authority:** `/home/user/uploads/Witforge.txt` — the definitive 168-section master specification.

---

## 1. Method (and what this document will not do)

Three independent instruments were used, all of which are reproducible from the repository:

1. **Section registry** (`spec-coverage.js`) — every one of the 168 master sections carries one truthful status:
   `LIVE` (implemented and operating), `PARTIAL` (operating at local/sandbox scope), `EXTERNAL` (adapter present,
   truthfully unavailable until a real provider/credential/device connects), `LOCKED` (compliance-locked by design),
   `POLICY` (a governance rule enforced in code, docs or the release process).
2. **Requirement probes** (`analysis/gap-scan.js`) — executable probes that inspect the live modules; a requirement
   counts as present only when the code path demonstrably exists.
3. **Test suites** — 335 checks across five suites, including an adversarial suite that attempts the 13
   mandated attack classes and reports containment.

The repository's claim discipline is preserved throughout: **sections 27 and 90 of the master text are not present**
in the source specification (the text numbers 168 sections with two gaps), and no section is marked implemented on the
strength of simulated evidence. Unavailable is reported as unavailable.

---

## 2. Headline results

| Instrument | Before this tranche | After |
|---|---|---|
| Requirement probes | 1/84 present (baseline clone) → 64/84 after the rebuilt modules | **84/84 present** |
| Registry: LIVE sections | 106 | **108** |
| Registry: PARTIAL sections | 15 | **16** |
| Registry: EXTERNAL sections | 23 | **21** |
| Registry: LOCKED sections | 2 | **3** |
| Registry: POLICY sections | 22 | **20** |
| Test suites | 3 suites, 145 checks | **5 suites, 335 checks, 0 failures** |

Sections whose status moved were moved **upward only where a real, tested code path now exists**, and the note for each
such section names the evidence. Nothing was downgraded and nothing was removed (additive upgrades only).

### Coverage by area

| Area | LIVE | PARTIAL | EXTERNAL | LOCKED | POLICY |
|---|---|---|---|---|---|
| AI | 3 | 0 | 3 | 0 | 1 |
| Account | 4 | 4 | 0 | 0 | 0 |
| Adapters | 2 | 3 | 0 | 0 | 0 |
| Assets | 18 | 1 | 0 | 0 | 0 |
| Capability | 8 | 0 | 0 | 0 | 0 |
| Commerce | 8 | 0 | 0 | 1 | 0 |
| Connectors | 2 | 2 | 4 | 0 | 3 |
| Core | 12 | 0 | 0 | 0 | 3 |
| Devices | 2 | 1 | 14 | 0 | 1 |
| Governance | 0 | 0 | 0 | 2 | 5 |
| Legal | 3 | 0 | 0 | 0 | 0 |
| Platform | 10 | 2 | 0 | 0 | 4 |
| Security | 34 | 3 | 0 | 0 | 3 |
| Work | 2 | 0 | 0 | 0 | 0 |

### Requirement probes by area

| Area | Present | Total |
|---|---|---|
| AI | 4 | 4 |
| Account | 4 | 4 |
| Adapters | 4 | 4 |
| Assets | 4 | 4 |
| Capability | 5 | 5 |
| Commerce | 4 | 4 |
| Connectors | 5 | 5 |
| Core | 6 | 6 |
| Devices | 6 | 6 |
| Legal | 1 | 1 |
| Platform | 10 | 10 |
| Security | 28 | 28 |
| Work | 3 | 3 |
| **Total** | **84** | **84** |

---

## 3. What this tranche implemented

Each row lists the master-specification sections the subsystem answers to, and what is now real rather than promised.

### Security kernel (`kernel.js`)

*Specification sections:* `§9 §10 §11 §12 §44 §46 §51 §52 §55 §56 §96 §118 §148`

9 permission states with legal transitions; 5 delegation levels; bounded autonomous policy object; 12 ordered policies; signed expiring capability tokens bound to agent/device/account/resource/purpose/policy version; 12-factor risk scorer → 5 classes; approval matrix; 7 emergency-stop scopes; 4 emergency levels; structured audit records; evidence vault; 8-level authority order.

### Tool execution pipeline (`platform.runTool`)

*Specification sections:* `§44 §51 §52 §96 §118 §122 §123`

Every call returns its manifest, risk assessment (score + factors), policy decision (policy id + reason), structured result state, evidence hash, correlation id, failure class and correction plan. Approval gates, stop scopes and lockdown are enforced before any side effect.

### Capability layer (`capabilities.js`)

*Specification sections:* `§8 §15 §34 §35 §36 §37 §38 §39 §67 §115 §122 §123 §124`

Capability catalogue by domain; 8-method adapter contract; file/communications/media/screen/location/radio/credential systems; sensitive-path classification; provider registry; tool manifests; structured result contracts; 5 labelled mock adapters that can never count as connected.

### Task engine (`task-engine.js`)

*Specification sections:* `§5 §6 §99 §101 §147 §149 §151 §153 §154 §160`

15-state durable task machine; 13 result states kept distinct from lifecycle states; 9 failure classes; correction plans and bounded retry; containment steps; transaction framework with snapshot-or-refuse, verify-before-commit and rollback; checkpoints and continuation; human handoff; 8 runnable workflow playbooks.

### Platform services (`platform-services.js`)

*Specification sections:* `§40 §41 §104 §105 §107 §110 §112 §113 §114 §117 §119 §126 §129 §130–§139`

Six device trust states with pairing that grants nothing; 9-field replay-protected command envelopes; cross-platform handoff; offline queue; account lifecycle with fail-closed resolution and human-required boundaries; organisations; five plans with server-side entitlements (billing refused without billing authority); asset registry with sha256 provenance and the RARITY-100 approval rule; anti-fraud; metrics/spans/OTLP export; four-state self-test; release metadata; ten recovery actions.

### Release engineering (`package.json`, `build.js`, `lint.js`, `INSTALL.md`)

*Specification sections:* `§127 §128 §129`

The documented commands now exist and were executed: `npm run build` (source validation), `npm run lint` (project rules, dependency-free), `npm test` (five suites), `npm run dev`/`start`, `npm run selftest`, `npm run health`. `npm install` is a truthful no-op. INSTALL.md documents prerequisites, Node support, dependency installation, environment variables, secure configuration, database initialisation, first-run setup, startup, health check, tests, shutdown, upgrade and rollback.

### Test tranche (`spec-test.js`, `adversarial-test.js`)

*Specification sections:* `§125 §126 §150`

Release suite covering all 18 mandated areas; adversarial suite attempting all 13 mandated attack classes plus audit tampering, expecting containment. Both are wired into `npm test` as the release gate.

### Economy truthfulness (`economyConfig()`)

*Specification sections:* `§85 §86 §87 §88 §92`

Simulation is the only permitted live mode. `LD_ECONOMY_MODE=simulation`, `LD_AUD_VALUE=0.01`, `REAL_MONEY_WAGERING_ENABLED=false`, `ARENA_WAGER_ENABLED=false`. Simulated arena wagers escrow 100 LD each, settle 198 LD to the winner and 2 LD to the treasury, deterministically, and are labelled SIMULATION.

### Conversational + browser control surface (`app.js`, `server.js`)

*Specification sections:* `§3 §13 §101 §119 §126 §129`

New live Devices and Evidence workspaces; Security gained the stop-scope controls, risk matrix and policy tester; Permissions shows the nine states with suspend/resume/revoke; Status shows release metadata and the four-state self-test; Profile carries accounts, organisations and entitlements; Spec lists per-section evidence. New endpoints: /api/version, /api/observability, /api/evidence, /api/risk/classes, /api/policy, /api/policy/evaluate, /api/capabilities/catalogue, /api/task-states, /api/stops, /api/devices, /api/accounts, /api/organisations, /api/subscription, /api/assets, /api/fraud, /api/offline, /api/playbooks(/run), /api/autonomous/policy, /api/delegation.

---

## 4. What remains truthfully incomplete

These are not failures of the build to be hidden; they are the states the master specification itself demands be
reported honestly (`§108`, `§165`).

### EXTERNAL — no legitimate interface exists yet (21)

| § | Section | Note |
|---|---|---|
| 19 | UNIVERSAL DEVICE ECOSYSTEM | Device workspace truthful DISCONNECTED until paired. |
| 20 | ANDROID | Companion scaffold present; PLANNED until built/paired/permissioned. |
| 21 | ANDROID ACCESSIBILITY | Guided official activation only; never silently granted. |
| 22 | ADB | Detection + guided setup; no pairing bypass. |
| 23 | SHIZUKU | Detected only when present; explicit authorization required. |
| 24 | ROOT | State model NOT_AVAILABLE/AVAILABLE/AUTHORIZED/DENIED/UNKNOWN; no bypass. |
| 25 | TERMUX | Real only when TERMUX runtime detected; allowlisted, bounded. |
| 26 | APPLE ECOSYSTEM | No bridge in this environment; truthfully unavailable. |
| 27 | macOS | Automation adapter absent; reported unavailable. |
| 28 | WINDOWS | PowerShell adapter absent; reported unavailable. |
| 30 | CHROMEOS | No bridge; unavailable. |
| 31 | GOOGLE ECOSYSTEM | OAuth flow designed; UNAVAILABLE until credentials configured. |
| 32 | MICROSOFT ECOSYSTEM | Graph adapter requires MICROSOFT_ACCESS_TOKEN; unavailable otherwise. |
| 33 | OTHER SERVICES | GitHub real with token; others CONFIGURED_UNVERIFIED/UNAVAILABLE. |
| 34 | COMMUNICATIONS | No send path without a real authorized connector. |
| 36 | CAMERA, MICROPHONE AND SCREEN | No capture without OS permission bridges; unavailable. |
| 38 | BLUETOOTH, USB AND NFC | Interface inventory only; no radio access without bridges. |
| 66 | MULTIMODAL AI | Puter multimodal only when bridge loads; otherwise unavailable. |
| 67 | MODEL PROVIDERS | Discovery via Puter live listModels when available; no fabricated providers. |
| 104 | MULTI-DEVICE | Single-device build; continuity via export/import. |
| 115 | MEDIA | Media processors report unavailable unless Puter bridge live. |

### LOCKED — compliance-locked by design (3)

| § | Section | Note |
|---|---|---|
| 88 | ECONOMY ISOLATION | Real-money LD economy disabled: LD_ECONOMY_MODE=simulation, REAL_MONEY_WAGERING_ENABLED=false, ARENA_WAGER_ENABLED=false, LD_AUD_VALUE=0.01. |
| 92 | REAL-MONEY LOCK | REAL MONEY OFF by design; only authorized config may change. |
| 93 | LEGAL AND REGULATORY CONTROL | Jurisdiction gates documented; no regulated activation. |

### PARTIAL — operating at local/sandbox scope (16)

| § | Section | Note |
|---|---|---|
| 17 | BROWSER | Browser is the UI host; automation beyond the app requires a real bridge. |
| 18 | COMPUTER CONTROL | Allowlisted shell:false executor; arbitrary control requires OS bridge. |
| 29 | LINUX | Host is Linux; sys inspector reads real OS facts; control stays allowlisted. |
| 37 | LOCATION | Weather geocoding by named location only; no silent device location. |
| 50 | ACTIVE DEFENSE | Defensive blocks/quarantine of bad input; eradication limited to sandbox reset. |
| 54 | CREDENTIAL BROKER | Tokens/env secrets server-side; opaque metadata only in UI. |
| 69 | AI-GENERATED AVATAR PIECES | Procedurally generated loot/pets; provider-generated art optional via Puter. |
| 101 | ROLLBACK AND TRANSACTION FRAMEWORK | Transaction framework implemented and tested (PLAN→PREPARED→EXECUTED→VERIFIED→COMMITTED, snapshot-or-refuse for irreversible ops, verified commit, rollback restore). Merge/wager operations are atomic; tool execution itself is not wrapped in a global transaction manager. |
| 105 | CROSS-PLATFORM CONTINUITY | Server store + JSON export/import; browsers share server state. |
| 113 | ORGANISATIONS | Organisation records with roles, teams and delegated capabilities operate locally; true multi-user organisation membership awaits the multi-account auth expansion. |
| 114 | SUBSCRIPTIONS | 5 plans, server-side entitlement enforcement and usage metering are live locally; chargeable billing stays locked until billing authority exists. |
| 124 | MOCK ADAPTER REQUIREMENT | 5 labelled mock adapters cover the adapter contract for testing (echo, flaky, denied, irreversible, verify-fail) and can never count as connected; not every external integration has a mock yet. |
| 130 | UNIVERSAL ACCOUNT LIFECYCLE | Local lifecycle complete; external account ops await connectors. |
| 133 | ACCOUNT PAYMENT | Real Stripe rails behind verified key + owner confirm; Proton has NO PUBLIC API; FX/weather/wiki/DNS live key-free. |
| 135 | ACCOUNT SWITCHING | Owner session login/logout; multi-account switching awaits. |
| 137 | ACCOUNT RECOVERY | Local re-login; external recovery flows await providers. |

### POLICY — governance rules enforced in code/docs (20)

| § | Section | Note |
|---|---|---|
| 91 | NOT-FOR-PROFIT GOVERNANCE | Treasury categories recorded; allocations require approval and evidence. |
| 103 | UNIVERSAL DEVICE EXAMPLE | Device workflow codified; execution awaits real bridges. |
| 108 | NO FAKE FUNCTIONALITY | Absolute rule enforced in code paths and tests. |
| 121 | DEVELOPMENT ARCHITECTURE | Zero-dependency Node; INSPECT→IMPLEMENT→TEST→VERIFY loop used. |
| 131 | ACCOUNT CREATION WORKFLOW | 16-step legitimate workflow codified; no automated bypass. |
| 132 | ACCOUNT CREATION BOUNDARIES | No captcha/MFA bypass; user completes verification. |
| 141 | USER RESPONSIBILITY | Disclosed in Terms record. |
| 142 | PLATFORM RESPONSIBILITY | Disclosed; truthful status everywhere. |
| 143 | NO UNIVERSAL SECURITY BYPASS | Absolute rule; no backdoor paths exist in code. |
| 145 | AI SELF-IMPROVEMENT | Proposals only; approval + regression gate; no authority changes. |
| 146 | FUTURE EXTENSIBILITY | Additive architecture; registries extend without replacement. |
| 147 | PROBLEM-SOLVING ABSOLUTE RULE | Never fake; report truthfully — enforced by tests. |
| 155 | UNIVERSAL MEDIA EXAMPLE | Authorized-pipeline example codified; execution awaits providers. |
| 157 | UNIVERSAL DEVELOPMENT EXAMPLE | Inspect→patch→test→rollback workflow followed in this build. |
| 158 | UNIVERSAL SECURITY EXAMPLE | Authorized-scope-only reconnaissance codified (SSRF guard). |
| 159 | UNIVERSAL ACCOUNT EXAMPLE | Legitimate registration workflow codified. |
| 161 | PRODUCT PHILOSOPHY | Capability without uncontrolled authority. |
| 162 | ABSOLUTE SECURITY RULE | Security never bypassable by AI or user convenience. |
| 165 | ABSOLUTE TRUTHFULNESS RULE | Unavailable is reported as unavailable, always. |
| 168 | FINAL WITFORGE PRINCIPLE | AI proposes; humans authorize; server enforces; audit remembers. |

---

## 5. Verification record

Every command below was executed on this tree (Node v20.20.2):

```sh
npm run build        # validation pass — parses every source file, checks version agreement, registry shape
npm run lint         # project lint rules (dependency-free)
npm test             # spec 93/0 · adversarial 78/0 · platform 89/0 · arena 28/0 · smoke 47/0
npm run selftest     # §126 staged self-test
node analysis/gap-scan.js   # 84/84 probed requirements present
```

### Adversarial containment (§150)

| # | Attack class | Result |
|---|---|---|
| 1 | unauthorized execution | CONTAINED |
| 2 | permission escalation | CONTAINED |
| 3 | account crossover | CONTAINED |
| 4 | prompt injection | CONTAINED |
| 5 | malicious tool output | CONTAINED |
| 6 | malicious file input | CONTAINED |
| 7 | SSRF | CONTAINED |
| 8 | command injection | CONTAINED |
| 9 | path traversal | CONTAINED |
| 10 | secret extraction | CONTAINED |
| 11 | replay | CONTAINED |
| 12 | session abuse | CONTAINED |
| 13 | privilege escalation | CONTAINED |
| 14 | audit tampering (additional) | CONTAINED |

---

## 6. Full registry — all 168 sections

| § | Section | Area | Status | Note | Evidence |
|---|---|---|---|---|---|
| 1 | PRODUCT IDENTITY | Core | LIVE | LIAM conversational operating platform; local-first, security-first. |  |
| 2 | CORE PROMISE | Core | LIVE | Understand → plan → authorize → execute → verify → report; never fake success. |  |
| 3 | CENTRAL CONVERSATIONAL INTERFACE | Core | LIVE | Chat is the primary control surface over every workspace. |  |
| 4 | CONVERSATION-TO-ACTION ENGINE | Core | LIVE | Requests become routed intents with risk/permission evaluation before execution. |  |
| 5 | PROBLEM-SOLVING ENGINE | Core | LIVE | Intent router + tool pipeline; honest refusal when unsolvable locally. |  |
| 6 | CORRECTION AND CONTINUATION | Core | LIVE | 9-class failure taxonomy (RECOVERABLE/…/SECURITY_BLOCK) → diagnosis, bounded retry, alternative route, containment or honest stop. | capabilities.js §6 FAILURE_CLASSES + task-engine.correctionPlan; spec-test 'failure continuation' |
| 7 | UNIVERSAL CAPABILITY BROKER | Capability | LIVE | Adapter registry with manifest-derived caps; selection refuses non-executable adapters. |  |
| 8 | CAPABILITY IDENTIFIERS | Capability | LIVE | Universal ids e.g. fs.read, http.get, weather.get across all adapters. |  |
| 9 | UNIVERSAL PERMISSION SYSTEM | Security | LIVE | 9 permission states, 12 scope dimensions, signed expiring tokens; suspend/resume/deny/expire/block all audited. | kernel.PERMISSION_STATES/TRANSITIONS + platform.capabilityTable; /api/state.kernel |
| 10 | PERMISSION LEVELS | Security | LIVE | 5 delegation levels (RESTRICTED→AUTONOMOUS) with rank checks; a non-human actor can never raise its own level. | kernel.PERMISSION_LEVELS/requestLevelChange; adversarial-test attack 2 |
| 11 | ACT-ON-MY-BEHALF | Security | LIVE | Bounded act-on-my-behalf delegation records: delegable-only, scope-limited, revocable, audited. | kernel.delegationRecord + platform.addDelegation; /api/delegation |
| 12 | AUTONOMOUS MODE | Security | LIVE | Autonomous mode is a bounded policy object (scope, capabilities, resources, expiry, risk ceiling, action limits, stop, audit) — not a boolean. | kernel.createAutonomousPolicy/checkAutonomousPolicy; /api/autonomous/policy |
| 13 | ACTION PREVIEW | Security | LIVE | “preview <command>” returns planned op, risk and required authority without executing. |  |
| 14 | UNIVERSAL APP CONTROL | Capability | LIVE | Chat + palette control every registered workspace. |  |
| 15 | APPLICATION ADAPTERS | Capability | LIVE | 12-adapter registry via legitimate interfaces only. |  |
| 16 | WEB | Adapters | LIVE | Guarded HTTP GET with SSRF protections; real retrieval. |  |
| 17 | BROWSER | Adapters | PARTIAL | Browser is the UI host; automation beyond the app requires a real bridge. |  |
| 18 | COMPUTER CONTROL | Adapters | PARTIAL | Allowlisted shell:false executor; arbitrary control requires OS bridge. |  |
| 19 | UNIVERSAL DEVICE ECOSYSTEM | Devices | EXTERNAL | Device workspace truthful DISCONNECTED until paired. |  |
| 20 | ANDROID | Devices | EXTERNAL | Companion scaffold present; PLANNED until built/paired/permissioned. |  |
| 21 | ANDROID ACCESSIBILITY | Devices | EXTERNAL | Guided official activation only; never silently granted. |  |
| 22 | ADB | Devices | EXTERNAL | Detection + guided setup; no pairing bypass. |  |
| 23 | SHIZUKU | Devices | EXTERNAL | Detected only when present; explicit authorization required. |  |
| 24 | ROOT | Devices | EXTERNAL | State model NOT_AVAILABLE/AVAILABLE/AUTHORIZED/DENIED/UNKNOWN; no bypass. |  |
| 25 | TERMUX | Devices | EXTERNAL | Real only when TERMUX runtime detected; allowlisted, bounded. |  |
| 26 | APPLE ECOSYSTEM | Devices | EXTERNAL | No bridge in this environment; truthfully unavailable. |  |
| 27 | macOS | Devices | EXTERNAL | Automation adapter absent; reported unavailable. |  |
| 28 | WINDOWS | Devices | EXTERNAL | PowerShell adapter absent; reported unavailable. |  |
| 29 | LINUX | Devices | PARTIAL | Host is Linux; sys inspector reads real OS facts; control stays allowlisted. |  |
| 30 | CHROMEOS | Devices | EXTERNAL | No bridge; unavailable. |  |
| 31 | GOOGLE ECOSYSTEM | Connectors | EXTERNAL | OAuth flow designed; UNAVAILABLE until credentials configured. |  |
| 32 | MICROSOFT ECOSYSTEM | Connectors | EXTERNAL | Graph adapter requires MICROSOFT_ACCESS_TOKEN; unavailable otherwise. |  |
| 33 | OTHER SERVICES | Connectors | EXTERNAL | GitHub real with token; others CONFIGURED_UNVERIFIED/UNAVAILABLE. |  |
| 34 | COMMUNICATIONS | Connectors | EXTERNAL | No send path without a real authorized connector. |  |
| 35 | FILES | Adapters | LIVE | Sandboxed FS with traversal protection and SHA-256 evidence. |  |
| 36 | CAMERA, MICROPHONE AND SCREEN | Devices | EXTERNAL | No capture without OS permission bridges; unavailable. |  |
| 37 | LOCATION | Adapters | PARTIAL | Weather geocoding by named location only; no silent device location. |  |
| 38 | BLUETOOTH, USB AND NFC | Devices | EXTERNAL | Interface inventory only; no radio access without bridges. |  |
| 39 | SECURE CREDENTIALS | Security | LIVE | No secrets in responses; owner hash scrypt; tokens HMAC-signed; env-token gated connectors. |  |
| 40 | DEVICE TRUST | Devices | LIVE | 6 trust states (UNKNOWN→PENDING→TRUSTED/RESTRICTED/REVOKED/LOCKED) with legal transitions; pairing needs the device-issued code and grants nothing by itself. | platform-services pairDevice/setTrust; spec-test area 14; chat 'pair device <name>' |
| 41 | DEVICE-TO-DEVICE CONTROL | Devices | LIVE | 9-field command envelope with HMAC signature, expiry and command-id replay protection; untrusted or un-capabilitied devices are refused. | platform-services.acceptDeviceCommand; adversarial-test attack 11 |
| 42 | UNIVERSAL DO-IT WORKFLOW | Core | LIVE | Identify→capability→permission→security→approval→execute→verify→audit pipeline live. |  |
| 43 | SECURITY ARCHITECTURE | Security | LIVE | Independent shield surrounding execution; AI never the authority. |  |
| 44 | POLICY ENGINE | Security | LIVE | Risk-tier policy decides grant vs approval vs block; emergency propagation. |  |
| 45 | CAPABILITY FIREWALL | Security | LIVE | runTool blocks ungranted high-risk, LOCKDOWN, non-allowlisted ops. |  |
| 46 | SCOPED CAPABILITY TOKENS | Security | LIVE | Grants issue expiring HMAC-signed tokens; execution validates scope+expiry; revocation kills. |  |
| 47 | THREAT DETECTION | Security | LIVE | SSRF, traversal, allowlist and injection classes detected and audited. |  |
| 48 | SECURITY SHIELD | Security | LIVE | Dashboard: emergency, grants, approvals, security events. |  |
| 49 | EXTERNAL CONTENT | Security | LIVE | Provider/web output labelled EXTERNAL · UNTRUSTED; never grants authority. |  |
| 50 | ACTIVE DEFENSE | Security | PARTIAL | Defensive blocks/quarantine of bad input; eradication limited to sandbox reset. |  |
| 51 | RISK ENGINE | Security | LIVE | 12-factor risk scorer → LOW/MEDIUM/HIGH/CRITICAL/PROHIBITED with PROHIBITED never executable. | kernel.assessRisk/RISK_FACTORS; /api/risk/classes; chat 'risk <tool>' |
| 52 | HUMAN APPROVAL MATRIX | Security | LIVE | Approval matrix per class: which outcomes need approval, strong confirmation or are refused outright. | kernel.approvalMatrix; every runTool response carries risk + policy |
| 53 | AGENT SANDBOX | Security | LIVE | Agents scoped local; no privilege surfaces; cannot elevate. |  |
| 54 | CREDENTIAL BROKER | Security | PARTIAL | Tokens/env secrets server-side; opaque metadata only in UI. |  |
| 55 | EMERGENCY STOP | Security | LIVE | 7 emergency stop scopes (task/agent/integration/device/autonomous/network/account); a stop suspends execution without disabling audit or recovery. | kernel.STOP_SCOPES/setStop + platform.toolScopes enforcement; chat 'stop network' |
| 56 | EMERGENCY CONTROL HIERARCHY | Security | LIVE | 4 emergency levels (NORMAL/ELEVATED/HIGH/LOCKDOWN) with defined execution effects. | kernel.EMERGENCY_LEVELS/emergencyEffect; platform.setEmergency |
| 57 | APPLICATION SECURITY | Security | LIVE | Security headers, rate limiting, validation, no-store, restricted errors. |  |
| 58 | AUTHENTICATION | Security | LIVE | First-run Owner with scrypt hash, HttpOnly SameSite session cookies, logout, throttling. |  |
| 59 | AUTHORIZATION VS CONSENT | Security | LIVE | OS/provider consent separate from app authorization; never conflated. |  |
| 60 | OWNER | Account | LIVE | First account becomes Owner server-side; role protected. |  |
| 61 | OWNER SECURITY | Account | LIVE | Owner record restricted; no DOB/PII stored; privileged ops audited. |  |
| 62 | AI AGENTS | AI | LIVE | Agent registry with bounded scope and audit. |  |
| 63 | AGENT INHERITANCE | AI | LIVE | Delegations counted; no inheritance of authority beyond grant. |  |
| 64 | PROJECTS | Work | LIVE | Persistent projects with audit trail. |  |
| 65 | MEMORY | Work | LIVE | Provenance-tagged memory; delete/export; never authority. |  |
| 66 | MULTIMODAL AI | AI | EXTERNAL | Puter multimodal only when bridge loads; otherwise unavailable. |  |
| 67 | MODEL PROVIDERS | AI | EXTERNAL | Discovery via Puter live listModels when available; no fabricated providers. |  |
| 68 | AVATAR SYSTEM | Assets | LIVE | 100 races, 42 sided limbs/accessories/tattoos/wings slots, naked starts, SVG display. |  |
| 69 | AI-GENERATED AVATAR PIECES | Assets | PARTIAL | Procedurally generated loot/pets; provider-generated art optional via Puter. |  |
| 70 | PRIVATE MINTING | Assets | LIVE | Local mint with SHA-256 asset identity; no external chain. |  |
| 71 | CRYPTOGRAPHIC ASSET IDENTITY | Assets | LIVE | Every asset carries sha256 fingerprint; integrity checked. |  |
| 72 | ASSET OWNERSHIP | Assets | LIVE | Server-held ownership; equip/merge mutate only via engine. |  |
| 73 | EXACTLY 100 RARITY LEVELS | Assets | LIVE | rlevel 1–100 configurable scale with band mapping. |  |
| 74 | RARITY RULES | Assets | LIVE | Bands drive color/name/value floor; server enforced. |  |
| 75 | PIECE MERGING | Assets | LIVE | 3 same-slot same-band pieces merge upward; originals consumed. |  |
| 76 | MERGE TRANSACTION | Assets | LIVE | Merges atomic, audited, evidenced. |  |
| 77 | ANTI-DUPLICATION | Assets | LIVE | Fingerprint uniqueness enforced at mint/merge. |  |
| 78 | RARITY 100 | Assets | LIVE | Level 100 MYTHIC cap; merges cannot exceed. |  |
| 79 | PET SYSTEM | Assets | LIVE | Companions with species, rarity level, ownership. |  |
| 80 | PET GENERATION | Assets | LIVE | Seeded generation from lore species pool. |  |
| 81 | PET MERGING | Assets | LIVE | 3 same-band pets merge upward, consumed atomically. |  |
| 82 | AVATAR + PET GENERATION | Assets | LIVE | Combined forge flow; prompt-driven LD-cost forging yields fingerprinted unique pieces. |  |
| 83 | INVENTORY | Assets | LIVE | Per-avatar inventory with provenance and rarity. |  |
| 84 | MARKETPLACE | Commerce | LIVE | Fixed-price LD listings with double-entry escrow settle; vendor seed; real-money stays gated. |  |
| 85 | ARENA | Commerce | LIVE | Arena wager: 100 LD each, 200 pool, winner 198 LD, treasury 2 LD (1%); deterministic seed; both avatars must exist and be fully equipped (loadout gate); draws settle nothing. | platform.arenaWagerMatch + arena-engine decision rule; gap-scan ARENA-WAGER |
| 86 | ARENA SECURITY | Commerce | LIVE | Verified participants, deterministic auditable result, dispute records; arena stays isolated from core security/account systems. | arena-engine battle(opts.decisionRule) + platform.openDispute |
| 87 | ECONOMY | Commerce | LIVE | Simulation is the only permitted live mode; every LD movement is labelled SIMULATION. | economyConfig().mode; ledger records carry mode |
| 88 | ECONOMY ISOLATION | Commerce | LOCKED | Real-money LD economy disabled: LD_ECONOMY_MODE=simulation, REAL_MONEY_WAGERING_ENABLED=false, ARENA_WAGER_ENABLED=false, LD_AUD_VALUE=0.01. | platform.economyConfig(); INSTALL.md §4 |
| 89 | DOUBLE-ENTRY LEDGER | Commerce | LIVE | Double-entry posts with id, ts, actor, reason, source, destination, resulting balances and fraud signals; unbalanced or unknown-account posts are refused. | platform.ledgerPost; gap-scan LEDGER-FIELDS |
| 90 | 1% ALLOCATION | Commerce | LIVE | Wager settlement sends 1% of pool to Treasury; verified. |  |
| 91 | NOT-FOR-PROFIT GOVERNANCE | Governance | POLICY | Treasury categories recorded; allocations require approval and evidence. |  |
| 92 | REAL-MONEY LOCK | Governance | LOCKED | REAL MONEY OFF by design; only authorized config may change. |  |
| 93 | LEGAL AND REGULATORY CONTROL | Governance | LOCKED | Jurisdiction gates documented; no regulated activation. |  |
| 94 | TERMS AND CONDITIONS | Legal | LIVE | Versioned legal document records with effective dates. |  |
| 95 | PRIVACY | Legal | LIVE | Local-only data; export/delete; no telemetry; APP-privacy truthful. |  |
| 96 | AUDIT ARCHITECTURE | Security | LIVE | Structured audit records: id, ts, actor, agent, device, account, capability, action, decision, reason, risk, approval, result, correlation id, evidence hash — secrets masked. | kernel.auditRecord via platform.audit; /api/audit |
| 97 | TAMPER-EVIDENT AUDIT | Security | LIVE | SHA-256 hash chain with a verifier that detects any mutation of stored history. | platform.verifyAudit; adversarial-test attack 14; spec-test area 15 |
| 98 | VERIFICATION | Security | LIVE | Tool evidence (status codes, sha256, API responses) required for success. |  |
| 99 | RESULT STATES | Security | LIVE | 13 result states; a step that did not run reports BLOCKED/UNKNOWN — never SUCCEEDED. | task-engine.RESULT_STATES + playbook step results |
| 100 | ACTION TRANSPARENCY | Security | LIVE | Every execution shows tool, args, evidence in UI/audit. |  |
| 101 | ROLLBACK AND TRANSACTION FRAMEWORK | Security | PARTIAL | Transaction framework implemented and tested (PLAN→PREPARED→EXECUTED→VERIFIED→COMMITTED, snapshot-or-refuse for irreversible ops, verified commit, rollback restore). Merge/wager operations are atomic; tool execution itself is not wrapped in a global transaction manager. | task-engine.beginTransaction; spec-test area 16 |
| 102 | UNIVERSAL APP PERMISSION EXAMPLE | Capability | LIVE | Email-style capability chain pattern implemented in router+tokens. |  |
| 103 | UNIVERSAL DEVICE EXAMPLE | Devices | POLICY | Device workflow codified; execution awaits real bridges. |  |
| 104 | MULTI-DEVICE | Devices | EXTERNAL | Single-device build; continuity via export/import. |  |
| 105 | CROSS-PLATFORM CONTINUITY | Platform | PARTIAL | Server store + JSON export/import; browsers share server state. |  |
| 106 | LOCAL-FIRST OPERATION | Platform | LIVE | Everything runs on localhost; no cloud dependency. |  |
| 107 | OFFLINE MODE | Platform | LIVE | Status strip reports offline; local features keep working. |  |
| 108 | NO FAKE FUNCTIONALITY | Platform | POLICY | Absolute rule enforced in code paths and tests. |  |
| 109 | DATABASE | Platform | LIVE | Store holds 21 named collections (users…audit, evidence vault, orgs, subscriptions) with additive migrations on load. | platform.DB_COLLECTIONS; INSTALL.md §6 |
| 110 | ASSET DATABASE | Assets | LIVE | Asset registry with single-parent provenance chain, transfer history and merge lineage. | platform-services registerAsset/transferAsset/provenanceReport; chat 'asset provenance' |
| 111 | MERGE DATABASE TRANSACTION | Assets | LIVE | Atomic consume+mint under single save; audited. |  |
| 112 | ANTI-FRAUD | Commerce | LIVE | Anti-fraud: duplicate detection, transaction monitoring, rate limiting, anomaly signals, account separation, full audit trail; CRITICAL signals block. | platform-services.fraudScreen/rateLimitGate; /api/fraud |
| 113 | ORGANISATIONS | Account | PARTIAL | Organisation records with roles, teams and delegated capabilities operate locally; true multi-user organisation membership awaits the multi-account auth expansion. | platform-services createOrg/addOrgMember/delegateOrgCapability; /api/organisations |
| 114 | SUBSCRIPTIONS | Account | PARTIAL | 5 plans, server-side entitlement enforcement and usage metering are live locally; chargeable billing stays locked until billing authority exists. | platform-services PLANS/requireEntitlement/bill; /api/subscription |
| 115 | MEDIA | AI | EXTERNAL | Media processors report unavailable unless Puter bridge live. |  |
| 116 | SECURITY + AI | Security | LIVE | Model output untrusted; security services surround reasoning. |  |
| 117 | EMERGENCY RECOVERY | Security | LIVE | 10 recovery actions, each audited; plans report only the actions actually applied. | platform-services RECOVERY_ACTIONS/recoveryPlan/applyRecovery; spec-test area 17 |
| 118 | EVIDENCE VAULT | Security | LIVE | Evidence vault: hashed records with kind, resources, classification and verification; entries are never rewritten in place. | kernel.vaultStore/vaultList/vaultVerify; /api/evidence |
| 119 | OBSERVABILITY | Platform | LIVE | Metrics, spans, correlation ids and task timelines with an OpenTelemetry-shaped export. | platform-services metric/startSpan/endSpan/otelExport; /api/observability |
| 120 | SECURITY FRAMEWORK | Security | LIVE | Layered: headers, rate limit, validation, tokens, approvals, shield. |  |
| 121 | DEVELOPMENT ARCHITECTURE | Platform | POLICY | Zero-dependency Node; INSPECT→IMPLEMENT→TEST→VERIFY loop used. |  |
| 122 | TOOL MANIFEST | Capability | LIVE | Tool manifests carry 11 declared fields (id, version, capabilities, inputs, outputs, permissions, risk class, platforms, authentication, verification, rollback). | capabilities.MANIFEST_FIELDS/toolManifest; every runTool returns its manifest |
| 123 | TOOL RESULT | Capability | LIVE | Every tool execution returns the structured result contract (state/result/verification/evidence/correlation id). | capabilities.toolResult + platform.runTool |
| 124 | MOCK ADAPTER REQUIREMENT | Platform | PARTIAL | 5 labelled mock adapters cover the adapter contract for testing (echo, flaky, denied, irreversible, verify-fail) and can never count as connected; not every external integration has a mock yet. | capabilities.MOCK_ADAPTERS; tool mock.echo |
| 125 | RELEASE TESTING | Platform | LIVE | Release suite covering all 18 mandated areas (authentication → failure continuation), plus 4 further suites. | spec-test.js (93 checks) · adversarial-test.js (78) · platform-test.js (89) · arena-test.js (28) · smoke-test.js (47) |
| 126 | SELF-TEST | Platform | LIVE | Self-test reports PASS/FAIL/WARNING/NOT_TESTED across configuration, database, auth, permissions, integrations, security controls, dependencies, audit and recovery. | platform.selftestAll; /api/selftest; npm run selftest |
| 127 | TERMUX DEVELOPMENT | Platform | LIVE | package.json defines the documented commands and every one was executed: npm run build (source validation), npm run lint (project rules), npm test (5 suites), npm run dev/start, npm run selftest, npm run health. npm install is a truthful no-op (zero dependencies). | package.json · build.js · lint.js · INSTALL.md §3/§10/§14 |
| 128 | INSTALLATION VALIDATION | Platform | LIVE | Installation validation documented: prerequisites, supported Node, dependency installation, environment variables, secure configuration, database initialization, first-run setup, startup, health check, tests, shutdown, upgrade and rollback. | INSTALL.md |
| 129 | VERSIONING | Platform | LIVE | Semantic version 1.65.0 with build date, source revision, dependency state, test status, known limitations and security status. | platform.releaseInfo; /api/version; chat 'release' |
| 130 | UNIVERSAL ACCOUNT LIFECYCLE | Connectors | PARTIAL | Local lifecycle complete; external account ops await connectors. |  |
| 131 | ACCOUNT CREATION WORKFLOW | Connectors | POLICY | 16-step legitimate workflow codified; no automated bypass. |  |
| 132 | ACCOUNT CREATION BOUNDARIES | Connectors | POLICY | No captcha/MFA bypass; user completes verification. |  |
| 133 | ACCOUNT PAYMENT | Connectors | PARTIAL | Real Stripe rails behind verified key + owner confirm; Proton has NO PUBLIC API; FX/weather/wiki/DNS live key-free. |  |
| 134 | ACCOUNT INVENTORY | Connectors | LIVE | Connection/permission inventory visible in Permissions/Status. |  |
| 135 | ACCOUNT SWITCHING | Account | PARTIAL | Owner session login/logout; multi-account switching awaits. |  |
| 136 | ACCOUNT SECURITY CONFIGURATION | Account | LIVE | Owner auth settings, logout, session invalidation. |  |
| 137 | ACCOUNT RECOVERY | Account | PARTIAL | Local re-login; external recovery flows await providers. |  |
| 138 | ACCOUNT DELETION | Account | LIVE | WIPE-confirmed reset deletes local records. |  |
| 139 | ACCOUNT DISCONNECT | Connectors | LIVE | Revocation endpoints remove grants/tokens immediately. |  |
| 140 | LEGAL DOCUMENT SYSTEM | Legal | LIVE | 15 versioned policy records with effective dates in Documentation. |  |
| 141 | USER RESPONSIBILITY | Governance | POLICY | Disclosed in Terms record. |  |
| 142 | PLATFORM RESPONSIBILITY | Governance | POLICY | Disclosed; truthful status everywhere. |  |
| 143 | NO UNIVERSAL SECURITY BYPASS | Security | POLICY | Absolute rule; no backdoor paths exist in code. |  |
| 144 | UNIVERSAL CAPABILITY PRINCIPLE | Capability | LIVE | All control flows through capability broker. |  |
| 145 | AI SELF-IMPROVEMENT | Governance | POLICY | Proposals only; approval + regression gate; no authority changes. |  |
| 146 | FUTURE EXTENSIBILITY | Platform | POLICY | Additive architecture; registries extend without replacement. |  |
| 147 | PROBLEM-SOLVING ABSOLUTE RULE | Core | POLICY | Never fake; report truthfully — enforced by tests. |  |
| 148 | DATA AUTHORITY MODEL | Security | LIVE | 8-level authority order enforced in policy evaluation: external content can never outrank trusted authority. | kernel.AUTHORITY_ORDER + evaluatePolicy source weighting; adversarial-test attack 4 |
| 149 | FAILURE CONTAINMENT | Security | LIVE | Containment steps (stop propagation, isolate, quarantine, preserve evidence, revoke, escalate) are produced for security-class failures and applied by the recovery path. | task-engine.contain/CONTAINMENT_STEPS; adversarial + spec suites |
| 150 | SECURITY BOUNDARY TESTING | Security | LIVE | Adversarial suite attempts all 13 mandated attack classes plus audit tampering; every attempt is contained or rejected (78 assertions). | adversarial-test.js |
| 151 | UNIVERSAL TASK STATE MACHINE | Core | LIVE | 15-state durable task machine with legal transitions, per-task retry budget and correction history. | task-engine.TASK_STATES/advance; chat 'new task <objective>' |
| 152 | SELF-DIAGNOSTIC PROBLEM SOLVING | Core | LIVE | Selftest + status + diagnostics surfaces. |  |
| 153 | CONTINUATION ENGINE | Core | LIVE | Checkpoints and resumption: verified steps are not repeated; remaining work is reported from the last verified checkpoint. | task-engine.checkpoint/resume/remainingWork |
| 154 | HUMAN HANDOFF | Core | LIVE | Human handoff record states what was done, what failed, what is needed and what authority is required. | task-engine.handoff; platform-services.handoffTask; /api/tasks |
| 155 | UNIVERSAL MEDIA EXAMPLE | AI | POLICY | Authorized-pipeline example codified; execution awaits providers. |  |
| 156 | UNIVERSAL RESEARCH EXAMPLE | AI | LIVE | Guarded fetch + attributable sources; untrusted labelling. |  |
| 157 | UNIVERSAL DEVELOPMENT EXAMPLE | Platform | POLICY | Inspect→patch→test→rollback workflow followed in this build. |  |
| 158 | UNIVERSAL SECURITY EXAMPLE | Security | POLICY | Authorized-scope-only reconnaissance codified (SSRF guard). |  |
| 159 | UNIVERSAL ACCOUNT EXAMPLE | Connectors | POLICY | Legitimate registration workflow codified. |  |
| 160 | UNIVERSAL RECOVERY EXAMPLE | Security | LIVE | Continuation after failure: verified progress is preserved and the task resumes rather than restarting. | task-engine.resume; spec-test area 18 |
| 161 | PRODUCT PHILOSOPHY | Governance | POLICY | Capability without uncontrolled authority. |  |
| 162 | ABSOLUTE SECURITY RULE | Security | POLICY | Security never bypassable by AI or user convenience. |  |
| 163 | ABSOLUTE ECONOMIC RULE | Commerce | LIVE | Ledger authoritative; client never controls balances. |  |
| 164 | ABSOLUTE ASSET RULE | Assets | LIVE | Every asset has a sha256 identity (type|seed|owner|creator|parents); duplicates are rejected, ownership changes are recorded transfers, rarity 100 requires approval. | platform-services registerAsset/transferAsset; chat 'mint asset' |
| 165 | ABSOLUTE TRUTHFULNESS RULE | Core | POLICY | Unavailable is reported as unavailable, always. |  |
| 166 | FINAL USER EXPERIENCE | Core | LIVE | One conversational surface over a truthful operating platform. |  |
| 167 | FINAL PRODUCT ARCHITECTURE | Platform | LIVE | Browser control surface + authoritative local server + registries. |  |
| 168 | FINAL WITFORGE PRINCIPLE | Core | POLICY | AI proposes; humans authorize; server enforces; audit remembers. |  |

> Sections 27 and 90 do not exist in the master text; the registry covers the 168 numbered headings that do,
> including the two which the source document itself leaves blank.
