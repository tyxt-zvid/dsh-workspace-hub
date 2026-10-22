// Client-half test: loading the browser bundle and applying it with a minimal
// Cordis-like context must register the slot surfaces without throwing. The
// dev-server UI lives on those surfaces (header hub button + server pill), so
// the old keyboard-shortcut registration must be gone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const React = {
  Fragment: Symbol('Fragment'),
  createElement: (type, props, ...children) => ({ type, props, children }),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
};

const realSetInterval = globalThis.setInterval;
globalThis.setInterval = () => 0;

let clientFactory;
async function loadClient() {
  if (clientFactory !== undefined) return clientFactory;
  let definition;
  const originalWindow = globalThis.window;
  globalThis.window = {
    __ModuleLoader__: {
      load: (value) => {
        definition = value;
      },
    },
  };
  try {
    await import(new URL('../client.js', import.meta.url).href);
  } finally {
    globalThis.window = originalWindow;
  }
  assert.ok(definition, 'client.js must call window.__ModuleLoader__.load');
  assert.equal(definition.id, '@local/dsh-workspace-hub');
  clientFactory = definition.factory((name) => {
    assert.equal(name, 'react');
    return React;
  });
  return clientFactory;
}

function makeContext() {
  const registrations = [];
  const injections = [];
  let injectCalled = false;
  const ctx = {
    locale: {
      bind: () => (key, params) => (params === undefined ? key : `${key} ${JSON.stringify(params)}`),
      register: () => () => {},
    },
    effect: (factory) => {
      const dispose = factory();
      return () => {
        if (typeof dispose === 'function') dispose();
      };
    },
    slots: {
      entries: () => [],
      subscribe: () => () => {},
      inject: (name, callback) => {
        injections.push(name);
        const dispose = callback();
        return typeof dispose === 'function' ? dispose : () => {};
      },
      register: (options, component) => {
        registrations.push({ options, component });
        return () => {};
      },
    },
    sessions: {
      list: { getSnapshot: () => ({ byId: {} }) },
      subagentAddress: () => undefined,
    },
    uiWorkspace: { openSession: () => {} },
    layout: { selectPanel: () => {} },
    inject: () => {
      injectCalled = true;
      throw new Error('client apply must not inject the shortcuts service');
    },
  };
  return { ctx, registrations, injections, injected: () => injectCalled };
}

const SOURCE = () => readFileSync(new URL('../client.js', import.meta.url), 'utf8');

test('client apply mounts the UI surfaces without a shortcuts service', async () => {
  const factory = await loadClient();
  const { ctx, registrations, injected } = makeContext();
  assert.doesNotThrow(() => factory.apply(ctx), 'apply must not throw');

  const byName = new Map();
  for (const entry of registrations) {
    const list = byName.get(entry.options.name) ?? [];
    list.push(entry.options);
    byName.set(entry.options.name, list);
  }
  const expectedSlots = [
    'main',
    'sidebar.panellist',
    'conversation.header.leading',
    'sidebar.workspaces.session.row.action',
    'sidebar.session.row.hover',
    'sidebar.session.row.leading',
    'shell.overlay',
  ];
  assert.deepEqual(
    [...byName.keys()].sort(),
    [...expectedSlots].sort(),
    'the hub must register exactly the global slot surfaces',
  );
  const main = byName.get('main') ?? [];
  assert.deepEqual(
    main.map((options) => options.key),
    ['workspace-hub'],
    'the hub must expose one global main panel keyed workspace-hub',
  );
  const navEntries = byName.get('sidebar.panellist') ?? [];
  assert.deepEqual(
    navEntries.map((options) => options.id),
    ['workspace-hub'],
    'the sidebar panellist must expose the global hub entry',
  );
  assert.equal(navEntries[0]?.order, 20, 'the hub panel entry must keep the sidebar order');
  assert.equal(typeof navEntries[0]?.label, 'function', 'the sidebar entry must expose a locale label');
  assert.ok(byName.has('conversation.header.leading'), 'header entry (hub button + server pill) must be registered');
  assert.ok(byName.has('sidebar.workspaces.session.row.action'), 'sub-chat row action must stay registered');
  assert.ok(byName.has('sidebar.session.row.hover'), 'sub-chat hover card must stay registered');
  assert.ok(byName.has('sidebar.session.row.leading'), 'sub-chat leading badge must stay registered');
  const overlay = byName.get('shell.overlay') ?? [];
  assert.deepEqual(
    overlay.map((options) => options.id),
    ['workspace-hub-subchat-menu'],
    'only the sub-chat overlay remains; the shortcut toast overlay must be gone',
  );
  assert.equal(injected(), false, 'no ctx.inject (shortcuts) call may remain');
  assert.deepEqual(factory.inject, ['slots', 'locale', 'uiWorkspace', 'layout', 'sessions']);
});

