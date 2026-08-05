'use client';

import React, { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function ShortcutsModal() {
  const { isShortcutsOpen, setIsShortcutsOpen } = useAppStore();

  // Listen for '?' key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(!isShortcutsOpen);
      } else if (e.key === 'Escape' && isShortcutsOpen) {
        setIsShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, setIsShortcutsOpen]);

  if (!isShortcutsOpen) return null;

  const SHORTCUTS = [
    { key: 'N or /', label: 'Focus Quick-Add input bar' },
    { key: 'Esc', label: 'Close detail panel or modal' },
    { key: '?', label: 'Toggle this keyboard shortcuts guide' },
    { key: '^today', label: 'Tag due date as Today in Quick-Add' },
    { key: '^tomorrow', label: 'Tag due date as Tomorrow in Quick-Add' },
    { key: '!high', label: 'Tag Priority as High in Quick-Add' },
    { key: '@listName', label: 'Assign task to custom List in Quick-Add' },
    { key: '#5pm', label: 'Schedule reminder alert at 5 PM' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100"
            >
              <span className="text-xs font-medium text-stone-700">{sc.label}</span>
              <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-white text-amber-900 border border-stone-200 rounded-md shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-stone-50 border-t border-stone-100 text-center text-xs text-stone-400">
          Press <kbd className="font-mono text-stone-600">Esc</kbd> anytime to close
        </div>
      </div>
    </div>
  );
}
