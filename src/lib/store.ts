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
  TodoComment,
  FocusSession,
  ListMemberRole,
} from './types';
import { getTodayISO, calculateNextDueDate } from './dates';
import { enqueueSyncOp } from './syncQueue';

const DB_STORE_KEY = 'lumen_app_data_v1';
const SETTINGS_KEY = 'lumen_settings_v1';

interface AppData {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
  comments: TodoComment[];
}

interface AppSettings {
  dayBudgetMinutes: number;
  focusSession: FocusSession | null;
}

const DEFAULT_LISTS: List[] = [
  {
    id: 'list-work',
    name: 'Work',
    color: '#3B82F6',
    archived: false,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'list-personal',
    name: 'Personal',
    color: '#10B981',
    archived: false,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'list-ideas',
    name: 'Ideas & Projects',
    color: '#F59E0B',
    archived: false,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getSeedData(): AppData {
  const today = getTodayISO();
  const now = new Date().toISOString();

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
        createdAt: now,
        updatedAt: now,
      },
    ],
    checklists: [
      {
        id: 'check-welcome-1',
        todoId: 'todo-welcome',
        title: 'Explore the detail panel on the right',
        completed: false,
        order: 0,
        updatedAt: now,
      },
      {
        id: 'check-welcome-2',
        todoId: 'todo-welcome',
        title: 'Delete this example when you’re ready',
        completed: false,
        order: 1,
        updatedAt: now,
      },
    ],
    comments: [],
  };
}

function queueIfSignedIn(getUser: () => User | null, op: Parameters<typeof enqueueSyncOp>[0]) {
  if (!getUser()) return;
  void enqueueSyncOp(op);
}

export interface AppStoreState {
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
  comments: TodoComment[];

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
  assignedToMeFilter: boolean;
  shareListId: string | null;

  user: User | null;
  isAuthModalOpen: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  syncToast: string | null;

  dayBudgetMinutes: number;
  focusSession: FocusSession | null;

  hydrateStore: () => Promise<void>;
  hydrateCloudData: (
    lists: List[],
    todos: Todo[],
    checklists: ChecklistItem[],
    comments?: TodoComment[]
  ) => void;
  applyMergedCloudData: (
    lists: List[],
    todos: Todo[],
    checklists: ChecklistItem[],
    comments: TodoComment[],
    remoteWins?: number
  ) => void;

  setUser: (user: User | null) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error') => void;
  setSyncToast: (msg: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedTodoId: (id: string | null) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setSearchQuery: (query: string) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setActiveTagFilter: (tag: string | null) => void;
  setTodaySubView: (view: TodaySubView) => void;
  setAssignedToMeFilter: (on: boolean) => void;
  setShareListId: (id: string | null) => void;
  setDayBudgetMinutes: (minutes: number) => void;

  toggleTodoSelection: (id: string) => void;
  selectAllTodos: (ids: string[]) => void;
  clearTodoSelection: () => void;
  bulkUpdateTodos: (ids: string[], updates: Partial<Todo>) => void;
  bulkDeleteTodos: (ids: string[]) => void;
  bulkCompleteTodos: (ids: string[]) => void;
  bulkAddTag: (ids: string[], tag: string) => void;

  addList: (name: string, color?: string) => string;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  setListRole: (listId: string, role: ListMemberRole | undefined, shared?: boolean) => void;

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
    assigneeId?: string | null;
  }) => string;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  toggleTodoComplete: (id: string) => void;
  deleteTodo: (id: string) => void;

  addChecklistItem: (todoId: string, title: string) => string;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  toggleChecklistItem: (id: string) => void;
  deleteChecklistItem: (id: string) => void;
  reorderChecklistItems: (todoId: string, itemIds: string[]) => void;

  addComment: (todoId: string, body: string) => string;
  deleteComment: (id: string) => void;
  setComments: (comments: TodoComment[]) => void;

  startFocus: (todoId: string) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  completeFocus: () => void;

  canEditList: (listId: string | null | undefined) => boolean;
}

