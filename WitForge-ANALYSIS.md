# WitForge / LIAM — Full Repository & Project Analysis
**Repo:** [doomed689/WitForge](https://github.com/doomed689/WitForge) · **Analysed:** 2026-09-19 · **HEAD:** `5424c3e` (v1.78.0, `npm test` all-green at analysis time) · **Analyst:** in-repo agent, informed by operating the live instance all day

> This supersedes the v1.73.0-era snapshot earlier in this file. The earlier verdict holds; the platform has since grown by ~1,400 LOC, five releases, and one major new architectural layer.

---

## 1 · Verdict (TL;DR)

**WitForge is a serious piece of software.** It is a *local-first, security-first conversational operating platform* — not a chat UI, not an "agent wrapper". Its defining property is a **truth architecture enforced in code**: every capability, connector, AI provider, task step and economy post carries an explicit state (`LIVE / EXTERNAL / PARTIAL / LOCKED / POLICY`, `PASS / FAIL / WARNING / NOT_TESTED`), and the test suites contain **adversarial tests whose entire job is proving the system refuses rather than pretends**. That is a rarer and harder thing to build than features, and it shows in every layer, from the spec-ledger to the runtime self-test that reports 22 PASS / 3 WARNING / 2 NOT_TESTED instead of claiming 27/27.

Measured against its peers (single-developer agent platforms), it is unusually **honest, unusually well-specified, and unusually well-tested for a zero-dependency Node codebase**. Its weakest points are exactly where you'd expect: a 3,274-line core file, a non-atomic JSON store, and a security posture that is *superb once an owner is registered* and deliberately opt-in before that.

## 2 · Metrics (measured, not guessed)

| Metric | Value | Note |
|---|---|---|
| Files tracked | **49** | js/html/css/md only; runtime data git-ignored |
| Total LOC (js+html+css) | **14,053** | of which ~2,400 is `analysis/` one-off patch tooling |
| Product code | **~9,900** | 13 hand-written modules + UI |
| Test code | **~1,730** | 6 suites, **561 checks, 0 failures** |
| **Runtime dependencies** | **0** | pure Node ≥18 stdlib; `devDependencies` also `{}` |
| API routes | **73** | `/api/*` in server.js |
| UI modules | **40** registered, **33 LIVE** | the others truthfully not-yet |
| Spec ledger | **186 requirements** | 116 LIVE · 17 PARTIAL · 24 EXTERNAL · 7 LOCKED · 22 POLICY |
| Legal records | **21** | seeded, versioned, incl. Global Trust Charter |
| Releases in repo history | **v1.58 → v1.78** | 10 landed **today** (2026-09-19) |
| Commit history | **28 commits** | disciplined, versioned, single-purpose |

## 3 · Architecture map

```
┌─ Browser ─ index.html (shell, 73) · styles.css (design system, 588)
│            app.js (1,385) — 40 UI modules, offline-degrades gracefully
├─ Edge ──── server.js (503) — 73 routes, security headers + CSP,
│            120-req/min non-GET rate limit, owner-session gate,
│            chat-over-HTTP, OAuth callback, export/import
├─ Core OS ─ platform.js (3,274) — state + persistence, tamper-evident
│            audit chain, 9-state capability machine, approvals, human
│            steps, risk classes, emergency stop, proposal engine,
│            command router (~78 intents), credential vault, owner auth,
│            SSRF-guarded HTTP, LLM wiring, compliance gates
├─ Normative machinery (the spec made code):
│   kernel.js (500)       §9–§55: permissions/levels/delegation/bounded
│                         autonomy/policy engine/scoped tokens/12-factor
│                         risk/fate matrix/7-scope emergency stop
│   capabilities.js (320) §8 declarative capability catalogue (truthful states)
│   task-engine.js (532)  durable tasks, honest failure taxonomy, rollback, playbooks
│   owner-security.js(390)TOTP from scratch, guardian charter screening,
│                         protection report split COVERED/PARTIAL/OUT-OF-SCOPE
├─ Brains ── llm.js (244) — 6 providers (5 cloud free-tier + Ollama
│            loopback-only), injected network edge, ensemble + consensus,
│            v1.78 command-atlas system prompt
│   oauth.js (140) — 6 social OAuth providers, PKCE, single-use states, pure builders
├─ Economy / play ─ engagement.js (490) — LD ledger (double-entry in
│            caller-supplied hooks), commit→reveal lotto, deterministic quests
│   arena-engine.js (475) + races.js (126) — server-authoritative battles
└─ Data ──── data/platform.json (SQLite-less, single JSON file,
             git-ignored, AES-256-GCM creds inside)
```

**Dependency analysis:** zero npm packages is a *load-bearing* design decision. TOTP, OAuth PKCE, AES-256-GCM, scrypt, SSRF DNS pinning, commit→reveal lotto — all hand-rolled on `crypto`/`dns`/`net`/`http`. That removes the entire supply-chain risk class and every "dependency broke prod" failure mode, at the cost of owning the crypto implementations (which are thin wrappers over Node primitives — the right layer to hand-roll).

## 4 · The truth architecture (the product's thesis)

Most agent platforms say "powerful". This one says "correct, honest, trustworthy" — in its own charter (21 legal records, sealed §94 additive-amendment rule) — and then **makes the claim testable**:

1. **States, not vibes.** Capabilities (`capabilities.js`), connectors, LLM providers, OAuth apps, task steps each carry explicit state enums. A capability that isn't available says `WAITING_FOR_CAPABILITY`, `SETUP REQUIRED`, `UNAVAILABLE — connect <id> with token <key>`. Never a spinner forever.
2. **Adversarial tests as philosophy.** The 78-check adversarial suite feeds junk API tokens to connectors and asserts the *real platform refusals* come back ("reported not faked"). The platform suite proves SSRF DNS-rebinding blocks, path traversal blocks, unbalanced ledger rejection, expired-capability refresh paths. The v1.78 fallback tests prove a rate-limited provider is reported as `ai-error` — *never* mislabelled "no provider connected".
3. **Tamper-evident audit.** Append-only chain with hash links, secret masking on ingest, and `verifyAudit()` — the self-test includes "tamper-evident audit chain verifies".
4. **Runtime self-test with honest vocabulary.** `selftestAll()` returns 22 PASS / 0 FAIL / **3 WARNING / 2 NOT_TESTED** — and the five non-passes are the *correct* five: "owner authentication configured" (this instance: no owner registered), "anti-fraud screens" (rules-based, limits stated), "integration availability" (network-dependent), "model provider configured" (not dry-testable), "device bridges" (no hardware). A platform that would rather print NOT_TESTED than PASS is a platform you can read dashboards from.

## 5 · The conversational OS (v1.78 anatomy)

The chat is an **operating shell**, three layers deep:

1. **Rule router first** (~78 audited intents): deterministic instant answers (tasks, plans, lotto, weather, briefing…). Fast, free, auditable.
2. **Atlas-grounded LLM fallback**: unmatched text goes to the connected provider (gemini-first) with a system prompt listing **only the exact real command forms** — measured live today: real proposals (`connections`, `buy a lotto ticket`), zero hallucinated commands after grounding.
3. **Proposals, never self-execution**: the model's `SUGGEST:` line becomes a recorded 📋 proposal. Only the human's `do pr<N>` executes — back through the audited router, where capability state, risk class, and approvals apply. Prompt injection has no execution path: worst case, a persuasive suggestion lands in a queue a human reads, with provenance (`source: 'ai-fallback'`) in the audit.

Safety ordering is exactly right: *deterministic rules outrank the model; the model proposes; the human disposes; the router enforces.*

## 6 · Security posture

**Verified controls (all live-tested or test-proven in repo):** SSRF guard with DNS resolution + private/loopback/metadata blocking + redirect no-follow + 8s timeouts · sandbox path-traversal guard · AES-256-GCM credential vault, tokens write-only (never returned by any API) · scrypt owner auth (N=16384 r=8 p=1), 32-byte random sessions, HttpOnly SameSite=Strict cookies, 5-fails/min login throttle · CSP + security headers + nosniff/frame-deny · OAuth single-use 10-min states, PKCE on X · secrets masked in audit · single-use approvals · capability TTLs with honest EXPIRED→REQUESTED refresh · emergency stop across 7 scopes · guardian layer screening agent actions (refuses self-authorization, exfiltration, control-reversal, untrusted-data instructions) · real-money wagering compliance-locked behind two env flags + a licensing block, not "flip a boolean" · PROHIBITED risk class provably cannot execute.

**Honest gaps / risks, ranked:**

| # | Finding | Severity | Note |
|---|---------|----------|------|
| 1 | **`save()` is a non-atomic `writeFileSync` of the entire state.** A crash mid-write = corrupt store; no backup/rotation. | **Medium** | Trivial fix (tmp-write + rename, keep N backups). Top candidate for a v1.79 hardening pass. |
| 2 | **Vault key adjacency.** AES key = `sha256(S.secret)` where `S.secret` lives in the same `platform.json` as the ciphertext — real encryption, but both halves travel in one file. | Medium-low | Fine against API leakage/accidental commits (achieved); a full-file theft undoes it. OS-keychain binding is the honest next step. |
| 3 | **Unauthenticated until an owner registers.** The API accepts commands POST-side while `S.owner` is null (enforcement engages on first-run creation). | Deployment-dependent | Architectural choice, honored here as the owner's standing decision — recorded as fact, not re-litigated. |
| 4 | **Version drift in cache-busters**: `index.html` pins `/app.js?v=1.73.0` while the platform is 1.78.0. | Cosmetic | Browsers keep stale-ish assets boundary; sweep the pins with the version next release. |
| 5 | `platform.js` at **3,274 LOC** is absorbing every concern; the kernel/capabilities extraction (v1.65-v1.78) is the right direction that should continue (vault, oauth glue, router table). | Maintainability | Not yet at pain threshold; the modularity trend is correct. |
| 6 | `analysis/patch*.js` (~2.4k LOC of one-off patch scripts) committed in tree. | Cosmetic | History-preserving; an `analysis/ARCHIVED.md` note or folder rename would remove ambiguity. |
| 7 | Puter.js loads from `js.puter.com` (the single external runtime dep, CSP-allowlisted, labelled untrusted in UI). | Low | Graceful offline; documented. |
| 8 | Single-process, in-memory rate limiting/login throttle. | Low at current scale | Correct for local-first; would need shared stores if ever multi-instance. |

## 7 · Test & release discipline

Eight gates must pass to ship (all ran green for v1.78.0): **spec (93)** · **adversarial (78)** · **platform (187)** · **arena (28)** · **engagement (117)** · **smoke (58)** = 561 checks + **build**, **lint**, **selftest**. Plus `gap-scan.js` requirement probes **89/89**.

Test isolation is done properly: per-suite `mkdtemp` data dirs via `PLATFORM_DATA`/`ARENA_DATA` env overrides, a scripted fake Ollama on an isolated port (never the real 11434), injected network edges into `llm.js`/`platform.js`, dry OAuth wire builders asserted byte-for-byte without network. Today's one failing test even proved the environment honest: with the fake Ollama *up*, an unruled chat *truthfully* gets an AI answer — the test asserting "no provider" belonged after the fake's shutdown, and the suite was restructured to match reality rather than vice versa.

## 8 · Project trajectory

v1.58→v1.78 in 28 disciplined single-purpose commits; ten landed today at an average of ~90 min/release including full-gate green each time — **stripe rails → ad agent → plan ladder → charter → credentials → OAuth → conversational layer**. The pattern each release: build → gate → live-verify against real providers → document → commit exactly once (no fixup chains in history). The changelog discipline (README/STATUS updated per release, version swept across code) is held — with the single `index.html?v=` drift noted above.

Bottleneck is obvious and acknowledged: it's a one-author, agent-assisted velocity machine, which is why *process* (gates, live verification, adversarial tests) carries so much weight — it compensates for absent human peer review.

## 9 · Scorecard

| Dimension | Grade | Evidence |
|---|---|---|
| Truthfulness engineering | **A+** | state enums, adversarial refusal tests, honest selftest vocabulary |
| Security engineering | **A−** | verified controls list; docked for findings #1–#3 |
| Test rigor | **A** | 561 checks, proper isolation, 89/89 requirement probes |
| Architecture | **B+** | clean layering, zero-dep discipline; core file needs the ongoing extraction to continue |
| Docs & traceability | **A** | 186-req ledger, 21 legal records, README/STATUS in lockstep |
| Velocity | **A+** | 10 major releases in a day, gate green each time |
| Feature completeness (vs own spec) | **B+** | 116/186 fully LIVE by design honesty — includes 31 EXTERNAL/LOCKED/POLICY that are *declared* not-done rather than faked |

**Bottom line:** the most trusted-word in this codebase is *not* a marketing page — it's `NOT_TESTED`. Everything I've probed today says the rest of the system lives up to that word.
