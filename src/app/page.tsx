'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { MainHeader } from '@/components/MainHeader';
import { QuickAdd } from '@/components/QuickAdd';
import { TodoGroup } from '@/components/TodoGroup';
import { DetailPanel } from '@/components/DetailPanel';
import { WeekView } from '@/components/WeekView';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { ReminderListener } from '@/components/ReminderListener';
import { AuthModal } from '@/components/AuthModal';
import { BulkActionBar } from '@/components/BulkActionBar';
import { TimeBlockingGrid } from '@/components/TimeBlockingGrid';
import { getTodayISO, isOverdue } from '@/lib/dates';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRealtimeSync, bootstrapCloudSync } from '@/lib/useRealtimeSync';
import { SyncToast } from '@/components/SyncToast';
import { FocusOverlay } from '@/components/FocusOverlay';
import { ShareListModal } from '@/components/ShareListModal';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const {
    hydrateStore,
    isHydrated,
    activeView,
    todos,
    statusFilter,
    searchQuery,
    activeTagFilter,
    todaySubView,
    assignedToMeFilter,
    user,
    setUser,
    setSyncStatus,
  } = useAppStore();

  useRealtimeSync();

  useEffect(() => {
    hydrateStore();

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          await bootstrapCloudSync(session.user.id);
        } else {
          setUser(null);
          setSyncStatus('offline');
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          if (event === 'SIGNED_IN') {
            await bootstrapCloudSync(session.user.id);
          } else {
            setSyncStatus('synced');
          }
        } else {
          setUser(null);
          setSyncStatus('offline');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [hydrateStore, setUser, setSyncStatus]);

  if (!isHydrated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-900 text-stone-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-serif text-lg font-semibold tracking-tight text-amber-100">
            Lumen is waking up...
          </p>
        </div>
      </div>
    );
  }

  const today = getTodayISO();

  // Filter todos by view
  let viewFilteredTodos = todos;

  if (activeView === 'inbox') {
    viewFilteredTodos = todos.filter((t) => !t.dueDate && !t.listId);
  } else if (activeView === 'today') {
    viewFilteredTodos = todos.filter(
      (t) => t.dueDate === today || isOverdue(t.dueDate, t.completed)
    );
  } else if (activeView === 'upcoming') {
    viewFilteredTodos = todos.filter((t) => t.dueDate && t.dueDate > today);
  } else if (activeView === 'week') {
    viewFilteredTodos = todos;
  } else {
    // Custom list view
    viewFilteredTodos = todos.filter((t) => t.listId === activeView);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    viewFilteredTodos = viewFilteredTodos.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.tags || []).some((tag) => tag.includes(q.replace(/^#/, '')))
    );
  }

  // Filter by active tag
  if (activeTagFilter) {
    viewFilteredTodos = viewFilteredTodos.filter((t) => (t.tags || []).includes(activeTagFilter));
  }

  if (assignedToMeFilter && user) {
    viewFilteredTodos = viewFilteredTodos.filter((t) => t.assigneeId === user.id);
  }

  // Filter by status tab (active / completed / all)
  let statusFilteredTodos = viewFilteredTodos;
  if (statusFilter === 'active') {
    statusFilteredTodos = viewFilteredTodos.filter((t) => !t.completed);
  } else if (statusFilter === 'completed') {
    statusFilteredTodos = viewFilteredTodos.filter((t) => t.completed);
  }

  // Split into buckets
  const overdueTodos = statusFilteredTodos.filter(
    (t) => !t.completed && isOverdue(t.dueDate, t.completed)
  );
  const pinnedTodos = statusFilteredTodos.filter(
    (t) => t.pinned && !isOverdue(t.dueDate, t.completed) && !t.completed
  );
  const activeUnpinnedTodos = statusFilteredTodos.filter(
    (t) => !t.pinned && !isOverdue(t.dueDate, t.completed) && !t.completed
  );
  const completedTodos = statusFilteredTodos.filter((t) => t.completed);

  const showPlanner = activeView === 'today' && todaySubView === 'planner';

  return (
    <div className="flex h-screen w-full bg-amber-50/20 text-stone-900 overflow-hidden bg-grain">
      {/* Left Navigation Rail */}
      <Sidebar />

      {/* Main Workspace Pane */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        <MainHeader />

        <div className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
          {/* Quick Add Bar */}
          <QuickAdd />

          {/* If Week View is Active */}
          {activeView === 'week' ? (
            <WeekView />
          ) : showPlanner ? (
            <TimeBlockingGrid />
          ) : (
            /* Standard View Task Buckets */
            <div className="space-y-6">
              {/* Overdue Section */}
              <TodoGroup
                title="Overdue"
                todos={overdueTodos}
                badgeColor="bg-rose-100 text-rose-800"
              />

              {/* Pinned Section */}
              <TodoGroup
                title="Pinned Tasks"
                todos={pinnedTodos}
                badgeColor="bg-amber-100 text-amber-900"
              />

              {/* Active Focus Tasks Section */}
              <TodoGroup
                title={activeView === 'today' ? "Today's Focus" : 'Tasks'}
                todos={activeUnpinnedTodos}
                badgeColor="bg-amber-100 text-amber-900"
              />

              {/* Completed Section */}
              <TodoGroup
                title="Completed"
                todos={completedTodos}
                badgeColor="bg-stone-200 text-stone-700"
                defaultExpanded={statusFilter === 'completed'}
              />

              {/* Empty State */}
              {statusFilteredTodos.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-stone-200/80 rounded-2xl bg-white/60 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-800">
                      All clear for now
                    </h4>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 font-medium">
                      No tasks found in this view. Capture a new task above or press{' '}
                      <kbd className="font-mono bg-stone-100 px-1 border rounded">N</kbd> to get
                      started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Context Detail Panel (Slide-over) */}
      <DetailPanel />

      {/* Modals & Floating Listeners */}
      <ShortcutsModal />
      <ReminderListener />
      <AuthModal />
      <BulkActionBar />
      <ShareListModal />
      <FocusOverlay />
      <SyncToast />
    </div>
  );
}
