'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Copy, Download, RefreshCw, Check, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { todosToIcs, downloadIcs } from '@/lib/ical';
import {
  ensureCalendarFeedToken,
  regenerateCalendarFeedToken,
  buildCalendarFeedUrl,
  buildWebcalUrl,
} from '@/lib/calendarFeed';
import { isSupabaseConfigured } from '@/lib/supabase';

interface CalendarExportProps {
  compact?: boolean;
}

export function CalendarExport({ compact = false }: CalendarExportProps) {
  const { todos, user } = useAppStore();
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const canSubscribe = Boolean(user?.id && isSupabaseConfigured);
  const activeFeedUrl = canSubscribe ? feedUrl : null;

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await ensureCalendarFeedToken(user.id);
        if (!cancelled && token) setFeedUrl(buildCalendarFeedUrl(token));
      } catch {
        if (!cancelled) setError('Could not load calendar feed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleDownload = () => {
    const ics = todosToIcs(todos);
    downloadIcs('lumen-tasks.ics', ics);
  };

  const handleCopy = async () => {
    if (!activeFeedUrl) return;
    try {
      await navigator.clipboard.writeText(activeFeedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy link.');
    }
  };

  const handleRegenerate = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    const token = await regenerateCalendarFeedToken(user.id);
    if (token) {
      setFeedUrl(buildCalendarFeedUrl(token));
    } else {
      setError('Could not regenerate link. Ensure calendar_feeds migration is applied.');
    }
    setLoading(false);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-stone-800 hover:text-stone-200 transition text-[11px] text-stone-400"
        title="Download tasks as .ics calendar file"
      >
        <Download className="w-3.5 h-3.5" />
        Export .ics
      </button>
    );
  }

  return (
    <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
        <Calendar className="w-4 h-4 text-amber-600" />
        Calendar Export
      </div>
      <p className="text-[11px] text-stone-500 leading-relaxed">
        Download a snapshot, or subscribe by URL in Apple Calendar / Google Calendar / Outlook
        (signed-in only).
      </p>

      <button
        type="button"
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
      >
        <Download className="w-3.5 h-3.5" />
        Download .ics
      </button>

      {canSubscribe && (
        <div className="space-y-2 pt-1 border-t border-stone-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Subscribe feed
          </p>
          {loading && !activeFeedUrl ? (
            <p className="text-[11px] text-stone-500">Loading feed link…</p>
          ) : activeFeedUrl ? (
            <>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={activeFeedUrl}
                  className="flex-1 text-[10px] font-mono bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-stone-700 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700"
                  title="Copy subscribe URL"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={buildWebcalUrl(activeFeedUrl)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-white border border-stone-200 rounded-lg hover:bg-stone-100 text-stone-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Calendar
                </a>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-stone-200"
                  title="Invalidate the old link and create a new one"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Subscribe feed unavailable. Apply{' '}
              <code className="font-mono">migration_calendar_feed.sql</code> and set{' '}
              <code className="font-mono">SUPABASE_SECRET_KEY</code> on the server.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-700">{error}</p>}
    </div>
  );
}
