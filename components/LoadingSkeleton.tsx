'use client';

type LoadingSkeletonProps = { label?: string; cards?: number };

export default function LoadingSkeleton({ label = 'Loading your workspace', cards = 3 }: LoadingSkeletonProps) {
  return (
    <main role="status" aria-live="polite" aria-label={label} className="app-theme min-h-screen px-4 py-6 sm:px-6">
      <span className="sr-only">{label}…</span>
      <div className="mx-auto max-w-6xl animate-pulse space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2"><div className="skeleton-block h-3 w-24 rounded-full"/><div className="skeleton-block h-7 w-48 max-w-[60vw] rounded-lg"/></div>
          <div className="skeleton-block h-10 w-10 rounded-xl"/>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => <div key={i} className="skeleton-panel space-y-3 rounded-2xl border p-4"><div className="skeleton-block h-9 w-9 rounded-xl"/><div className="skeleton-block h-5 w-2/3 rounded-md"/><div className="skeleton-block h-3 w-full rounded-full"/><div className="skeleton-block h-3 w-4/5 rounded-full"/></div>)}
        </div>
        <div className="skeleton-panel space-y-3 rounded-2xl border p-4"><div className="skeleton-block h-4 w-40 rounded-md"/><div className="skeleton-block h-12 w-full rounded-xl"/><div className="skeleton-block h-12 w-full rounded-xl"/></div>
      </div>
    </main>
  );
}
