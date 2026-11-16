'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type StudioBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type VisualBlock = {
  id: string;
  type: 'heading' | 'text' | 'button' | 'card' | 'icon' | 'stat' | 'divider';
  title: string;
  text?: string;
  buttonLabel?: string;
  href?: string;
  icon?: string;
  effect?: 'none' | 'fade' | 'rise' | 'float' | 'pulse';
  variant?: 'solid' | 'outline' | 'soft';
  styles?: Record<string, string>;
};
export type StudioConfig = {
  global: Record<string, string>;
  pages: Record<string, Record<string, string>>;
  breakpoints: Record<StudioBreakpoint, Record<string, string>>;
  pageBreakpoints: Record<string, Partial<Record<StudioBreakpoint, Record<string, string>>>>;
  components: Record<string, Record<string, string>>;
  elementStyles: Record<string, Record<string, string>>;
  structure: Record<string, string[]>;
  assets: { id: string; name: string; type: string; data: string; path?: string }[];
  customCss: string;
  componentUpgrades: Record<string, { component: string; variant: string; updatedAt: string }>;
  slotBlocks: Record<string, VisualBlock[]>;
  slotOrder: Record<string, number>;
};
const STORAGE_KEY = 'gyankunj-design-studio-v1';
export const DEFAULT_STUDIO: StudioConfig = {
  global: {
    '--app-bg': '#08110f', '--app-panel': 'rgba(14, 28, 25, 0.92)',
    '--app-panel-strong': '#10211d', '--app-text': '#eef7f4',
    '--app-muted': '#94afa6', '--app-border': 'rgba(167, 218, 200, 0.18)',
    '--app-accent': '#34d399', '--app-accent-strong': '#10b981',
    '--app-accent-soft': 'rgba(52, 211, 153, 0.13)', '--app-secondary': '#38bdf8',
    '--studio-radius': '18px', '--studio-font-scale': '1',
    '--studio-content-width': '1280px', '--studio-spacing': '16px',
  },
  pages: {}, breakpoints: { desktop: {}, tablet: {}, mobile: {} },
  pageBreakpoints: {}, components: {}, elementStyles: {}, structure: {}, assets: [],
  customCss: '', componentUpgrades: {}, slotBlocks: {}, slotOrder: {},
};
type StudioEnvelope = { __studioVersion: 2; draft: StudioConfig; published: StudioConfig };
const mergeConfig = (value: Partial<StudioConfig> | null | undefined): StudioConfig => ({
  ...DEFAULT_STUDIO, ...(value || {}),
  breakpoints: { ...DEFAULT_STUDIO.breakpoints, ...(value?.breakpoints || {}) },
  slotBlocks: value?.slotBlocks || {}, slotOrder: value?.slotOrder || {},
});
const decodeEnvelope = (value: any): StudioEnvelope => {
  if (value?.__studioVersion === 2) return {
    __studioVersion: 2, draft: mergeConfig(value.draft), published: mergeConfig(value.published),
  };
  const legacy = mergeConfig(value);
  return { __studioVersion: 2, draft: legacy, published: legacy };
};
const initialEnvelope: StudioEnvelope = {
  __studioVersion: 2, draft: DEFAULT_STUDIO, published: DEFAULT_STUDIO,
};
const StudioContext = createContext<{
  config: StudioConfig;
  draft: StudioConfig;
  published: StudioConfig;
  save: (v: StudioConfig) => void;
  publish: () => Promise<boolean>;
  discard: () => void;
  isSaving: boolean;
  saveError: string | null;
  isPublished: boolean;
} | null>(null);

export function useDesignStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error('useDesignStudio must be used inside DesignStudioProvider');
  return value;
}

