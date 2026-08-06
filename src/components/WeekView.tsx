'use client';

import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getWeekDays, getTodayISO, formatLoadHours } from '@/lib/dates';

export function WeekView() {
  const {
    todos,
    addTodo,
    setSelectedTodoId,
    selectedTodoId,
    toggleTodoComplete,
    dayBudgetMinutes,
  } = useAppStore();
  const weekDays = getWeekDays();
  const todayISO = getTodayISO();

  const [addingDayISO, setAddingDayISO] = useState<string | null>(null);
  const [newDayTitle, setNewDayTitle] = useState('');

  const handleDaySubmit = (e: React.FormEvent, dateISO: string) => {
    e.preventDefault();
    if (!newDayTitle.trim()) return;
    addTodo({
      title: newDayTitle.trim(),
      dueDate: dateISO,
    });
    setNewDayTitle('');
    setAddingDayISO(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>7-Day Timeline Canvas</span>
        </h3>
        <p className="text-xs text-stone-500 font-medium">Click any day to add or inspect tasks</p>
      </div>

      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayTodos = todos.filter((t) => t.dueDate === day.dateISO);
          const isToday = day.dateISO === todayISO;
          const dayLoad = dayTodos
            .filter((t) => !t.completed)
            .reduce((sum, t) => {
              if (t.durationMinutes && t.durationMinutes > 0) return sum + t.durationMinutes;
              if (t.startTime) return sum + 30;
              return sum;
            }, 0);
          const overBudget = dayLoad > dayBudgetMinutes;

          return (
            <div
              key={day.dateISO}
              className={`flex flex-col min-h-[320px] rounded-2xl p-3 border transition ${
                isToday
                  ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20 shadow-xs'
                  : overBudget
                    ? 'bg-amber-50/80 border-amber-300/80'
                    : 'bg-white border-stone-200/80 hover:border-stone-300'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-stone-100">
                <div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-amber-700' : 'text-stone-400'}`}
                  >
                    {day.dayName}
                  </span>
                  <div
                    className={`text-lg font-bold font-serif leading-none mt-0.5 ${isToday ? 'text-amber-900' : 'text-stone-800'}`}
                  >
                    {day.dateNum}
                  </div>
                  {dayLoad > 0 && (
                    <div
                      className={`text-[10px] font-semibold mt-1 ${overBudget ? 'text-amber-800' : 'text-stone-400'}`}
                    >
                      {formatLoadHours(dayLoad)}
                      {overBudget ? ' · over' : ''}
                    </div>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                    isToday ? 'bg-amber-200/80 text-amber-900' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {dayTodos.length}
                </span>
              </div>

              {/* Day Todos Stack */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px] pr-1">
                {dayTodos.length === 0 ? (
                  <div className="h-20 flex items-center justify-center text-[11px] text-stone-300 italic">
                    No tasks
                  </div>
                ) : (
                  dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => setSelectedTodoId(todo.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        selectedTodoId === todo.id
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-medium'
                          : todo.completed
                            ? 'bg-stone-50 border-stone-100 text-stone-400 line-through'
                            : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/60 text-stone-800'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTodoComplete(todo.id);
                          }}
                          className="mt-0.5 w-3.5 h-3.5 text-amber-600 rounded border-stone-300"
                        />
                        <span className="line-clamp-2 leading-snug">{todo.title}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Add Button for Column */}
              <div className="pt-2 mt-2 border-t border-stone-100">
                {addingDayISO === day.dateISO ? (
                  <form onSubmit={(e) => handleDaySubmit(e, day.dateISO)} className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newDayTitle}
                      onChange={(e) => setNewDayTitle(e.target.value)}
                      autoFocus
                      className="w-full text-xs p-1.5 bg-stone-50 border border-amber-400 rounded-lg focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setAddingDayISO(null)}
                        className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newDayTitle.trim()}
                        className="text-[10px] bg-amber-600 text-white font-semibold px-2 py-0.5 rounded-md"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAddingDayISO(day.dateISO);
                      setNewDayTitle('');
                    }}
                    className="w-full py-1 text-[11px] text-stone-400 hover:text-amber-700 hover:bg-amber-50/50 rounded-lg transition flex items-center justify-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
