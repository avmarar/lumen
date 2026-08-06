import { get as getIDB, set as setIDB } from 'idb-keyval';
import { List, Todo, ChecklistItem, TodoComment } from './types';

export type SyncEntity = 'list' | 'todo' | 'checklist' | 'comment';

export type SyncOpKind = 'upsert' | 'delete';

export interface SyncOp {
  id: string;
  entity: SyncEntity;
  entityId: string;
  op: SyncOpKind;
  payload?: List | Todo | ChecklistItem | TodoComment;
  updatedAt: string;
  attempts: number;
}

const QUEUE_KEY = 'lumen_sync_queue_v1';
const RECENT_PUSH_KEY = 'lumen_recent_pushes_v1';

export async function loadSyncQueue(): Promise<SyncOp[]> {
  try {
    const q = await getIDB<SyncOp[]>(QUEUE_KEY);
    return Array.isArray(q) ? q : [];
  } catch {
    return [];
  }
}

export async function saveSyncQueue(queue: SyncOp[]): Promise<void> {
  await setIDB(QUEUE_KEY, queue);
}

export async function enqueueSyncOp(
  partial: Omit<SyncOp, 'id' | 'attempts'> & { id?: string }
): Promise<void> {
  const queue = await loadSyncQueue();
  // Coalesce: drop older upserts for same entityId; deletes replace prior upserts
  const filtered = queue.filter(
    (op) => !(op.entity === partial.entity && op.entityId === partial.entityId)
  );
  const next: SyncOp = {
    id: partial.id || `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entity: partial.entity,
    entityId: partial.entityId,
    op: partial.op,
    payload: partial.payload,
    updatedAt: partial.updatedAt,
    attempts: 0,
  };
  filtered.push(next);
  await saveSyncQueue(filtered);
}

export async function removeSyncOps(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const queue = await loadSyncQueue();
  await saveSyncQueue(queue.filter((op) => !idSet.has(op.id)));
}

export async function bumpSyncOpAttempts(id: string): Promise<void> {
  const queue = await loadSyncQueue();
  await saveSyncQueue(
    queue.map((op) => (op.id === id ? { ...op, attempts: op.attempts + 1 } : op))
  );
}

/** Recently pushed entity keys to ignore realtime echo briefly */
export async function markRecentlyPushed(entity: SyncEntity, entityId: string): Promise<void> {
  try {
    const map = (await getIDB<Record<string, number>>(RECENT_PUSH_KEY)) || {};
    map[`${entity}:${entityId}`] = Date.now();
    // prune older than 15s
    const cutoff = Date.now() - 15_000;
    for (const k of Object.keys(map)) {
      if (map[k] < cutoff) delete map[k];
    }
    await setIDB(RECENT_PUSH_KEY, map);
  } catch {
    // ignore
  }
}

export async function wasRecentlyPushed(entity: SyncEntity, entityId: string): Promise<boolean> {
  try {
    const map = (await getIDB<Record<string, number>>(RECENT_PUSH_KEY)) || {};
    const t = map[`${entity}:${entityId}`];
    return Boolean(t && Date.now() - t < 12_000);
  } catch {
    return false;
  }
}

export function isNewer(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a && !b) return false;
  if (!a) return false;
  if (!b) return true;
  return new Date(a).getTime() > new Date(b).getTime();
}
