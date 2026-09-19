# LIAM Status

- **App:** LIAM Control Centre **v1.67.0** — local-first, truth-stated
- **Local:** `npm run dev` (or `node server.js`) → http://localhost:8787 (`PORT` overrides)
- **Hosted preview:** https://doomed689.github.io/WitForge/ (static; offline banner when no backend)
- **AI brain (v1.67):** six LLM providers — groq · gemini · openrouter · deepseek · mistral (free-tier keys via `connect <id> with token <key>`) and ollama (local, no key); `ask <anything>` answers labelled `provider · model`; unmatched chat falls back to the brain automatically; missing keys are truth-stated with the free-key path; Ollama is loopback-11434-only
- **Connector states:** github VERIFIED (doomed689); weather/FX/wiki/DNS/HN/countries AVAILABLE key-free; stripe UNAVAILABLE until key; proton NO PUBLIC API (truthful); AI providers FREE KEY / LOCAL until connected
- **Specification coverage:** 171 requirements registered (168 master sections + 3 platform) — **110 LIVE · 16 PARTIAL · 21 EXTERNAL · 4 LOCKED · 20 POLICY**, evidence pointers in the `Spec` workspace (`/api/spec/compliance`)
- **Requirement probes:** `node analysis/gap-scan.js` → **84/84 present**
- **Tests:** spec 93 · adversarial 78 · platform 124 · arena 28 · engagement 117 · smoke 57 — **497 checks, 0 failures**
- **Release gate:** `npm run build` · `npm run lint` · `npm test` · `npm run selftest` — all green on Node v20.20.2
- **v1.66 human gates:** tools that meet a captcha/2FA/consent gate pause as `WAITING_FOR_HUMAN`; owner resolves with `resolve <step> with <answer>`; single-use (`pending → resolved → consumed`), masked, never a permission. Registry #169 LIVE. The chat HTTP route now awaits the async router (replies were `{}` before the fix).
- **v1.65 chat surface:** every piece costs LD · LD market at a disclosed 5% spread (`SIMULATION`) · events · lotto with commit→reveal proof · sign-in gifts and daily/weekly tasks · 4+4 subscription tiers · owner protection (TOTP, sessions, alerts, drills) and the guardian 10-duty/14-threat matrix
- **Economy:** simulation only (`LD_ECONOMY_MODE=simulation`, `LD_AUD_VALUE=0.01`, `REAL_MONEY_WAGERING_ENABLED=false`, `ARENA_WAGER_ENABLED=false`) — real money COMPLIANCE-LOCKED (`ROADMAP-REAL-MONEY.md`)
- **Docs:** installation/upgrade/rollback validation in `INSTALL.md`; upgrade history in `README.md`

> Written via the LIAM `github write` chat command (approval-gated, audited).
