'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type StudioBreakpoint = 'desktop' | 'tablet' | 'mobile';
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
  pageBreakpoints: {}, components: {}, elementStyles: {}, structure: {}, assets: [], customCss: '', componentUpgrades: {},
};
const StudioContext = createContext<{ config: StudioConfig; save: (v: StudioConfig) => void } | null>(null);
export function useDesignStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error('useDesignStudio must be used inside DesignStudioProvider');
  return value;
}
export function DesignStudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_STUDIO);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig({ ...DEFAULT_STUDIO, ...JSON.parse(raw) });
    } catch { /* retain defaults */ }
    let alive = true;
    supabase.from('design_studio_config').select('config').eq('id', 'global').maybeSingle()
      .then(({ data, error }) => {
        if (!alive || error || !data?.config) return;
        const remote = { ...DEFAULT_STUDIO, ...data.config };
        setConfig(remote);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch {}
      });
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try { setConfig({ ...DEFAULT_STUDIO, ...JSON.parse(event.newValue) }); } catch {}
      }
    };
    window.addEventListener('storage', sync);
    return () => { alive = false; window.removeEventListener('storage', sync); };
  }, []);
  const save = (next: StudioConfig) => {
    setConfig(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (error) {
      console.error('Design studio settings could not be persisted', error);
    }
  };
  const pageKey = pathname === '/' ? 'home' : pathname.split('/').filter(Boolean)[0] || 'home';
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
    const componentCss = Object.entries(config.components).map(([name, styles]) => `.${name}{${declarations(styles)}}`).join("");
    const elementCss = Object.entries(config.elementStyles || {}).filter(([key]) => key.startsWith(`${pageKey}::`)).map(([key, styles]) => `${key.slice(pageKey.length + 2)}{${declarations(styles)}}`).join("");
    return `html[data-theme]{${global}}html[data-studio-page="${pageKey}"]{${page}}` + componentCss + elementCss +
      responsive('tablet','(min-width:768px) and (max-width:1023px)') +
      responsive('mobile','(max-width:767px)') + (config.customCss || '');
  }, [config, pageKey]);
  useEffect(() => {
    document.documentElement.dataset.studioPage = pageKey;
    document.documentElement.style.fontSize = `calc(16px * ${config.global['--studio-font-scale'] || '1'})`;
  }, [pageKey, config.global]);
  return <StudioContext.Provider value={{ config, save }}>
    <style id="gyankunj-live-design-tokens">{css}</style>{children}
  </StudioContext.Provider>;
}
