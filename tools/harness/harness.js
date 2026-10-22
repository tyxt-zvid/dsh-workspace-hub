/*
 * Workspace Hub harness runtime.
 *
 * Loads the REAL repo client.js in a browser page, installs the smallest fake
 * Cordis host that satisfies its slot/locale/effect/session dependencies, grabs
 * the global `main` panel (key `workspace-hub`) or, for the pre-global client,
 * the legacy per-workspace panel (key `workspace-hub:<id>`), and renders it with
 * React 18 + mocked Host bridge responses. `sidebar.panellist` is also captured
 * and mounted in the fake sidebar when the plugin registers it.
 *
 * Query parameters:
 *   theme=dark|light   body[data-ds-dark-theme] toggle (default dark)
 *   data=full|empty|error|stale   mock Host payload mode (default full)
 *   lang=zh|en         locale used by the t() passed to the panel (default zh)
 *   view=all|default|workspace|overview|tasks|sessions|sessions-expanded|settings|servers|palette|dispatch
 *   select=<id|all>    preselect a workspace via localStorage (default: all; the
 *                      workspace-scoped views preselect the primary workspace)
 *   shell=full|bare    full = fake 248px sidebar reserving the real main width
 *   latency=ms         mocked bridge latency (default 25)
 *   ready=0            do not wait for the panel's first data load
 *
 * Everything the harness had to fake is listed in window.__WH_HARNESS__.report.
 */
