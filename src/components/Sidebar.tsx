'use client';

import React, { useState } from 'react';
import {
  Inbox,
  Sun,
  CalendarDays,
  CalendarRange,
  Plus,
  Trash2,
  Bell,
  X,
  Sparkles,
  User,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTodayISO, isOverdue } from '@/lib/dates';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/reminders';

export function Sidebar() {
  const {
    lists,
    todos,
    activeView,
    setActiveView,
    addList,
    deleteList,
    setIsShortcutsOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    user,
    setIsAuthModalOpen,
    syncStatus,
  } = useAppStore();

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#D97706');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' ? getNotificationPermission() : 'default'
  );

  const today = getTodayISO();

  // Counts
  const inboxCount = todos.filter((t) => !t.completed && !t.dueDate && !t.listId).length;
  const todayCount = todos.filter(
    (t) => !t.completed && (t.dueDate === today || isOverdue(t.dueDate, t.completed))
  ).length;
  const overdueCount = todos.filter(
    (t) => !t.completed && isOverdue(t.dueDate, t.completed)
  ).length;
  const upcomingCount = todos.filter((t) => !t.completed && t.dueDate && t.dueDate > today).length;

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const createdId = addList(newListName.trim(), newListColor);
    setNewListName('');
    setIsAddingList(false);
    setActiveView(createdId);
  };

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const PRESET_COLORS = ['#D97706', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'];

  const content = (
    <aside className="w-64 h-full flex flex-col bg-stone-900 text-stone-300 border-r border-stone-800 selection:bg-amber-900/50">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-serif text-xl tracking-tight font-semibold text-stone-100 flex items-center gap-1.5">
              Lumen
            </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              Calm Planner
            </p>
          </div>
        </div>

        {isMobileSidebarOpen && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auth & Sync Button Banner */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full flex items-center justify-between p-2.5 bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 rounded-xl text-xs transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] border border-amber-500/30">
              {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="truncate text-stone-200 font-medium">
              {user?.email ? user.email : 'Guest Mode'}
            </span>
          </div>

          <span
            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${
              syncStatus === 'synced'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                : syncStatus === 'syncing'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Sync'}
          </span>
        </button>
      </div>

      {/* Main Views Navigation */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => setActiveView('today')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'today'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sun
              className={`w-4 h-4 ${activeView === 'today' ? 'text-amber-400' : 'text-amber-500/80'}`}
            />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50">
                {overdueCount} overdue
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono">
              {todayCount}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('inbox')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'inbox'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox
              className={`w-4 h-4 ${activeView === 'inbox' ? 'text-amber-400' : 'text-stone-400'}`}
            />
            <span>Inbox</span>
          </div>
          {inboxCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono">
              {inboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('upcoming')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'upcoming'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays
              className={`w-4 h-4 ${activeView === 'upcoming' ? 'text-amber-400' : 'text-stone-400'}`}
            />
            <span>Upcoming</span>
          </div>
          {upcomingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono">
              {upcomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('week')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'week'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarRange
              className={`w-4 h-4 ${activeView === 'week' ? 'text-amber-400' : 'text-stone-400'}`}
            />
            <span>Week Planner</span>
          </div>
        </button>
      </div>

      <div className="my-2 border-t border-stone-800/80 mx-3" />

      {/* Custom Lists Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-stone-400 tracking-wider uppercase">
          <span>Lists</span>
          <button
            onClick={() => setIsAddingList(true)}
            className="p-1 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition"
            title="Create list"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAddingList && (
          <form
            onSubmit={handleAddListSubmit}
            className="p-2 bg-stone-800/80 rounded-lg border border-stone-700/60 mb-2 space-y-2"
          >
            <input
              type="text"
              placeholder="List name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              className="w-full bg-stone-900 text-stone-100 text-xs px-2.5 py-1.5 rounded border border-stone-700 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className={`w-4 h-4 rounded-full transition-transform ${newListColor === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-stone-800' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingList(false)}
                  className="px-2 py-1 text-[11px] text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-500 text-stone-950 rounded hover:bg-amber-400 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {lists.map((list) => {
          const listCount = todos.filter((t) => !t.completed && t.listId === list.id).length;
          const isActive = activeView === list.id;

          return (
            <div
              key={list.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <button
                onClick={() => setActiveView(list.id)}
                className="flex-1 flex items-center gap-2.5 truncate text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: list.color }}
                />
                <span className="truncate">{list.name}</span>
              </button>

              <div className="flex items-center gap-1">
                {listCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono group-hover:hidden">
                    {listCount}
                  </span>
                )}
                <button
                  onClick={() => deleteList(list.id)}
                  className="hidden group-hover:flex p-1 text-stone-500 hover:text-rose-400 rounded hover:bg-stone-800"
                  title="Delete list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footbar */}
      <div className="p-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
        <button
          onClick={handleRequestNotif}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-stone-800 hover:text-stone-200 transition"
          title={
            notifPermission === 'granted'
              ? 'Notifications Active'
              : 'Click to enable reminder alerts'
          }
        >
          <Bell
            className={`w-3.5 h-3.5 ${
              notifPermission === 'granted' ? 'text-emerald-400' : 'text-stone-500'
            }`}
          />
          <span className="text-[11px]">
            {notifPermission === 'granted' ? 'Reminders On' : 'Allow Alerts'}
          </span>
        </button>

        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition"
          title="Keyboard shortcuts (?)"
        >
          <span className="font-mono text-[10px] bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-stone-300">
            ?
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop rail */}
      <div className="hidden md:block h-screen sticky top-0 flex-shrink-0">{content}</div>

      {/* Mobile drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
