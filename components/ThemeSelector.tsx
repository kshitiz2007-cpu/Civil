'use client';

import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';

const THEMES = [
  { id: 'ocean', label: 'Ocean', swatch: 'from-cyan-400 via-blue-500 to-indigo-600' },
  { id: 'sunrise', label: 'Sunrise', swatch: 'from-amber-300 via-orange-500 to-rose-500' },
  { id: 'orchid', label: 'Orchid', swatch: 'from-fuchsia-400 via-violet-500 to-indigo-600' },
  { id: 'forest', label: 'Forest', swatch: 'from-emerald-300 via-teal-500 to-cyan-700' },
];

export default function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('ocean');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('gyankunj-theme', theme);
  }, [theme]);

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="theme-control" aria-expanded={open}>
        <Palette className="h-4 w-4" />
        {!compact && <span>Theme</span>}
      </button>
      {open && (
        <div className="theme-menu">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[.14em] text-[var(--app-muted)]">Choose your theme</p>
          {THEMES.map((item) => (
            <button key={item.id} onClick={() => { setTheme(item.id); setOpen(false); }} className="theme-choice">
              <span className={`h-7 w-7 rounded-full bg-gradient-to-br ${item.swatch}`} />
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {theme === item.id && <Check className="h-4 w-4 text-[var(--app-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}