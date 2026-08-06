import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase, isServiceSupabaseConfigured } from '@/lib/supabaseServer';
import { todosToIcs } from '@/lib/ical';
import type { Todo, Priority, RecurrenceRule } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface DbTodoRow {
  id: string;
  list_id: string | null;
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  priority: Priority;
  remind_at: string | null;
  pinned: boolean;
  recurrence: RecurrenceRule | null;
  parent_recurring_id: string | null;
  duration_minutes: number | null;
  start_time: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  if (!token || token.length < 16) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (!isServiceSupabaseConfigured()) {
    return new NextResponse('Calendar feed is not configured on the server.', { status: 503 });
  }

  const admin = createServiceSupabase();
  if (!admin) {
    return new NextResponse('Calendar feed is not configured on the server.', { status: 503 });
  }

  const { data: feed, error: feedError } = await admin
    .from('calendar_feeds')
    .select('user_id')
    .eq('token', token)
    .maybeSingle();

  if (feedError || !feed?.user_id) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { data: rows, error: todosError } = await admin
    .from('todos')
    .select('*')
    .eq('user_id', feed.user_id)
    .eq('completed', false)
    .not('due_date', 'is', null);

  if (todosError) {
    console.error('calendar feed todos error:', todosError);
    return new NextResponse('Failed to load tasks', { status: 500 });
  }

  const todos: Todo[] = ((rows || []) as DbTodoRow[]).map((t) => ({
    id: t.id,
    listId: t.list_id,
    title: t.title,
    notes: t.notes ?? undefined,
    completed: t.completed,
    completedAt: t.completed_at,
    dueDate: t.due_date,
    priority: t.priority,
    remindAt: t.remind_at,
    pinned: t.pinned,
    recurrence: t.recurrence,
    parentRecurringId: t.parent_recurring_id,
    durationMinutes: t.duration_minutes,
    startTime: t.start_time,
    tags: t.tags || [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  const ics = todosToIcs(todos);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="lumen.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
