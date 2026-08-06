'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function readDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('lumen_install_dismissed') === '1';
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || !deferred) return null;

  const handleInstall = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferred(null);
    try {
      localStorage.setItem('lumen_install_dismissed', '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60">
      <button
        type="button"
        onClick={handleInstall}
        className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300 hover:text-amber-200"
      >
        <Download className="w-3.5 h-3.5" />
        Install app
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-0.5 text-stone-500 hover:text-stone-300"
        aria-label="Dismiss install prompt"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
