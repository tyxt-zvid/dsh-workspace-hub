// Core logic test: durable board store + pure task operations (no Harness runtime).
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { boardPath, mutateBoard, readBoardFile, mutateJsonFile, readJsonFile, hubFile } from '../lib/store.js';
import { sessionRows, groupWorkspaceSessions } from '../lib/hub.js';
import {
  createWorkspaceSkill,
  findProjectRoot,
  readWorkspaceContext,
  workspaceInfo,
  writeWorkspaceContext,
  writeWorkspaceRules,
} from '../lib/workspace-info.js';
import { Subchats } from '../lib/subchats.js';
import * as T from '../lib/tasks.js';

let failures = 0;
function check(name, condition, detail) {
  if (condition) console.log(`  ok  ${name}`);
  else {
    failures += 1;
    console.error(`FAIL  ${name}${detail === undefined ? '' : ` :: ${detail}`}`);
  }
}
async function throws(name, operation, code) {
  try {
    await operation();
    check(name, false, 'did not throw');
  } catch (error) {
    check(name, code === undefined || error.code === code, `code=${error.code} message=${error.message}`);
  }
}

const root = await mkdtemp(join(tmpdir(), 'workspace-hub-test-'));
const alice = { sessionId: 'session-alice', sessionTitle: undefined };
const bob = { sessionId: 'session-bob', sessionTitle: undefined };

