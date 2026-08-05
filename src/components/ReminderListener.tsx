'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { triggerBrowserNotification } from '@/lib/reminders';

export function ReminderListener() {
  const { todos, setSelectedTodoId } = useAppStore();
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; remindAt: string } | null>(null);
  const [firedReminderIds, setFiredReminderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      todos.forEach((todo) => {
        if (!todo.completed && todo.remindAt && !firedReminderIds.has(todo.id)) {
          const remindTime = new Date(todo.remindAt);
          // If reminder time is reached or slightly past (within 1 hour)
          const diffMs = now.getTime() - remindTime.getTime();
          if (diffMs >= 0 && diffMs <= 3600000) {
            // Trigger browser native notification
            triggerBrowserNotification(`Reminder: ${todo.title}`, `Due at ${remindTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);

            // Show floating UI Toast
            setActiveToast({
              id: todo.id,
              title: todo.title,
              remindAt: todo.remindAt,
            });

            setFiredReminderIds((prev) => new Set(prev).add(todo.id));
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [todos, firedReminderIds]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-stone-900 text-stone-100 p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
        <Bell className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Reminder Alert
          </span>
          <span className="text-[10px] text-stone-400">
            {new Date(activeToast.remindAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs font-semibold text-stone-100 truncate">{activeToast.title}</p>
        <button
          onClick={() => {
            setSelectedTodoId(activeToast.id);
            setActiveToast(null);
          }}
          className="text-xs text-amber-400 hover:underline font-medium pt-1 block"
        >
          View task details &rarr;
        </button>
      </div>

      <button
        onClick={() => setActiveToast(null)}
        className="p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
