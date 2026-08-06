'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Tag,
  CheckSquare,
  Bell,
  Repeat,
  Timer,
  Focus,
  MessageSquare,
  User,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  getTodayISO,
  formatDateISO,
  formatDateTimeFriendly,
  DURATION_PRESETS,
  getTomorrowISO,
} from '@/lib/dates';
import { Priority, RecurrenceFrequency } from '@/lib/types';
import { fetchListMembers } from '@/lib/listShare';
import { ListMember } from '@/lib/types';

export function DetailPanel() {
  const {
    todos,
    selectedTodoId,
    setSelectedTodoId,
    updateTodo,
    deleteTodo,
    lists,
    checklists,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    updateChecklistItem,
    comments,
    addComment,
    deleteComment,
    startFocus,
    user,
    canEditList,
  } = useAppStore();

  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [customRemindDateTime, setCustomRemindDateTime] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [members, setMembers] = useState<ListMember[]>([]);

  const todo = todos.find((t) => t.id === selectedTodoId);
  const canEdit = todo ? canEditList(todo.listId) : true;
  const listIdForMembers = todo?.listId && user ? todo.listId : null;

  useEffect(() => {
    if (!listIdForMembers) return;
    let cancelled = false;
    void fetchListMembers(listIdForMembers).then((rows) => {
      if (!cancelled) setMembers(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [listIdForMembers]);

  // Close panel on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTodoId) {
        setSelectedTodoId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTodoId, setSelectedTodoId]);

  if (!todo) return null;

  const activeMembers = listIdForMembers ? members : [];
  const todoChecklists = checklists
    .filter((c) => c.todoId === todo.id)
    .sort((a, b) => a.order - b.order);
  const todoComments = comments
    .filter((c) => c.todoId === todo.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const completedCount = todoChecklists.filter((c) => c.completed).length;
  const progressPercent =
    todoChecklists.length > 0 ? Math.round((completedCount / todoChecklists.length) * 100) : 0;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    addChecklistItem(todo.id, newChecklistTitle);
    setNewChecklistTitle('');
  };

  const handleSetReminderPreset = (preset: 'today-5pm' | 'tomorrow-9am' | 'monday-9am') => {
    const todayISO = getTodayISO();
    let remindISO = '';

    if (preset === 'today-5pm') {
      remindISO = `${todayISO}T17:00:00`;
    } else if (preset === 'tomorrow-9am') {
      remindISO = `${getTomorrowISO()}T09:00:00`;
    } else if (preset === 'monday-9am') {
      const d = new Date();
      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      const mondayISO = formatDateISO(d);
      remindISO = `${mondayISO}T09:00:00`;
    }

    const remindDate = remindISO.split('T')[0];
    updateTodo(todo.id, {
      remindAt: remindISO,
      dueDate: todo.dueDate || remindDate,
    });
  };

  const handleCustomReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRemindDateTime) return;
    const remindDate = customRemindDateTime.split('T')[0];
    updateTodo(todo.id, {
      remindAt: customRemindDateTime,
      dueDate: todo.dueDate || remindDate,
    });
  };

  const handleRecurrenceChange = (value: string) => {
    if (value === 'none') {
      updateTodo(todo.id, { recurrence: null });
    } else {
      updateTodo(todo.id, {
        recurrence: { frequency: value as RecurrenceFrequency, interval: 1 },
        dueDate: todo.dueDate || getTodayISO(),
      });
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = tagInput.replace(/^#/, '').trim().toLowerCase();
    if (!normalized) return;
    const existing = todo.tags || [];
    if (existing.includes(normalized)) {
      setTagInput('');
      return;
    }
    updateTodo(todo.id, { tags: [...existing, normalized] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateTodo(todo.id, { tags: (todo.tags || []).filter((t) => t !== tag) });
  };

  return (
    <aside className="w-full md:w-[380px] h-screen sticky top-0 flex-shrink-0 bg-white border-l border-stone-200/90 shadow-2xl flex flex-col z-40 transition-all">
      {/* Panel Top Action Bar */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          {/* List Selector */}
          <select
            value={todo.listId || ''}
            onChange={(e) => updateTodo(todo.id, { listId: e.target.value || null })}
            className="text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">📥 Inbox (No List)</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Priority Selector */}
          <select
            value={todo.priority}
            onChange={(e) => updateTodo(todo.id, { priority: e.target.value as Priority })}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
              todo.priority === 'high'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : todo.priority === 'medium'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            <option value="none">Priority: Normal</option>
            <option value="low">Priority: Low</option>
            <option value="medium">Priority: Medium</option>
            <option value="high">Priority: High</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          {!todo.completed && canEdit && (
            <button
              onClick={() => startFocus(todo.id)}
              className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
              title="Start focus"
            >
              <Focus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete task"
            disabled={!canEdit}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedTodoId(null)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            title="Close detail panel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Form Scroll Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title Input */}
        <div>
          <textarea
            value={todo.title}
            onChange={(e) => updateTodo(todo.id, { title: e.target.value })}
            placeholder="Task title..."
            rows={2}
            className="w-full text-lg font-semibold text-stone-900 placeholder:text-stone-300 resize-none bg-transparent focus:outline-none"
          />
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Notes & Details
          </label>
          <textarea
            value={todo.notes || ''}
            onChange={(e) => updateTodo(todo.id, { notes: e.target.value })}
            placeholder="Add context, URLs, or background instructions..."
            rows={4}
            className="w-full text-xs text-stone-700 placeholder:text-stone-300 bg-stone-50/60 p-3 rounded-xl border border-stone-200/80 focus:outline-none focus:border-amber-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* Due Date & Recurrence Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span>Due Date</span>
              {todo.dueDate && (
                <button
                  onClick={() => updateTodo(todo.id, { dueDate: null })}
                  className="text-[11px] text-stone-400 hover:text-rose-600 font-normal"
                >
                  Clear
                </button>
              )}
            </label>
            <input
              type="date"
              value={todo.dueDate || ''}
              onChange={(e) => updateTodo(todo.id, { dueDate: e.target.value || null })}
              className="w-full text-xs font-medium bg-stone-50 text-stone-800 p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Repeat className="w-3 h-3 text-purple-600" />
              <span>Repeat</span>
            </label>
            <select
              value={todo.recurrence?.frequency || 'none'}
              onChange={(e) => handleRecurrenceChange(e.target.value)}
              className="w-full text-xs font-semibold bg-stone-50 text-stone-800 p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday (Mon-Fri)</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>
        </div>

        {/* Duration & Start Time */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-teal-600" />
              Duration
            </span>
            {todo.durationMinutes && (
              <button
                onClick={() => updateTodo(todo.id, { durationMinutes: null })}
                className="text-[11px] text-stone-400 hover:text-rose-600 font-normal"
              >
                Clear
              </button>
            )}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => updateTodo(todo.id, { durationMinutes: preset.minutes })}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                  todo.durationMinutes === preset.minutes
                    ? 'bg-teal-100 text-teal-900 border-teal-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-teal-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-stone-500 font-medium whitespace-nowrap">
              Start time
            </label>
            <input
              type="time"
              value={todo.startTime || ''}
              onChange={(e) =>
                updateTodo(todo.id, {
                  startTime: e.target.value || null,
                  dueDate: todo.dueDate || getTodayISO(),
                })
              }
              className="flex-1 text-xs font-medium bg-stone-50 text-stone-800 p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500"
            />
            {todo.startTime && (
              <button
                onClick={() => updateTodo(todo.id, { startTime: null })}
                className="text-[11px] text-stone-400 hover:text-rose-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-600" />
            Tags
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(todo.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[11px] font-medium border border-indigo-100"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-indigo-400 hover:text-rose-600"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag (e.g. design)"
              className="flex-1 text-xs font-medium bg-stone-50 text-stone-800 p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={!tagInput.trim()}
              className="px-2.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>

        {/* Reminders & Alerts */}
        <div className="space-y-2.5 p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Reminder Alert</span>
            </div>
            {todo.remindAt && (
              <button
                onClick={() => updateTodo(todo.id, { remindAt: null })}
                className="text-[11px] text-amber-800 hover:text-rose-600"
              >
                Remove
              </button>
            )}
          </div>

          {todo.remindAt ? (
            <div className="text-xs text-amber-900 bg-amber-100/80 p-2 rounded-lg font-medium flex items-center justify-between">
              <span>{formatDateTimeFriendly(todo.remindAt)}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-stone-500">Quick set reminder presets:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetReminderPreset('today-5pm')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[11px] font-medium rounded-lg border border-amber-200 shadow-sm transition"
                >
                  Today 5 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetReminderPreset('tomorrow-9am')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[11px] font-medium rounded-lg border border-amber-200 shadow-sm transition"
                >
                  Tomorrow 9 AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetReminderPreset('monday-9am')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[11px] font-medium rounded-lg border border-amber-200 shadow-sm transition"
                >
                  Mon 9 AM
                </button>
              </div>

              <form onSubmit={handleCustomReminderSubmit} className="flex items-center gap-2 pt-1">
                <input
                  type="datetime-local"
                  value={customRemindDateTime}
                  onChange={(e) => setCustomRemindDateTime(e.target.value)}
                  className="text-xs bg-white text-stone-800 p-1.5 rounded-lg border border-stone-200 focus:outline-none flex-1"
                />
                <button
                  type="submit"
                  disabled={!customRemindDateTime}
                  className="px-2.5 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  Set
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Nested Checklist Subtasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </label>
            {todoChecklists.length > 0 && (
              <span className="text-xs font-mono font-medium text-stone-500">
                {completedCount}/{todoChecklists.length} ({progressPercent}%)
              </span>
            )}
          </div>

          {/* Progress bar */}
          {todoChecklists.length > 0 && (
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-1.5">
            {todoChecklists.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 transition"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateChecklistItem(item.id, { title: e.target.value })}
                  className={`flex-1 text-xs font-medium bg-transparent focus:outline-none ${
                    item.completed ? 'line-through text-stone-400' : 'text-stone-800'
                  }`}
                />
                <button
                  onClick={() => deleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition"
                  title="Remove subtask"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Subtask Input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
            <Plus className="w-4 h-4 text-stone-400 ml-1" />
            <input
              type="text"
              placeholder="Add subtask (press Enter)..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              className="flex-1 text-xs font-medium text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none py-1"
            />
          </form>
        </div>

        {/* Assignee */}
        {user && todo.listId && (
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <User className="w-3 h-3" /> Assignee
            </label>
            <select
              value={todo.assigneeId || ''}
              disabled={!canEdit}
              onChange={(e) => updateTodo(todo.id, { assigneeId: e.target.value || null })}
              className="w-full text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2"
            >
              <option value="">Unassigned</option>
              <option value={user.id}>Me</option>
              {activeMembers
                .filter((m) => m.userId !== user.id)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userId.slice(0, 8)}…
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Comments
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {todoComments.length === 0 && (
              <p className="text-[11px] text-stone-400 italic">No comments yet.</p>
            )}
            {todoComments.map((c) => (
              <div
                key={c.id}
                className="text-xs bg-stone-50 border border-stone-100 rounded-lg p-2"
              >
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] text-stone-400">
                    {c.userId.slice(0, 8)}…
                  </span>
                  {user?.id === c.userId && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-stone-800 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
          {user && canEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentBody.trim()) return;
                addComment(todo.id, commentBody);
                setCommentBody('');
              }}
              className="flex gap-2"
            >
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-semibold bg-stone-800 text-white rounded-lg"
              >
                Post
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="p-3 border-t border-stone-100 bg-stone-50/60 text-[11px] text-stone-400 flex items-center justify-between">
        <span>Created {new Date(todo.createdAt).toLocaleDateString()}</span>
        <span>
          Updated{' '}
          {new Date(todo.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
    </aside>
  );
}