(async () => {
  const params = new URLSearchParams(location.search);
  const pick = (key, fallback) => params.get(key) ?? fallback;
  const theme = pick('theme', 'dark');
  const dataMode = pick('data', 'full');
  const lang = pick('lang', 'zh');
  const view = pick('view', 'default');
  const latency = Number(pick('latency', '25'));
  const shell = pick('shell', 'full');

  document.body.dataset.dsDarkTheme = theme === 'dark' ? '' : undefined;
  if (theme !== 'dark') delete document.body.dataset.dsDarkTheme;
  document.documentElement.dataset.theme = theme;
  if (shell === 'bare') document.body.classList.add('bare');

  window.__WH_ERRORS__ = [];
  window.__WH_ACTIONS__ = [];
  const recordError = (kind) => (error) => {
    window.__WH_ERRORS__.push({ kind, message: String(error?.stack ?? error) });
  };
  window.addEventListener('error', (event) => recordError('window.error')(event.error ?? event.message));
  window.addEventListener('unhandledrejection', (event) => recordError('unhandledrejection')(event.reason));
  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    window.__WH_ERRORS__.push({ kind: 'console.error', message: args.map((value) => String(value?.stack ?? value)).join(' ') });
    originalConsoleError(...args);
  };

  // Guide/tour overlays persisted in localStorage would cover every shot; the
  // harness is for the panel body, so start from a dismissed state.
  const workspaceScopedViews = ['workspace', 'overview', 'tasks', 'sessions', 'sessions-expanded', 'settings', 'servers', 'palette', 'dispatch'];
  const selection = pick('select', workspaceScopedViews.includes(view) ? window.__WH_MOCK__.primaryWorkspaceId : 'all');
  try {
    localStorage.clear();
    localStorage.setItem('workspace-hub:guide:v1', 'dismissed');
    localStorage.setItem('workspace-hub:guide:v2', 'dismissed');
    // The global client persists its selection under this key; prefer it so the
    // page boots directly in the requested workspace instead of the All home.
    localStorage.setItem('workspace-hub:selection:v1', selection);
  } catch {
    /* ignore */
  }

  window.__WH_MOCK__.mode = dataMode;
  window.__WH_MOCK__.reset();

  // ---- mocked bridge: POST /workspace-hub/api/<method> ---------------------
  const apiLog = [];
  const realFetch = window.fetch.bind(window);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    const marker = '/workspace-hub/api/';
    if (!url.includes(marker)) return realFetch(input, init);
    const method = url.slice(url.indexOf(marker) + marker.length).split('?')[0];
    let body = {};
    try {
      body = init?.body === undefined || init.body === '' ? {} : JSON.parse(init.body);
    } catch {
      body = {};
    }
    if (latency > 0) await sleep(latency);
    let envelope;
    try {
      envelope = window.__WH_MOCK__.answer(method, body, window.__WH_MOCK__.mode);
    } catch (error) {
      envelope = { ok: false, error: { code: error.code ?? 'internal', message: String(error.message ?? error) } };
    }
    const status = envelope?.ok === false && envelope?.error?.code === 'unknown-method' ? 404 : 200;
    apiLog.push({ method, body, status, ok: envelope?.ok !== false });
    const text = JSON.stringify(envelope);
    return new Response(text, { status, headers: { 'content-type': 'application/json' } });
  };

  // ---- capture client.js definition ---------------------------------------
  const definition = await (async () => {
    let captured;
    window.__ModuleLoader__ = { load: (value) => { captured = value; } };
    const response = await realFetch('/client.js', { cache: 'no-store' });
    if (!response.ok) throw new Error(`GET /client.js -> ${response.status}`);
    const source = await response.text();
    (0, eval)(`${source}\n//# sourceURL=repo-client.js`);
    if (captured === undefined) throw new Error('client.js did not call window.__ModuleLoader__.load');
    return captured;
  })();

  const React = window.React;
  const ReactDOM = window.ReactDOM;
  let definitionLocaleDict;
  const factory = definition.factory((name) => {
    if (name === 'react') return React;
    throw new Error(`harness: client factory requested un-mocked module ${JSON.stringify(name)}`);
  });

  // ---- fake Cordis ctx -----------------------------------------------------
  const registrations = [];
  const injections = [];
  const calls = [];
  const hostLog = [];
  const noop = () => {};
  const dispose = () => {};
  const ctx = {
    locale: {
      bind: () => (key) => key, // replaced after the dictionary is captured
      register: (namespace, dict) => {
        if (namespace === 'workspace-hub') definitionLocaleDict = dict;
        return dispose;
      },
    },
    effect: (factoryFn) => {
      const result = factoryFn();
      return () => { if (typeof result === 'function') result(); };
    },
    slots: {
      entries: () => [],
      subscribe: () => dispose,
      inject: (name, callback) => {
        injections.push(name);
        const result = callback();
        return typeof result === 'function' ? result : dispose;
      },
      register: (options, component) => {
        registrations.push({ options, component });
        return dispose;
      },
    },
    sessions: {
      list: { getSnapshot: () => ({ byId: {}, items: [] }), subscribe: () => dispose },
      subagentAddress: (id) => (id.startsWith('sc') ? { sessionId: id } : undefined),
    },
    uiWorkspace: { openSession: (id) => hostLog.push({ action: 'openSession', id }) },
    layout: { selectPanel: (id) => hostLog.push({ action: 'selectPanel', id }) },
  };

  // Panel-level translation comes from the dictionary the plugin registers.
  const dictFor = (dictionary, language) => {
    const table = dictionary?.[language] ?? dictionary?.[language?.startsWith('zh') ? 'zh' : 'en'] ?? {};
    return (key, values) => {
      const template = table[key] ?? dictionary?.en?.[key] ?? key;
      if (values === undefined) return template;
      return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
        values[name] === undefined ? match : String(values[name]),
      );
    };
  };

  try {
    if (!Array.isArray(factory.inject) || factory.inject.length === 0) {
      throw new Error('client factory did not declare its inject list');
    }
    factory.apply(ctx);
  } catch (error) {
    recordError('apply')(error);
    throw error;
  }

  const translate = dictFor(definitionLocaleDict, lang);
  window.__WH_DICT__ = definitionLocaleDict;

  // ---- wait for the per-workspace main panel registration ------------------
  const deadline = Date.now() + 8000;
  let panelEntry;
  let legacyFoundAt;
  const findGlobalPanel = () =>
    registrations.find((entry) => entry.options?.name === 'main' && entry.options?.key === 'workspace-hub');
  const findLegacyPanel = () =>
    registrations.find(
      (entry) => entry.options?.name === 'main' && String(entry.options?.key ?? '').startsWith('workspace-hub:'),
    );
  while (Date.now() < deadline) {
    panelEntry = findGlobalPanel();
    if (panelEntry !== undefined) break;
    if (findLegacyPanel() !== undefined) {
      // Transitional support: the pre-global client only registers
      // workspace-hub:<id> panels. Give the global registration a short grace
      // period, then fall back to the legacy panel.
      legacyFoundAt = legacyFoundAt ?? Date.now();
      if (Date.now() - legacyFoundAt > 1500) {
        panelEntry = findLegacyPanel();
        break;
      }
    }
    await sleep(40);
  }
  if (panelEntry === undefined) {
    const mainKeys = registrations.filter((entry) => entry.options?.name === 'main').map((entry) => entry.options?.key);
    throw new Error(
      `no main slot registration (workspace-hub or workspace-hub:<id>) after 8s; registrations = ${JSON.stringify(
        registrations.map((entry) => ({ name: entry.options?.name, key: entry.options?.key, id: entry.options?.id })),
      )}; main keys = ${JSON.stringify(mainKeys)}; api = ${JSON.stringify(apiLog)}`,
    );
  }

  const isGlobalPanel = panelEntry.options.key === 'workspace-hub';
  const slotInject = typeof panelEntry.options.inject === 'function' ? panelEntry.options.inject() : {};
  // The host provides these store hooks; mirror every mock workspace so scope
  // and assignee lookups resolve instead of showing placeholder ids.
  const byId = {};
  const workspaceRows = [];
  const workspaceData = window.__WH_MOCK__.workspaceData ?? {};
  for (const [workspaceId, data] of Object.entries(workspaceData)) {
    workspaceRows.push({
      workspaceId,
      id: workspaceId,
      title: data.title,
      path: data.path,
      sessionIds: data.sessionIds,
    });
    for (const session of data.sessions ?? []) {
      byId[session.sessionId] = {
        id: session.sessionId,
        title: session.title,
        cwd: data.path,
        running: session.running === true,
        updatedAt: session.updatedAt,
        retainedBy: { mainView: workspaceId === window.__WH_MOCK__.primaryWorkspaceId && session.sessionId === (data.sessionIds ?? [])[0] ? 1 : 0 },
      };
      for (const subchat of session.subchats ?? []) {
        byId[subchat.id] = { id: subchat.id, title: subchat.title, cwd: data.path, running: subchat.status === 'running', updatedAt: subchat.updatedAt };
      }
    }
  }
  const sessionsStub = (selector) => selector({ byId, items: Object.values(byId) });
  const workspacesStub = (selector) => selector({ items: workspaceRows });
  const panelProps = isGlobalPanel
    ? {
        t: translate,
        useSessions: sessionsStub,
        useWorkspaces: workspacesStub,
        notify: (message) => hostLog.push({ action: 'notify', message: String(message) }),
        refresh: noop,
      }
    : {
        ...slotInject,
        workspaceId: slotInject.workspaceId ?? window.__WH_MOCK__.workspace.workspaceId,
        workspacePath: slotInject.workspacePath ?? window.__WH_MOCK__.workspace.path,
        sessionId: 's1',
        workspaceTitle: window.__WH_MOCK__.workspace.title,
        t: translate,
        useSessions: sessionsStub,
        useWorkspaces: workspacesStub,
        notify: (message) => hostLog.push({ action: 'notify', message: String(message) }),
        refresh: noop,
      };

  // ---- render --------------------------------------------------------------
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { error: undefined };
    }
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error) {
      recordError('react.render')(error);
    }
    render() {
      if (this.state.error !== undefined) {
        return React.createElement(
          'div',
          { id: 'render-error', style: { padding: 24, color: 'var(--dsw-alias-state-error-primary)', fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap' } },
          `React render failed:\n${String(this.state.error?.stack ?? this.state.error)}`,
        );
      }
      return this.props.children;
    }
  }

  const host = document.querySelector('#panel-host');
  host.innerHTML = '';
  const root = ReactDOM.createRoot(host);
  root.render(
    React.createElement(ErrorBoundary, null, React.createElement(panelEntry.component, panelProps)),
  );

  // ---- sidebar.panellist entry (global hub) --------------------------------
  const panellistEntry = registrations.find((entry) => entry.options?.name === 'sidebar.panellist');
  if (panellistEntry !== undefined) {
    class NavBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: undefined };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error) {
        recordError('panellist.render')(error);
      }
      render() {
        if (this.state.error !== undefined) {
          return React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-state-error-primary)' } }, 'panellist render failed');
        }
        return this.props.children;
      }
    }
    const navSlot = document.querySelector('#nav-slot');
    if (navSlot !== null) {
      ReactDOM.createRoot(navSlot).render(
        React.createElement(
          NavBoundary,
          null,
          React.createElement(panellistEntry.component, {
            t: translate,
            active: true,
            selected: true,
            label: translate('panel.title'),
            onClick: () => hostLog.push({ action: 'panellist-click' }),
          }),
        ),
      );
    }
  }

  // ---- optional post-render interaction for screenshots --------------------
  const clickBy = (patterns) => {
    const clickable = [...document.querySelectorAll('button, [role="tab"], [role="button"], a, [data-act]')];
    for (const pattern of patterns) {
      const target = clickable.find((element) => pattern.test((element.textContent ?? '').trim()) || pattern.test(element.getAttribute('aria-label') ?? ''));
      if (target !== undefined) {
        target.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: (target.textContent ?? target.getAttribute('aria-label') ?? '').trim() });
        return true;
      }
    }
    return false;
  };
  const dispatchKey = (key, options = {}) => {
    const rootElement = host.firstElementChild ?? host;
    const target = document.activeElement ?? rootElement;
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, metaKey: false, ctrlKey: false, ...options });
    target.dispatchEvent(event);
    window.__WH_ACTIONS__.push({ action: 'key', key, target: target.tagName });
  };
  const bodyText = () => document.body.innerText ?? '';
  const inOverlay = (element) =>
    typeof element.closest === 'function' && element.closest('[role="dialog"]') !== null;
  const backToAllButton = () =>
    [...document.querySelectorAll('button, [role="button"], a')].find(
      (element) => inOverlay(element) !== true && /^(←\s*)?所有工作区/.test((element.textContent ?? '').trim()),
    );
  const inWorkspaceView = () =>
    backToAllButton() !== undefined ||
    [...document.querySelectorAll('[role="tab"]')].some(
      (element) => inOverlay(element) !== true && /^(概览|任务|对话|设置)/.test((element.textContent ?? '').trim()),
    );

  const selectionTitle = () => {
    const selectedId = (() => { try { return localStorage.getItem('workspace-hub:selection:v1'); } catch { return undefined; } })();
    return (window.__WH_MOCK__.workspaces ?? []).find((workspace) => workspace.workspaceId === selectedId)?.title;
  };
  const clickWorkspace = (title) => {
    const wanted = title ?? selectionTitle();
    const cardSelectors = ['[data-wh-workspace]', '.wh-ws-card', '.wh-workspace-card', '.wh-card', '.wh-ws-grid > *', '[data-wh-workspaces] > *'];
    for (const selector of cardSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (wanted !== undefined && !(element.textContent ?? '').includes(wanted)) continue;
        (element.closest('button, [role="button"], [tabindex], a') ?? element).click();
        window.__WH_ACTIONS__.push({ action: 'click', text: `workspace-card:${wanted ?? ''}` });
        return true;
      }
    }
    // Fallback: the smallest element whose text is a workspace title, then its
    // nearest clickable ancestor.
    const titles = wanted === undefined ? (window.__WH_MOCK__.workspaces ?? []).map((workspace) => workspace.title) : [wanted];
    const scope = document.querySelector('.wh-root') ?? document.body;
    for (const candidate of scope.querySelectorAll('h2, h3, span, div, button')) {
      const value = (candidate.textContent ?? '').trim();
      if (value.length === 0 || value.length > 80) continue;
      if (!titles.some((entry) => value === entry || value.startsWith(entry))) continue;
      (candidate.closest('button, [role="button"], [tabindex], a') ?? candidate).click();
      window.__WH_ACTIONS__.push({ action: 'click', text: `workspace-title:${value}` });
      return true;
    }
    return false;
  };
  const ensureWorkspace = async (title) => {
    if (inWorkspaceView()) return true;
    if (clickWorkspace(title) === true) {
      await sleep(550);
    }
    return inWorkspaceView();
  };

  const views = {
    overview: [/概览/, /Now/, /总览/],
    tasks: [/^任务/, /Tasks?/],
    sessions: [/^对话/, /^会话/, /Conversations?/, /Sessions?/],
    'sessions-expanded': [/^对话/, /^会话/, /Conversations?/, /Sessions?/],
    settings: [/设置/, /Settings?/, /^工作区$/],
    servers: [/环境/, /服务器/, /Servers?/],
    palette: [],
    dispatch: [/派发/, /Dispatch/],
  };
  await sleep(400);
  try {
    if (view === 'drill-return' || view === 'esc-return') {
      // Navigation round-trip: All home -> workspace -> back to All.
      const entered = await ensureWorkspace();
      if (!entered) window.__WH_ACTIONS__.push({ action: 'missing-workspace-view' });
      await sleep(350);
      if (view === 'drill-return') {
        const back = backToAllButton();
        if (back !== undefined) {
          back.click();
          window.__WH_ACTIONS__.push({ action: 'click', text: '所有工作区' });
          await sleep(550);
        } else {
          window.__WH_ACTIONS__.push({ action: 'missing-back-button' });
        }
      } else {
        host.firstElementChild?.focus?.();
        dispatchKey('Escape', {});
        await sleep(550);
      }
    } else if (view === 'settings-esc') {
      // Settings is a workspace sub-view: Escape must close it, not leave the workspace.
      await ensureWorkspace();
      await sleep(300);
      clickBy([/设置/, /Settings?/, /^工作区$/]);
      await sleep(400);
      host.firstElementChild?.focus?.();
      dispatchKey('Escape', {});
      await sleep(500);
    } else if (view === 'home-running-open') {
      // All home "正在运行" rows open the executor conversation of that workspace.
      if (inWorkspaceView()) {
        backToAllButton()?.click();
        await sleep(450);
      }
      await sleep(250);
      const runningButton = [...document.querySelectorAll('button')].find((button) => (button.textContent ?? '').trim() === '打开');
      if (runningButton !== undefined) {
        runningButton.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: '打开（正在运行）' });
        await sleep(900);
      } else {
        window.__WH_ACTIONS__.push({ action: 'missing-running-open' });
      }
    } else if (view === 'workspace-switch') {
      // Switch from the primary workspace to the small "dsh" workspace via the
      // header switcher menu; the console must re-fetch hub.snapshot for it.
      await ensureWorkspace();
      await sleep(250);
      (document.querySelector('.wh-ws-switch') ?? [...document.querySelectorAll('button')].find((el) => /dsh-plugins/.test(el.textContent ?? '')))?.click();
      await sleep(350);
      const menuItem = [...document.querySelectorAll('button, [role="menuitem"], .wh-menu-row')].find(
        (el) => (el.textContent ?? '').trim() === 'dsh' || (el.getAttribute('aria-label') ?? '').trim() === 'dsh',
      );
      if (menuItem !== undefined) {
        menuItem.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: 'switch-to:dsh' });
        await sleep(700);
      } else {
        window.__WH_ACTIONS__.push({ action: 'missing-workspace-menu-item' });
      }
    } else if (view === 'ga-return') {
      // g then a returns to the All-workspaces home (900ms chord window).
      const entered = await ensureWorkspace();
      if (!entered) window.__WH_ACTIONS__.push({ action: 'missing-workspace-view' });
      await sleep(300);
      host.firstElementChild?.focus?.();
      dispatchKey('g', {});
      await sleep(120);
      dispatchKey('a', {});
      await sleep(550);
    } else if (view === 'all-cards') {
      if (inWorkspaceView()) {
        backToAllButton()?.click();
        await sleep(450);
      }
      await sleep(250);
      const scroller = document.querySelector('.wh-scroll');
      if (scroller !== null) {
        scroller.scrollTop = scroller.scrollHeight;
        window.__WH_ACTIONS__.push({ action: 'scroll', target: 'workspace-cards' });
        await sleep(450);
      }
    } else if (view === 'workspace-menu') {
      await ensureWorkspace();
      await sleep(250);
      const switcher = document.querySelector('.wh-ws-switch') ?? [...document.querySelectorAll('button')].find((element) => /dsh-plugins|工作区中枢/.test(element.textContent ?? ''));
      if (switcher !== undefined) {
        switcher.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: 'workspace-switcher' });
        await sleep(400);
      } else {
        window.__WH_ACTIONS__.push({ action: 'missing-workspace-switcher' });
      }
    } else if (view === 'workspace') {
      const entered = await ensureWorkspace();
      if (!entered) window.__WH_ACTIONS__.push({ action: 'missing-workspace-view' });
    } else if (view === 'all' || view === 'default') {
      // Home is the default selection; normalize if the persisted selection or
      // the client defaulted into a workspace.
      if (inWorkspaceView()) {
        backToAllButton()?.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: '所有工作区' });
        await sleep(450);
      }
    } else if (view === 'palette' || view === 'palette-all') {
      if (view === 'palette') await ensureWorkspace();
      else if (inWorkspaceView()) {
        backToAllButton()?.click();
        window.__WH_ACTIONS__.push({ action: 'click', text: '所有工作区' });
        await sleep(450);
      }
      await sleep(200);
      host.firstElementChild?.focus?.();
      dispatchKey('k', { metaKey: true });
      await sleep(300);
    } else if (view === 'dispatch') {
      // The dispatch sheet opens from an expanded task row: enter the workspace,
      // go to Tasks, expand the first row, then press its exact 派发 action.
      await ensureWorkspace();
      await sleep(250);
      if (document.querySelector('[role="dialog"]') === null) {
        clickBy([/^任务/, /Tasks?/]);
        await sleep(300);
        document.querySelector('.wh-row')?.click();
        await sleep(250);
        const dispatchButton = [...document.querySelectorAll('button')].find((button) => (button.textContent ?? '').trim() === '派发' || (button.getAttribute('aria-label') ?? '').trim() === '派发');
        if (dispatchButton !== undefined) {
          dispatchButton.click();
          window.__WH_ACTIONS__.push({ action: 'click', text: '派发' });
        }
        await sleep(350);
      }
    } else if (views[view] !== undefined) {
      await ensureWorkspace();
      await sleep(250);
      const clicked = clickBy(views[view]);
      if (!clicked) window.__WH_ACTIONS__.push({ action: 'missing-view', view });
      await sleep(350);
      if (view === 'sessions-expanded') {
        // The current conversation is auto-expanded on mount; only click when a
        // session list is not already visible (clicking again would collapse it).
        if (document.querySelectorAll('.wh-subrow').length === 0) {
          document.querySelector('.wh-row[data-kind="session"]')?.click();
          window.__WH_ACTIONS__.push({ action: 'click', text: 'expand first session' });
          await sleep(300);
        }
      }
    }
  } catch (error) {
    recordError('interaction')(error);
  }

  const viewState = {
    inWorkspace: inWorkspaceView(),
    hasBackToAll: backToAllButton() !== undefined,
    homeMarker: /所有工作区/.test(bodyText()),
  };
  window.__WH_HARNESS__ = {
    report: {
      viewState,
      definitionId: definition.id,
      factoryInject: factory.inject,
      theme,
      dataMode,
      lang,
      view,
      slots: registrations.map((entry) => ({ name: entry.options?.name, key: entry.options?.key, id: entry.options?.id, order: entry.options?.order })),
      injections,
      panelKey: panelEntry.options.key,
      panelMode: isGlobalPanel ? 'global' : 'legacy',
      selection,
      panellist: panellistEntry === undefined ? null : { name: panellistEntry.options?.name, id: panellistEntry.options?.id, order: panellistEntry.options?.order },
      panelProps: Object.keys(panelProps),
      localeKeys: Object.keys(definitionLocaleDict?.zh ?? {}).length,
      hostLog,
    },
    apiLog,
    errors: window.__WH_ERRORS__,
    actions: window.__WH_ACTIONS__,
    rerender: () => root.render(React.createElement(ErrorBoundary, null, React.createElement(panelEntry.component, panelProps))),
  };
  document.body.dataset.whReady = '1';
  document.documentElement.dataset.whReady = '1';
  delete window.__ModuleLoader__;
})().catch((error) => {
  window.__WH_ERRORS__ = window.__WH_ERRORS__ ?? [];
  window.__WH_ERRORS__.push({ kind: 'boot', message: String(error?.stack ?? error) });
  const box = document.querySelector('#harness-error');
  if (box !== null) {
    box.textContent = `HARNESS BOOT FAILED\n\n${String(error?.stack ?? error)}\n\napi=${JSON.stringify(window.__WH_HARNESS__?.apiLog ?? [])}`;
    box.classList.add('on');
  }
  document.body.dataset.whReady = 'error';
  document.documentElement.dataset.whReady = 'error';
  console.error(error);
});
