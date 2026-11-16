'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type StudioBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type VisualBlock = {
  id: string;
  type: 'heading' | 'text' | 'button' | 'card' | 'icon' | 'stat' | 'image' | 'divider' | 'reactBit';
  component?: 'blur-text' | 'aurora' | 'spotlight-card' | 'magnet-button' | 'shiny-text' | 'gradient-text' | 'fuzzy-text' | 'split-text' | 'tilted-card' | 'glare-hover' | 'particles' | 'beams' | 'click-spark' | 'card-swap' | 'target-cursor' | 'text-pressure' | 'electric-border' | 'dither' | 'star-border' | 'fade-content' | 'animated-content' | 'scroll-reveal' | 'count-up' | 'decrypted-text' | 'infinite-scroll' | 'dock' | 'profile-card' | 'glass-icons' | 'true-focus' | 'scroll-float' | 'pixel-transition' | 'waves' | 'silk' | 'lightning' | 'galaxy' | 'orb' | 'masonry' | 'stack' | 'carousel' | 'stepper' | 'folder' | 'pill-nav' | 'flowing-menu' | 'shadcn-button' | 'shadcn-card' | 'shadcn-badge' | 'shadcn-input' | 'shadcn-tabs' | 'shadcn-dialog' | 'shadcn-accordion' | 'shadcn-avatar' | 'shadcn-alert' | 'shadcn-progress' | 'shadcn-skeleton' | 'shadcn-separator' | 'shadcn-tooltip' | 'shadcn-dropdown-menu' | 'shadcn-sheet' | 'shadcn-select' | 'shadcn-switch' | 'shadcn-checkbox' | 'shadcn-slider' | 'shadcn-table';
  title: string;
  text?: string;
  buttonLabel?: string;
  href?: string;
  src?: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const latest = useRef<StudioEnvelope>(initialEnvelope);
  const dirty = useRef(false);
  const hasLocalDraft = useRef(false);

  useEffect(() => {
    let active = true;
    const wantsDraft = pathname.startsWith('/admin') || new URLSearchParams(window.location.search).has('studioPreview');
    if (!wantsDraft) {
      setIsAdminView(false);
      return () => { active = false; };
    }
    const verifyAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (active) setIsAdminView(false); return; }
        const email = session.user.email || '';
        if (email === 'kshitiz2007@gmail.com' || email === 'admin@civilprep.in') {
          if (active) setIsAdminView(true);
          return;
        }
        const { data: profile } = await supabase.from('profiles')
          .select('role').eq('id', session.user.id).maybeSingle();
        if (active) setIsAdminView(profile?.role === 'admin');
      } catch {
        if (active) setIsAdminView(false);
      }
    };
    void verifyAdmin();
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const applyLocal = (raw: any) => {
      const envelope = decodeEnvelope(raw);
      latest.current = envelope;
      hasLocalDraft.current = true;
      setDraft(envelope.draft);
      setPublished(envelope.published);
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) applyLocal(JSON.parse(raw));
    } catch { /* retain safe defaults */ }

    supabase.from('design_studio_config').select('config').eq('id', 'global').maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error('Design Studio cloud load failed:', error);
          const code = (error as { code?: string }).code || '';
          if (code === '42P01' || code === 'PGRST205' || /relation .*design_studio_config.* does not exist|could not find the table/i.test(error.message)) {
            setSaveError('Cloud publishing is not configured yet. Apply supabase/migrations/20261116190000_design_studio_config_persistence.sql in Supabase SQL Editor.');
          } else if (code === '42501' || /permission denied|row-level security/i.test(error.message)) {
            setSaveError('Cloud configuration cannot be read. Apply the Design Studio persistence migration and its public SELECT grant/policy in Supabase.');
          }
          return;
        }
        if (!data?.config) return;
        const remote = decodeEnvelope(data.config);
        const remotePublished = remote.published;
        const nextDraft = hasLocalDraft.current || dirty.current ? latest.current.draft : remotePublished;
        const envelope = { __studioVersion: 2 as const, draft: nextDraft, published: remotePublished };
        latest.current = envelope;
        setPublished(remotePublished);
        if (!dirty.current) setDraft(nextDraft);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); } catch {}
      });

    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const envelope = decodeEnvelope(JSON.parse(event.newValue));
        latest.current = envelope;
        hasLocalDraft.current = true;
        setDraft(envelope.draft);
        setPublished(envelope.published);
      } catch {}
    };
    window.addEventListener('storage', sync);
    return () => { alive = false; window.removeEventListener('storage', sync); };
  }, []);

  const save = (next: StudioConfig) => {
    dirty.current = true;
    hasLocalDraft.current = true;
    const envelope = { ...latest.current, draft: next };
    latest.current = envelope;
    setDraft(next);
    setSaveError(null);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); }
    catch { setSaveError('Browser storage is unavailable; draft may not survive a reload.'); }
  };

  const publish = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) throw new Error('Could not verify your admin session: ' + authError.message);
      if (!authData.session?.user) throw new Error('Your admin session has expired. Sign in again, then publish.');
      const nextPublished = latest.current.draft;
      // Persist the complete StudioConfig as one atomic JSONB snapshot.
      // Draft edits remain browser-local until the admin explicitly publishes them.
      const { data, error } = await supabase.from('design_studio_config')
        .upsert({ id: 'global', config: nextPublished, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('id,config,updated_at').single();
      if (error) {
        const code = (error as { code?: string }).code || '';
        if (code === '42P01' || code === 'PGRST205' || /relation .*design_studio_config.* does not exist|could not find the table/i.test(error.message)) {
          throw new Error('The design_studio_config table is missing. Apply supabase/migrations/20261116190000_design_studio_config_persistence.sql in Supabase SQL Editor, then retry.');
        }
        if (code === '42501' || /row-level security|permission denied|not allowed/i.test(error.message)) {
          throw new Error('Supabase blocked publishing. Apply the Design Studio persistence migration and confirm your signed-in account is an admin in public.profiles (role = admin), or uses an approved admin email.');
        }
        throw new Error('Supabase publish failed (' + (code || 'unknown') + '): ' + error.message);
      }
      if (!data?.config || data.id !== 'global') throw new Error('Publish could not be verified: Supabase returned no saved global configuration.');
      const verified = mergeConfig(data.config as Partial<StudioConfig>);
      const envelope = { ...latest.current, published: verified };
      latest.current = envelope;
      if (latest.current.draft === nextPublished) dirty.current = false;
      setPublished(verified);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); }
      catch { setSaveError('Published to the cloud, but this browser could not update its local cache.'); }
      return true;
    } catch (error) {
      console.error('Visual designer publish failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Publish failed. Check Supabase table permissions, admin role and connection.');
      return false;
    } finally { setIsSaving(false); }
  };

  const discard = () => {
    const envelope = { ...latest.current, draft: latest.current.published };
    latest.current = envelope;
    dirty.current = false;
    hasLocalDraft.current = true;
    setDraft(envelope.draft);
    setSaveError(null);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); } catch {}
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
      componentCss + '.theme-gradient-text{background-image:var(--app-text-gradient);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}' + elementCss +
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