export const useAppStore = create<AppStoreState>((set, get) => {
  const persistSettings = (patch: Partial<AppSettings>) => {
    const next: AppSettings = {
      dayBudgetMinutes: patch.dayBudgetMinutes ?? get().dayBudgetMinutes,
      focusSession: patch.focusSession !== undefined ? patch.focusSession : get().focusSession,
    };
    set(next);
    if (typeof window !== 'undefined') {
      setIDB(SETTINGS_KEY, next).catch(() => undefined);
    }
  };

  const persist = (data: Partial<AppData>) => {
    const currentState = get();
    const payload: AppData = {
      lists: data.lists ?? currentState.lists,
      todos: data.todos ?? currentState.todos,
      checklists: data.checklists ?? currentState.checklists,
      comments: data.comments ?? currentState.comments,
    };
    set(payload);
    if (typeof window !== 'undefined') {
      setIDB(DB_STORE_KEY, payload).catch((err: unknown) =>
        console.error('Error saving to IndexedDB:', err)
      );
    }
  };

  const signedIn = () => get().user;

  return {
    lists: [],
    todos: [],
    checklists: [],
    comments: [],

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
    assignedToMeFilter: false,
    shareListId: null,

    user: null,
    isAuthModalOpen: false,
    syncStatus: 'offline',
    syncToast: null,

    dayBudgetMinutes: 360,
    focusSession: null,

    setUser: (user) => set({ user }),
    setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    setSyncToast: (syncToast) => set({ syncToast }),
    setActiveTagFilter: (activeTagFilter) => set({ activeTagFilter }),
    setTodaySubView: (todaySubView) => set({ todaySubView }),
    setAssignedToMeFilter: (assignedToMeFilter) => set({ assignedToMeFilter }),
    setShareListId: (shareListId) => set({ shareListId }),
    setDayBudgetMinutes: (dayBudgetMinutes) => persistSettings({ dayBudgetMinutes }),

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
      const now = new Date().toISOString();
      const todos = get().todos.map((t) => {
        if (!idSet.has(t.id)) return t;
        const next = { ...t, ...updates, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: t.id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ todos });
      set({ selectedTodoIds: [] });
    },

    bulkDeleteTodos: (ids) => {
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      for (const id of ids) {
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: id,
          op: 'delete',
          updatedAt: now,
        });
      }
      const cascadingChecks = get().checklists.filter((c) => idSet.has(c.todoId));
      for (const c of cascadingChecks) {
        queueIfSignedIn(signedIn, {
          entity: 'checklist',
          entityId: c.id,
          op: 'delete',
          updatedAt: now,
        });
      }
      const todos = get().todos.filter((t) => !idSet.has(t.id));
      const checklists = get().checklists.filter((c) => !idSet.has(c.todoId));
      const comments = get().comments.filter((c) => !idSet.has(c.todoId));
      const selectedTodoId =
        get().selectedTodoId && idSet.has(get().selectedTodoId!) ? null : get().selectedTodoId;
      set({ selectedTodoId, selectedTodoIds: [] });
      persist({ todos, checklists, comments });
    },

    bulkCompleteTodos: (ids) => {
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      const todos = get().todos.map((t) => {
        if (!idSet.has(t.id)) return t;
        const next = { ...t, completed: true, completedAt: now, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: t.id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ todos });
      set({ selectedTodoIds: [] });
    },

    bulkAddTag: (ids, tag) => {
      const normalized = tag.replace(/^#/, '').trim().toLowerCase();
      if (!normalized) return;
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      const todos = get().todos.map((t) => {
        if (!idSet.has(t.id)) return t;
        const existing = t.tags || [];
        if (existing.includes(normalized)) return t;
        const next = { ...t, tags: [...existing, normalized], updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: t.id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ todos });
      set({ selectedTodoIds: [] });
    },

    hydrateStore: async () => {
      if (get().isHydrated) return;
      try {
        const [stored, settings] = await Promise.all([
          getIDB<AppData>(DB_STORE_KEY),
          getIDB<AppSettings>(SETTINGS_KEY),
        ]);
        if (stored && Array.isArray(stored.lists) && Array.isArray(stored.todos)) {
          set({
            lists: stored.lists,
            todos: stored.todos,
            checklists: stored.checklists || [],
            comments: stored.comments || [],
            dayBudgetMinutes: settings?.dayBudgetMinutes ?? 360,
            focusSession: settings?.focusSession ?? null,
            isHydrated: true,
          });
        } else {
          const seed = getSeedData();
          set({
            lists: seed.lists,
            todos: seed.todos,
            checklists: seed.checklists,
            comments: [],
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
          comments: [],
          isHydrated: true,
        });
      }
    },

    hydrateCloudData: (lists, todos, checklists, comments) => {
      persist({ lists, todos, checklists, comments: comments ?? get().comments });
    },

    applyMergedCloudData: (lists, todos, checklists, comments, remoteWins = 0) => {
      persist({ lists, todos, checklists, comments });
      if (remoteWins > 0) {
        set({ syncToast: 'Updated from another device' });
      }
    },

    setActiveView: (activeView) =>
      set({ activeView, isMobileSidebarOpen: false, selectedTodoIds: [] }),
    setSelectedTodoId: (selectedTodoId) => set({ selectedTodoId }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setIsShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
    setIsMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

    addList: (name, color = '#6B7280') => {
      const id = `list-${Date.now()}`;
      const now = new Date().toISOString();
      const newList: List = {
        id,
        name: name.trim(),
        color,
        archived: false,
        order: get().lists.length,
        createdAt: now,
        updatedAt: now,
        ownerId: get().user?.id,
        myRole: 'owner',
      };
      queueIfSignedIn(signedIn, {
        entity: 'list',
        entityId: id,
        op: 'upsert',
        payload: newList,
        updatedAt: now,
      });
      persist({ lists: [...get().lists, newList] });
      return id;
    },

    updateList: (id, updates) => {
      const now = new Date().toISOString();
      const lists = get().lists.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...updates, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'list',
          entityId: id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ lists });
    },

    deleteList: (id) => {
      const now = new Date().toISOString();
      queueIfSignedIn(signedIn, {
        entity: 'list',
        entityId: id,
        op: 'delete',
        updatedAt: now,
      });
      const lists = get().lists.filter((l) => l.id !== id);
      const todos = get().todos.map((t) => {
        if (t.listId !== id) return t;
        const next = { ...t, listId: null, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: t.id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      const activeView = get().activeView === id ? 'inbox' : get().activeView;
      set({ activeView });
      persist({ lists, todos });
    },

    setListRole: (listId, role, shared) => {
      const lists = get().lists.map((l) =>
        l.id === listId ? { ...l, myRole: role, shared: shared ?? l.shared } : l
      );
      set({ lists });
    },

    addTodo: (data) => {
      const id = `todo-${Date.now()}`;
      const now = new Date().toISOString();
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
        assigneeId: data.assigneeId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      queueIfSignedIn(signedIn, {
        entity: 'todo',
        entityId: id,
        op: 'upsert',
        payload: newTodo,
        updatedAt: now,
      });
      persist({ todos: [newTodo, ...get().todos] });
      return id;
    },

    updateTodo: (id, updates) => {
      const now = new Date().toISOString();
      const todos = get().todos.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...updates, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ todos });
    },

    toggleTodoComplete: (id) => {
      const currentTodos = get().todos;
      const targetTodo = currentTodos.find((t) => t.id === id);
      if (!targetTodo) return;

      const nextCompleted = !targetTodo.completed;
      const now = new Date().toISOString();
      let newTodos = currentTodos.map((t) => {
        if (t.id !== id) return t;
        const next = {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? now : null,
          updatedAt: now,
        };
        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });

      let newChecklists = get().checklists;

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
          assigneeId: targetTodo.assigneeId ?? null,
          createdAt: now,
          updatedAt: now,
        };

        queueIfSignedIn(signedIn, {
          entity: 'todo',
          entityId: spawnedTodoId,
          op: 'upsert',
          payload: spawnedTodo,
          updatedAt: now,
        });
        newTodos = [spawnedTodo, ...newTodos];

        const sourceChecklists = newChecklists.filter((c) => c.todoId === targetTodo.id);
        const copiedChecklists: ChecklistItem[] = sourceChecklists.map((c, idx) => {
          const item: ChecklistItem = {
            id: `check-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            todoId: spawnedTodoId,
            title: c.title,
            completed: false,
            order: c.order,
            updatedAt: now,
          };
          queueIfSignedIn(signedIn, {
            entity: 'checklist',
            entityId: item.id,
            op: 'upsert',
            payload: item,
            updatedAt: now,
          });
          return item;
        });

        newChecklists = [...newChecklists, ...copiedChecklists];
      }

      persist({ todos: newTodos, checklists: newChecklists });
    },

    deleteTodo: (id) => {
      const now = new Date().toISOString();
      queueIfSignedIn(signedIn, {
        entity: 'todo',
        entityId: id,
        op: 'delete',
        updatedAt: now,
      });
      for (const c of get().checklists.filter((x) => x.todoId === id)) {
        queueIfSignedIn(signedIn, {
          entity: 'checklist',
          entityId: c.id,
          op: 'delete',
          updatedAt: now,
        });
      }
      for (const c of get().comments.filter((x) => x.todoId === id)) {
        queueIfSignedIn(signedIn, {
          entity: 'comment',
          entityId: c.id,
          op: 'delete',
          updatedAt: now,
        });
      }
      const todos = get().todos.filter((t) => t.id !== id);
      const checklists = get().checklists.filter((c) => c.todoId !== id);
      const comments = get().comments.filter((c) => c.todoId !== id);
      const selectedTodoId = get().selectedTodoId === id ? null : get().selectedTodoId;
      const selectedTodoIds = get().selectedTodoIds.filter((x) => x !== id);
      const focusSession = get().focusSession?.todoId === id ? null : get().focusSession;
      set({ selectedTodoId, selectedTodoIds });
      if (focusSession !== get().focusSession) persistSettings({ focusSession });
      persist({ todos, checklists, comments });
    },

    addChecklistItem: (todoId, title) => {
      const id = `check-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const todoItems = get().checklists.filter((c) => c.todoId === todoId);
      const newItem: ChecklistItem = {
        id,
        todoId,
        title: title.trim(),
        completed: false,
        order: todoItems.length,
        updatedAt: now,
      };
      queueIfSignedIn(signedIn, {
        entity: 'checklist',
        entityId: id,
        op: 'upsert',
        payload: newItem,
        updatedAt: now,
      });
      persist({ checklists: [...get().checklists, newItem] });
      return id;
    },

    updateChecklistItem: (id, updates) => {
      const now = new Date().toISOString();
      const checklists = get().checklists.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'checklist',
          entityId: id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ checklists });
    },

    toggleChecklistItem: (id) => {
      const now = new Date().toISOString();
      const checklists = get().checklists.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, completed: !c.completed, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'checklist',
          entityId: id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ checklists });
    },

    deleteChecklistItem: (id) => {
      const now = new Date().toISOString();
      queueIfSignedIn(signedIn, {
        entity: 'checklist',
        entityId: id,
        op: 'delete',
        updatedAt: now,
      });
      persist({ checklists: get().checklists.filter((c) => c.id !== id) });
    },

    reorderChecklistItems: (todoId, itemIds) => {
      const now = new Date().toISOString();
      const checklists = get().checklists.map((item) => {
        if (item.todoId !== todoId) return item;
        const newOrder = itemIds.indexOf(item.id);
        if (newOrder === -1) return item;
        const next = { ...item, order: newOrder, updatedAt: now };
        queueIfSignedIn(signedIn, {
          entity: 'checklist',
          entityId: item.id,
          op: 'upsert',
          payload: next,
          updatedAt: now,
        });
        return next;
      });
      persist({ checklists });
    },

    addComment: (todoId, body) => {
      const user = get().user;
      if (!user) return '';
      const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const comment: TodoComment = {
        id,
        todoId,
        userId: user.id,
        body: body.trim(),
        createdAt: now,
      };
      queueIfSignedIn(signedIn, {
        entity: 'comment',
        entityId: id,
        op: 'upsert',
        payload: comment,
        updatedAt: now,
      });
      persist({ comments: [...get().comments, comment] });
      return id;
    },

    deleteComment: (id) => {
      const now = new Date().toISOString();
      queueIfSignedIn(signedIn, {
        entity: 'comment',
        entityId: id,
        op: 'delete',
        updatedAt: now,
      });
      persist({ comments: get().comments.filter((c) => c.id !== id) });
    },

    setComments: (comments) => persist({ comments }),

    startFocus: (todoId) => {
      const todo = get().todos.find((t) => t.id === todoId);
      if (!todo) return;
      persistSettings({
        focusSession: {
          todoId,
          startedAt: new Date().toISOString(),
          durationMinutes:
            todo.durationMinutes && todo.durationMinutes > 0 ? todo.durationMinutes : 25,
          status: 'running',
          pausedMs: 0,
          pausedAt: null,
        },
      });
    },

    pauseFocus: () => {
      const session = get().focusSession;
      if (!session || session.status !== 'running') return;
      persistSettings({
        focusSession: { ...session, status: 'paused', pausedAt: new Date().toISOString() },
      });
    },

    resumeFocus: () => {
      const session = get().focusSession;
      if (!session || session.status !== 'paused' || !session.pausedAt) return;
      const extra = Date.now() - new Date(session.pausedAt).getTime();
      persistSettings({
        focusSession: {
          ...session,
          status: 'running',
          pausedMs: session.pausedMs + extra,
          pausedAt: null,
        },
      });
    },

    stopFocus: () => persistSettings({ focusSession: null }),

    completeFocus: () => {
      const session = get().focusSession;
      if (!session) return;
      get().toggleTodoComplete(session.todoId);
      persistSettings({ focusSession: null });
    },

    canEditList: (listId) => {
      if (!listId) return true; // inbox personal
      const list = get().lists.find((l) => l.id === listId);
      if (!list) return true;
      if (!list.shared && !list.myRole) return true;
      return list.myRole === 'owner' || list.myRole === 'editor' || list.myRole === undefined;
    },
  };
});
