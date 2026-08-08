'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Search,
  Sun,
  Inbox,
  CalendarDays,
  CalendarRange,
  ListCheck,
  Tag,
  X,
  LayoutList,
  CalendarClock,
  UserCheck,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { StatusFilter } from '@/lib/types';
import { getTodayISO, formatLoadHours, isOverdue } from '@/lib/dates';

export function MainHeader() {
  const {
    activeView,
    lists,
    todos,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    setIsMobileSidebarOpen,
    activeTagFilter,
    setActiveTagFilter,
    todaySubView,
    setTodaySubView,
    assignedToMeFilter,
    setAssignedToMeFilter,
    dayBudgetMinutes,
    setShareListId,
    user,
  } = useAppStore();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (filtersRef.current?.contains(target) || filtersPanelRef.current?.contains(target)) {
        return;
      }
      setFiltersOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

  let viewTitle = 'Today';
  let viewSub = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  let Icon = Sun;

  if (activeView === 'inbox') {
    viewTitle = 'Inbox';
    viewSub = 'Unassigned capture tasks';
    Icon = Inbox;
  } else if (activeView === 'upcoming') {
    viewTitle = 'Upcoming';
    viewSub = 'Next 7 days rolling horizon';
    Icon = CalendarDays;
  } else if (activeView === 'week') {
    viewTitle = 'Week Planner';
    viewSub = 'Distribute workload across days';
    Icon = CalendarRange;
  } else {
    const customList = lists.find((l) => l.id === activeView);
    if (customList) {
      viewTitle = customList.name;
      viewSub = customList.shared || customList.myRole ? 'Shared list' : 'Custom List';
      Icon = ListCheck;
    }
  }

  const today = getTodayISO();
  const loadMinutes = todos
    .filter(
      (t) => !t.completed && t.dueDate && (t.dueDate === today || isOverdue(t.dueDate, t.completed))
    )
    .reduce((sum, t) => {
      if (t.durationMinutes && t.durationMinutes > 0) return sum + t.durationMinutes;
      if (t.startTime) return sum + 30;
      return sum;
    }, 0);
  const overBudget = loadMinutes > dayBudgetMinutes;

  const allTags = Array.from(new Set(todos.flatMap((t) => t.tags || []).filter(Boolean))).sort();
  const isCustomList = !['inbox', 'today', 'upcoming', 'week'].includes(activeView);
  const activeList = lists.find((l) => l.id === activeView);
  const filtersActive = statusFilter !== 'active' || assignedToMeFilter || Boolean(activeTagFilter);
  const canShare =
    isCustomList && user && activeList && (activeList.myRole === 'owner' || !activeList.myRole);

  const statusTabs = (
    <div
      className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs font-medium w-full"
      role="group"
      aria-label="Status filter"
    >
      {(['active', 'completed', 'all'] as StatusFilter[]).map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => setStatusFilter(filter)}
          aria-pressed={statusFilter === filter}
          className={`flex-1 min-h-9 px-2 py-1.5 rounded-md capitalize transition text-center ${
            statusFilter === filter
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );

  const assignedButton = user ? (
    <button
      type="button"
      onClick={() => setAssignedToMeFilter(!assignedToMeFilter)}
      aria-pressed={assignedToMeFilter}
      className={`inline-flex items-center gap-1 min-h-11 px-2.5 py-1 rounded-lg text-xs font-medium border ${
        assignedToMeFilter
          ? 'bg-amber-700 text-white border-amber-700'
          : 'bg-white text-stone-600 border-stone-200'
      }`}
      aria-label="Assigned to me"
    >
      <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="hidden lg:inline">Assigned to me</span>
    </button>
  ) : null;

  const todayLayoutToggle =
    activeView === 'today' ? (
      <div
        className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs font-medium"
        role="group"
        aria-label="Today layout"
      >
        <button
          type="button"
          onClick={() => setTodaySubView('list')}
          aria-pressed={todaySubView === 'list'}
          className={`min-h-11 min-w-11 px-2.5 rounded-md transition inline-flex items-center justify-center gap-1 ${
            todaySubView === 'list'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          aria-label="List view"
        >
          <LayoutList className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">List</span>
        </button>
        <button
          type="button"
          onClick={() => setTodaySubView('planner')}
          aria-pressed={todaySubView === 'planner'}
          className={`min-h-11 min-w-11 px-2.5 rounded-md transition inline-flex items-center justify-center gap-1 ${
            todaySubView === 'planner'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          aria-label="Planner view"
        >
          <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Planner</span>
        </button>
      </div>
    ) : null;

  const loadBadge =
    activeView === 'today' ? (
      <div
        className={`px-2.5 py-1.5 min-h-9 inline-flex items-center rounded-lg text-[11px] font-semibold border ${
          overBudget
            ? 'bg-amber-100 text-amber-900 border-amber-300'
            : 'bg-stone-100 text-stone-600 border-stone-200'
        }`}
        title={`Day budget ${formatLoadHours(dayBudgetMinutes)}`}
      >
        {formatLoadHours(loadMinutes)} / {formatLoadHours(dayBudgetMinutes)}
        <span className="hidden sm:inline"> planned</span>
      </div>
    ) : null;

  const shareButton = canShare ? (
    <button
      type="button"
      onClick={() => setShareListId(activeView)}
      className="inline-flex items-center gap-1 min-h-9 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
      aria-label="Share list"
    >
      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Share</span>
    </button>
  ) : null;

  const searchField = (id: string) => (
    <div className="relative w-full min-w-0">
      <Search
        className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
        aria-hidden="true"
      />
      <label htmlFor={id} className="sr-only">
        Search tasks
      </label>
      <input
        id={id}
        type="search"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-8 pr-3 py-2.5 min-h-11 text-xs font-medium bg-white/90 text-stone-800 placeholder:text-stone-600 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
      />
    </div>
  );

  const filtersTrigger = (
    <button
      type="button"
      onClick={() => setFiltersOpen((o) => !o)}
      className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-medium border transition ${
        filtersActive
          ? 'bg-amber-700 text-white border-amber-700'
          : filtersOpen
            ? 'bg-stone-100 text-stone-800 border-stone-300'
            : 'bg-white/80 text-stone-500 border-stone-200/80 hover:bg-white hover:text-stone-700'
      }`}
      aria-expanded={filtersOpen}
      aria-controls="mobile-filters-panel"
      aria-label={filtersActive ? 'Filters (active)' : 'Filters'}
    >
      <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
      Filters
      {filtersActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/90" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-20 bg-amber-50/60 backdrop-blur-md border-b border-stone-200/80 px-4 md:px-8 pb-4 pt-safe flex flex-col gap-3">
      {/* ── Stacked until xl: sidebar docks at lg, but content width still too tight for a single chrome row ── */}
      <div className="flex flex-col gap-3 xl:hidden">
        {/* Row 1: title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="tap-target rounded-lg text-stone-600 hover:bg-stone-200/60 flex-shrink-0 lg:!hidden"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <div
            className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-xs flex-shrink-0"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              {viewTitle}
            </h2>
            <p className="text-xs text-stone-600 font-medium">{viewSub}</p>
          </div>
        </div>

        {/* Row 2: day tools */}
        {(loadBadge || todayLayoutToggle || shareButton) && (
          <div className="flex items-center gap-2 flex-wrap">
            {loadBadge}
            {todayLayoutToggle}
            {shareButton}
          </div>
        )}

        {/* Row 3: search + filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{searchField('task-search-mobile')}</div>
          <div className="flex-shrink-0" ref={filtersRef}>
            {filtersTrigger}
          </div>
        </div>

        {filtersOpen && (
          <div
            id="mobile-filters-panel"
            ref={filtersPanelRef}
            className="w-full rounded-xl bg-white border border-stone-200 shadow-sm p-3 space-y-3"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Status
              </p>
              {statusTabs}
            </div>
            {assignedButton && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Assignment
                </p>
                <button
                  type="button"
                  onClick={() => setAssignedToMeFilter(!assignedToMeFilter)}
                  aria-pressed={assignedToMeFilter}
                  className={`w-full inline-flex items-center justify-center gap-1.5 min-h-11 px-2.5 py-2 rounded-lg text-xs font-medium border ${
                    assignedToMeFilter
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Assigned to me
                </button>
              </div>
            )}
            {allTags.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTagFilter(null)}
                    aria-pressed={!activeTagFilter}
                    className={`min-h-9 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                      !activeTagFilter
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                      aria-pressed={activeTagFilter === tag}
                      className={`min-h-9 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        activeTagFilter === tag
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Wide desktop (xl+): title on its own row, tools wrap below ── */}
      <div className="hidden xl:flex flex-col gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-xs flex-shrink-0"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              {viewTitle}
            </h2>
            <p className="text-xs text-stone-600 font-medium">{viewSub}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {loadBadge}
          {shareButton}
          {assignedButton}
          {todayLayoutToggle}
          <div className="w-48 min-[1400px]:w-56 flex-1 min-w-[12rem] max-w-xs">
            {searchField('task-search')}
          </div>
          <div className="min-w-[10rem]">{statusTabs}</div>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <Tag className="w-3 h-3" aria-hidden="true" /> Tags
            </span>
            <button
              type="button"
              onClick={() => setActiveTagFilter(null)}
              aria-pressed={!activeTagFilter}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition flex-shrink-0 ${
                !activeTagFilter
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                aria-pressed={activeTagFilter === tag}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition flex-shrink-0 ${
                  activeTagFilter === tag
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:border-indigo-300'
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeTagFilter && (
              <button
                type="button"
                onClick={() => setActiveTagFilter(null)}
                className="tap-target text-stone-500 hover:text-rose-600 flex-shrink-0"
                aria-label="Clear tag filter"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
