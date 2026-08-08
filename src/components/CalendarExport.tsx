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
        className="tap-target gap-1.5 px-2 rounded hover:bg-stone-800 hover:text-stone-200 transition text-[11px] text-stone-400"
        aria-label="Download tasks as .ics calendar file"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        Export .ics
      </button>
    );
  }

  return (
    <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
        <Calendar className="w-4 h-4 text-amber-600" aria-hidden="true" />
        Calendar Export
      </div>
      <p className="text-[11px] text-stone-600 leading-relaxed">
        Download a snapshot, or subscribe by URL in Apple Calendar / Google Calendar / Outlook
        (signed-in only).
      </p>

      <button
        type="button"
        onClick={handleDownload}
        className="w-full min-h-11 flex items-center justify-center gap-2 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        Download .ics
      </button>

      {canSubscribe && (
        <div className="space-y-2 pt-1 border-t border-stone-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Subscribe feed
          </p>
          {loading && !activeFeedUrl ? (
            <p className="text-[11px] text-stone-500" role="status">
              Loading feed link…
            </p>
          ) : activeFeedUrl ? (
            <>
              <div className="flex items-center gap-1.5">
                <label htmlFor="calendar-feed-url" className="sr-only">
                  Calendar subscribe URL
                </label>
                <input
                  id="calendar-feed-url"
                  readOnly
                  value={activeFeedUrl}
                  className="flex-1 text-[10px] font-mono bg-white border border-stone-200 rounded-lg px-2 py-2.5 text-stone-700 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="tap-target rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700"
                  aria-label={copied ? 'Copied subscribe URL' : 'Copy subscribe URL'}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={buildWebcalUrl(activeFeedUrl)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 py-2 text-[11px] font-semibold bg-white border border-stone-200 rounded-lg hover:bg-stone-100 text-stone-800"
                >
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  Open in Calendar
                </a>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="inline-flex items-center gap-1 min-h-11 px-2.5 text-[11px] font-medium text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-stone-200"
                  aria-label="Regenerate calendar feed link"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
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

      {error && (
        <p className="text-[11px] text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