export function DesignStudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [draft, setDraft] = useState<StudioConfig>(DEFAULT_STUDIO);
  const [published, setPublished] = useState<StudioConfig>(DEFAULT_STUDIO);
  const [isSaving, setIsSaving] = useState(false);\n  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const latest = useRef<StudioEnvelope>(initialEnvelope);

  useEffect(() => {
    setIsAdminView(pathname.startsWith('/admin') || new URLSearchParams(window.location.search).has('studioPreview'));
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const apply = (raw: any) => {
      const envelope = decodeEnvelope(raw);
      latest.current = envelope;
      setDraft(envelope.draft);
      setPublished(envelope.published);
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) apply(JSON.parse(raw));
    } catch { /* retain safe defaults */ }
    supabase.from('design_studio_config').select('config').eq('id', 'global').maybeSingle()
      .then(({ data, error }) => {
        if (!alive || error || !data?.config) return;
        apply(data.config);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decodeEnvelope(data.config))); } catch {}
      });
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try { apply(JSON.parse(event.newValue)); } catch {}
    };
    window.addEventListener('storage', sync);
    return () => { alive = false; window.removeEventListener('storage', sync); };
  }, []);

  const persist = (envelope: StudioEnvelope) => {
    const task = writeQueue.current.then(async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
        const { error } = await supabase.from('design_studio_config')
          .upsert({ id: 'global', config: envelope }, { onConflict: 'id' });
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Visual designer cloud save failed:', error);
        setSaveError(error instanceof Error ? error.message : 'Cloud save failed. Check Supabase permissions and connection.');
        return false;
      } finally { setIsSaving(false); }
    });
    writeQueue.current = task;
    return task;
  };

  const save = (next: StudioConfig) => {
    const envelope = { ...latest.current, draft: next };
    latest.current = envelope;
    setDraft(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); } catch {}
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void persist(envelope); }, 700);
  };

  const publish = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const envelope = { ...latest.current, published: latest.current.draft };
    const ok = await persist(envelope);
    if (ok) {
      latest.current = envelope;
      setPublished(envelope.published);
    }
    return ok;
  };

  const discard = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const envelope = { ...latest.current, draft: latest.current.published };
    latest.current = envelope;
    setDraft(envelope.draft);
    void persist(envelope);
  };

  const pageKey = pathname === '/' ? 'home' : pathname.split('/').filter(Boolean)[0] || 'home';
  const config = isAdminView ? draft : published;
  const css = useMemo(() => {
    const declarations = (values: Record<string, string>) => Object.entries(values).map(([k,v]) => `${k}:${v}`).join(';');
    const global = declarations(config.global);
    const page = declarations(config.pages[pageKey] || {});
    const responsive = (bp: StudioBreakpoint, query: string) => {
      const globalOverrides = declarations(config.breakpoints[bp] || {});
      const pageOverrides = declarations(config.pageBreakpoints[pageKey]?.[bp] || {});
      return (globalOverrides || pageOverrides)
        ? `@media ${query}{html[data-theme]{${globalOverrides}}html[data-studio-page="${pageKey}"]{${pageOverrides}}}`
        : '';
    };
    const componentCss = Object.entries(config.components).map(([name, styles]) => `.${name}{${declarations(styles)}}`).join('');
    const elementCss = Object.entries(config.elementStyles || {}).filter(([key]) => key.startsWith(`${pageKey}::`)).map(([key, styles]) => `${key.slice(pageKey.length + 2)}{${declarations(styles)}}`).join('');
    return `html[data-theme]{${global}}html[data-studio-page="${pageKey}"]{${page}}${
      componentCss + elementCss +
      responsive('tablet','(min-width:768px) and (max-width:1023px)') +
      responsive('mobile','(max-width:767px)') + (config.customCss || '')
    }`;
  }, [config, pageKey]);

  useEffect(() => {
    document.documentElement.dataset.studioPage = pageKey;
    document.documentElement.style.fontSize = `calc(16px * ${config.global['--studio-font-scale'] || '1'})`;
  }, [pageKey, config.global]);

  return <StudioContext.Provider value={{
    config, draft, published, save, publish, discard, isSaving, saveError,
    isPublished: JSON.stringify(draft) === JSON.stringify(published),
  }}>
    <style id="gyankunj-live-design-tokens">{css}</style>{children}
  </StudioContext.Provider>;
}
