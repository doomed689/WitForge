# WitForge Repository Analysis
**Repo:** [doomed689/WitForge](https://github.com/doomed689/WitForge) · **Analysed:** 2026-09-19 · **HEAD:** `aa08d69` (v1.73.0)

## What it is
**LIAM / WitForge v1.73.0** — a *local-first, security-first conversational AI operating platform*. An authoritative Node server (`server.js`, port 8787) with a browser control surface (`app.js`, `index.html`, `styles.css`). The philosophy, stated repeatedly in code and docs: **nothing is simulated as success** — unavailable providers report truthfully with their connect command, high-risk actions are approval-gated, keys are masked in audit logs.

## Architecture (19k LOC, zero runtime dependencies)
| File | Lines | Role |
|---|---|---|
| `platform.js` | 3,169 | Core: command router, ledger, SSRF guard, sandbox, allow-lists, approvals |
| `app.js` | 1,293 | Browser control-surface logic |
| `platform-services.js` | 748 | Connector/service layer (weather, FX, wiki, DNS, HN, GitHub, social…) |
| `task-engine.js` | 532 | Tasks/playbooks |
| `kernel.js` | 500 | Modular kernel split (v1.65) |
| `engagement.js` | 490 | LD economy, events, lotto (simulation-only) |
| `server.js` | 463 | HTTP server + chat-over-HTTP |
| `owner-security.js` | 390 | TOTP, sessions, alerts, lockdown |
| `llm.js` | 229 | **Multi-provider LLM brain** (see below) |
| arena/races/etc. | ~700 | Arena engine, determinism, loadouts |
| `analysis/` | — | Spec gap-scan tooling, one-off patch scripts |

Notable design choice: **zero npm dependencies** (pure Node stdlib). The network edge is *injected* into `llm.js` (`deps.remoteFetch`/`deps.localFetch`) so tests run fully dry.

## Verified quality signals
- ✅ **`npm test` → all suites green right now** on Node v20.20.2 (matches their release gate exactly): spec 93 · adversarial 78 · platform 166 · arena 28 · engagement 117 · smoke 57 = **539 checks, 0 failures**
- ✅ Spec traceability: 176 requirements (115 LIVE / 16 PARTIAL / 21 EXTERNAL / 4 LOCKED / 20 POLICY), `gap-scan.js` probes 89/89
- ✅ Real security engineering: SSRF guards, Ollama loopback-only validation, single-use approvals, capability TTLs, audit tampering tests, human-in-the-loop gates (`WAITING_FOR_HUMAN`)
- ✅ Disciplined history: 15+ versioned commits v1.59→v1.73, meaningful messages, docs (README/STATUS/INSTALL/ROADMAP) kept in lockstep with code
- ✅ Compliance-aware: real-money economy code exists but is hard-locked (`REAL_MONEY_WAGERING_ENABLED=false`), Spam Act 2003 cited for the ad agent's walls

## Weaknesses / risks
| Severity | Finding |
|---|---|
| ⚠️ Medium | **License mismatch:** `package.json` says `UNLICENSED`/`private: true`, but the repo is **public** on GitHub with no LICENSE file |
| ⚠️ Medium | **No CI**: no `.github/workflows` — the "all green" claim relies on someone running suites locally |
| ⚠️ Medium | `platform.js` at 3,169 lines is a god-module; the v1.65 kernel split started, but this remains the monolith risk |
| Low | No type system (plain JS across ~19k LOC), no coverage tooling |
| Low | `analysis/patch1..9.js` — one-off fix scripts committed to the tree (clutter) |
| Low | Account is 4 days old (created 2026-09-15), solo dev, 0 stars/forks — bus factor of 1 |

## OpenRouter integration (your original request) — verified live
**It's already built in** since `c6ddea6` (v1.67), in `llm.js`:

```js
id: 'openrouter', shape: 'openai',
endpoint: 'https://openrouter.ai/api/v1/chat/completions',   // ← exact match to your curl
defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
connect: 'connect openrouter with token <your-free-key>'
```

Live verification with your key (2026-09-19):
- ✅ **`openai/gpt-4o` works** with your key — test call succeeded via Azure upstream ($0.00009)
- ❌ **The project's default model `meta-llama/llama-3.3-70b-instruct:free` is dead** — OpenRouter now returns `404 "This model is unavailable for free"`. Chat through the default provider chain will fail on OpenRouter until `defaultModel` is updated.
- 🔑 Keys are **not** in source by design — they're connected at runtime (`connect openrouter with token <key>`) and persisted in git-ignored `data/`. Your curl belongs in runtime config, not a commit.

## Recommended next steps
1. Patch `llm.js` `defaultModel` → `openai/gpt-4o` (your curl's model) or a currently-working `:free` slug
2. Boot the server, run `connect openrouter with token sk-or-v1-…` in the chat UI to wire your key
3. Add `.github/workflows/node.yml` running `npm test` on push (5-line fix for the CI gap)
4. Decide the license: add a LICENSE file or make the repo private to match `package.json`
