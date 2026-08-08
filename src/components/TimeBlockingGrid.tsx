'use client';

import React, { useState } from 'react';
import { Clock, Timer, GripVertical, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  getTodayISO,
  isOverdue,
  formatDuration,
  formatStartTime,
  PLANNER_HOURS,
} from '@/lib/dates';
import { Todo } from '@/lib/types';

function hourToStartTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function parseStartHour(startTime?: string | null): number | null {
  if (!startTime) return null;
  const h = parseInt(startTime.split(':')[0], 10);
  return isNaN(h) ? null : h;
}

export function TimeBlockingGrid() {
  const { todos, updateTodo, setSelectedTodoId, statusFilter } = useAppStore();
  const [dragTodoId, setDragTodoId] = useState<string | null>(null);
  const [tapAssignId, setTapAssignId] = useState<string | null>(null);
  const today = getTodayISO();

  let todayTodos = todos.filter((t) => t.dueDate === today || isOverdue(t.dueDate, t.completed));

  if (statusFilter === 'active') {
    todayTodos = todayTodos.filter((t) => !t.completed);
  } else if (statusFilter === 'completed') {
    todayTodos = todayTodos.filter((t) => t.completed);
  }

  const scheduled = todayTodos.filter((t) => t.startTime && !t.completed);
  const unscheduled = todayTodos.filter((t) => !t.startTime && !t.completed);

  const totalMinutes = todayTodos
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
  const scheduledMinutes = scheduled.reduce((sum, t) => sum + (t.durationMinutes || 30), 0);

  const todosByHour: Record<number, Todo[]> = {};
  for (const hour of PLANNER_HOURS) {
    todosByHour[hour] = [];
  }
  for (const todo of scheduled) {
    const hour = parseStartHour(todo.startTime);
    if (hour !== null && todosByHour[hour]) {
      todosByHour[hour].push(todo);
    } else if (hour !== null) {
      const clamped = Math.min(22, Math.max(7, hour));
      todosByHour[clamped] = todosByHour[clamped] || [];
      todosByHour[clamped].push(todo);
    }
  }

  const assignToHour = (todoId: string, hour: number) => {
    updateTodo(todoId, {
      startTime: hourToStartTime(hour),
      dueDate: today,
      durationMinutes: todos.find((t) => t.id === todoId)?.durationMinutes ?? 30,
    });
    setTapAssignId(null);
    setDragTodoId(null);
  };

  const handleDropOnHour = (hour: number) => {
    if (!dragTodoId) return;
    assignToHour(dragTodoId, hour);
  };

  const formatHourLabel = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric' });
  };

  const activeAssignId = dragTodoId || tapAssignId;
  const instructionsId = 'planner-schedule-instructions';
  const selectedTrayTodo = tapAssignId ? unscheduled.find((t) => t.id === tapAssignId) : null;

  return (
    <div className="space-y-4">
      {/* Workload summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 bg-white border border-stone-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Estimated
            </p>
            <p className="font-semibold text-stone-800 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              {formatDuration(totalMinutes) || '0m'}
            </p>
          </div>
          <div className="w-px h-8 bg-stone-200" aria-hidden="true" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Scheduled
            </p>
            <p className="font-semibold text-stone-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              {formatDuration(scheduledMinutes) || '0m'}
            </p>
          </div>
          <div className="w-px h-8 bg-stone-200" aria-hidden="true" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Unscheduled
            </p>
            <p className="font-semibold text-stone-800">{unscheduled.length}</p>
          </div>
        </div>
        <p
          id={instructionsId}
          className="text-[11px] text-stone-600"
          role="status"
          aria-live="polite"
        >
          {selectedTrayTodo
            ? `Selected “${selectedTrayTodo.title}”. Tap or press Enter on an hour to schedule.`
            : 'Select a tray task (or drag), then choose an hour.'}
        </p>
      </div>

      {/* Unscheduled tray */}
      {unscheduled.length > 0 && (
        <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-amber-800 font-semibold">
            Unscheduled tray
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((todo) => (
              <div
                key={todo.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border text-xs font-medium text-stone-800 shadow-xs max-w-full sm:max-w-none ${
                  tapAssignId === todo.id
                    ? 'border-amber-500 ring-2 ring-amber-200'
                    : 'border-stone-200'
                } ${dragTodoId === todo.id ? 'opacity-50' : ''}`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={() => {
                    setDragTodoId(todo.id);
                    setTapAssignId(todo.id);
                  }}
                  onDragEnd={() => setDragTodoId(null)}
                  onClick={() => {
                    setTapAssignId((id) => (id === todo.id ? null : todo.id));
                  }}
                  aria-pressed={tapAssignId === todo.id}
                  aria-label={`Select ${todo.title} for scheduling`}
                  aria-describedby={instructionsId}
                  className="inline-flex items-center gap-1.5 min-w-0 min-h-11 cursor-grab active:cursor-grabbing text-left"
                >
                  <GripVertical
                    className="w-3 h-3 text-stone-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate min-w-0 max-w-[200px] sm:max-w-[220px]">
                    {todo.title}
                  </span>
                  {todo.durationMinutes ? (
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                      {formatDuration(todo.durationMinutes)}
                    </span>
                  ) : null}
                </button>
                <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                  {[9, 11, 14, 16].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => assignToHour(todo.id, h)}
                      className="tap-target px-1.5 text-[10px] font-medium text-stone-600 hover:text-amber-800 hover:bg-amber-100 rounded"
                      aria-label={`Schedule ${todo.title} at ${formatHourLabel(h)}`}
                      aria-describedby={instructionsId}
                    >
                      {formatHourLabel(h)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {PLANNER_HOURS.map((hour) => {
          const hourTodos = todosByHour[hour] || [];
          const isDropTarget = activeAssignId !== null;

          return (
            <div
              key={hour}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnHour(hour);
              }}
              onClick={() => {
                if (tapAssignId) assignToHour(tapAssignId, hour);
              }}
              onKeyDown={(e) => {
                if (!tapAssignId) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  assignToHour(tapAssignId, hour);
                }
              }}
              role={isDropTarget ? 'button' : undefined}
              tabIndex={isDropTarget ? 0 : undefined}
              aria-label={
                isDropTarget ? `Schedule selected task at ${formatHourLabel(hour)}` : undefined
              }
              aria-describedby={isDropTarget ? instructionsId : undefined}
              className={`flex border-b border-stone-100 last:border-b-0 min-h-[44px] md:min-h-[56px] transition ${
                isDropTarget ? 'bg-amber-50/40 cursor-pointer' : 'hover:bg-stone-50/60'
              }`}
            >
              <div className="w-12 md:w-16 flex-shrink-0 py-2 md:py-3 px-1.5 md:px-2 text-right">
                <span className="text-[11px] font-semibold text-stone-500">
                  {formatHourLabel(hour)}
                </span>
              </div>
              <div className="flex-1 py-1.5 md:py-2 px-2 space-y-1.5 border-l border-stone-100">
                {hourTodos.length === 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeAssignId) assignToHour(activeAssignId, hour);
                    }}
                    className={`w-full min-h-11 rounded-lg border border-dashed text-[10px] ${
                      isDropTarget
                        ? 'border-amber-300 text-amber-800'
                        : 'border-transparent text-stone-500 hover:border-stone-200'
                    }`}
                    aria-label={`Schedule at ${formatHourLabel(hour)}`}
                    aria-describedby={instructionsId}
                  >
                    {isDropTarget ? 'Tap to schedule' : ''}
                  </button>
                ) : (
                  hourTodos.map((todo) => {
                    const blockHeight = Math.max(
                      32,
                      Math.round(((todo.durationMinutes || 30) / 60) * 48)
                    );
                    return (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={() => setDragTodoId(todo.id)}
                        onDragEnd={() => setDragTodoId(null)}
                        style={{ minHeight: blockHeight }}
                        className="relative group/block flex items-start gap-2 p-2 rounded-lg bg-amber-100/80 border border-amber-200 hover:bg-amber-100 transition"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTodoId(todo.id);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-xs font-semibold text-amber-950 truncate">
                            {todo.title}
                          </p>
                          <p className="text-[10px] text-amber-800/80 font-medium mt-0.5">
                            {formatStartTime(todo.startTime)}
                            {todo.durationMinutes
                              ? ` · ${formatDuration(todo.durationMinutes)}`
                              : ''}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTodo(todo.id, { startTime: null });
                          }}
                          className="tap-target text-amber-700/70 hover:text-rose-600 rounded transition"
                          aria-label={`Unschedule ${todo.title}`}
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
