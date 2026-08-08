'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (selectedTodoIds.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showListMenu) {
        e.preventDefault();
        setShowListMenu(false);
        return;
      }
      if (showTagInput) {
        e.preventDefault();
        setShowTagInput(false);
        setTagValue('');
        return;
      }
      e.preventDefault();
      clearTodoSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedTodoIds.length, showListMenu, showTagInput, clearTodoSelection]);

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
    <div
      className="fixed bottom-safe left-1/2 -translate-x-1/2 z-50 w-[min(92vw,640px)]"
      role="toolbar"
      aria-label={`Bulk actions for ${count} selected task${count > 1 ? 's' : ''}`}
    >
      <div className="bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-700 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 pr-3 border-r border-stone-700">
          <span className="text-xs font-semibold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-md">
            {count}
          </span>
          <span className="text-xs text-stone-300 font-medium">selected</span>
          <button
            type="button"
            onClick={clearTodoSelection}
            className="tap-target text-stone-400 hover:text-stone-100 rounded"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <button
            type="button"
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: getTodayISO() })}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition inline-flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" aria-hidden="true" />
            Today
          </button>
          <button
            type="button"
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: getTomorrowISO() })}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => bulkUpdateTodos(selectedTodoIds, { dueDate: addDaysISO(7) })}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-stone-800 hover:bg-amber-600 rounded-lg transition"
          >
            Next week
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowListMenu((v) => !v);
                setShowTagInput(false);
              }}
              aria-expanded={showListMenu}
              aria-haspopup="menu"
              className="min-h-11 px-2.5 text-[11px] font-semibold bg-stone-800 hover:bg-stone-700 rounded-lg transition inline-flex items-center gap-1"
            >
              <List className="w-3 h-3" aria-hidden="true" />
              Move
            </button>
            {showListMenu && (
              <div
                role="menu"
                className="absolute bottom-full mb-2 left-0 w-44 bg-white text-stone-800 rounded-xl shadow-xl border border-stone-200 overflow-hidden z-10"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    bulkUpdateTodos(selectedTodoIds, { listId: null });
                    setShowListMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 min-h-11 text-xs hover:bg-stone-50 font-medium"
                >
                  Inbox (No List)
                </button>
                {lists.map((l) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={l.id}
                    onClick={() => {
                      bulkUpdateTodos(selectedTodoIds, { listId: l.id });
                      setShowListMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 min-h-11 text-xs hover:bg-stone-50 font-medium flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: l.color }}
                      aria-hidden="true"
                    />
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowTagInput((v) => !v);
              setShowListMenu(false);
            }}
            aria-expanded={showTagInput}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-stone-800 hover:bg-indigo-600 rounded-lg transition inline-flex items-center gap-1"
          >
            <Tag className="w-3 h-3" aria-hidden="true" />
            Tag
          </button>

          <button
            type="button"
            onClick={() => bulkCompleteTodos(selectedTodoIds)}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 rounded-lg transition inline-flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            Complete
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete ${count} task${count > 1 ? 's' : ''}?`)) {
                bulkDeleteTodos(selectedTodoIds);
              }
            }}
            className="min-h-11 px-2.5 text-[11px] font-semibold bg-rose-800 hover:bg-rose-700 rounded-lg transition inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            Delete
          </button>
        </div>

        {showTagInput && (
          <form
            onSubmit={handleAddTag}
            className="w-full flex items-center gap-2 pt-1 border-t border-stone-700"
          >
            <label htmlFor="bulk-tag-input" className="sr-only">
              Tag name
            </label>
            <input
              id="bulk-tag-input"
              type="text"
              autoFocus
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              placeholder="Tag name..."
              className="flex-1 min-h-11 text-xs bg-stone-800 text-stone-100 px-3 py-1.5 rounded-lg border border-stone-600 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={!tagValue.trim()}
              className="min-h-11 px-3 text-xs font-semibold bg-indigo-600 rounded-lg disabled:opacity-40"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
