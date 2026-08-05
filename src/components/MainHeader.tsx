'use client';

import React from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Inbox, 
  CalendarDays, 
  CalendarRange, 
  Filter, 
  CheckCircle2, 
  ListCheck
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTodayISO } from '@/lib/dates';
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
  } = useAppStore();

  const today = getTodayISO();

  // Determine Title & Context
  let viewTitle = 'Today';
  let viewSub = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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

  // Active task counter
  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <header className="sticky top-0 z-20 bg-amber-50/60 backdrop-blur-md border-b border-stone-200/80 px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* Right Tools: Search Bar + Status Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
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

        {/* Status Filter Segmented Control */}
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
    </header>
  );
}
