/**
 * Read-only workspace facts for the hub panel: the instruction chain that
 * applies to sessions in this workspace and the skills visible to them.
 *
 * No writes: rules are ordinary AGENTS.md/CLAUDE.md files resolved the same way
 * the standard agent preset resolves them (project root = nearest `.git` ancestor,
 * else the workspace itself), and skills come from the shared skill registry.
 */
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { homedir } from 'node:os';
import { readTextFile, writeTextFileDurable } from './store.js';

const BASE_FILES = ['AGENTS.md', 'CLAUDE.md'];
const LOCAL_FILES = ['AGENTS.local.md', 'CLAUDE.local.md'];
const PROJECT_MARKER = '.git';
const CONTEXT_RELATIVE = ['.dsh', 'workspace-hub', 'CONTEXT.md'];
const SKILLS_RELATIVE = ['.dsh', 'skills'];
const MAX_RULE_BYTES = 262144;
const MAX_CONTEXT_BYTES = 262144;
const MAX_SKILL_BODY_BYTES = 65536;
const SKILL_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function dshHome() {
  const configured = process.env.DSH_HOME;
  return configured !== undefined && configured.length > 0 ? configured : join(homedir(), '.dsh');
}

function agentsHome() {
  const configured = process.env.DSH_AGENTS_HOME;
  return configured !== undefined && configured.length > 0 ? configured : join(homedir(), '.agents');
}

async function fileInfo(path) {
  try {
    const stats = await stat(path);
    if (!stats.isFile()) return { path, exists: false };
    return { path, exists: true, bytes: stats.size };
  } catch {
    return { path, exists: false };
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/** Nearest ancestor containing `.git`, else `start` itself (matches the preset). */
export async function findProjectRoot(start) {
  let directory = start;
  for (;;) {
    if (await isDirectory(join(directory, PROJECT_MARKER))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return start;
    directory = parent;
  }
}

/** Directories from `root` down to `leaf`, broad to specific. */
function directoriesBetween(root, leaf) {
  if (root !== leaf && !leaf.startsWith(root.endsWith(sep) ? root : root + sep)) return [leaf];
  const list = [];
  let directory = leaf;
  for (;;) {
    list.push(directory);
    if (directory === root) break;
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return list.reverse();
}

function displayFor(directory, workspaceRoot, file) {
  const prefix = relative(workspaceRoot, directory);
  return prefix.length === 0 ? file : `${prefix}/${file}`;
}

/** Instruction chain plus the skills visible to this workspace. Read-only. */
export async function workspaceInfo(ctx, workspaceRoot, sessionId) {
  const projectRoot = await findProjectRoot(workspaceRoot);
  const directories = directoriesBetween(projectRoot, workspaceRoot);

  const project = [];
  for (const directory of directories) {
    for (const file of [...BASE_FILES, ...LOCAL_FILES]) {
      const info = await fileInfo(join(directory, file));
      project.push({
        scope: 'project',
        file,
        display: displayFor(directory, workspaceRoot, file),
        path: info.path,
        exists: info.exists,
        ...(info.bytes === undefined ? {} : { bytes: info.bytes }),
      });
    }
  }

  const global = [];
  for (const [label, home] of [
    ['dsh', dshHome()],
    ['agents', agentsHome()],
  ]) {
    const info = await fileInfo(join(home, 'AGENTS.md'));
    global.push({
      scope: 'global',
      label,
      path: info.path,
      exists: info.exists,
      ...(info.bytes === undefined ? {} : { bytes: info.bytes }),
    });
  }

  const skills = [];
  const service = ctx.get('skills');
  if (service !== undefined) {
    const agents = ctx.get('agents');
    let agent = sessionId === undefined ? undefined : agents?.get(sessionId);
    if (agent === undefined) {
      agent = (agents?.list() ?? []).find((candidate) => candidate.session.header.cwd === workspaceRoot);
    }
    try {
      const catalog = await service.list({
        cwd: workspaceRoot,
        ...(agent === undefined ? {} : { scope: agent }),
      });
      for (const entry of catalog) {
        skills.push({
          name: entry.name,
          description: entry.description,
          source: typeof entry.source === 'string' ? entry.source : 'unknown',
          provider: typeof entry.provider === 'string' ? entry.provider : undefined,
          workspaceScoped: typeof entry.source === 'string' && entry.source.startsWith('project'),
          modelInvocable: entry.invocation?.modelInvocable !== false,
          userInvocable: entry.invocation?.userInvocable !== false,
          ...(typeof entry.path === 'string' ? { path: entry.path } : {}),
        });
      }
    } catch {
      /* an unavailable provider leaves the list empty, not fatal */
    }
  }

  const rulesPath = join(workspaceRoot, 'AGENTS.md');
  const contextPath = join(workspaceRoot, ...CONTEXT_RELATIVE);
  const [rulesContent, contextContent] = await Promise.all([readTextFile(rulesPath), readTextFile(contextPath)]);
  return {
    workspaceRoot,
    projectRoot,
    global,
    project,
    skills,
    files: {
      rulesPath,
      rulesContent: rulesContent ?? null,
      contextPath,
      contextContent: contextContent ?? null,
      skillsDir: join(workspaceRoot, ...SKILLS_RELATIVE),
    },
  };
}

/** Read the hub-managed workspace context file (injected into sessions). */
export async function readWorkspaceContext(workspaceRoot) {
  return readTextFile(join(workspaceRoot, ...CONTEXT_RELATIVE));
}

function assertContent(content, label, limit) {
  if (typeof content !== 'string') throw new Error(label + ' must be a string');
  if (Buffer.byteLength(content, 'utf8') > limit) throw new Error(label + ' is larger than ' + limit + ' bytes');
  return content;
}

/** Save the workspace-level AGENTS.md. Never touches user-global files. */
export async function writeWorkspaceRules(workspaceRoot, content) {
  assertContent(content, 'workspace AGENTS.md', MAX_RULE_BYTES);
  await writeTextFileDurable(join(workspaceRoot, 'AGENTS.md'), content);
  return { path: join(workspaceRoot, 'AGENTS.md') };
}

/** Save the hub-managed workspace context document. */
export async function writeWorkspaceContext(workspaceRoot, content) {
  assertContent(content, 'workspace context', MAX_CONTEXT_BYTES);
  const path = join(workspaceRoot, ...CONTEXT_RELATIVE);
  await writeTextFileDurable(path, content);
  return { path };
}

/** Create one workspace skill bundle at <workspace>/.dsh/skills/<name>/SKILL.md. */
export async function createWorkspaceSkill(workspaceRoot, input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (!SKILL_NAME.test(name)) throw new Error('skill name must be kebab-case (letters, digits, single dashes)');
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  if (description.length === 0) throw new Error('skill description is required');
  if (description.length > 1024) throw new Error('skill description is longer than 1024 characters');
  const body = assertContent(typeof input?.body === 'string' ? input.body : '', 'skill body', MAX_SKILL_BODY_BYTES);
  const directory = join(workspaceRoot, ...SKILLS_RELATIVE, name);
  await mkdir(directory, { recursive: true });
  const text = '---\nname: ' + name + '\ndescription: ' + JSON.stringify(description) + '\n---\n\n' + body.trim() + '\n';
  await writeTextFileDurable(join(directory, 'SKILL.md'), text);
  return { name, path: join(directory, 'SKILL.md') };
}
