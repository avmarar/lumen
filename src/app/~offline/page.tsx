export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-100 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4 text-xl font-serif font-bold">
        L
      </div>
      <h1 className="font-serif text-2xl font-bold tracking-tight mb-2">You&apos;re offline</h1>
      <p className="text-sm text-stone-400 max-w-sm">
        Lumen couldn&apos;t reach the network. Your local tasks are still saved on this device —
        reopen the app when you&apos;re back online.
      </p>
    </main>
  );
}
