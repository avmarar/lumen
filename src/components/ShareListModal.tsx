'use client';

import React, { useEffect, useState } from 'react';
import { X, Link2, Users, Copy, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  buildInviteUrl,
  createListInvite,
  fetchListMembers,
  removeListMember,
} from '@/lib/listShare';
import { ListMember } from '@/lib/types';

export function ShareListModal() {
  const shareListId = useAppStore((s) => s.shareListId);
  const setShareListId = useAppStore((s) => s.setShareListId);
  const lists = useAppStore((s) => s.lists);
  const user = useAppStore((s) => s.user);
  const updateList = useAppStore((s) => s.updateList);

  const [members, setMembers] = useState<ListMember[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const list = lists.find((l) => l.id === shareListId);

  useEffect(() => {
    if (!shareListId) return;
    void fetchListMembers(shareListId).then(setMembers);
  }, [shareListId]);

  if (!shareListId || !list) return null;

  const handleCreateInvite = async () => {
    if (!user) {
      setError('Sign in to share lists.');
      return;
    }
    setLoading(true);
    setError('');
    const token = await createListInvite(shareListId, user.id, 'editor');
    setLoading(false);
    if (!token) {
      setError('Could not create invite. Run migration_shared_lists.sql.');
      return;
    }
    updateList(shareListId, { shared: true, myRole: 'owner' });
    setInviteUrl(buildInviteUrl(token));
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRemove = async (userId: string) => {
    await removeListMember(shareListId, userId);
    setMembers((m) => m.filter((x) => x.userId !== userId));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-lg text-stone-900">Share list</h2>
            <p className="text-xs text-stone-500">{list.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setShareListId(null)}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-stone-600">
            Create an invite link. Recipients must be signed in to accept and join as editors.
          </p>

          {!inviteUrl ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateInvite}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              <Link2 className="w-4 h-4" />
              {loading ? 'Creating…' : 'Create invite link'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 rounded-lg bg-stone-200 hover:bg-stone-300"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-rose-700">{error}</p>}

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              <Users className="w-3.5 h-3.5" />
              Members
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-stone-500">No members yet (you are the owner).</p>
            ) : (
              <ul className="space-y-1.5">
                {members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-stone-50"
                  >
                    <span className="font-mono text-xs text-stone-700 truncate">
                      {m.userId.slice(0, 8)}…
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-stone-400">{m.role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(m.userId)}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        aria-label="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
