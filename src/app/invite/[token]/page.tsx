'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { acceptListInvite } from '@/lib/listShare';
import { bootstrapCloudSync } from '@/lib/useRealtimeSync';
import { useAppStore } from '@/lib/store';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'loading' | 'need-auth' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const setUser = useAppStore((s) => s.setUser);
  const setIsAuthModalOpen = useAppStore((s) => s.setIsAuthModalOpen);
  const router = useRouter();

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function run() {
      if (!isSupabaseConfigured || !supabase) {
        setStatus('error');
        setMessage('Cloud sync is not configured.');
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        setStatus('need-auth');
        setIsAuthModalOpen(true);
        return;
      }
      setUser(data.session.user);
      const result = await acceptListInvite(token, data.session.user.id);
      if (!result.ok) {
        setStatus('error');
        setMessage(result.error || 'Could not accept invite');
        return;
      }
      await bootstrapCloudSync(data.session.user.id);
      setStatus('ok');
      setMessage('You joined the list. Redirecting…');
      setTimeout(() => {
        if (result.listId) {
          useAppStore.getState().setActiveView(result.listId);
        }
        router.push('/');
      }, 1200);
    }

    void run();
  }, [token, setUser, setIsAuthModalOpen, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/40 p-6">
      <div className="max-w-sm w-full rounded-2xl bg-white border border-stone-200 p-6 text-center shadow-sm">
        <h1 className="font-serif text-xl text-stone-900 mb-2">List invite</h1>
        {status === 'loading' && <p className="text-sm text-stone-500">Accepting invite…</p>}
        {status === 'need-auth' && (
          <p className="text-sm text-stone-600">
            Sign in to accept this invite, then reopen the link.
          </p>
        )}
        {status === 'ok' && <p className="text-sm text-emerald-700">{message}</p>}
        {status === 'error' && <p className="text-sm text-rose-700">{message}</p>}
      </div>
    </div>
  );
}
