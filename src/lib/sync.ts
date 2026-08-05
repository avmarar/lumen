import { supabase, isSupabaseConfigured } from './supabase';
import { List, Todo, ChecklistItem } from './types';

export async function migrateLocalToSupabase(
  userId: string,
  lists: List[],
  todos: Todo[],
  checklists: ChecklistItem[]
) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Upload Lists
    if (lists.length > 0) {
      const dbLists = lists.map((l) => ({
        id: l.id,
        user_id: userId,
        name: l.name,
        color: l.color,
        archived: l.archived,
        list_order: l.order,
        created_at: l.createdAt,
      }));
      await supabase.from('lists').upsert(dbLists, { onConflict: 'id' });
    }

    // 2. Upload Todos
    if (todos.length > 0) {
      const dbTodos = todos.map((t) => ({
        id: t.id,
        user_id: userId,
        list_id: t.listId || null,
        title: t.title,
        notes: t.notes || null,
        completed: t.completed,
        completed_at: t.completedAt || null,
        due_date: t.dueDate || null,
        priority: t.priority,
        remind_at: t.remindAt || null,
        pinned: t.pinned || false,
        recurrence: t.recurrence || null,
        parent_recurring_id: t.parentRecurringId || null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      }));
      await supabase.from('todos').upsert(dbTodos, { onConflict: 'id' });
    }

    // 3. Upload Checklists
    if (checklists.length > 0) {
      const dbChecklists = checklists.map((c) => ({
        id: c.id,
        user_id: userId,
        todo_id: c.todoId,
        title: c.title,
        completed: c.completed,
        item_order: c.order,
      }));
      await supabase.from('checklists').upsert(dbChecklists, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

export async function fetchUserDataFromSupabase(userId: string): Promise<{
  lists: List[];
  todos: Todo[];
  checklists: ChecklistItem[];
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [listsRes, todosRes, checklistsRes] = await Promise.all([
      supabase.from('lists').select('*').eq('user_id', userId),
      supabase.from('todos').select('*').eq('user_id', userId),
      supabase.from('checklists').select('*').eq('user_id', userId),
    ]);

    if (listsRes.error || todosRes.error || checklistsRes.error) {
      console.error('Fetch cloud data error:', listsRes.error || todosRes.error || checklistsRes.error);
      return null;
    }

    const lists: List[] = (listsRes.data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      archived: l.archived,
      order: l.list_order,
      createdAt: l.created_at,
    }));

    const todos: Todo[] = (todosRes.data || []).map((t: any) => ({
      id: t.id,
      listId: t.list_id,
      title: t.title,
      notes: t.notes,
      completed: t.completed,
      completedAt: t.completed_at,
      dueDate: t.due_date,
      priority: t.priority,
      remindAt: t.remind_at,
      pinned: t.pinned,
      recurrence: t.recurrence,
      parentRecurringId: t.parent_recurring_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    const checklists: ChecklistItem[] = (checklistsRes.data || []).map((c: any) => ({
      id: c.id,
      todoId: c.todo_id,
      title: c.title,
      completed: c.completed,
      order: c.item_order,
    }));

    return { lists, todos, checklists };
  } catch (err) {
    console.error('Error fetching Supabase user data:', err);
    return null;
  }
}