try {
  console.log(`workspace: ${root}`);

  const empty = await readBoardFile(root);
  check('empty board version', empty.version === 1 && empty.revision === 0 && empty.tasks.length === 0);

  const created = await mutateBoard(root, (board) => T.createTask(board, root, alice, { title: 'First task', detail: 'do it' }));
  check('create returns task', created.task.title === 'First task' && created.task.revision === 1);
  check('board revision advanced', created.board === undefined); // result only; re-read below
  let board = await readBoardFile(root);
  check('board persisted revision 1', board.revision === 1 && board.tasks.length === 1);
  const taskId = board.tasks[0].id;
  check('createdBy recorded', board.tasks[0].createdBy.sessionId === alice.sessionId);

  await throws(
    'claim with stale revision',
    () => mutateBoard(root, (b) => T.claimTask(b, root, bob, { id: taskId, expectedRevision: 99 })),
    'stale-revision',
  );

  const claimed = await mutateBoard(root, (b) => T.claimTask(b, root, alice, { id: taskId, expectedRevision: 1 }));
  check('claim sets doing + assignee', claimed.task.status === 'doing' && claimed.task.assignee.sessionId === alice.sessionId);
  check('claim has lease', claimed.task.assignee.leaseExpiresAt > Date.now());
  check('claim has claimId', typeof claimed.task.assignee.claimId === 'string');

  await throws(
    'second session cannot claim leased task',
    () => mutateBoard(root, (b) => T.claimTask(b, root, bob, { id: taskId, expectedRevision: claimed.task.revision })),
    'already-claimed',
  );

  const note = await mutateBoard(root, (b) =>
    T.updateTask(b, root, alice, { id: taskId, expectedRevision: claimed.task.revision, note: 'progress', status: 'doing' }),
  );
  check('owner update renews lease', note.task.revision === claimed.task.revision + 1 && note.task.notes.length === 1);

  // Concurrent claim from two sessions: exactly one may win.
  const contested = await mutateBoard(root, (b) => T.createTask(b, root, alice, { title: 'Contested' }));
  const contestedId = contested.task.id;
  const results = await Promise.allSettled([
    mutateBoard(root, (b) => T.claimTask(b, root, alice, { id: contestedId })),
    mutateBoard(root, (b) => T.claimTask(b, root, bob, { id: contestedId })),
  ]);
  const wins = results.filter((entry) => entry.status === 'fulfilled').length;
  check('concurrent claim has exactly one winner', wins === 1, `wins=${wins}`);

  // Dispatch write-ahead + accepted finish.
  const requestId = 'req-123';
  const dispatchable = await mutateBoard(root, (b) => T.createTask(b, root, alice, { title: 'Dispatch me' }));
  const started = await mutateBoard(root, (b) =>
    T.beginDispatch(b, root, alice, { id: dispatchable.task.id, requestId, mode: 'new' }),
  );
  check('dispatch write-ahead state creating', started.task.dispatch.state === 'creating' && started.task.dispatch.requestId === requestId);
  const queued = await mutateBoard(root, (b) =>
    T.finishDispatch(b, root, alice, { id: dispatchable.task.id, requestId, state: 'queued', sessionId: 'session-new' }),
  );
  check('dispatch queued records session', queued.task.dispatch.state === 'queued' && queued.task.dispatch.sessionId === 'session-new');
  const accepted = await mutateBoard(root, (b) =>
    T.finishDispatch(b, root, alice, { id: dispatchable.task.id, requestId, state: 'accepted', sessionId: 'session-new' }),
  );
  check('dispatch accepted assigns owner', accepted.task.assignee.sessionId === 'session-new' && accepted.task.dispatches.length === 1);

  // Done clears ownership; delete removes.
  const done = await mutateBoard(root, (b) =>
    T.updateTask(b, root, alice, { id: dispatchable.task.id, expectedRevision: accepted.task.revision, status: 'done' }),
  );
  check('done clears assignee', done.task.assignee === null);
  const deleted = await mutateBoard(root, (b) => T.deleteTask(b, root, alice, { id: done.task.id }));
  check('delete returns id', deleted.deleted.id === done.task.id);
  check('delete returns restorable snapshot', deleted.deleted.title === done.task.title && deleted.deleted.status === 'done');

  // Undo: restore the deleted snapshot under its original id.
  const restored = await mutateBoard(root, (b) => T.restoreTask(b, root, alice, deleted.deleted));
  check('restore keeps id and title', restored.task.id === deleted.deleted.id && restored.task.title === deleted.deleted.title);
  check('restore resets revision', restored.task.revision === 1);
  check('restore marks result', restored.restored === true);
  let restoredBoard = await readBoardFile(root);
  check('restored task is on the board', restoredBoard.tasks.some((task) => task.id === deleted.deleted.id));
  await throws(
    'restore refuses duplicate id',
    () => mutateBoard(root, (b) => T.restoreTask(b, root, alice, deleted.deleted)),
    'task-exists',
  );

  // Restoring a claimed task keeps its assignee and dispatch history.
  const undoClaimed = await mutateBoard(root, (b) => T.createTask(b, root, alice, { title: 'Claimed work' }));
  const owned = await mutateBoard(root, (b) =>
    T.claimTask(b, root, alice, { id: undoClaimed.task.id, expectedRevision: undoClaimed.task.revision }),
  );
  const undoClaimedDeleted = await mutateBoard(root, (b) => T.deleteTask(b, root, alice, { id: owned.task.id }));
  const undoClaimedRestored = await mutateBoard(root, (b) => T.restoreTask(b, root, alice, undoClaimedDeleted.deleted));
  check('restore keeps the assignee', undoClaimedRestored.task.assignee?.sessionId === alice.sessionId, JSON.stringify(undoClaimedRestored.task.assignee));
  check('restore keeps the doing status', undoClaimedRestored.task.status === 'doing');

  // Corrupt board fails loud and stays unchanged.
  const file = boardPath(root);
  const before = await readFile(file, 'utf8');
  await writeFile(file, '{ this is not json');
  await throws('corrupt board read fails', () => readBoardFile(root), 'board-corrupt');
  await throws('corrupt board mutate fails', () => mutateBoard(root, (b) => T.createTask(b, root, alice, { title: 'x' })), 'board-corrupt');
  const after = await readFile(file, 'utf8');
  check('corrupt board not overwritten', after === '{ this is not json');
  await writeFile(file, before);

  // Generic JSON store used by the sub-chat rows.
  await mutateJsonFile(root, 'demo.json', () => ({ document: { hello: 'world' }, result: undefined }));
  const demo = await readJsonFile(root, 'demo.json');
  check('generic JSON file round-trips', demo.hello === 'world');

  // Workspace facts: project-root discovery and read-only rule/skill listing.
  const projectDir = await mkdtemp(join(tmpdir(), 'workspace-hub-project-'));
  const nestedDir = join(projectDir, 'packages', 'app');
  await mkdir(join(projectDir, '.git'));
  await mkdir(nestedDir, { recursive: true });
  await writeFile(join(projectDir, 'AGENTS.md'), '# project rules\n');
  check('finds the .git project root', (await findProjectRoot(nestedDir)) === projectDir);
  const facts = await workspaceInfo({ get: () => undefined }, nestedDir, undefined);
  check('lists existing project instruction files', facts.project.some((entry) => entry.file === 'AGENTS.md' && entry.exists && entry.bytes > 0));
  check('lists both global instruction candidates', facts.global.length === 2);
  check('reports no skills without a registry', facts.skills.length === 0);
  await writeWorkspaceRules(nestedDir, '# workspace rules\n');
  const savedRules = await workspaceInfo({ get: () => undefined }, nestedDir, undefined);
  check('saves workspace AGENTS.md at the workspace root', savedRules.files.rulesContent === '# workspace rules\n');
  await writeWorkspaceContext(nestedDir, 'shared context');
  check('round-trips the hub-managed context', (await readWorkspaceContext(nestedDir)) === 'shared context');
  const skill = await createWorkspaceSkill(nestedDir, { name: 'my-skill', description: 'Does things', body: '# body' });
  const skillText = await readFile(skill.path, 'utf8');
  check('creates a skill bundle with frontmatter', skillText.startsWith('---\nname: my-skill\ndescription: "Does things"'));
  let badSkill = false;
  try { await createWorkspaceSkill(nestedDir, { name: '../escape', description: 'x', body: '' }); } catch { badSkill = true; }
  check('rejects unsafe skill names', badSkill === true);
  await rm(projectDir, { recursive: true, force: true });

  // Workspace session grouping: sub chats nested under their main conversation.
  const grouped = groupWorkspaceSessions(
    [{ sessionId: 'parent-1', title: 'Main', running: true, blank: false, updatedAt: 2, archived: false }],
    [
      { parentSessionId: 'parent-1', id: 'child-1', title: 'Child', status: 'active', updatedAt: 3 },
      { parentSessionId: 'parent-2', id: 'child-2', label: 'Orphan child', status: 'active', updatedAt: 4 },
    ],
  );
  check('groups sub chats under their parent', grouped[0].subchats.length === 1 && grouped[0].subchats[0].id === 'child-1');
  check('keeps orphan parent as its own group', grouped.length === 2 && grouped[1].orphanParent === true && grouped[1].subchats[0].id === 'child-2');

  // Session-list reply shapes seen across Host/Remote boundaries.
  check('sessionRows accepts array', sessionRows([{ sessionId: 'a' }]).length === 1);
  check('sessionRows accepts {items}', sessionRows({ items: [{ sessionId: 'a' }, { sessionId: 'b' }] }).length === 2);
  check('sessionRows accepts {ok,value}', sessionRows({ ok: true, value: [{ sessionId: 'a' }] }).length === 1);
  check('sessionRows rejects junk', sessionRows(undefined).length === 0 && sessionRows({}).length === 0);

  // Sidebar catalog: only open sub chats, shaped for the row badge.
  const subchats = new Subchats({ get: () => undefined }, undefined);
  await writeFile(
    hubFile(root, 'subchats.json'),
    JSON.stringify({
      schema: 'dsh-workspace-hub/subchats',
      version: 1,
      subchats: [
        { id: 'child-open', parentSessionId: 'parent-1', label: 'Open one', status: 'active', createdAt: 1, updatedAt: 2 },
        { id: 'child-closed', parentSessionId: 'parent-1', label: 'Closed one', status: 'closed', createdAt: 1, updatedAt: 2 },
      ],
    }),
  );
  const catalog = await subchats.catalog(root);
  check('catalog hides closed sub chats', catalog.subchats.length === 1 && catalog.subchats[0].id === 'child-open');
  check('catalog carries the parent id', catalog.subchats[0].parentSessionId === 'parent-1');
  const fullCatalog = await subchats.catalog(root, { includeClosed: true, lastReply: true });
  check('catalog includeClosed keeps closed rows', fullCatalog.subchats.length === 2);
  check('catalog exposes last reply field', fullCatalog.subchats.every((row) => 'lastAssistantMessage' in row));
  check('closed row has closed status', fullCatalog.subchats.some((row) => row.id === 'child-closed' && row.status === 'closed'));

  const leftovers = (await readFile(file, 'utf8')) !== undefined;
  check('board still readable after tests', leftovers === true);

  const files = await import('node:fs/promises').then((fs) => fs.readdir(join(root, '.dsh', 'workspace-hub')));
  check('no lock or temp leftovers', files.every((name) => !name.endsWith('.lock') && !name.endsWith('.tmp')), files.join(','));

  console.log(failures === 0 ? '\nALL CORE TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
} finally {
  await rm(root, { recursive: true, force: true });
}
process.exitCode = failures === 0 ? 0 : 1;
