export type Priority = 'none' | 'low' | 'medium' | 'high';

export type MainViewType = 'inbox' | 'today' | 'upcoming' | 'week';

export type ActiveView = MainViewType | string; // MainViewType or listId

export type StatusFilter = 'active' | 'completed' | 'all';

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export type TodaySubView = 'list' | 'planner';

export type ListMemberRole = 'owner' | 'editor' | 'viewer';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. every 2 weeks
  daysOfWeek?: number[]; // [1, 3, 5] for Mon/Wed/Fri
}

export interface List {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  /** Local-only: role of current user on this list when shared */
  myRole?: ListMemberRole;
  shared?: boolean;
}

export interface ListMember {
  listId: string;
  userId: string;
  role: ListMemberRole;
  email?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  todoId: string;
  title: string;
  completed: boolean;
  order: number;
  updatedAt?: string;
}

export interface Todo {
  id: string;
  listId?: string | null;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null; // ISO Date string 'YYYY-MM-DD'
  priority: Priority;
  remindAt?: string | null; // ISO DateTime string
  pinned?: boolean;
  recurrence?: RecurrenceRule | null;
  parentRecurringId?: string | null;
  durationMinutes?: number | null; // e.g., 15, 30, 45, 60, 120
  startTime?: string | null; // 'HH:mm' e.g., '14:00'
  tags?: string[]; // Array of custom tags, e.g., ['design', 'client']
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoComment {
  id: string;
  todoId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface FocusSession {
  todoId: string;
  startedAt: string;
  durationMinutes: number;
  status: 'running' | 'paused';
  /** Accumulated paused ms */
  pausedMs: number;
  /** When pause started, if paused */
  pausedAt?: string | null;
}

export interface ReminderNotification {
  id: string;
  todoId: string;
  title: string;
  remindAt: string;
  fired: boolean;
}
