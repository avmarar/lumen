import { useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  fetchUserDataFromSupabase,
  flushSyncQueue,
  mergeCloudData,
  migrateLocalToSupabase,
} from './sync';
import { loadSyncQueue, wasRecentlyPushed } from './syncQueue';

export function useRealtimeSync() {
  const { user, setSyncStatus, applyMergedCloudData, lists, todos, checklists, comments } =
    useAppStore();

  const flush = useCallback(async () => {
    if (!user) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    const result = await flushSyncQueue(user.id);
    if (result.conflicts > 0) {
      const cloud = await fetchUserDataFromSupabase(user.id);
      if (cloud) {
        const merged = mergeCloudData({ lists, todos, checklists, comments }, cloud);
        applyMergedCloudData(
          merged.lists,
          merged.todos,
          merged.checklists,
          merged.comments,
          merged.remoteWins
        );
      }
    }
    if (result.remaining > 0) {
      setSyncStatus('error');
    } else {
      setSyncStatus('synced');
    }
  }, [user, setSyncStatus, applyMergedCloudData, lists, todos, checklists, comments]);

  // Flush op-log when local data changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const timer = setTimeout(() => {
      void flush();
    }, 800);

    return () => clearTimeout(timer);
  }, [lists, todos, checklists, comments, user, flush]);

  // Online / offline
  useEffect(() => {
    if (!user) return;
    const onOnline = () => {
      void flush();
    };
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [user, flush, setSyncStatus]);

  // Initial seed upload if queue empty and cloud empty — one-shot on login handled in page.tsx

  // Realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const client = supabase;
    const channel = client
      .channel(`user-sync-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, async (payload) => {
        const id = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
        if (id && (await wasRecentlyPushed('todo', id))) return;
        await pullAndMerge();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, async (payload) => {
        const id = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
        if (id && (await wasRecentlyPushed('list', id))) return;
        await pullAndMerge();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checklists' },
        async (payload) => {
          const id = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
          if (id && (await wasRecentlyPushed('checklist', id))) return;
          await pullAndMerge();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_comments' },
        async (payload) => {
          const id = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
          if (id && (await wasRecentlyPushed('comment', id))) return;
          await pullAndMerge();
        }
      )
      .subscribe();

    async function pullAndMerge() {
      const state = useAppStore.getState();
      if (!state.user) return;
      const queue = await loadSyncQueue();
      if (queue.length > 0) {
        // Prefer flushing local first
        await flushSyncQueue(state.user.id);
      }
      setSyncStatus('syncing');
      const cloud = await fetchUserDataFromSupabase(state.user.id);
      if (cloud) {
        const merged = mergeCloudData(
          {
            lists: state.lists,
            todos: state.todos,
            checklists: state.checklists,
            comments: state.comments,
          },
          cloud
        );
        state.applyMergedCloudData(
          merged.lists,
          merged.todos,
          merged.checklists,
          merged.comments,
          merged.remoteWins
        );
      }
      setSyncStatus('synced');
    }

    return () => {
      client.removeChannel(channel);
    };
  }, [user, setSyncStatus]);

  return { flush };
}

/** Call after login: seed cloud from local if cloud empty, else merge. */
export async function bootstrapCloudSync(userId: string) {
  const state = useAppStore.getState();
  state.setSyncStatus('syncing');
  const cloud = await fetchUserDataFromSupabase(userId);
  if (!cloud || (cloud.todos.length === 0 && cloud.lists.length === 0)) {
    await migrateLocalToSupabase(userId, state.lists, state.todos, state.checklists);
    state.setSyncStatus('synced');
    return;
  }
  const merged = mergeCloudData(
    {
      lists: state.lists,
      todos: state.todos,
      checklists: state.checklists,
      comments: state.comments,
    },
    cloud
  );

  // Mark shared lists (not owned by current user)
  const refined = merged.lists.map((l) => {
    if (l.ownerId === userId) return { ...l, myRole: 'owner' as const, shared: Boolean(l.shared) };
    return { ...l, myRole: (l.myRole || 'editor') as 'editor' | 'viewer' | 'owner', shared: true };
  });

  state.applyMergedCloudData(refined, merged.todos, merged.checklists, merged.comments, 0);
  await flushSyncQueue(userId);
  state.setSyncStatus('synced');
}
