'use client';

import { useEffect, useState } from 'react';
import { Check, Code2, Copy, RotateCcw, ShieldAlert } from 'lucide-react';
import { useDesignStudio } from '@/components/design-studio/DesignStudioProvider';

const STARTER_CSS = `/* Global CSS — selectors, component styles, responsive rules and animations */
:root {
  --app-accent: #8b5cf6;
  --app-secondary: #22d3ee;
  --studio-radius: 16px;
}

/* Existing application surfaces */
.theme-surface,
.glass-card {
  border-radius: var(--studio-radius);
  box-shadow: 0 8px 28px rgba(0, 0, 0, .14);
}

/* Component-level styling */
button.theme-control {
  transition: background-color .18s ease, border-color .18s ease, transform .18s ease;
}

/* Responsive CSS is supported */
@media (max-width: 767px) {
  .theme-surface { backdrop-filter: blur(12px); }
}
`;

export default function CustomCssEditor() {
  const { config, save } = useDesignStudio();
  const [draft, setDraft] = useState(config.customCss || '');
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(true);

  useEffect(() => setDraft(config.customCss || ''), [config.customCss]);

  const apply = (value: string) => {
    setDraft(value);
    const lower = value.toLowerCase();
    if (lower.includes('@import') || lower.includes('javascript:') || lower.includes('expression(') || lower.includes('</style')) {
      setError('For safety, @import, javascript URLs, CSS expressions and style-tag closing sequences are not allowed.');
      setApplied(false);
      return;
    }
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(value);
      save({ ...config, customCss: value });
      setError('');
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSS could not be parsed.');
      setApplied(false);
    }
  };

  const reset = () => {
    setDraft('');
    setError('');
    setApplied(true);
    save({ ...config, customCss: '' });
  };

  const loadStarter = () => apply(STARTER_CSS);

  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); } catch { setError('Clipboard access was unavailable in this browser.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Code2 size={18} className="text-[var(--app-accent)]"/><h3 className="font-bold">Live CSS playground</h3></div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--app-muted)]">Paste a complete stylesheet, style individual components, add media queries and animations. Valid CSS is applied live across the application and saved with your Design Studio configuration.</p>
        </div>
        <span className={applied ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400' : 'inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400'}>
          {applied ? <Check size={12}/> : <ShieldAlert size={12}/>}
          {applied ? 'Live · applied' : 'Draft · not applied'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[#0b0b13]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-rose-400"/><span className="size-2 rounded-full bg-amber-300"/><span className="size-2 rounded-full bg-emerald-400"/><span className="ml-2 font-mono text-[10px] text-slate-400">custom-styles.css</span></div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={loadStarter} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/5">Load example</button>
            <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/5"><Copy size={11}/>Copy</button>
            <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/5"><RotateCcw size={11}/>Clear</button>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(event) => apply(event.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Complete custom CSS stylesheet"
          placeholder={STARTER_CSS}
          className="min-h-[440px] w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-[12px] leading-[1.8] text-violet-100 outline-none placeholder:text-slate-600 focus:ring-0"
        />
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-slate-500">
          <span>{draft.split('\\n').length} lines · {draft.length} characters</span>
          <span>CSS · Global scope</span>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200"><ShieldAlert size={15} className="mt-0.5 shrink-0"/><span>{error}</span></div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
          <p className="text-xs font-semibold">Full stylesheet support</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--app-muted)]">Selectors, variables, gradients, pseudo-states, keyframes, media queries, component classes and responsive overrides.</p>
        </div>
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
          <p className="text-xs font-semibold">Safe editing workflow</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--app-muted)]">Invalid CSS stays in the editor as a draft. The last valid stylesheet remains active until a valid replacement is entered.</p>
        </div>
      </div>
    </div>
  );
}
