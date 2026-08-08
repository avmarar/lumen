'use client';

import React, { useEffect, useState } from 'react';
import { Pause, Play, Check, X, Focus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useDialog } from '@/lib/useDialog';

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FocusOverlay() {
  const focusSession = useAppStore((s) => s.focusSession);
  const todos = useAppStore((s) => s.todos);
  const pauseFocus = useAppStore((s) => s.pauseFocus);
  const resumeFocus = useAppStore((s) => s.resumeFocus);
  const stopFocus = useAppStore((s) => s.stopFocus);
  const completeFocus = useAppStore((s) => s.completeFocus);
  const [now, setNow] = useState(() => Date.now());
  const [announced, setAnnounced] = useState('');

  const open = Boolean(focusSession);
  const { containerRef, titleId } = useDialog({
    open,
    onClose: stopFocus,
  });

  useEffect(() => {
    if (!focusSession || focusSession.status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [focusSession]);

  // Announce remaining time every 30s and on pause/resume (defer setState out of effect body)
  useEffect(() => {
    if (!focusSession) return;
    const session = focusSession;
    const totalMs = session.durationMinutes * 60_000;

    const buildMessage = () => {
      const elapsed =
        session.status === 'paused' && session.pausedAt
          ? new Date(session.pausedAt).getTime() -
            new Date(session.startedAt).getTime() -
            session.pausedMs
          : Date.now() - new Date(session.startedAt).getTime() - session.pausedMs;
      const label = formatRemaining(Math.max(0, totalMs - elapsed));
      return session.status === 'paused'
        ? `Focus paused. ${label} remaining.`
        : `${label} remaining.`;
    };

    const initial = window.setTimeout(() => setAnnounced(buildMessage()), 0);
    if (session.status === 'paused') {
      return () => window.clearTimeout(initial);
    }

    const id = window.setInterval(() => setAnnounced(buildMessage()), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [focusSession]);

  if (!focusSession) return null;

  const todo = todos.find((t) => t.id === focusSession.todoId);
  if (!todo) return null;

  const totalMs = focusSession.durationMinutes * 60_000;
  const elapsed =
    focusSession.status === 'paused' && focusSession.pausedAt
      ? new Date(focusSession.pausedAt).getTime() -
        new Date(focusSession.startedAt).getTime() -
        focusSession.pausedMs
      : now - new Date(focusSession.startedAt).getTime() - focusSession.pausedMs;
  const remaining = totalMs - elapsed;
  const progress = Math.min(1, Math.max(0, elapsed / totalMs));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md mx-4 p-8 rounded-2xl bg-stone-900 border border-stone-700 text-center shadow-2xl outline-none"
      >
        <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-4">
          <Focus className="w-4 h-4" aria-hidden="true" />
          Focus
        </div>
        <h2 id={titleId} className="font-serif text-2xl text-stone-100 mb-2 leading-snug">
          {todo.title}
        </h2>
        <p className="text-5xl font-semibold tabular-nums text-amber-400 my-6" aria-hidden="true">
          {formatRemaining(remaining)}
        </p>
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announced}
        </div>
        <div
          className="h-1.5 rounded-full bg-stone-800 mb-8 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Focus progress"
        >
          <div
            className="h-full bg-amber-500 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          {focusSession.status === 'running' ? (
            <button
              type="button"
              onClick={pauseFocus}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 text-sm font-medium"
            >
              <Pause className="w-4 h-4" aria-hidden="true" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeFocus}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 text-sm font-medium"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={completeFocus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-sm font-semibold"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Complete
          </button>
          <button
            type="button"
            onClick={stopFocus}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-sm"
            aria-label="Stop focus"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
