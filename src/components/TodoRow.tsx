'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  Trash2, 
  ChevronRight,
  Pin,
  AlertCircle,
  Repeat
} from 'lucide-react';
import { Todo } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatFriendlyDate, isOverdue, getTodayISO, formatRecurrenceLabel } from '@/lib/dates';

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
  } = useAppStore();

  const isSelected = selectedTodoId === todo.id;
  const listObj = lists.find((l) => l.id === todo.listId);
  const todoChecklists = checklists.filter((c) => c.todoId === todo.id);
  const completedChecklistCount = todoChecklists.filter((c) => c.completed).length;

  const overdue = isOverdue(todo.dueDate, todo.completed);
  const isDueToday = todo.dueDate === getTodayISO();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTodoComplete(todo.id);

    if (!todo.completed) {
      if (todo.priority === 'high' || todoChecklists.length > 2) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#D97706', '#2563EB', '#10B981'],
        });
      }
    }
  };

  const handleRowClick = () => {
    setSelectedTodoId(todo.id);
  };

  const handleQuickScheduleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo(todo.id, { dueDate: getTodayISO() });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo(todo.id, { pinned: !todo.pinned });
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-sm'
          : todo.completed
          ? 'bg-stone-50/60 border-stone-200/60 opacity-60'
          : 'bg-white border-stone-200/80 hover:border-amber-500/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
        {/* Custom Animated Checkbox */}
        <button
          onClick={handleToggle}
          className={`relative mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
            todo.completed
              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
              : 'border-stone-300 hover:border-amber-500 bg-white'
          }`}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
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
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title & Priority Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium leading-snug transition-all ${
                todo.completed
                  ? 'line-through text-stone-400'
                  : 'text-stone-900 group-hover:text-stone-950'
              }`}
            >
              {todo.title}
            </span>

            {todo.priority === 'high' && !todo.completed && (
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High priority" />
            )}
            {todo.priority === 'medium' && !todo.completed && (
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Medium priority" />
            )}
          </div>

          {/* Badges Bar */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs text-stone-500">
            {/* List tag */}
            {listObj && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listObj.color }} />
                {listObj.name}
              </span>
            )}

            {/* Due date badge */}
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
                <Calendar className="w-3 h-3" />
                {formatFriendlyDate(todo.dueDate)}
              </span>
            )}

            {/* Recurrence Badge */}
            {todo.recurrence && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-medium text-[11px]">
                <Repeat className="w-3 h-3 text-purple-600" />
                {formatRecurrenceLabel(todo.recurrence)}
              </span>
            )}

            {/* Checklist progress badge */}
            {todoChecklists.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px]">
                <CheckSquare className="w-3 h-3 text-stone-500" />
                {completedChecklistCount}/{todoChecklists.length}
              </span>
            )}

            {/* Reminder bell badge */}
            {todo.remindAt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium text-[11px]">
                <Clock className="w-3 h-3 text-blue-600" />
                {new Date(todo.remindAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}

            {/* Notes preview indicator */}
            {todo.notes && todo.notes.trim().length > 0 && (
              <span className="text-[11px] text-stone-400 italic truncate max-w-[180px]">
                &ldquo;{todo.notes}&rdquo;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Hover Quick Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleTogglePin}
          className={`p-1.5 rounded-lg transition ${
            todo.pinned ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
          }`}
          title={todo.pinned ? 'Unpin task' : 'Pin to top'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {!todo.dueDate && (
          <button
            onClick={handleQuickScheduleToday}
            className="px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 rounded-lg transition"
            title="Schedule for Today"
          >
            + Today
          </button>
        )}

        <button
          onClick={handleDelete}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <ChevronRight className="w-4 h-4 text-stone-300 ml-1" />
      </div>
    </div>
  );
}
