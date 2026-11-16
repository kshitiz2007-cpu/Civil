'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type DesignValues = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  font: string;
  radius: number;
  spacing: number;
};
export type ElementDesign = Record<string, string>;
export type BentoDesign = {
  global: DesignValues;
  pages: Record<string, Partial<DesignValues>>;
  elements?: Record<string, Record<string, ElementDesign>>;
};
export const DEFAULT_DESIGN: BentoDesign = {
  global: {
    background: '#061321', surface: '#10263a', text: '#effbff',
    muted: '#a5b7c8', accent: '#62e6e4', border: '#284257',
    font: 'DM Sans', radius: 18, spacing: 24,
  },
  pages: {},
  elements: {},
};

const ALLOWED_ELEMENT_PROPERTIES = new Set([
  'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderStyle',
  'borderRadius', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom',
  'paddingLeft', 'margin', 'marginTop', 'marginRight', 'marginBottom',
  'marginLeft', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight',
  'textAlign', 'width', 'maxWidth', 'minWidth', 'height', 'minHeight',
  'maxHeight', 'gap', 'opacity', 'boxShadow', 'display', 'justifyContent',
  'alignItems', 'borderStyle', 'flexDirection', 'flexWrap', 'overflow',
]);

function safeStyleValue(property: string, raw: string) {
  if (!ALLOWED_ELEMENT_PROPERTIES.has(property)) return '';
  const value = String(raw).trim();
  if (!value || /[;{}<>]/.test(value) || /url\s*\(|expression\s*\(/i.test(value)) return '';
  if (property === 'color' || property === 'backgroundColor' || property === 'borderColor') {
    return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|transparent|currentColor)$/i.test(value) ? value : '';
  }
  if (property === 'display') return /^(block|inline|inline-block|flex|inline-flex|grid|none)$/i.test(value) ? value : '';
  if (property === 'borderStyle') return /^(none|solid|dashed|dotted|double)$/i.test(value) ? value : '';
  if (property === 'flexDirection') return /^(row|column|row-reverse|column-reverse)$/i.test(value) ? value : '';
  if (property === 'flexWrap') return /^(nowrap|wrap|wrap-reverse)$/i.test(value) ? value : '';
  if (property === 'overflow') return /^(visible|hidden|auto|scroll)$/i.test(value) ? value : '';
  if (property === 'textAlign') return /^(left|center|right|justify|start|end)$/i.test(value) ? value : '';
  if (property === 'justifyContent') return /^(start|end|center|space-between|space-around|space-evenly|flex-start|flex-end)$/i.test(value) ? value : '';
  if (property === 'alignItems') return /^(start|end|center|stretch|baseline|flex-start|flex-end)$/i.test(value) ? value : '';
  if (property === 'boxShadow') return /^(none|[\d\s.,#%()a-z-]+)$/i.test(value) ? value : '';
  return /^-?(\d+\.?\d*|\.\d+)(px|rem|em|%|vw|vh)?$/i.test(value) || property === 'fontWeight' && /^(normal|bold|[1-9]00)$/i.test(value) ? value : '';
}

export function designCss(design: BentoDesign, page: string) {
  const v = { ...design.global, ...(design.pages?.[page] || {}) };
  return `
    :root {
      --studio-bg:${v.background}; --studio-surface:${v.surface}; --studio-text:${v.text};
      --studio-muted:${v.muted}; --studio-accent:${v.accent}; --studio-border:${v.border};
      --studio-radius:${v.radius}px; --studio-spacing:${v.spacing}px;
    }
    body { background:var(--studio-bg)!important; color:var(--studio-text)!important; font-family:${JSON.stringify(v.font)},sans-serif!important; }
    .app-theme { background:var(--studio-bg)!important; color:var(--studio-text)!important; }
    .theme-surface,.theme-surface-solid,.glass-card,.dashboard-panel,.dashboard-recent,.dashboard-metric-card,.rb-spotlight-card,.quizzes-subject-card,.resources-subject-card {
      background:var(--studio-surface)!important; border-color:var(--studio-border)!important;
      color:var(--studio-text)!important; border-radius:var(--studio-radius)!important;
    }
    .dashboard-hero,.login-glow-card {
      background:linear-gradient(135deg,color-mix(in srgb,var(--studio-surface),var(--studio-accent) 9%),var(--studio-surface))!important;
      border-color:var(--studio-border)!important; border-radius:calc(var(--studio-radius) * 1.35)!important;
    }
    .dashboard-primary-button,.theme-control {
      background:var(--studio-accent)!important; border-color:var(--studio-accent)!important;
      color:#071321!important; border-radius:var(--studio-radius)!important;
    }
    .dashboard-gradient-text { background-image:linear-gradient(100deg,var(--studio-accent),var(--studio-text))!important; }
    button,a,input,select,textarea { accent-color:var(--studio-accent); }
    [data-bento-page="${page}"] { --studio-page-spacing:var(--studio-spacing); }
  `;
}

export default function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    const page = pathname === '/' ? 'login' : pathname.split('/').filter(Boolean)[0] || 'login';
    document.body.dataset.bentoPage = page;
    let style = document.getElementById('bento-live-design') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'bento-live-design';
      document.head.appendChild(style);
    }
    let activeDesign: BentoDesign = DEFAULT_DESIGN;
    let editorMode = false;
    let selectedElement: Element | null = null;
    const previousOverrides = new Map<HTMLElement, Map<string, { value: string; priority: string }>>();

    const apply = (next: BentoDesign) => {
      if (!next || !next.global) return;
      activeDesign = next;
      previousOverrides.forEach((properties, element) => {
        properties.forEach((original, property) => {
          if (original.value) element.style.setProperty(property, original.value, original.priority);
          else element.style.removeProperty(property);
        });
      });
      previousOverrides.clear();
      style!.textContent = designCss(next, page) + '[data-bento-editor-selected="true"]{outline:2px solid #3b82f6!important;outline-offset:2px!important;cursor:crosshair!important;}';
      document.querySelectorAll('[data-bento-editor-selected="true"]').forEach(el => {
        el.removeAttribute('data-bento-editor-selected');
      });
      const scoped = {
        ...(next.elements?.global || {}),
        ...(next.elements?.[page] || {}),
      };
      Object.entries(scoped).forEach(([selector, properties]) => {
        try {
          const element = document.querySelector(selector) as HTMLElement | null;
          if (!element) return;
          Object.entries(properties || {}).forEach(([property, raw]) => {
            const value = safeStyleValue(property, String(raw));
            if (value) {
              const cssProperty = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
              if (!previousOverrides.has(element)) previousOverrides.set(element, new Map());
              if (!previousOverrides.get(element)!.has(cssProperty)) {
                previousOverrides.get(element)!.set(cssProperty, {
                  value: element.style.getPropertyValue(cssProperty),
                  priority: element.style.getPropertyPriority(cssProperty),
                });
              }
              element.style.setProperty(cssProperty, value, 'important');
            }
          });
        } catch { /* Ignore stale selectors after a page update. */ }
      });
    };

    const selectorFor = (element: Element) => {
      if ((element as HTMLElement).id) return `#${CSS.escape((element as HTMLElement).id)}`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && current !== document.body && parts.length < 6) {
        const node = current as HTMLElement;
        let part = node.tagName.toLowerCase();
        const stableClasses = Array.from(current.classList).filter(c => !/^(hover:|focus:|active:|group|peer)/.test(c)).slice(0, 3);
        if (stableClasses.length) part += stableClasses.map(c => `.${CSS.escape(c)}`).join('');
        const parentElement: HTMLElement | null = node.parentElement as HTMLElement | null;
        if (parentElement) {
          const siblings = (Array.from(parentElement.children) as Element[]).filter((s: Element) => s.tagName === node.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        if (parentElement === document.body) break;
        current = parentElement;
      }
      return parts.join(' > ');
    };

    const onClick = (event: MouseEvent) => {
      if (!editorMode) return;
      const target = event.target as HTMLElement | null;
      const element = target?.closest('button,a,input,textarea,select,section,article,header,nav,aside,main,h1,h2,h3,h4,p,span,div') as HTMLElement | null;
      if (!element || element === document.body || element === document.documentElement) return;
      if (element.closest('[data-bento-studio-ignore="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      selectedElement = element;
      document.querySelectorAll('[data-bento-editor-selected="true"]').forEach(el => el.removeAttribute('data-bento-editor-selected'));
      element.setAttribute('data-bento-editor-selected', 'true');
      const computed = getComputedStyle(element);
      window.parent.postMessage({
        type: 'BENTO_ELEMENT_SELECTED',
        selector: selectorFor(element),
        tag: element.tagName.toLowerCase(),
        label: ((element as HTMLElement).innerText || element.getAttribute('aria-label') || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 90),
        classes: Array.from(element.classList).slice(0, 8),
        styles: {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          margin: computed.margin,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          letterSpacing: computed.letterSpacing,
          lineHeight: computed.lineHeight,
          width: computed.width,
          maxWidth: computed.maxWidth,
          minHeight: computed.minHeight,
          boxShadow: computed.boxShadow,
          opacity: computed.opacity,
          textAlign: computed.textAlign,
          display: computed.display,
          gap: computed.gap,
        },
      }, window.location.origin);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'BENTO_DESIGN_PREVIEW') apply(event.data.design as BentoDesign);
      if (event.data?.type === 'BENTO_EDITOR_MODE') {
        editorMode = Boolean(event.data.enabled);
        document.body.style.cursor = editorMode ? 'crosshair' : '';
        if (editorMode) document.addEventListener('click', onClick, true);
        else {
          document.removeEventListener('click', onClick, true);
          document.querySelectorAll('[data-bento-editor-selected="true"]').forEach(el => el.removeAttribute('data-bento-editor-selected'));
          selectedElement = null;
        }
      }
    };

    const load = async () => {
      try {
        const { data } = await supabase.from('bento_design_settings').select('published').eq('id', 'global').maybeSingle();
        if (data?.published) apply(data.published as BentoDesign);
      } catch (error) {
        console.warn('Bento design settings are not configured yet.', error);
      }
    };
    window.addEventListener('message', onMessage);
    void load();
    return () => {
      window.removeEventListener('message', onMessage);
      previousOverrides.forEach((properties, element) => properties.forEach((original, property) => {
        if (original.value) element.style.setProperty(property, original.value, original.priority);
        else element.style.removeProperty(property);
      }));
      previousOverrides.clear();
      document.removeEventListener('click', onClick, true);
      document.body.style.cursor = '';
    };
  }, [pathname]);
  return <>{children}</>;
}
