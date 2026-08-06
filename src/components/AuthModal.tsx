'use client';

import React, { useState } from 'react';
import { X, Mail, Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { migrateLocalToSupabase, fetchUserDataFromSupabase } from '@/lib/sync';
import { CalendarExport } from '@/components/CalendarExport';

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    setUser,
    setSyncStatus,
    lists,
    todos,
    checklists,
    hydrateCloudData,
  } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          setUser(data.user);
          setSyncStatus('syncing');
          // Migrate local IndexedDB items to user account
          await migrateLocalToSupabase(data.user.id, lists, todos, checklists);
          setSyncStatus('synced');
          setSuccessMsg('Account created & local tasks synced!');
          setTimeout(() => setIsAuthModalOpen(false), 1500);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          setUser(data.user);
          setSyncStatus('syncing');

          // Fetch user cloud data
          const cloudData = await fetchUserDataFromSupabase(data.user.id);
          if (cloudData && (cloudData.todos.length > 0 || cloudData.lists.length > 0)) {
            hydrateCloudData(cloudData.lists, cloudData.todos, cloudData.checklists);
          } else {
            // If new cloud account, migrate current local tasks
            await migrateLocalToSupabase(data.user.id, lists, todos, checklists);
          }

          setSyncStatus('synced');
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => setIsAuthModalOpen(false), 1200);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setSyncStatus('offline');
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-lg">
              {user ? 'Account & Sync' : mode === 'login' ? 'Sign In to Lumen' : 'Create Account'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!isSupabaseConfigured && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Local-First Guest Mode Active</p>
                <p className="mt-0.5 text-amber-800/80">
                  To enable Supabase Auth & Multi-Device Sync, set your{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{' '}
                  and{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{' '}
                  in environment variables.
                </p>
              </div>
            </div>
          )}

          {user ? (
            /* Signed In View */
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200 font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{user.email}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cloud Sync Active
                  </p>
                </div>
              </div>

              <CalendarExport />

              <div className="pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 font-semibold text-xs rounded-xl transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <div className="space-y-4">
              <CalendarExport />
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Toggle Segment */}
                <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      mode === 'login'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      mode === 'signup'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isSupabaseConfigured}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading
                    ? 'Connecting...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account & Sync Tasks'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
