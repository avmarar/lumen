'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { acceptListInvite } from '@/lib/listShare';
import { bootstrapCloudSync } from '@/lib/useRealtimeSync';
import { useAppStore } from '@/lib/store';
import { AuthModal } from '@/components/AuthModal';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'loading' | 'need-auth' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setIsAuthModalOpen = useAppStore((s) => s.setIsAuthModalOpen);
  const router = useRouter();
  const acceptingRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  // Keep store user in sync on this route (home page listener is not mounted)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser]);

  useEffect(() => {
    if (!token || doneRef.current) return;

    async function run() {
      if (!isSupabaseConfigured || !supabase) {
        setStatus('error');
        setMessage('Cloud sync is not configured.');
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? user;

      if (!sessionUser) {
        setStatus('need-auth');
        setIsAuthModalOpen(true);
        return;
      }

      if (acceptingRef.current) return;
      acceptingRef.current = true;
      setStatus('loading');
      setUser(sessionUser);

      const result = await acceptListInvite(token, sessionUser.id);
      if (!result.ok) {
        acceptingRef.current = false;
        setStatus('error');
        setMessage(result.error || 'Could not accept invite');
        return;
      }

      doneRef.current = true;
      await bootstrapCloudSync(sessionUser.id);
      setStatus('ok');
      setMessage('You joined the list. Redirecting…');
      setIsAuthModalOpen(false);
      setTimeout(() => {
        if (result.listId) {
          useAppStore.getState().setActiveView(result.listId);
        }
        router.push('/');
      }, 1200);
    }

    void run();
  }, [token, user, setUser, setIsAuthModalOpen, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/40 p-6">
      <div className="max-w-sm w-full rounded-2xl bg-white border border-stone-200 p-6 text-center shadow-sm">
        <h1 className="font-serif text-xl text-stone-900 mb-2">List invite</h1>
        {status === 'loading' && <p className="text-sm text-stone-500">Accepting invite…</p>}
        {status === 'need-auth' && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">Sign in to accept this invite.</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
            >
              Sign in
            </button>
          </div>
        )}
        {status === 'ok' && <p className="text-sm text-emerald-700">{message}</p>}
        {status === 'error' && <p className="text-sm text-rose-700">{message}</p>}
      </div>
      <AuthModal />
    </div>
  );
}
