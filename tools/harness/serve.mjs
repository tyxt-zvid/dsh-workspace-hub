#!/usr/bin/env node
/*
 * Static server for the Workspace Hub harness.
 *
 * Serves the harness page, the REAL repo client.js (read from disk per request,
 * so re-running picks up edits), harness scripts and the React UMD bundles from
 * the /tmp dependency install created by build.mjs.
 *
 *   node tools/harness/serve.mjs [--port 4180]
 *
 * No dependencies are installed into the repo; see README.md.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HARNESS_DIR, '..', '..');
export const DEPS_DIR = process.env.WH_HARNESS_DEPS ?? '/tmp/wh-harness-deps';
const NODE_MODULES = join(DEPS_DIR, 'node_modules');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function file(path) {
  const response = await readFile(path);
  return response;
}

export function startServer({ port = 4180, host = '127.0.0.1' } = {}) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, {
        'content-type': type,
        'cache-control': 'no-store, no-cache, must-revalidate',
        'access-control-allow-origin': '*',
      });
      response.end(body);
    };
    try {
      if (pathname === '/' || pathname === '/index.html') {
        return send(200, await file(join(HARNESS_DIR, 'index.html')), MIME['.html']);
      }
      if (pathname === '/client.js') {
        // Always read the repo file: this is the artifact under test.
        const source = await readFile(join(REPO_ROOT, 'client.js'));
        return send(200, source, MIME['.js']);
      }
      if (pathname === '/health') {
        return send(200, JSON.stringify({ ok: true, repoRoot: REPO_ROOT, depsDir: DEPS_DIR, clientMtimeMs: (await stat(join(REPO_ROOT, 'client.js'))).mtimeMs }), MIME['.json']);
      }
      if (pathname.startsWith('/vendor/')) {
        const name = pathname.slice('/vendor/'.length);
        const map = {
          'react.js': join(NODE_MODULES, 'react/umd/react.development.js'),
          'react-dom.js': join(NODE_MODULES, 'react-dom/umd/react-dom.development.js'),
        };
        const target = map[name];
        if (target === undefined || !existsSync(target)) {
          return send(500, `missing vendor bundle ${name}; run: node tools/harness/build.mjs`);
        }
        return send(200, await file(target), MIME['.js']);
      }
      const harnessFile = join(HARNESS_DIR, pathname.replace(/^\//, ''));
      if (harnessFile.startsWith(HARNESS_DIR) && existsSync(harnessFile) && (await stat(harnessFile)).isFile()) {
        return send(200, await file(harnessFile), MIME[extname(harnessFile)] ?? 'application/octet-stream');
      }
      return send(404, `not found: ${pathname}`);
    } catch (error) {
      return send(500, `harness server error: ${String(error?.stack ?? error)}`);
    }
  });
  return new Promise((resolvePromise, reject) => {
    const listen = (candidate, allowFallback) => {
      const onError = (error) => {
        if (allowFallback && error.code === 'EADDRINUSE') {
          server.removeListener('error', onError);
          listen(0, false);
          return;
        }
        reject(error);
      };
      server.once('error', onError);
      server.listen(candidate, host, () => {
        server.removeListener('error', onError);
        const address = server.address();
        const actualPort = typeof address === 'object' && address !== null ? address.port : candidate;
        resolvePromise({ server, port: actualPort, url: `http://${host}:${actualPort}/` });
      });
    };
    listen(port, port !== 0);
  });
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const portArg = process.argv.indexOf('--port');
  const port = portArg >= 0 ? Number(process.argv[portArg + 1]) : Number(process.env.WH_HARNESS_PORT ?? 4180);
  if (!existsSync(join(NODE_MODULES, 'react/umd/react.development.js'))) {
    console.error(`[harness] React bundles not found in ${NODE_MODULES}. Run: node tools/harness/build.mjs`);
    process.exit(1);
  }
  const { url } = await startServer({ port });
  console.log(`[harness] serving ${REPO_ROOT}/client.js at ${url}`);
  console.log(`[harness] examples:`);
  console.log(`  ${url}?theme=dark&view=default`);
  console.log(`  ${url}?theme=light&view=overview&data=full`);
  console.log(`  ${url}?theme=dark&view=palette`);
  const shutdown = () => process.exit(0);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
