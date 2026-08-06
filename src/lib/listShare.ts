import { supabase, isSupabaseConfigured } from './supabase';
import { ListMember, ListMemberRole } from './types';

function randomToken() {
  return `inv_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function fetchListMembers(listId: string): Promise<ListMember[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('list_members')
    .select('list_id, user_id, role, created_at')
    .eq('list_id', listId);
  if (error || !data) return [];
  return (
    data as { list_id: string; user_id: string; role: ListMemberRole; created_at: string }[]
  ).map((r) => ({
    listId: r.list_id,
    userId: r.user_id,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export async function createListInvite(
  listId: string,
  createdBy: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const token = randomToken();
  const id = `invite-${Date.now()}`;
  const expires = new Date();
  expires.setDate(expires.getDate() + 14);
  const { error } = await supabase.from('list_invites').insert({
    id,
    list_id: listId,
    token,
    role,
    created_by: createdBy,
    expires_at: expires.toISOString(),
  });
  if (error) {
    console.error('createListInvite', error);
    return null;
  }
  return token;
}

export function buildInviteUrl(token: string): string {
  if (typeof window === 'undefined') return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

export async function acceptListInvite(
  token: string,
  userId: string
): Promise<{ ok: boolean; listId?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  const { data: invite, error } = await supabase
    .from('list_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) return { ok: false, error: 'Invite not found' };
  const row = invite as {
    list_id: string;
    role: 'editor' | 'viewer';
    expires_at: string;
    accepted_at: string | null;
  };

  if (row.accepted_at) return { ok: false, error: 'Invite already used' };
  if (new Date(row.expires_at) < new Date()) return { ok: false, error: 'Invite expired' };

  const { error: memberErr } = await supabase.from('list_members').upsert(
    {
      list_id: row.list_id,
      user_id: userId,
      role: row.role,
    },
    { onConflict: 'list_id,user_id' }
  );
  if (memberErr) return { ok: false, error: memberErr.message };

  await supabase
    .from('list_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);

  return { ok: true, listId: row.list_id };
}

export async function removeListMember(listId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from('list_members')
    .delete()
    .eq('list_id', listId)
    .eq('user_id', userId);
  return !error;
}

export async function updateMemberRole(
  listId: string,
  userId: string,
  role: ListMemberRole
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from('list_members')
    .update({ role })
    .eq('list_id', listId)
    .eq('user_id', userId);
  return !error;
}
