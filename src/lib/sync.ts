import { supabase, isSupabaseConfigured } from './supabase';
import { List, Todo, ChecklistItem, Priority, RecurrenceRule, TodoComment } from './types';
import {
  SyncOp,
  loadSyncQueue,
  removeSyncOps,
  bumpSyncOpAttempts,
  markRecentlyPushed,
  isNewer,
  wasRecentlyPushed,
} from './syncQueue';

function logSyncError(label: string, error: unknown, context?: Record<string, unknown>) {
  const e = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
  } | null;
  console.error(`[sync] ${label}`, {
    message: e?.message ?? String(error),
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
    status: e?.status,
    ...context,
  });
}

interface DbListRow {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  list_order: number;
  created_at: string;
  updated_at?: string | null;
  user_id?: string;
  owner_id?: string | null;
}

interface DbTodoRow {
  id: string;
  list_id: string | null;
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  priority: Priority;
  remind_at: string | null;
  pinned: boolean;
  recurrence: RecurrenceRule | null;
  parent_recurring_id: string | null;
  duration_minutes: number | null;
  start_time: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  assignee_id?: string | null;
  user_id?: string;
}

interface DbChecklistRow {
  id: string;
  todo_id: string;
  title: string;
  completed: boolean;
  item_order: number;
  updated_at?: string | null;
  user_id?: string;
}

interface DbCommentRow {
  id: string;
  todo_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export function mapListRow(l: DbListRow): List {
  return {
    id: l.id,
    name: l.name,
    color: l.color,
    archived: l.archived,
    order: l.list_order,
    createdAt: l.created_at,
    updatedAt: l.updated_at || l.created_at,
    ownerId: l.owner_id || l.user_id,
  };
}

export function mapTodoRow(t: DbTodoRow): Todo {
  return {
    id: t.id,
    listId: t.list_id,
    title: t.title,
    notes: t.notes ?? undefined,
    completed: t.completed,
    completedAt: t.completed_at,
    dueDate: t.due_date,
    priority: t.priority,
    remindAt: t.remind_at,
    pinned: t.pinned,
    recurrence: t.recurrence,
    parentRecurringId: t.parent_recurring_id,
    durationMinutes: t.duration_minutes,
    startTime: t.start_time,
    tags: t.tags || [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    assigneeId: t.assignee_id ?? null,
  };
}

export function mapChecklistRow(c: DbChecklistRow): ChecklistItem {
  return {
    id: c.id,
    todoId: c.todo_id,
    title: c.title,
    completed: c.completed,
    order: c.item_order,
    updatedAt: c.updated_at || new Date().toISOString(),
  };
}

export function mapCommentRow(c: DbCommentRow): TodoComment {
  return {
    id: c.id,
    todoId: c.todo_id,
    userId: c.user_id,
    body: c.body,
    createdAt: c.created_at,
  };
}

function listToDb(l: List, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    owner_id: l.ownerId || userId,
    name: l.name,
    color: l.color,
    archived: l.archived,
    list_order: l.order,
    created_at: l.createdAt,
    updated_at: l.updatedAt || l.createdAt,
  };
}

function todoToDb(t: Todo, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    list_id: t.listId || null,
    title: t.title,
    notes: t.notes || null,
    completed: t.completed,
    completed_at: t.completedAt || null,
    due_date: t.dueDate || null,
    priority: t.priority,
    remind_at: t.remindAt || null,
    pinned: t.pinned || false,
    recurrence: t.recurrence || null,
    parent_recurring_id: t.parentRecurringId || null,
    duration_minutes: t.durationMinutes ?? null,
    start_time: t.startTime ?? null,
    tags: t.tags || [],
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    assignee_id: t.assigneeId ?? null,
  };
}

function checklistToDb(c: ChecklistItem, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    todo_id: c.todoId,
    title: c.title,
    completed: c.completed,
    item_order: c.order,
    updated_at: c.updatedAt || new Date().toISOString(),
  };
}

export type MergeResult = {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
  comments: TodoComment[];
  remoteWins: number;
};

