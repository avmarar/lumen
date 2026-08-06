'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Tag, AlertCircle, Clock, Sparkles, Timer } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  getTodayISO,
  formatFriendlyDate,
  formatDuration,
  parseFlexibleDueDate,
  parseDurationToken,
} from '@/lib/dates';
import { Priority } from '@/lib/types';

export function QuickAdd() {
  const { addTodo, activeView, lists } = useAppStore();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'n' || e.key === 'N' || e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reminder: #5pm / #17:00 (must run before #tag extraction)
  const parsedReminderTime = (() => {
    const match = text.match(/#(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour > 23) return null;

    const due =
      parseFlexibleDueDate(text) || (activeView === 'today' ? getTodayISO() : getTodayISO());
    return `${due}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  })();

  const parsedDueDate = (() => {
    const flexible = parseFlexibleDueDate(text);
    if (flexible) return flexible;
    if (activeView === 'today') return getTodayISO();
    return null;
  })();

  const parsedPriority: Priority = (() => {
    const lower = text.toLowerCase();
    if (lower.includes('!high')) return 'high';
    if (lower.includes('!medium')) return 'medium';
    if (lower.includes('!low')) return 'low';
    return 'none';
  })();

  const parsedListId = (() => {
    const lower = text.toLowerCase();
    const foundList = lists.find((l) =>
      lower.includes(`@${l.name.toLowerCase().replace(/\s+/g, '')}`)
    );
    if (foundList) return foundList.id;
    if (lists.some((l) => l.id === activeView)) return activeView;
    return null;
  })();

  // Duration: ~30m, ~1h, ~90m
  const parsedDuration = (() => {
    const match = text.match(/~(\d+)\s*(m|min|mins|h|hr|hrs)?\b/i);
    if (!match) return null;
    return parseDurationToken(`~${match[1]}${match[2] || 'm'}`);
  })();

  // Tags: #design #admin (exclude time-like #5pm / #17:00)
  const parsedTags = (() => {
    const tags: string[] = [];
    const re = /#([a-zA-Z][\w-]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tag = m[1].toLowerCase();
      if (!tags.includes(tag)) tags.push(tag);
    }
    return tags;
  })();

  const cleanTitle = text
    .replace(
      /\^(?:next\s+)?(?:today|tomorrow|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|in\s+\d+\s+days?)\b/gi,
      ''
    )
    .replace(/!(high|medium|low)/gi, '')
    .replace(/@[a-zA-Z0-9_-]+/gi, '')
    .replace(/#\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/#[a-zA-Z][\w-]*/g, '')
    .replace(/~(\d+)\s*(m|min|mins|h|hr|hrs)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanTitle && !text.trim()) return;

    addTodo({
      title: cleanTitle || text.trim(),
      listId: parsedListId,
      dueDate: parsedDueDate,
      priority: parsedPriority,
      remindAt: parsedReminderTime,
      durationMinutes: parsedDuration,
      tags: parsedTags,
    });

    setText('');
  };

  const selectedListObj = lists.find((l) => l.id === parsedListId);
  const hasPreview =
    parsedDueDate ||
    parsedPriority !== 'none' ||
    selectedListObj ||
    parsedReminderTime ||
    parsedDuration ||
    parsedTags.length > 0;

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={`relative transition-all duration-200 rounded-xl bg-white border ${
          isFocused
            ? 'border-amber-500/80 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/5'
            : 'border-stone-200/90 hover:border-stone-300 shadow-sm'
        }`}
      >
        <div className="flex items-center px-4 py-3">
          <div className="text-amber-600 flex-shrink-0 mr-3">
            <Plus className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Capture… ^next fri !high @work #design ~30m #5pm"
            className="w-full bg-transparent text-stone-900 placeholder:text-stone-400 text-sm font-medium focus:outline-none"
          />

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-stone-400 bg-stone-100 border border-stone-200 rounded-md">
              N
            </kbd>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-40 disabled:hover:bg-amber-600 flex items-center gap-1"
            >
              <span>Add</span>
            </button>
          </div>
        </div>

        {hasPreview && (
          <div className="px-4 py-2 bg-stone-50/80 border-t border-stone-100 rounded-b-xl flex items-center gap-2 text-xs flex-wrap">
            <span className="text-stone-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Auto-tags:
            </span>

            {parsedDueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-medium">
                <Calendar className="w-3 h-3 text-amber-600" />
                {formatFriendlyDate(parsedDueDate)}
              </span>
            )}

            {parsedPriority !== 'none' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium capitalize ${
                  parsedPriority === 'high'
                    ? 'bg-rose-100 text-rose-800'
                    : parsedPriority === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-200 text-stone-800'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {parsedPriority} Priority
              </span>
            )}

            {selectedListObj && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedListObj.color }}
                />
                {selectedListObj.name}
              </span>
            )}

            {parsedDuration && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium">
                <Timer className="w-3 h-3 text-teal-600" />
                {formatDuration(parsedDuration)}
              </span>
            )}

            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-medium"
              >
                <Tag className="w-3 h-3 text-indigo-600" />#{tag}
              </span>
            ))}

            {parsedReminderTime && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-medium">
                <Clock className="w-3 h-3 text-blue-600" />
                Reminder{' '}
                {new Date(parsedReminderTime).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
