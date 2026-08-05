export type Priority = 'none' | 'low' | 'medium' | 'high';

export type MainViewType = 'inbox' | 'today' | 'upcoming' | 'week';

export type ActiveView = MainViewType | string; // MainViewType or listId

export type StatusFilter = 'active' | 'completed' | 'all';

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

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
}

export interface ChecklistItem {
  id: string;
  todoId: string;
  title: string;
  completed: boolean;
  order: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface ReminderNotification {
  id: string;
  todoId: string;
  title: string;
  remindAt: string;
  fired: boolean;
}