/** Merge remote snapshot into local using per-entity LWW. */
export function mergeCloudData(
  local: {
    lists: List[];
    todos: Todo[];
    checklists: ChecklistItem[];
    comments?: TodoComment[];
  },
  remote: {
    lists: List[];
    todos: Todo[];
    checklists: ChecklistItem[];
    comments?: TodoComment[];
  },
  deletedIds?: { lists: Set<string>; todos: Set<string>; checklists: Set<string> }
): MergeResult {
  let remoteWins = 0;

  const mergeMap = <T extends { id: string; updatedAt?: string }>(
    localItems: T[],
    remoteItems: T[],
    deleted: Set<string> | undefined,
    getUpdated: (x: T) => string | undefined
  ): T[] => {
    const map = new Map<string, T>();
    for (const item of localItems) {
      if (deleted?.has(item.id)) continue;
      map.set(item.id, item);
    }
    for (const remoteItem of remoteItems) {
      if (deleted?.has(remoteItem.id)) continue;
      const localItem = map.get(remoteItem.id);
      if (!localItem) {
        map.set(remoteItem.id, remoteItem);
        continue;
      }
      if (isNewer(getUpdated(remoteItem), getUpdated(localItem))) {
        map.set(remoteItem.id, remoteItem);
        remoteWins += 1;
      }
    }
    // Remove local items that exist only remotely-deleted: if remote set is full fetch,
    // items only in local that aren't in remote and not pending upsert stay if we have
    // pending ops — caller should pass pending delete awareness. For full hydrate after
    // login we trust remote as source of truth for membership when no pending ops.
    return Array.from(map.values());
  };

  const lists = mergeMap(local.lists, remote.lists, deletedIds?.lists, (l) => l.updatedAt);
  const todos = mergeMap(local.todos, remote.todos, deletedIds?.todos, (t) => t.updatedAt);
  const checklists = mergeMap(
    local.checklists,
    remote.checklists,
    deletedIds?.checklists,
    (c) => c.updatedAt
  );

  // Comments: append-only by id (remote union)
  const commentMap = new Map<string, TodoComment>();
  for (const c of local.comments || []) commentMap.set(c.id, c);
  for (const c of remote.comments || []) {
    if (!commentMap.has(c.id)) {
      commentMap.set(c.id, c);
      remoteWins += 1;
    }
  }

  return {
    lists,
    todos,
    checklists,
    comments: Array.from(commentMap.values()),
    remoteWins,
  };
}

/** After login: prefer remote when no local pending queue; else LWW merge. */
export async function fetchUserDataFromSupabase(userId: string): Promise<{
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
  comments: TodoComment[];
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [ownedLists, memberRows] = await Promise.all([
      supabase.from('lists').select('*').eq('user_id', userId),
      supabase.from('list_members').select('list_id').eq('user_id', userId),
    ]);

    // list_members may not exist yet (pre-migration) — ignore error
    const memberListIds = !memberRows.error
      ? ((memberRows.data || []) as { list_id: string }[]).map((r) => r.list_id)
      : [];

    let sharedLists: DbListRow[] = [];
    if (memberListIds.length > 0) {
      const sharedRes = await supabase.from('lists').select('*').in('id', memberListIds);
      if (!sharedRes.error) sharedLists = (sharedRes.data || []) as DbListRow[];
    }

    const owned = (ownedLists.data || []) as DbListRow[];
    const listById = new Map<string, DbListRow>();
    for (const l of [...owned, ...sharedLists]) listById.set(l.id, l);
    const allLists = Array.from(listById.values());
    const listIds = allLists.map((l) => l.id);

    const ownedTodosRes = await supabase.from('todos').select('*').eq('user_id', userId);
    let todosData = (ownedTodosRes.data || []) as DbTodoRow[];

    if (listIds.length > 0) {
      const sharedTodosRes = await supabase.from('todos').select('*').in('list_id', listIds);
      if (!sharedTodosRes.error && sharedTodosRes.data) {
        const byId = new Map<string, DbTodoRow>();
        for (const t of [...todosData, ...(sharedTodosRes.data as DbTodoRow[])]) {
          byId.set(t.id, t);
        }
        todosData = Array.from(byId.values());
      }
    }

    const todoIds = todosData.map((t) => t.id);
    let checklistsData: DbChecklistRow[] = [];
    if (todoIds.length > 0) {
      const allChecks = await supabase.from('checklists').select('*').in('todo_id', todoIds);
      if (!allChecks.error) checklistsData = (allChecks.data || []) as DbChecklistRow[];
    }

    let comments: TodoComment[] = [];
    if (todoIds.length > 0) {
      const commentsRes = await supabase.from('todo_comments').select('*').in('todo_id', todoIds);
      if (!commentsRes.error && commentsRes.data) {
        comments = (commentsRes.data as DbCommentRow[]).map(mapCommentRow);
      }
    }

    const lists: List[] = allLists.map(mapListRow);
    const todos: Todo[] = ((todosData || []) as DbTodoRow[]).map(mapTodoRow);
    const checklists: ChecklistItem[] = (checklistsData || []).map(mapChecklistRow);

    return { lists, todos, checklists, comments };
  } catch (err) {
    console.error('Error fetching Supabase user data:', err);
    return null;
  }
}

