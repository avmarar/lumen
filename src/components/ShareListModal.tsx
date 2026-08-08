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
import { useDialog } from '@/lib/useDialog';

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
  const open = Boolean(shareListId && list);
  const close = () => setShareListId(null);
  const { containerRef, titleId, descId } = useDialog({ open, onClose: close });

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
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={close}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 id={titleId} className="font-serif text-lg text-stone-900">
              Share list
            </h2>
            <p className="text-xs text-stone-500">{list.name}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p id={descId} className="text-sm text-stone-600">
            Create an invite link. Recipients must be signed in to accept and join as editors.
          </p>

          {!inviteUrl ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateInvite}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 disabled:opacity-60"
            >
              <Link2 className="w-4 h-4" aria-hidden="true" />
              {loading ? 'Creating…' : 'Create invite link'}
            </button>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="share-invite-url" className="sr-only">
                Invite URL
              </label>
              <input
                id="share-invite-url"
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 rounded-lg bg-stone-200 hover:bg-stone-300"
                aria-label={copied ? 'Copied' : 'Copy invite link'}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs text-rose-700">
              {error}
            </p>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
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
                      <span className="text-[10px] uppercase text-stone-500">{m.role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(m.userId)}
                        className="p-1.5 text-stone-400 hover:text-rose-600"
                        aria-label="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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
