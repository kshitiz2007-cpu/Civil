'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type DesignValues = {
  background: string; surface: string; text: string; muted: string; accent: string;
  border: string; font: string; radius: number; spacing: number;
};
export type BentoDesign = { global: DesignValues; pages: Record<string, Partial<DesignValues>> };
export const DEFAULT_DESIGN: BentoDesign = {
  global: { background:'#061321', surface:'#10263a', text:'#effbff', muted:'#a5b7c8', accent:'#62e6e4', border:'#284257', font:'DM Sans', radius:18, spacing:24 },
  pages: {}
};
export function designCss(design: BentoDesign, page: string) {
  const v = { ...design.global, ...(design.pages?.[page] || {}) };
  return `
    :root { --studio-bg:${v.background}; --studio-surface:${v.surface}; --studio-text:${v.text}; --studio-muted:${v.muted}; --studio-accent:${v.accent}; --studio-border:${v.border}; --studio-radius:${v.radius}px; --studio-spacing:${v.spacing}px; }
    body { background:var(--studio-bg)!important; color:var(--studio-text)!important; font-family:${JSON.stringify(v.font)},sans-serif!important; }
    .app-theme { background:var(--studio-bg)!important; color:var(--studio-text)!important; }
    .theme-surface,.theme-surface-solid,.glass-card,.dashboard-panel,.dashboard-recent,.dashboard-metric-card,.rb-spotlight-card,.quizzes-subject-card,.resources-subject-card { background:var(--studio-surface)!important; border-color:var(--studio-border)!important; color:var(--studio-text)!important; border-radius:var(--studio-radius)!important; }
    .dashboard-hero,.login-glow-card { background:linear-gradient(135deg,color-mix(in srgb,var(--studio-surface),var(--studio-accent) 9%),var(--studio-surface))!important; border-color:var(--studio-border)!important; border-radius:calc(var(--studio-radius) * 1.35)!important; }
    .dashboard-primary-button,.theme-control { background:var(--studio-accent)!important; border-color:var(--studio-accent)!important; color:#071321!important; border-radius:var(--studio-radius)!important; }
    .dashboard-gradient-text { background-image:linear-gradient(100deg,var(--studio-accent),var(--studio-text))!important; }
    button,a,input,select,textarea { accent-color:var(--studio-accent); }
    [data-bento-page="${page}"] { --studio-page-spacing:var(--studio-spacing); }
    [data-bento-page="${page}"] .dashboard-main,[data-bento-page="${page}"] main { scroll-padding:var(--studio-spacing); }
  `;
}
export default function DesignSystemProvider({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  useEffect(() => {
    const page = pathname === '/' ? 'login' : pathname.split('/').filter(Boolean)[0] || 'login';
    document.body.dataset.bentoPage = page;
    let style = document.getElementById('bento-live-design') as HTMLStyleElement | null;
    if (!style) { style=document.createElement('style'); style.id='bento-live-design'; document.head.appendChild(style); }
    let active = DEFAULT_DESIGN;
    const apply = (next: BentoDesign) => { active=next; style!.textContent=designCss(next,page); };
    const load = async () => {
      try {
        const { data } = await supabase.from('bento_design_settings').select('published').eq('id','global').maybeSingle();
        if (data?.published) apply(data.published as BentoDesign);
      } catch (error) { console.warn('Bento design settings are not configured yet.',error); }
    };
    const onPreview = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'BENTO_DESIGN_PREVIEW') return;
      apply(event.data.design as BentoDesign);
    };
    window.addEventListener('message',onPreview);
    void load();
    return () => window.removeEventListener('message',onPreview);
  },[pathname]);
  return <>{children}</>;
}