test('client apply survives a context without workspaces/sessions data', async () => {
  const factory = await loadClient();
  const { ctx } = makeContext();
  ctx.sessions = {};
  assert.doesNotThrow(() => factory.apply(ctx));
});

test('client source keeps the console data and interaction contracts', () => {
  const source = SOURCE();
  assert.match(source, /call\('hub\.snapshot'/, 'the panel must prefer hub.snapshot');
  assert.match(source, /call\('context'/, 'the panel must keep the legacy context fallback');
  assert.match(source, /call\('tasks\.restore'/, 'delete undo must use tasks.restore');
  assert.match(source, /subchats\.send/, 'sub chat send must be wired');
  assert.match(source, /subchats\.interrupt/, 'sub chat interrupt must be wired');
  assert.match(source, /subchats\.close/, 'sub chat close must be wired');
  assert.match(source, /subchats\.reopen/, 'sub chat reopen must be wired');
  assert.match(source, /workspace-hub:view:v2:/, 'view state must persist under the v2 key');
  assert.match(source, /call\('hub\.overview'/, 'All workspaces must be fed by hub.overview');
  assert.match(source, /hub\.catalog/, 'the workspace switcher must use hub.catalog');
  assert.match(source, /sidebar\.panellist/, 'the sidebar panellist entry must be registered');
  assert.match(source, /workspace-hub:selection:v1/, 'the global selection must persist');
  assert.match(source, /key: PANEL_ID/, 'the hub main panel must use the global PANEL_ID key');
  assert.equal(source.includes('workspace-hub:${workspaceId}'), false, 'no per-workspace panel keys may remain');
  assert.equal(source.includes('syncPanels'), false, 'the per-workspace panel loop must be gone');
  assert.match(source, /role: 'dialog'/, 'overlays must expose a dialog role');
  assert.match(source, /onKeyDown/, 'keyboard handling must live on the panel root');
});

test('client source has no blocking dialogs, gradients, emoji or off-scale type', () => {
  const source = SOURCE();
  assert.equal(source.includes('window.confirm'), false, 'window.confirm must be gone');
  assert.equal(source.includes('linear-gradient'), false, 'no gradients are allowed');
  assert.equal(/font-size:\s*10\.5px/.test(source), false, '10.5px type is off-scale');
  assert.equal(/ctx\.inject\(/.test(source), false, 'no shortcuts service injection');
  const sizes = [...source.matchAll(/font-size:\s*([0-9.]+)px/g)].map((match) => Number(match[1]));
  const allowed = new Set([10, 11, 12, 13, 14, 15, 20]);
  assert.deepEqual(
    [...new Set(sizes)].filter((size) => !allowed.has(size)),
    [],
    `font sizes must stay on the host scale, found ${[...new Set(sizes)].join(', ')}`,
  );
  const hardcodedHex = [...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)]
    .map((match) => match[0])
    .filter((value) => value !== '#');
  assert.deepEqual(hardcodedHex, [], `hardcoded hex colors are not allowed: ${hardcodedHex.join(', ')}`);
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  assert.deepEqual([...source.matchAll(emoji)].map((match) => match[0]), [], 'emoji icons are not allowed');
});

process.on('exit', () => {
  globalThis.setInterval = realSetInterval;
});