async function applyOp(userId: string, op: SyncOp): Promise<{ ok: boolean; conflict?: boolean }> {
  if (!supabase) return { ok: false };

  if (op.op === 'delete') {
    const table =
      op.entity === 'list'
        ? 'lists'
        : op.entity === 'todo'
          ? 'todos'
          : op.entity === 'checklist'
            ? 'checklists'
            : 'todo_comments';
    const { error } = await supabase.from(table).delete().eq('id', op.entityId);
    if (error) {
      logSyncError('delete failed', error, { table, entityId: op.entityId });
      return { ok: false };
    }
    await markRecentlyPushed(op.entity, op.entityId);
    return { ok: true };
  }

  // upsert
  if (op.entity === 'list' && op.payload) {
    const list = op.payload as List;
    const row = listToDb(list, userId);
    const { data: remote } = await supabase
      .from('lists')
      .select('*')
      .eq('id', list.id)
      .maybeSingle();
    if (remote && isNewer((remote as DbListRow).updated_at, list.updatedAt)) {
      return { ok: true, conflict: true };
    }

    // Prefer insert-or-update over upsert so INSERT vs UPDATE RLS paths are explicit
    let error;
    if (remote) {
      ({ error } = await supabase.from('lists').update(row).eq('id', list.id));
    } else {
      ({ error } = await supabase.from('lists').insert(row));
      // Concurrent create: fall back to update
      if (error?.code === '23505') {
        ({ error } = await supabase.from('lists').update(row).eq('id', list.id));
      }
    }
    if (error) {
      logSyncError('list upsert failed', error, {
        listId: list.id,
        payload: row,
        hadRemote: Boolean(remote),
      });
      return { ok: false };
    }
    await markRecentlyPushed('list', list.id);
    return { ok: true };
  }

  if (op.entity === 'todo' && op.payload) {
    const todo = op.payload as Todo;
    const { data: remote } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todo.id)
      .maybeSingle();
    if (remote && isNewer((remote as DbTodoRow).updated_at, todo.updatedAt)) {
      return { ok: true, conflict: true };
    }
    const { error } = await supabase.from('todos').upsert(todoToDb(todo, userId), {
      onConflict: 'id',
    });
    if (error) {
      logSyncError('todo upsert failed', error, {
        todoId: todo.id,
        listId: todo.listId,
      });
      return { ok: false };
    }
    await markRecentlyPushed('todo', todo.id);
    return { ok: true };
  }

  if (op.entity === 'checklist' && op.payload) {
    const item = op.payload as ChecklistItem;
    const { data: remote } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', item.id)
      .maybeSingle();
    if (remote && isNewer((remote as DbChecklistRow).updated_at, item.updatedAt)) {
      return { ok: true, conflict: true };
    }
    const { error } = await supabase.from('checklists').upsert(checklistToDb(item, userId), {
      onConflict: 'id',
    });
    if (error) {
      logSyncError('checklist upsert failed', error, {
        checklistId: item.id,
        todoId: item.todoId,
      });
      return { ok: false };
    }
    await markRecentlyPushed('checklist', item.id);
    return { ok: true };
  }

  if (op.entity === 'comment' && op.payload) {
    const comment = op.payload as TodoComment;
    const { error } = await supabase.from('todo_comments').upsert(
      {
        id: comment.id,
        todo_id: comment.todoId,
        user_id: comment.userId,
        body: comment.body,
        created_at: comment.createdAt,
      },
      { onConflict: 'id' }
    );
    if (error) {
      logSyncError('comment upsert failed', error, {
        commentId: comment.id,
        todoId: comment.todoId,
      });
      return { ok: false };
    }
    await markRecentlyPushed('comment', comment.id);
    return { ok: true };
  }

  return { ok: true };
}

export type FlushResult = {
  success: boolean;
  conflicts: number;
  remaining: number;
};

let flushing = false;

export async function flushSyncQueue(userId: string): Promise<FlushResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, conflicts: 0, remaining: 0 };
  }
  if (flushing) {
    const q = await loadSyncQueue();
    return { success: true, conflicts: 0, remaining: q.length };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    logSyncError('flush skipped — no auth session', {
      message: 'Not signed in to Supabase (auth.uid() would be null)',
      code: 'NO_SESSION',
    });
    return { success: false, conflicts: 0, remaining: (await loadSyncQueue()).length };
  }
  if (sessionData.session.user.id !== userId) {
    logSyncError(
      'flush skipped — session user mismatch',
      {
        message: 'Store user id does not match Supabase session',
        code: 'SESSION_MISMATCH',
      },
      { storeUserId: userId, sessionUserId: sessionData.session.user.id }
    );
    return { success: false, conflicts: 0, remaining: (await loadSyncQueue()).length };
  }

  flushing = true;
  let conflicts = 0;

  try {
    const queue = await loadSyncQueue();
    const doneIds: string[] = [];

    for (const op of queue) {
      const result = await applyOp(userId, op);
      if (result.ok) {
        doneIds.push(op.id);
        if (result.conflict) conflicts += 1;
      } else {
        await bumpSyncOpAttempts(op.id);
        // stop on first hard failure to preserve order
        break;
      }
    }

    await removeSyncOps(doneIds);
    const remaining = (await loadSyncQueue()).length;
    return { success: remaining === 0, conflicts, remaining };
  } finally {
    flushing = false;
  }
}

/** @deprecated Prefer flushSyncQueue — kept for one-shot seed upload on first login */
export async function migrateLocalToSupabase(
  userId: string,
  lists: List[],
  todos: Todo[],
  checklists: ChecklistItem[]
) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    if (lists.length > 0) {
      await supabase.from('lists').upsert(
        lists.map((l) => listToDb(l, userId)),
        { onConflict: 'id' }
      );
    }
    if (todos.length > 0) {
      await supabase.from('todos').upsert(
        todos.map((t) => todoToDb(t, userId)),
        { onConflict: 'id' }
      );
    }
    if (checklists.length > 0) {
      await supabase.from('checklists').upsert(
        checklists.map((c) => checklistToDb(c, userId)),
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

export { wasRecentlyPushed };
