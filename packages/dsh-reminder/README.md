# dsh-reminder

<p align="center"><b>English</b> · <a href="README.zh.md">简体中文</a></p>

**A cross-window reminder plugin for DeepSeek Harness** — while you work in any other window, it taps you on the shoulder the moment a task **finishes** or **waits for your approval**.

<img src="assets/toast-preview.svg" alt="Toast preview" width="720">

---

## Features

| Feature | Description |
|---------|-------------|
| Completion | Pops "Task completed" on every turn end, with session · duration and a green check icon |
| Approval | Pops "Waiting for your approval" with the tool name and an amber alert icon |
| Pops in any window | Notifies even while you work in other apps |
| Click to return | Clicking focuses the DSH window and opens the session |
| Auto-dismiss | Gone in 3-5 s (adjustable) |
| Soft chime | A gentle two-note chime (D4→A4) — nothing startling |
| Deduplicated | Never pops twice for the same event |
| Reminds, never acts | Never approves on your behalf |

---

## Why

- *Nobody calls you for approvals* — the agent waits while you are away; now an amber popup tells you
- *Nobody tells you it's done* — no completion signal before; now a green popup tells you

---

## Quick start

1. **Install**: `dsh plugin --profile web add <dsh-reminder>` (or `npm i dsh-reminder`), register `dsh-reminder` in the profile bundle list, restart the DSH web process
2. **Grant permission**: Settings → Reminders → "Enable & test notifications" → Allow — a test popup arrives instantly
3. **Enjoy**: switch away and work — the popups come to you

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Notification permission | unset | One-click grant + test popup |
| Approval reminders | On | Off = no approval popups |
| Completion reminders | On | Off = no completion popups |
| Duration | 3-5 s | Seconds before auto-dismiss |
| Failure alerts | Off (reserved) | Planned for a later release |

---

## Architecture

One package ships the **host Cordis plugin** and the **web client**:

- **host**: registers the settings namespace plus a plugin-owned Typert Remote (`reminder/getSettings` · `updateSettings`) — plugin namespaces sit outside the web settings allowlist
- **client**: subscribes to the session list and conversation snapshots (turn/end, approval/requested arrive over the mux stream), pops via the Notification API with a Web Audio chime
- **Read-only**: never mutates DSH core behavior

---

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # unit tests under tests/unit
npm run build       # esbuild: host ESM + single-file client bundle
```

- Artifacts: `lib/index.js` (host ESM), `lib/client.js` (client), `lib/types/` (.d.ts)
- Host builds must NOT mark `@deepseek-ai/dsh-*` as external when bundling into a profile runtime that resolves them by real path; keep the peer set optional as declared above.

---

## Known limits

- Chrome page notifications reject `actions` (ServiceWorker persistent notifications only) — dismiss via auto-close or the OS hover close button
- Permission must be requested from a user gesture (browser policy) — the settings button does it in one click
- The chime unlocks on the first click (autoplay policy)

---

## Provenance

Upstream: [Aisland-SJL/dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder). This vendored copy is built locally (upstream tarballs ship without `lib/`) and localized; behavior matches upstream v0.1.0.

## License

[MIT](LICENSE)
