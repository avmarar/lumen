'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Tag, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTodayISO, formatDateISO } from '@/lib/dates';
import { Priority } from '@/lib/types';

export function QuickAdd() {
  const { addTodo, activeView, lists } = useAppStore();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener ('n' or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
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

  // Parse smart chips from input text
  // Keywords: ^today, ^tomorrow, !high, !medium, !low, @work, #5pm
  const parsedDueDate = (() => {
    const lower = text.toLowerCase();
    if (lower.includes('^today')) {
      return getTodayISO();
    }
    if (lower.includes('^tomorrow')) {
      return formatDateISO(new Date(Date.now() + 86400000));
    }
    // Default depending on activeView
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
    const foundList = lists.find((l) => lower.includes(`@${l.name.toLowerCase().replace(/\s+/g, '')}`));
    if (foundList) return foundList.id;
    // Default if current view is a custom list
    if (lists.some((l) => l.id === activeView)) return activeView;
    return null;
  })();

  const parsedReminderTime = (() => {
    const match = text.match(/#(\d{1,2})(am|pm)?/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const ampm = match[2]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    
    const targetDate = parsedDueDate || getTodayISO();
    const hourStr = String(hour).padStart(2, '0');
    return `${targetDate}T${hourStr}:00:00`;
  })();

  const cleanTitle = text
    .replace(/\^(today|tomorrow)/gi, '')
    .replace(/!(high|medium|low)/gi, '')
    .replace(/@[a-zA-Z0-9_-]+/gi, '')
    .replace(/#\d{1,2}(am|pm)?/gi, '')
    .trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanTitle && !text.trim()) return;

    const titleToUse = cleanTitle || text.trim();

    addTodo({
      title: titleToUse,
      listId: parsedListId,
      dueDate: parsedDueDate,
      priority: parsedPriority,
      remindAt: parsedReminderTime,
    });

    setText('');
  };

  const selectedListObj = lists.find((l) => l.id === parsedListId);

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
            placeholder="Capture task... try '^today', '!high', '@work', '#5pm' or press N"
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

        {/* Dynamic metadata parsing preview bar */}
        {(parsedDueDate || parsedPriority !== 'none' || selectedListObj || parsedReminderTime) && (
          <div className="px-4 py-2 bg-stone-50/80 border-t border-stone-100 rounded-b-xl flex items-center gap-2 text-xs flex-wrap">
            <span className="text-stone-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Auto-tags:
            </span>

            {parsedDueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-medium">
                <Calendar className="w-3 h-3 text-amber-600" />
                {parsedDueDate === getTodayISO() ? 'Today' : 'Tomorrow'}
              </span>
            )}

            {parsedPriority !== 'none' && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium capitalize ${
                parsedPriority === 'high'
                  ? 'bg-rose-100 text-rose-800'
                  : parsedPriority === 'medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-200 text-stone-800'
              }`}>
                <AlertCircle className="w-3 h-3" />
                {parsedPriority} Priority
              </span>
            )}

            {selectedListObj && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedListObj.color }} />
                {selectedListObj.name}
              </span>
            )}

            {parsedReminderTime && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-medium">
                <Clock className="w-3 h-3 text-blue-600" />
                Reminder {new Date(parsedReminderTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
