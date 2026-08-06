import { supabase, isSupabaseConfigured } from './supabase';

function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export async function ensureCalendarFeedToken(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: existing, error: selectError } = await supabase
    .from('calendar_feeds')
    .select('token')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    console.error('calendar feed select error:', selectError);
    return null;
  }

  if (existing?.token) return existing.token as string;

  const token = generateToken();
  const { data: inserted, error: insertError } = await supabase
    .from('calendar_feeds')
    .insert({ user_id: userId, token })
    .select('token')
    .single();

  if (insertError) {
    console.error('calendar feed insert error:', insertError);
    return null;
  }

  return (inserted?.token as string) || token;
}

export async function regenerateCalendarFeedToken(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const token = generateToken();
  const { data, error } = await supabase
    .from('calendar_feeds')
    .upsert(
      { user_id: userId, token, created_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('token')
    .single();

  if (error) {
    console.error('calendar feed regenerate error:', error);
    return null;
  }

  return (data?.token as string) || token;
}

export function buildCalendarFeedUrl(token: string): string {
  if (typeof window === 'undefined') return `/api/calendar/${token}`;
  return `${window.location.origin}/api/calendar/${token}`;
}

export function buildWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https:/i, 'webcal:').replace(/^http:/i, 'webcal:');
}
