'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Trash2, Tag, X, List } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTodayISO, getTomorrowISO, addDaysISO } from '@/lib/dates';

export function BulkActionBar() {
  const {
    selectedTodoIds,
    clearTodoSelection,
    bulkUpdateTodos,
    bulkDeleteTodos,
    bulkCompleteTodos,
    bulkAddTag,
    lists,
  } = useAppStore();

  const [showListMenu, setShowListMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState('');

  if (selectedTodoIds.length === 0) return null;

  const count = selectedTodoIds.length;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagValue.trim()) return;
    bulkAddTag(selectedTodoIds, tagValue);
    setTagValue('');
    setShowTagInput(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,640px)]">
      <div className="bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-700 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 pr-3 border-r border-stone-700">
          <span className="text-xs font-semibold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-md">
            {count}
          </span>
          <span className="text-xs text-stone-300 font-medium">selected</span>
          <button
            onClick={clearTodoSelection}
            className="p-1 text-stone-400 hover:text-stone-100 rounded"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <button
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: getTodayISO() })}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition flex items-center gap-1"
            title="Set due today"
          >
            <Calendar className="w-3 h-3" />
            Today
          </button>
          <button
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: getTomorrowISO() })}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition"
          >
            Tomorrow
          </button>
          <button
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: addDaysISO(7) })}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition"
          >
            Next week
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowListMenu((v) => !v);
                setShowTagInput(false);
              }}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-stone-800 hover:bg-stone-700 rounded-lg transition flex items-center gap-1"
            >
              <List className="w-3 h-3" />
              Move
            </button>
            {showListMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-44 bg-white text-stone-800 rounded-xl shadow-xl border border-stone-200 overflow-hidden z-10">
                <button
                  onClick={() => {
                    bulkUpdateTodos(selectedTodoIds, { listId: null });
                    setShowListMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 font-medium"
                >
                  Inbox (No List)
                </button>
                {lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      bulkUpdateTodos(selectedTodoIds, { listId: l.id });
                      setShowListMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 font-medium flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowTagInput((v) => !v);
              setShowListMenu(false);
            }}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-stone-800 hover:bg-indigo-600 rounded-lg transition flex items-center gap-1"
          >
            <Tag className="w-3 h-3" />
            Tag
          </button>

          <button
            onClick={() => bulkCompleteTodos(selectedTodoIds)}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 rounded-lg transition flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete ${count} task${count > 1 ? 's' : ''}?`)) {
                bulkDeleteTodos(selectedTodoIds);
              }
            }}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-rose-800 hover:bg-rose-700 rounded-lg transition flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>

        {showTagInput && (
          <form
            onSubmit={handleAddTag}
            className="w-full flex items-center gap-2 pt-1 border-t border-stone-700"
          >
            <input
              type="text"
              autoFocus
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              placeholder="Tag name..."
              className="flex-1 text-xs bg-stone-800 text-stone-100 px-3 py-1.5 rounded-lg border border-stone-600 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={!tagValue.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 rounded-lg disabled:opacity-40"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
