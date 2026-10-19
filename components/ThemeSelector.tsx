'use client';

import { useEffect, useState } from 'react';
import { Check, Palette, Sun, Moon, Type } from 'lucide-react';

const THEMES = [
  {
    id: 'sage',
    label: 'Ashram Sage',
    subtitle: 'Calm botanical dark',
    swatch: 'from-emerald-400 via-teal-500 to-slate-800',
  },
  {
    id: 'parchment',
    label: 'Vedic Parchment',
    subtitle: 'Warm paper daylight',
    swatch: 'from-amber-200 via-stone-300 to-teal-700',
  },
  {
    id: 'mussoorie',
    label: 'LBSNAA Mist',
    subtitle: 'Serene twilight slate',
    swatch: 'from-sky-300 via-blue-500 to-slate-900',
  },
  {
    id: 'sandstone',
    label: 'Dholpur Dusk',
    subtitle: 'Warm sandstone earth',
    swatch: 'from-amber-300 via-orange-400 to-stone-800',
  },
];

export default function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('sage');
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'large'>('normal');

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem('gyankunj-theme');
      const savedScale = window.localStorage.getItem('gyankunj-font-scale') as 'compact' | 'normal' | 'large' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      } else {
        document.documentElement.dataset.theme = 'sage';
      }
      if (savedScale) {
        setFontScale(savedScale);
        document.documentElement.dataset.fontScale = savedScale;
      }
    } catch {
      document.documentElement.dataset.theme = 'sage';
    }
  }, []);

  const applyTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem('gyankunj-theme', nextTheme);
    } catch {
      // Ignore storage errors in restricted environments
    }
  };

  const applyScale = (nextScale: 'compact' | 'normal' | 'large') => {
    setFontScale(nextScale);
    document.documentElement.dataset.fontScale = nextScale;
    try {
      window.localStorage.setItem('gyankunj-font-scale', nextScale);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="theme-control"
        aria-expanded={open}
        title="Reading ambience & comfort"
      >
        {theme === 'parchment' ? <Sun className="h-4 w-4 text-amber-600" /> : <Palette className="h-4 w-4 text-[var(--app-accent)]" />}
        {!compact && <span>Ambience</span>}
      </button>

      {open && (
        <div className="theme-menu">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Eye-Care Study Theme
            </p>
            <Moon className="h-3.5 w-3.5 text-[var(--app-muted)]" />
          </div>

          <div className="space-y-1">
            {THEMES.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  applyTheme(item.id);
                  setOpen(false);
                }}
                className="theme-choice"
              >
                <span className={`h-7 w-7 shrink-0 rounded-full bg-gradient-to-br ${item.swatch} border border-white/20`} />
                <span className="flex-1 text-left">
                  <span className="block text-xs font-semibold leading-tight">{item.label}</span>
                  <span className="block text-[10px] text-[var(--app-muted)]">{item.subtitle}</span>
                </span>
                {theme === item.id && <Check className="h-4 w-4 text-[var(--app-accent)]" />}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-[var(--app-border)] pt-2.5 px-1">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              <Type className="h-3 w-3" /> Reading Text Scale
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['compact', 'normal', 'large'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => applyScale(scale)}
                  className={`rounded-lg py-1 text-xs font-semibold capitalize transition ${
                    fontScale === scale
                      ? 'bg-[var(--app-accent)] text-slate-950'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  {scale === 'compact' ? 'A-' : scale === 'normal' ? 'Default' : 'A+'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}