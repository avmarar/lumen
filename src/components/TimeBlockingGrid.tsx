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
      // Outside range — pin to nearest edge
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
  };

  const handleDropOnHour = (hour: number) => {
    if (!dragTodoId) return;
    assignToHour(dragTodoId, hour);
    setDragTodoId(null);
  };

  const formatHourLabel = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Workload summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 bg-white border border-stone-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              Estimated
            </p>
            <p className="font-semibold text-stone-800 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-teal-600" />
              {formatDuration(totalMinutes) || '0m'}
            </p>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              Scheduled
            </p>
            <p className="font-semibold text-stone-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {formatDuration(scheduledMinutes) || '0m'}
            </p>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              Unscheduled
            </p>
            <p className="font-semibold text-stone-800">{unscheduled.length}</p>
          </div>
        </div>
        <p className="text-[11px] text-stone-500">
          Drag tasks onto hours, or click a slot after selecting a task from the tray.
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
                draggable
                onDragStart={() => setDragTodoId(todo.id)}
                onDragEnd={() => setDragTodoId(null)}
                onClick={() => setSelectedTodoId(todo.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 cursor-grab active:cursor-grabbing shadow-xs hover:border-amber-400 ${
                  dragTodoId === todo.id ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="w-3 h-3 text-stone-400" />
                <span className="truncate max-w-[160px]">{todo.title}</span>
                {todo.durationMinutes ? (
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
                    {formatDuration(todo.durationMinutes)}
                  </span>
                ) : null}
                <div className="flex items-center gap-0.5 ml-1">
                  {[9, 11, 14, 16].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToHour(todo.id, h);
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-medium text-stone-500 hover:text-amber-800 hover:bg-amber-100 rounded"
                      title={`Schedule at ${formatHourLabel(h)}`}
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
          const isDropTarget = dragTodoId !== null;

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
              className={`flex border-b border-stone-100 last:border-b-0 min-h-[56px] transition ${
                isDropTarget ? 'bg-amber-50/40' : 'hover:bg-stone-50/60'
              }`}
            >
              <div className="w-16 flex-shrink-0 py-3 px-2 text-right">
                <span className="text-[11px] font-semibold text-stone-400">
                  {formatHourLabel(hour)}
                </span>
              </div>
              <div className="flex-1 py-2 px-2 space-y-1.5 border-l border-stone-100">
                {hourTodos.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (dragTodoId) assignToHour(dragTodoId, hour);
                    }}
                    className="w-full h-8 rounded-lg border border-dashed border-transparent hover:border-stone-200 text-[10px] text-stone-300"
                    aria-label={`Drop zone ${formatHourLabel(hour)}`}
                  />
                ) : (
                  hourTodos.map((todo) => {
                    const blockHeight = Math.max(
                      36,
                      Math.round(((todo.durationMinutes || 30) / 60) * 48)
                    );
                    return (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={() => setDragTodoId(todo.id)}
                        onDragEnd={() => setDragTodoId(null)}
                        onClick={() => setSelectedTodoId(todo.id)}
                        style={{ minHeight: blockHeight }}
                        className="relative group/block flex items-start gap-2 p-2 rounded-lg bg-amber-100/80 border border-amber-200 cursor-pointer hover:bg-amber-100 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-950 truncate">
                            {todo.title}
                          </p>
                          <p className="text-[10px] text-amber-800/80 font-medium mt-0.5">
                            {formatStartTime(todo.startTime)}
                            {todo.durationMinutes
                              ? ` · ${formatDuration(todo.durationMinutes)}`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTodo(todo.id, { startTime: null });
                          }}
                          className="opacity-0 group-hover/block:opacity-100 p-1 text-amber-700/60 hover:text-rose-600 rounded transition"
                          title="Unschedule"
                        >
                          <X className="w-3.5 h-3.5" />
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
