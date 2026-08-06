'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { flushSyncQueue } from '@/lib/sync';

export function SyncToast() {
  const syncToast = useAppStore((s) => s.syncToast);
  const setSyncToast = useAppStore((s) => s.setSyncToast);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const user = useAppStore((s) => s.user);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);

  useEffect(() => {
    if (!syncToast) return;
    const t = setTimeout(() => setSyncToast(null), 4000);
    return () => clearTimeout(t);
  }, [syncToast, setSyncToast]);

  const handleRetry = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    const result = await flushSyncQueue(user.id);
    setSyncStatus(result.remaining > 0 ? 'error' : 'synced');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none">
      {syncToast && (
        <div className="pointer-events-auto px-4 py-2 rounded-xl bg-stone-900 text-stone-100 text-sm shadow-lg border border-stone-700">
          {syncToast}
        </div>
      )}
      {syncStatus === 'error' && user && (
        <button
          type="button"
          onClick={handleRetry}
          className="pointer-events-auto px-4 py-2 rounded-xl bg-rose-900/90 text-rose-100 text-sm shadow-lg border border-rose-700 hover:bg-rose-800"
        >
          Sync failed — tap to retry
        </button>
      )}
    </div>
  );
}
