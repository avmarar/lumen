'use client';

import React from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { StatusFilter } from '@/lib/types';

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
  } = useAppStore();

  // Determine Title & Context
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
      viewSub = 'Custom List';
      Icon = ListCheck;
    }
  }

  // Collect unique tags from all todos
  const allTags = Array.from(new Set(todos.flatMap((t) => t.tags || []).filter(Boolean))).sort();

  return (
    <header className="sticky top-0 z-20 bg-amber-50/60 backdrop-blur-md border-b border-stone-200/80 px-4 md:px-8 py-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* View Title + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200/60 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-xs">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight leading-tight">
                {viewTitle}
              </h2>
              <p className="text-xs text-stone-500 font-medium">{viewSub}</p>
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Today List / Planner toggle */}
          {activeView === 'today' && (
            <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTodaySubView('list')}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  todaySubView === 'list'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setTodaySubView('planner')}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  todaySubView === 'planner'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Planner
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:w-48 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white/90 text-stone-800 placeholder:text-stone-400 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs font-medium">
            {(['active', 'completed', 'all'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-md capitalize transition ${
                  statusFilter === filter
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tag Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3 h-3" /> Tags
          </span>
          <button
            onClick={() => setActiveTagFilter(null)}
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
              key={tag}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
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
              onClick={() => setActiveTagFilter(null)}
              className="p-1 text-stone-400 hover:text-rose-600 flex-shrink-0"
              title="Clear tag filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
