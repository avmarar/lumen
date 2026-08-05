import { useEffect } from 'react';
import { useAppStore } from './store';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchUserDataFromSupabase, migrateLocalToSupabase } from './sync';

export function useRealtimeSync() {
  const { user, setSyncStatus, hydrateCloudData, lists, todos, checklists } = useAppStore();

  // 1. Sync local mutations to cloud when logged in
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      await migrateLocalToSupabase(user.id, lists, todos, checklists);
      setSyncStatus('synced');
    }, 1000); // 1s debounce to avoid flooding DB during rapid typing

    return () => clearTimeout(timer);
  }, [lists, todos, checklists, user, setSyncStatus]);

  // 2. Realtime Postgres Subscriptions for Multi-Device Sync
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const client = supabase;
    const channel = client
      .channel(`user-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` },
        async () => {
          setSyncStatus('syncing');
          const updatedCloudData = await fetchUserDataFromSupabase(user.id);
          if (updatedCloudData) {
            hydrateCloudData(
              updatedCloudData.lists,
              updatedCloudData.todos,
              updatedCloudData.checklists
            );
          }
          setSyncStatus('synced');
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, hydrateCloudData, setSyncStatus]);
}
