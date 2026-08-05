import { create } from 'zustand';
import { get as getIDB, set as setIDB } from 'idb-keyval';
import { Todo, List, ChecklistItem, ActiveView, StatusFilter, Priority } from './types';
import { getTodayISO, formatDateISO } from './dates';

const DB_STORE_KEY = 'lumen_app_data_v1';

interface AppData {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
}

const DEFAULT_LISTS: List[] = [
  { id: 'list-work', name: 'Work', color: '#3B82F6', archived: false, order: 0, createdAt: new Date().toISOString() },
  { id: 'list-personal', name: 'Personal', color: '#10B981', archived: false, order: 1, createdAt: new Date().toISOString() },
  { id: 'list-ideas', name: 'Ideas & Projects', color: '#F59E0B', archived: false, order: 2, createdAt: new Date().toISOString() },
];

function getSeedData(): AppData {
  const today = getTodayISO();
  const tomorrow = formatDateISO(new Date(Date.now() + 86400000));
  const inTwoDays = formatDateISO(new Date(Date.now() + 86400000 * 2));

  return {
    lists: DEFAULT_LISTS,
    todos: [
      {
        id: 'todo-1',
        listId: 'list-work',
        title: 'Review product design specification for Lumen MVP',
        notes: 'Check 3-column layout, typography, and color palette in design system section.',
        completed: false,
        dueDate: today,
        priority: 'high',
        pinned: true,
        remindAt: `${today}T17:00:00`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'todo-2',
        listId: 'list-work',
        title: 'Draft week 32 roadmap sprint goals',
        notes: 'Break down deliverables into actionable checklists.',
        completed: false,
        dueDate: tomorrow,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'todo-3',
        listId: 'list-personal',
        title: 'Weekly grocery restock & meal prep',
        notes: 'Buy organic greens, sourdough, espresso beans.',
        completed: false,
        dueDate: today,
        priority: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'todo-4',
        listId: null,
        title: 'Explore local-first sync with IndexedDB',
        notes: 'Consider Dexie or CRDTs for future cloud backup.',
        completed: false,
        dueDate: null,
        priority: 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'todo-5',
        listId: 'list-ideas',
        title: 'Design high-contrast theme toggle for Lumen',
        notes: '',
        completed: true,
        completedAt: new Date().toISOString(),
        dueDate: inTwoDays,
        priority: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ],
    checklists: [
      { id: 'check-1', todoId: 'todo-1', title: 'Verify 3-column rail width (240px)', completed: true, order: 0 },
      { id: 'check-2', todoId: 'todo-1', title: 'Verify custom checkmark stroke animation', completed: true, order: 1 },
      { id: 'check-3', todoId: 'todo-1', title: 'Test keyboard shortcut command bar (N key)', completed: false, order: 2 },
      { id: 'check-4', todoId: 'todo-3', title: 'Fresh vegetables', completed: true, order: 0 },
      { id: 'check-5', todoId: 'todo-3', title: 'Artisanal coffee beans', completed: false, order: 1 },
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

  // Actions
  hydrateStore: () => Promise<void>;

  // Navigation
  setActiveView: (view: ActiveView) => void;
  setSelectedTodoId: (id: string | null) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setSearchQuery: (query: string) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // List CRUD
  addList: (name: string, color?: string) => string;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;

  // Todo CRUD
  addTodo: (data: { title: string; listId?: string | null; dueDate?: string | null; priority?: Priority; remindAt?: string | null; notes?: string }) => string;
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
      setIDB(DB_STORE_KEY, payload).catch((err: unknown) => console.error('Error saving to IndexedDB:', err));
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

    setActiveView: (activeView) => set({ activeView, isMobileSidebarOpen: false }),
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
      const todos = get().todos.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      persist({ todos });
    },

    deleteTodo: (id) => {
      const todos = get().todos.filter((t) => t.id !== id);
      const checklists = get().checklists.filter((c) => c.todoId !== id);
      const selectedTodoId = get().selectedTodoId === id ? null : get().selectedTodoId;
      set({ selectedTodoId });
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
