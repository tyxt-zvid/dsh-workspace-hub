# Workspace Hub panel harness

Renders the **real** `client.js` hub surface in headless Chrome with mocked Host
services, so the global All-workspaces home and the workspace console can be
screenshotted/diffed without a running authenticated DSH GUI.

No dependencies are installed into this repo and no build step is added to the
plugin. React 18 and puppeteer-core live in `/tmp/wh-harness-deps`; the harness
serves `client.js` from the repo root on every request, so a re-run always picks
up the latest edit.

## Commands

```bash
# 1. one-time: npm install react@18 react-dom@18 puppeteer-core into /tmp
node tools/harness/build.mjs

# 2. shoot every state (All home dark/light, workspace console, drill-in,
#    palette, dispatch, empty/error/stale, navigation round-trips) at 1440x900
node tools/harness/shoot.mjs

# one state only, e.g. the All-workspaces home
node tools/harness/shoot.mjs --filter 01-all-dark

# 3. optional: interactive server (open the printed URL in a browser)
node tools/harness/serve.mjs --port 4180
#    http://127.0.0.1:4180/?theme=dark&view=all&data=full
```

`shoot.mjs` prints the panel key and writes `tools/harness/shots/report.json`
(panel key/mode, sidebar.panellist, selection, viewState, mock API calls,
actions, runtime errors, client.js sha before/after, layout rects). Chrome is
auto-detected: `CHROME_PATH`, then the Playwright Chrome-for-Testing 1228/1223 in
`~/Library/Caches/ms-playwright`, then `/Applications/Google Chrome.app`.

## What the page does

1. Serves `/client.js` from the repo root (`serve.mjs`), plus the DSH host token
   stylesheet (`theme.css`, extracted from the installed app; regenerate with
   `node tools/harness/extract-theme.mjs`).
2. Captures `window.__ModuleLoader__.load`, calls `factory(name => React)`,
   builds a fake Cordis `ctx` (slots/locale/effect/sessions/uiWorkspace/layout),
   calls `apply(ctx)`.
3. Waits for `main` + key `workspace-hub` (global hub). If only the pre-global
   per-workspace `workspace-hub:<id>` panels register, it falls back to one after
   a 1.5s grace period (transitional support). Renders the panel with
   `{ t, useSessions, useWorkspaces }` (plus legacy slot `inject()` props).
4. Also captures `sidebar.panellist` and mounts it in the fake sidebar
   (`#nav-slot`), so the global entry is verified too.
5. Monkey-patches `window.fetch` so `POST /workspace-hub/api/<method>` returns
   `{ok:true,value}` payloads from `mock-data.js`.

### Query parameters

| param | values | default |
|---|---|---|
| `theme` | `dark`, `light` (toggles `body[data-ds-dark-theme]`) | `dark` |
| `data` | `full`, `empty`, `error`, `stale`, `boarderror` (overview row with `boardError:true`) | `full` |
| `view` | `all`, `default`, `workspace`, `overview`, `tasks`, `sessions`, `sessions-expanded`, `settings`, `servers`, `palette`, `palette-all`, `dispatch`, `all-cards`, `drill-return`, `esc-return`, `ga-return`, `workspace-menu`, `workspace-switch`, `settings-esc`, `home-running-open` | `default` |
| `select` | workspace id or `all`; written to `localStorage['workspace-hub:selection:v1']` before `client.js` runs | scoped views preselect the primary workspace, `all/default` → `all` |
| `shell` | `full`, `bare` (fake 248px sidebar so the panel gets its real ~1192px width) | `full` |
| `latency` | mocked bridge latency in ms | `25` |

`view` is best-effort: the harness clicks the matching nav/button, opens the
workspace switcher, scrolls the All home to the workspace cards, or sends the
keyboard chord (`⌘K`, `Escape`, `g a`). If client labels change, adjust the
`views` map / interaction branches in `harness.js`.

### Mock Host surface (`mock-data.js`)

- 4 workspaces: dsh-plugins (12 tasks / 4 conversations / 3 servers), dsh,
  snippets, website with blocked/doing/failed-server variety.
- `hub.overview`: `{generatedAt, totals, workspaces[]}` per
  `docs/implementation/02-global-hub-brief.md §2` (board + sessions summary +
  servers summary per workspace, cheap — no health probes).
- `hub.snapshot`: resolved by `workspaceId` / `workspacePath` for drill-in.
- `hub.catalog`, `context`, `tasks.list`, `hub.sessions`, `servers.status`,
  `hub.workspace`, `subchats.catalog`, `tasks.*`, `servers.start|stop`,
  `workspace.*` (optimistic mutations keep the in-memory boards consistent).
- `data=empty|error|stale` overrides keep the transport envelope; `hub.catalog`
  stays alive so panel registration can be exercised in error modes.

## Faked host surface (not client.js)

- `ctx.locale.register` captures the plugin dictionary; `t` resolves against it.
- `ctx.effect` runs the factory synchronously.
- `ctx.slots.inject` invokes the callback immediately; `register` records panels.
- `ctx.sessions` is a static `{byId,items}` store covering all mock workspaces;
  `ctx.uiWorkspace.openSession` / `ctx.layout.selectPanel` only log.
- `useSessions` / `useWorkspaces` props read the mock snapshot; localStorage
  starts from a dismissed guide.
- If the panel fails to mount, the page shows `HARNESS BOOT FAILED` with the
  phase that failed (apply / slot discovery / render) plus the mock API log.

## Scenarios (`shoot.mjs`)

`01-all-dark`, `01b-all-cards-dark`, `02-all-light`, `02b-all-cards-light`,
`03-all-bare`, `04-workspace-dark`, `04b-workspace-light`, `05-overview-dark`,
`06-tasks-dark`, `07-sessions-dark`, `07b-sessions-expanded-dark`,
`08-settings-dark`, `09-palette-dark`, `09b-palette-all-dark`,
`10-dispatch-dark`, `11-tasks-light`, `12-settings-light`, `13-empty-dark`,
`14-error-dark`, `15-stale-dark`, `16-all-1280`, `17-drill-return-dark`,
`18-esc-return-dark`, `19-workspace-menu-dark`, `20-workspace-empty-dark`,
`21-workspace-error-dark`, `23-ga-return-dark`, `24-workspace-switch-dark`, `25-settings-esc-dark`,
`26-home-running-open-dark`, `27-board-error-dark`.
