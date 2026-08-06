import { create } from 'zustand';
import { get as getIDB, set as setIDB } from 'idb-keyval';
import type { User } from '@supabase/supabase-js';
import {
  Todo,
  List,
  ChecklistItem,
  ActiveView,
  StatusFilter,
  Priority,
  RecurrenceRule,
  TodaySubView,
} from './types';
import { getTodayISO, calculateNextDueDate } from './dates';

const DB_STORE_KEY = 'lumen_app_data_v1';

interface AppData {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
}

const DEFAULT_LISTS: List[] = [
  {
    id: 'list-work',
    name: 'Work',
    color: '#3B82F6',
    archived: false,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'list-personal',
    name: 'Personal',
    color: '#10B981',
    archived: false,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'list-ideas',
    name: 'Ideas & Projects',
    color: '#F59E0B',
    archived: false,
    order: 2,
    createdAt: new Date().toISOString(),
  },
];

function getSeedData(): AppData {
  const today = getTodayISO();

  return {
    lists: DEFAULT_LISTS,
    todos: [
      {
        id: 'todo-welcome',
        listId: null,
        title: 'Welcome to Lumen — press N to capture your first real task',
        notes:
          'Try ^today, !high, @work, #focus, or ~30m in Quick Add. Open this card to explore notes, tags, duration, and reminders.',
        completed: false,
        dueDate: today,
        priority: 'none',
        tags: ['example'],
        durationMinutes: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    checklists: [
      {
        id: 'check-welcome-1',
        todoId: 'todo-welcome',
        title: 'Explore the detail panel on the right',
        completed: false,
        order: 0,
      },
      {
        id: 'check-welcome-2',
        todoId: 'todo-welcome',
        title: 'Delete this example when you’re ready',
        completed: false,
        order: 1,
      },
    ],
  };
}

export interface AppStoreState {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];

  // UI State
  activeView: ActiveView;
  selectedTodoId: string | null;
  statusFilter: StatusFilter;
  searchQuery: string;
  isShortcutsOpen: boolean;
  isMobileSidebarOpen: boolean;
  isHydrated: boolean;
  activeTagFilter: string | null;
  selectedTodoIds: string[];
  todaySubView: TodaySubView;

  // v2 Auth & Sync State
  user: User | null;
  isAuthModalOpen: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';

  // Actions
  hydrateStore: () => Promise<void>;
  hydrateCloudData: (lists: List[], todos: Todo[], checklists: ChecklistItem[]) => void;

  // Navigation & Auth Actions
  setUser: (user: User | null) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error') => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedTodoId: (id: string | null) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setSearchQuery: (query: string) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setActiveTagFilter: (tag: string | null) => void;
  setTodaySubView: (view: TodaySubView) => void;

  // Multi-select / Bulk
  toggleTodoSelection: (id: string) => void;
  selectAllTodos: (ids: string[]) => void;
  clearTodoSelection: () => void;
  bulkUpdateTodos: (ids: string[], updates: Partial<Todo>) => void;
  bulkDeleteTodos: (ids: string[]) => void;
  bulkCompleteTodos: (ids: string[]) => void;
  bulkAddTag: (ids: string[], tag: string) => void;

  // List CRUD
  addList: (name: string, color?: string) => string;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;

  // Todo CRUD
  addTodo: (data: {
    title: string;
    listId?: string | null;
    dueDate?: string | null;
    priority?: Priority;
    remindAt?: string | null;
    notes?: string;
    recurrence?: RecurrenceRule | null;
    durationMinutes?: number | null;
    startTime?: string | null;
    tags?: string[];
  }) => string;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  toggleTodoComplete: (id: string) => void;
  deleteTodo: (id: string) => void;

  // Checklist CRUD
  addChecklistItem: (todoId: string, title: string) => string;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  toggleChecklistItem: (id: string) => void;
  deleteChecklistItem: (id: string) => void;
  reorderChecklistItems: (todoId: string, itemIds: string[]) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => {
  const persist = (data: Partial<AppData>) => {
    const currentState = get();
    const payload: AppData = {
      lists: data.lists ?? currentState.lists,
      todos: data.todos ?? currentState.todos,
      checklists: data.checklists ?? currentState.checklists,
    };
    set(payload);
    if (typeof window !== 'undefined') {
      setIDB(DB_STORE_KEY, payload).catch((err: unknown) =>
        console.error('Error saving to IndexedDB:', err)
      );
    }
  };

  return {
    lists: [],
    todos: [],
    checklists: [],

    activeView: 'today',
    selectedTodoId: null,
    statusFilter: 'active',
    searchQuery: '',
    isShortcutsOpen: false,
    isMobileSidebarOpen: false,
    isHydrated: false,
    activeTagFilter: null,
    selectedTodoIds: [],
    todaySubView: 'list',

    user: null,
    isAuthModalOpen: false,
    syncStatus: 'offline',

    setUser: (user) => set({ user }),
    setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    setActiveTagFilter: (activeTagFilter) => set({ activeTagFilter }),
    setTodaySubView: (todaySubView) => set({ todaySubView }),

    toggleTodoSelection: (id) => {
      const current = get().selectedTodoIds;
      set({
        selectedTodoIds: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      });
    },
    selectAllTodos: (ids) => set({ selectedTodoIds: ids }),
    clearTodoSelection: () => set({ selectedTodoIds: [] }),
    bulkUpdateTodos: (ids, updates) => {
      const idSet = new Set(ids);
      const todos = get().todos.map((t) =>
        idSet.has(t.id) ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
      persist({ todos });
      set({ selectedTodoIds: [] });
    },
    bulkDeleteTodos: (ids) => {
      const idSet = new Set(ids);
      const todos = get().todos.filter((t) => !idSet.has(t.id));
      const checklists = get().checklists.filter((c) => !idSet.has(c.todoId));
      const selectedTodoId =
        get().selectedTodoId && idSet.has(get().selectedTodoId!) ? null : get().selectedTodoId;
      set({ selectedTodoId, selectedTodoIds: [] });
      persist({ todos, checklists });
    },
    bulkCompleteTodos: (ids) => {
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      const todos = get().todos.map((t) =>
        idSet.has(t.id) ? { ...t, completed: true, completedAt: now, updatedAt: now } : t
      );
      persist({ todos });
      set({ selectedTodoIds: [] });
    },
    bulkAddTag: (ids, tag) => {
      const normalized = tag.replace(/^#/, '').trim().toLowerCase();
      if (!normalized) return;
      const idSet = new Set(ids);
      const todos = get().todos.map((t) => {
        if (!idSet.has(t.id)) return t;
        const existing = t.tags || [];
        if (existing.includes(normalized)) return t;
        return {
          ...t,
          tags: [...existing, normalized],
          updatedAt: new Date().toISOString(),
        };
      });
      persist({ todos });
      set({ selectedTodoIds: [] });
    },

    hydrateStore: async () => {
      if (get().isHydrated) return;
      try {
        const stored = await getIDB<AppData>(DB_STORE_KEY);
        if (stored && Array.isArray(stored.lists) && Array.isArray(stored.todos)) {
          set({
            lists: stored.lists,
            todos: stored.todos,
            checklists: stored.checklists || [],
            isHydrated: true,
          });
        } else {
          const seed = getSeedData();
          set({
            lists: seed.lists,
            todos: seed.todos,
            checklists: seed.checklists,
            isHydrated: true,
          });
          await setIDB(DB_STORE_KEY, seed);
        }
      } catch (err: unknown) {
        console.error('Failed to hydrate from IndexedDB, falling back to seed:', err);
        const seed = getSeedData();
        set({
          lists: seed.lists,
          todos: seed.todos,
          checklists: seed.checklists,
          isHydrated: true,
        });
      }
    },

    hydrateCloudData: (lists, todos, checklists) => {
      persist({ lists, todos, checklists });
    },

    setActiveView: (activeView) =>
      set({ activeView, isMobileSidebarOpen: false, selectedTodoIds: [] }),
    setSelectedTodoId: (selectedTodoId) => set({ selectedTodoId }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setIsShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
    setIsMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

    // Lists
    addList: (name, color = '#6B7280') => {
      const id = `list-${Date.now()}`;
      const newList: List = {
        id,
        name: name.trim(),
        color,
        archived: false,
        order: get().lists.length,
        createdAt: new Date().toISOString(),
      };
      persist({ lists: [...get().lists, newList] });
      return id;
    },

    updateList: (id, updates) => {
      const lists = get().lists.map((l) => (l.id === id ? { ...l, ...updates } : l));
      persist({ lists });
    },

    deleteList: (id) => {
      const lists = get().lists.filter((l) => l.id !== id);
      const todos = get().todos.map((t) => (t.listId === id ? { ...t, listId: null } : t));
      const activeView = get().activeView === id ? 'inbox' : get().activeView;
      set({ activeView });
      persist({ lists, todos });
    },

    // Todos
    addTodo: (data) => {
      const id = `todo-${Date.now()}`;
      const newTodo: Todo = {
        id,
        listId: data.listId ?? null,
        title: data.title.trim(),
        notes: data.notes || '',
        completed: false,
        dueDate: data.dueDate ?? null,
        priority: data.priority || 'none',
        remindAt: data.remindAt ?? null,
        recurrence: data.recurrence ?? null,
        durationMinutes: data.durationMinutes ?? null,
        startTime: data.startTime ?? null,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist({ todos: [newTodo, ...get().todos] });
      return id;
    },

    updateTodo: (id, updates) => {
      const todos = get().todos.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      persist({ todos });
    },

    toggleTodoComplete: (id) => {
      const currentTodos = get().todos;
      const targetTodo = currentTodos.find((t) => t.id === id);
      if (!targetTodo) return;

      const nextCompleted = !targetTodo.completed;
      let newTodos = currentTodos.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      let newChecklists = get().checklists;

      // If marking a recurring task as completed, auto-spawn the next instance
      if (nextCompleted && targetTodo.recurrence) {
        const nextDueDate = calculateNextDueDate(targetTodo.dueDate, targetTodo.recurrence);

        let nextRemindAt: string | null = null;
        if (targetTodo.remindAt) {
          const timePart = targetTodo.remindAt.split('T')[1] || '09:00:00';
          nextRemindAt = `${nextDueDate}T${timePart}`;
        }

        const spawnedTodoId = `todo-${Date.now()}`;
        const spawnedTodo: Todo = {
          id: spawnedTodoId,
          listId: targetTodo.listId ?? null,
          title: targetTodo.title,
          notes: targetTodo.notes || '',
          completed: false,
          dueDate: nextDueDate,
          priority: targetTodo.priority,
          remindAt: nextRemindAt,
          recurrence: targetTodo.recurrence,
          parentRecurringId: targetTodo.id,
          durationMinutes: targetTodo.durationMinutes ?? null,
          startTime: null,
          tags: targetTodo.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newTodos = [spawnedTodo, ...newTodos];

        // Copy checklist items to spawned todo as uncompleted subtasks
        const sourceChecklists = newChecklists.filter((c) => c.todoId === targetTodo.id);
        const copiedChecklists: ChecklistItem[] = sourceChecklists.map((c, idx) => ({
          id: `check-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
          todoId: spawnedTodoId,
          title: c.title,
          completed: false,
          order: c.order,
        }));

        newChecklists = [...newChecklists, ...copiedChecklists];
      }

      persist({ todos: newTodos, checklists: newChecklists });
    },

    deleteTodo: (id) => {
      const todos = get().todos.filter((t) => t.id !== id);
      const checklists = get().checklists.filter((c) => c.todoId !== id);
      const selectedTodoId = get().selectedTodoId === id ? null : get().selectedTodoId;
      const selectedTodoIds = get().selectedTodoIds.filter((x) => x !== id);
      set({ selectedTodoId, selectedTodoIds });
      persist({ todos, checklists });
    },

    // Checklists
    addChecklistItem: (todoId, title) => {
      const id = `check-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const todoItems = get().checklists.filter((c) => c.todoId === todoId);
      const newItem: ChecklistItem = {
        id,
        todoId,
        title: title.trim(),
        completed: false,
        order: todoItems.length,
      };
      persist({ checklists: [...get().checklists, newItem] });
      return id;
    },

    updateChecklistItem: (id, updates) => {
      const checklists = get().checklists.map((c) => (c.id === id ? { ...c, ...updates } : c));
      persist({ checklists });
    },

    toggleChecklistItem: (id) => {
      const checklists = get().checklists.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      );
      persist({ checklists });
    },

    deleteChecklistItem: (id) => {
      const checklists = get().checklists.filter((c) => c.id !== id);
      persist({ checklists });
    },

    reorderChecklistItems: (todoId, itemIds) => {
      const checklists = get().checklists.map((item) => {
        if (item.todoId !== todoId) return item;
        const newOrder = itemIds.indexOf(item.id);
        return newOrder !== -1 ? { ...item, order: newOrder } : item;
      });
      persist({ checklists });
    },
  };
});
