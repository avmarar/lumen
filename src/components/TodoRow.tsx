'use client';

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckSquare,
  Clock,
  Trash2,
  ChevronRight,
  Pin,
  Repeat,
  Tag,
  Timer,
  Focus,
  MoreHorizontal,
} from 'lucide-react';
import { Todo } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import {
  formatFriendlyDate,
  isOverdue,
  getTodayISO,
  formatRecurrenceLabel,
  formatDuration,
  formatStartTime,
} from '@/lib/dates';

interface TodoRowProps {
  todo: Todo;
}

export function TodoRow({ todo }: TodoRowProps) {
  const {
    toggleTodoComplete,
    setSelectedTodoId,
    selectedTodoId,
    deleteTodo,
    updateTodo,
    lists,
    checklists,
    selectedTodoIds,
    toggleTodoSelection,
    setActiveTagFilter,
    startFocus,
    canEditList,
  } = useAppStore();

  const canEdit = canEditList(todo.listId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDetailSelected = selectedTodoId === todo.id;
  const isBulkSelected = selectedTodoIds.includes(todo.id);
  const listObj = lists.find((l) => l.id === todo.listId);
  const todoChecklists = checklists.filter((c) => c.todoId === todo.id);
  const completedChecklistCount = todoChecklists.filter((c) => c.completed).length;

  const overdue = isOverdue(todo.dueDate, todo.completed);
  const isDueToday = todo.dueDate === getTodayISO();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTodoComplete(todo.id);

    if (!todo.completed) {
      if (todo.priority === 'high' || todoChecklists.length > 2) {
        const reduceMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#D97706', '#2563EB', '#10B981'],
          });
        }
      }
    }
  };

  const openDetail = () => {
    setSelectedTodoId(todo.id);
  };

  const handleQuickScheduleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo(todo.id, { dueDate: getTodayISO() });
    setMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo(todo.id);
    setMenuOpen(false);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo(todo.id, { pinned: !todo.pinned });
    setMenuOpen(false);
  };

  const handleBulkSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTodoSelection(todo.id);
  };

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    startFocus(todo.id);
    setMenuOpen(false);
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all ${
        isBulkSelected
          ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-sm'
          : isDetailSelected
            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-sm'
            : todo.completed
              ? 'bg-stone-50/60 border-stone-200/60 opacity-60'
              : 'bg-white border-stone-200/80 hover:border-amber-500/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-1 min-w-0 flex-1 pr-2">
        {/* Bulk select — always on sm+; on mobile only once a selection is active */}
        <button
          onClick={handleBulkSelect}
          className={`mt-0.5 min-w-11 min-h-11 -m-2 p-2 items-center justify-center flex-shrink-0 transition ${
            selectedTodoIds.length > 0 || isBulkSelected ? 'flex' : 'hidden sm:flex'
          } ${isBulkSelected ? '' : 'opacity-50'}`}
          aria-label={isBulkSelected ? 'Deselect task' : 'Select task'}
          title="Select for bulk actions"
        >
          <span
            className={`w-5 h-5 rounded border flex items-center justify-center transition ${
              isBulkSelected
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-stone-300 bg-white hover:border-indigo-400'
            }`}
          >
            {isBulkSelected && (
              <svg className="w-3 h-3 stroke-current fill-none stroke-[3]" viewBox="0 0 16 16">
                <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>

        {/* Complete checkbox — ≥44px hit area */}
        <button
          onClick={handleToggle}
          className="relative mt-0.5 min-w-11 min-h-11 -m-2 p-2 flex items-center justify-center flex-shrink-0"
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          <span
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              todo.completed
                ? 'bg-amber-700 border-amber-700 text-white shadow-sm'
                : 'border-stone-300 hover:border-amber-500 bg-white'
            }`}
          >
            {todo.completed && (
              <svg
                className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5]"
                viewBox="0 0 16 16"
              >
                <path
                  className="animate-check-draw"
                  d="M3 8.5L6.5 12L13 4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <button
            type="button"
            onClick={openDetail}
            className="flex items-center gap-2 w-full text-left rounded-md"
            aria-current={isDetailSelected ? 'true' : undefined}
          >
            <span
              className={`text-sm font-medium leading-snug transition-all ${
                todo.completed
                  ? 'line-through text-stone-500'
                  : 'text-stone-900 group-hover:text-stone-950'
              }`}
            >
              {todo.title}
            </span>

            {todo.priority === 'high' && !todo.completed && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                <span className="sr-only">High priority</span>
              </span>
            )}
            {todo.priority === 'medium' && !todo.completed && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                <span className="sr-only">Medium priority</span>
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500">
            {/* Always: list + due — keep the row scannable on narrow screens */}
            {listObj && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: listObj.color }}
                  aria-hidden="true"
                />
                {listObj.name}
              </span>
            )}

            {todo.dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                  overdue
                    ? 'bg-rose-100 text-rose-800 font-semibold'
                    : isDueToday
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {formatFriendlyDate(todo.dueDate)}
                {todo.startTime ? ` · ${formatStartTime(todo.startTime)}` : ''}
              </span>
            )}

            {/* Secondary meta: sm+ only — detail panel has the rest */}
            {todo.durationMinutes ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px]">
                <Timer className="w-3 h-3 text-teal-600" aria-hidden="true" />
                {formatDuration(todo.durationMinutes)}
              </span>
            ) : null}

            {todo.recurrence && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-medium text-[11px]">
                <Repeat className="w-3 h-3 text-purple-600" aria-hidden="true" />
                {formatRecurrenceLabel(todo.recurrence)}
              </span>
            )}

            {(todo.tags || []).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTagFilter(tag);
                }}
                className="hidden sm:inline-flex items-center gap-1 min-h-9 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-medium text-[11px] hover:bg-indigo-100"
              >
                <Tag className="w-3 h-3 text-indigo-600" aria-hidden="true" />#{tag}
              </button>
            ))}

            {todoChecklists.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px]">
                <CheckSquare className="w-3 h-3 text-stone-500" aria-hidden="true" />
                {completedChecklistCount}/{todoChecklists.length}
              </span>
            )}

            {todo.remindAt && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium text-[11px]">
                <Clock className="w-3 h-3 text-blue-600" aria-hidden="true" />
                {new Date(todo.remindAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}

            {todo.notes && todo.notes.trim().length > 0 && (
              <span className="hidden sm:inline text-[11px] text-stone-500 italic truncate max-w-[180px]">
                &ldquo;{todo.notes}&rdquo;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fine pointer: hover action cluster */}
      <div className="pointer-actions items-center gap-1">
        {!todo.completed && canEdit && (
          <button
            type="button"
            onClick={handleStartFocus}
            className="tap-target rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition"
            aria-label="Start focus"
          >
            <Focus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={handleTogglePin}
          className={`tap-target rounded-lg transition ${
            todo.pinned
              ? 'text-amber-600 bg-amber-50'
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
          }`}
          aria-label={todo.pinned ? 'Unpin task' : 'Pin to top'}
          aria-pressed={todo.pinned}
        >
          <Pin className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        {!todo.dueDate && (
          <button
            type="button"
            onClick={handleQuickScheduleToday}
            className="min-h-11 px-2.5 text-[11px] font-medium text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 rounded-lg transition"
          >
            + Today
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="tap-target text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          aria-label="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={openDetail}
          className="tap-target rounded-lg text-stone-500 hover:text-stone-700 transition"
          aria-label={`Open details for ${todo.title}`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Touch: overflow menu */}
      <div className="touch-actions items-center gap-1 relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="tap-target rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          aria-label="Task actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={openDetail}
          className="tap-target text-stone-500 hover:text-stone-700"
          aria-label={`Open details for ${todo.title}`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 z-30 w-40 rounded-xl bg-white border border-stone-200 shadow-xl py-1"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                handleBulkSelect(e);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50"
            >
              Select
            </button>
            {!todo.completed && canEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={handleStartFocus}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-stone-700 hover:bg-amber-50"
              >
                <Focus className="w-3.5 h-3.5" aria-hidden="true" /> Focus
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleTogglePin}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50"
            >
              <Pin className="w-3.5 h-3.5" aria-hidden="true" /> {todo.pinned ? 'Unpin' : 'Pin'}
            </button>
            {!todo.dueDate && (
              <button
                type="button"
                role="menuitem"
                onClick={handleQuickScheduleToday}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-stone-700 hover:bg-amber-50"
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> + Today
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
