# LIAM Status

- **App:** LIAM Control Centre **v1.66.0** — local-first, truth-stated
- **Local:** `npm run dev` (or `node server.js`) → http://localhost:8787 (`PORT` overrides)
- **Hosted preview:** https://doomed689.github.io/WitForge/ (static; offline banner when no backend)
- **Connector states:** github VERIFIED (doomed689); weather/FX/wiki/DNS/HN/countries AVAILABLE key-free; stripe UNAVAILABLE until key; proton NO PUBLIC API (truthful)
- **Specification coverage:** 170 requirements registered (168 master sections + 2 platform) — **109 LIVE · 16 PARTIAL · 21 EXTERNAL · 4 LOCKED · 20 POLICY**, evidence pointers in the `Spec` workspace (`/api/spec/compliance`)
- **Requirement probes:** `node analysis/gap-scan.js` → **84/84 present**
- **Tests:** spec 93 · adversarial 78 · platform 106 · arena 28 · engagement 117 · smoke 57 — **479 checks, 0 failures**
- **Release gate:** `npm run build` · `npm run lint` · `npm test` · `npm run selftest` — all green on Node v20.20.2
- **v1.66 human gates:** any tool that meets a captcha/2FA/consent/credential gate pauses as `WAITING_FOR_HUMAN`; the owner completes the gate and answers with `resolve <step> with <answer>` in Chat (or `POST /api/human-steps/:id/resolve`); the answer is single-use (`pending → resolved → consumed`), masked in audit, never a permission; `stop <step>` cancels. The platform completes no captcha and defeats no human gate. Registry #169 `LIVE`, #170 real-money `LOCKED` (see `ROADMAP-REAL-MONEY.md`). Fixed in the same release: the chat HTTP route now awaits the async command router — replies were serialized as `{}` since `command()` went async.
- **v1.65 chat surface:** every piece costs LD (forge/provision/pet/merge) · LD bought and sold in-app at a disclosed 5% spread (`SIMULATION`) · events with entry-fee prize pools · lotto 6/49 with commit→reveal proof and a settlement that refuses to post unless it balances · sign-in gifts (10/20/35/50/75/110/200 LD) and 4 daily + 4 weekly tasks · 4 personal + 4 business subscription tiers (billing not chargeable) · owner protection (TOTP RFC 6238, sessions, alerts, drills) and a 10-duty guardian with a 14-threat matrix (8 COVERED · 4 PARTIAL · 2 OUT-OF-SCOPE: OS/hardware compromise, physical coercion)
- **Economy:** simulation only (`LD_ECONOMY_MODE=simulation`, `LD_AUD_VALUE=0.01`, `REAL_MONEY_WAGERING_ENABLED=false`, `ARENA_WAGER_ENABLED=false`) — real money COMPLIANCE-LOCKED
- **Docs:** installation/upgrade/rollback validation in `INSTALL.md`; upgrade history in `README.md`; real-money unlock path in `ROADMAP-REAL-MONEY.md`

> Written via the LIAM `github write` chat command (approval-gated, audited).
