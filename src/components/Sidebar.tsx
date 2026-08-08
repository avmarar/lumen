'use client';

import React, { useCallback, useState } from 'react';
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
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTodayISO, isOverdue } from '@/lib/dates';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/reminders';
import { CalendarExport } from '@/components/CalendarExport';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useDialog } from '@/lib/useDialog';

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
    setShareListId,
  } = useAppStore();

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#D97706');
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' ? getNotificationPermission() : 'default'
  );

  const closeDrawer = useCallback(() => {
    setIsMobileSidebarOpen(false);
    setListMenuId(null);
  }, [setIsMobileSidebarOpen]);

  const { containerRef: drawerRef, titleId: drawerTitleId } = useDialog({
    open: isMobileSidebarOpen,
    onClose: closeDrawer,
  });

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

  const renderContent = (isDrawer: boolean) => (
    <aside
      className="w-64 h-full flex flex-col bg-stone-900 text-stone-300 border-r border-stone-800 selection:bg-amber-900/50 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Lists and views"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h1
              id={isDrawer ? drawerTitleId : undefined}
              className="font-serif text-xl tracking-tight font-semibold text-stone-100 flex items-center gap-1.5"
            >
              Lumen
            </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              Calm Planner
            </p>
          </div>
        </div>

        {isDrawer && (
          <button
            type="button"
            onClick={closeDrawer}
            className="tap-target rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" aria-hidden="true" />
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
            role="status"
            aria-live="polite"
            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${
              syncStatus === 'synced'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                : syncStatus === 'syncing'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                  : syncStatus === 'error'
                    ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                    : 'bg-stone-800 text-stone-300 border-stone-600'
            }`}
          >
            {syncStatus === 'synced'
              ? 'Synced'
              : syncStatus === 'syncing'
                ? 'Syncing'
                : syncStatus === 'error'
                  ? 'Error'
                  : 'Offline'}
          </span>
        </button>
      </div>

      {/* Main Views Navigation */}
      <nav className="p-3 space-y-1" aria-label="Primary">
        <button
          type="button"
          onClick={() => setActiveView('today')}
          aria-current={activeView === 'today' ? 'page' : undefined}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'today'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sun
              className={`w-4 h-4 ${activeView === 'today' ? 'text-amber-400' : 'text-amber-500/80'}`}
              aria-hidden="true"
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
          type="button"
          onClick={() => setActiveView('inbox')}
          aria-current={activeView === 'inbox' ? 'page' : undefined}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'inbox'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox
              className={`w-4 h-4 ${activeView === 'inbox' ? 'text-amber-400' : 'text-stone-400'}`}
              aria-hidden="true"
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
          type="button"
          onClick={() => setActiveView('upcoming')}
          aria-current={activeView === 'upcoming' ? 'page' : undefined}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'upcoming'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays
              className={`w-4 h-4 ${activeView === 'upcoming' ? 'text-amber-400' : 'text-stone-400'}`}
              aria-hidden="true"
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
          type="button"
          onClick={() => setActiveView('week')}
          aria-current={activeView === 'week' ? 'page' : undefined}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'week'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
              : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarRange
              className={`w-4 h-4 ${activeView === 'week' ? 'text-amber-400' : 'text-stone-400'}`}
              aria-hidden="true"
            />
            <span>Week Planner</span>
          </div>
        </button>
      </nav>

      <div className="my-2 border-t border-stone-800/80 mx-3" />

      {/* Custom Lists Section */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-stone-400 tracking-wider uppercase">
          <span>Lists</span>
          <button
            type="button"
            onClick={() => setIsAddingList(true)}
            className="size-8 inline-flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition"
            aria-label="Create list"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {isAddingList && (
          <form
            onSubmit={handleAddListSubmit}
            className="p-2 bg-stone-800/80 rounded-lg border border-stone-700/60 mb-2 space-y-2"
          >
            <label htmlFor="new-list-name" className="sr-only">
              List name
            </label>
            <input
              id="new-list-name"
              type="text"
              placeholder="List name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              className="w-full bg-stone-900 text-stone-100 text-xs px-2.5 py-1.5 rounded border border-stone-700 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5" role="group" aria-label="List color">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    aria-label={`Color ${color}`}
                    aria-pressed={newListColor === color}
                    className="tap-target"
                  >
                    <span
                      className={`block w-4 h-4 rounded-full transition-transform ${newListColor === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-stone-800' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                  </button>
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
              className={`group relative flex items-center justify-between gap-1 px-2.5 py-1 min-h-9 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveView(list.id)}
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 flex items-center gap-2.5 truncate text-left min-h-8"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: list.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{list.name}</span>
              </button>

              <div className="flex items-center gap-0.5 flex-shrink-0 relative">
                {(list.shared || list.myRole === 'editor' || list.myRole === 'viewer') && (
                  <Share2 className="w-3 h-3 text-stone-500 flex-shrink-0" aria-hidden="true" />
                )}
                {listCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono">
                    {listCount}
                  </span>
                )}
                {/* Fine pointer: overlay so hover actions don't inflate row height */}
                <div className="pointer-actions absolute right-0 top-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md bg-stone-900/95 px-0.5">
                  {user && (list.myRole === 'owner' || !list.myRole) && (
                    <button
                      type="button"
                      onClick={() => setShareListId(list.id)}
                      className="size-8 inline-flex items-center justify-center text-stone-500 hover:text-amber-400 rounded hover:bg-stone-800"
                      aria-label={`Share ${list.name}`}
                    >
                      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteList(list.id)}
                    className="size-8 inline-flex items-center justify-center text-stone-500 hover:text-rose-400 rounded hover:bg-stone-800"
                    aria-label={`Delete ${list.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                {/* Touch: compact kebab */}
                <div className="touch-actions relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setListMenuId(listMenuId === list.id ? null : list.id);
                    }}
                    className="size-8 inline-flex items-center justify-center text-stone-500 hover:text-stone-200 rounded hover:bg-stone-800"
                    aria-label="List actions"
                    aria-expanded={listMenuId === list.id}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  {listMenuId === list.id && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg bg-stone-800 border border-stone-700 shadow-xl py-1"
                    >
                      {user && (list.myRole === 'owner' || !list.myRole) && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShareListId(list.id);
                            setListMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-stone-200 hover:bg-stone-700"
                        >
                          <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          deleteList(list.id);
                          setListMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-rose-400 hover:bg-stone-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footbar */}
      <div className="p-3 border-t border-stone-800/80 space-y-2 text-xs text-stone-400">
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-1">
            <CalendarExport compact />
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="tap-target text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition"
              aria-label="Keyboard shortcuts"
            >
              <span className="font-mono text-[10px] bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-stone-300">
                ?
              </span>
            </button>
          </div>
        </div>
        <InstallPrompt />
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop / large-tablet rail */}
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        {renderContent(false)}
      </div>

      {/* Phone / tablet drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm cursor-default"
            aria-label="Close navigation"
            onClick={closeDrawer}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            tabIndex={-1}
            className="relative z-10 w-64 h-full outline-none"
          >
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
