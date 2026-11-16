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
  responsive?: Record<string, { tokens?: Partial<DesignValues>; elements?: Record<string, ElementDesign> }>;
  components?: Record<string, { name: string; styles: ElementDesign }>;
  componentBindings?: Record<string, Record<string, string>>;
  structure?: Record<string, Record<string, string[]>>;
  hidden?: Record<string, string[]>;
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
  const mobile = { ...(design.responsive?.['global:mobile']?.tokens || {}), ...(design.responsive?.[page + ':mobile']?.tokens || {}) };
  const tablet = { ...(design.responsive?.['global:tablet']?.tokens || {}), ...(design.responsive?.[page + ':tablet']?.tokens || {}) };
  const tokenVars = (tokens: Partial<DesignValues>) => Object.entries(tokens).map(([key, value]) => {
    const names: Record<string, string> = { background:'--studio-bg', surface:'--studio-surface', text:'--studio-text', muted:'--studio-muted', accent:'--studio-accent', border:'--studio-border', radius:'--studio-radius', spacing:'--studio-spacing', font:'--studio-font' };
    const name = names[key]; return name ? name + ':' + (key === 'radius' || key === 'spacing' ? value + 'px' : key === 'font' ? JSON.stringify(value) + ',sans-serif' : value) + ';' : '';
  }).join('');
  return `
    :root {
      --studio-bg:${v.background}; --studio-surface:${v.surface}; --studio-text:${v.text};
      --studio-muted:${v.muted}; --studio-accent:${v.accent}; --studio-border:${v.border};
      --studio-radius:${v.radius}px; --studio-spacing:${v.spacing}px; --studio-font:${JSON.stringify(v.font)},sans-serif;
    }
    body { background:var(--studio-bg)!important; color:var(--studio-text)!important; font-family:var(--studio-font)!important; }
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
    @media (min-width:768px) and (max-width:1023px) { :root { ${tokenVars(tablet)} } }
    @media (max-width:767px) { :root { ${tokenVars(mobile)} } }
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
      document.querySelectorAll('section,article,header,nav,aside,main,div,ul,ol,li').forEach(node => ensureNodeId(node));
      const breakpoint = window.innerWidth <= 767 ? 'mobile' : window.innerWidth <= 1023 ? 'tablet' : 'desktop';
      const scoped = {
        ...(next.elements?.global || {}),
        ...(next.elements?.[page] || {}),
        ...(next.responsive?.[page + ':' + breakpoint]?.elements || {}),
      };
      Object.entries(next.components || {}).forEach(([id, component]) => {
        document.querySelectorAll('[data-bento-component="' + CSS.escape(id) + '"]').forEach(node => {
          Object.entries(component.styles || {}).forEach(([property, raw]) => {
            const value = safeStyleValue(property, String(raw));
            if (value) (node as HTMLElement).style.setProperty(property.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), value, 'important');
          });
        });
      });
      (next.hidden?.[page] || []).forEach(id => {
        const node = document.querySelector('[data-bento-node-id="' + CSS.escape(id) + '"]') as HTMLElement | null;
        if (node) node.style.setProperty('display', 'none', 'important');
      });
      Object.entries(next.structure?.[page] || {}).forEach(([parentId, childIds]) => {
        const parent = document.querySelector('[data-bento-node-id="' + CSS.escape(parentId) + '"]');
        if (parent) childIds.forEach(id => { const child = document.querySelector('[data-bento-node-id="' + CSS.escape(id) + '"]'); if (child && child.parentElement === parent) parent.appendChild(child); });
      });
      Object.entries(scoped).forEach(([selector, properties]) => {
        try {
          const element = document.querySelector(selector) as HTMLElement | null;
          if (!element) return;
          Object.entries(properties || {}).forEach(([property, raw]) => {
            if (property === 'assetUrl') {
              const url = String(raw);
              if (/^https:\/\//i.test(url) && !/[\"'<>]/.test(url)) {
                if (element instanceof HTMLImageElement) element.src = url;
                else element.style.setProperty('background-image', 'url("' + url + '")', 'important');
              }
              return;
            }
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

    const ensureNodeId = (element: Element) => {
      let id = element.getAttribute('data-bento-node-id');
      if (!id) {
        const html = element as HTMLElement;
        const signature = [element.tagName, html.id || '', Array.from(element.classList).sort().join('.'), (html.innerText || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80)].join('|');
        let hash = 2166136261;
        for (let i = 0; i < signature.length; i++) hash = Math.imul(hash ^ signature.charCodeAt(i), 16777619);
        id = 'bn-' + (hash >>> 0).toString(36);
        element.setAttribute('data-bento-node-id', id);
      }
      return id;
    };
    const selectorFor = (element: Element) => {
      const nodeId = element.getAttribute('data-bento-node-id');
      if (nodeId) return '[data-bento-node-id="' + CSS.escape(nodeId) + '"]';
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
      ensureNodeId(element);
      document.querySelectorAll('[data-bento-editor-selected="true"]').forEach(el => el.removeAttribute('data-bento-editor-selected'));
      element.setAttribute('data-bento-editor-selected', 'true');
      const computed = getComputedStyle(element);
      window.parent.postMessage({
        type: 'BENTO_ELEMENT_SELECTED',
        selector: selectorFor(element),
        nodeId: ensureNodeId(element),
        componentId: element.getAttribute('data-bento-component'),
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

    const onDragStart = (event: DragEvent) => {
      if (!editorMode) return;
      const target = event.target as HTMLElement | null;
      const node = target?.closest('section,article,header,nav,aside,main,div,ul,ol,li') as HTMLElement | null;
      if (!node || node === document.body || node.closest('[data-bento-studio-ignore="true"]')) return;
      ensureNodeId(node);
      event.dataTransfer?.setData('text/bento-node', ensureNodeId(node));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (event: DragEvent) => { if (editorMode && event.dataTransfer?.types.includes('text/bento-node')) event.preventDefault(); };
    const onDrop = (event: DragEvent) => {
      if (!editorMode) return;
      const sourceId = event.dataTransfer?.getData('text/bento-node');
      const target = event.target as HTMLElement | null;
      const destination = target?.closest('section,article,header,nav,aside,main,div,ul,ol,li') as HTMLElement | null;
      const source = sourceId ? document.querySelector('[data-bento-node-id="' + CSS.escape(sourceId) + '"]') as HTMLElement | null : null;
      if (!source || !destination || source === destination || source.contains(destination) || destination.closest('[data-bento-studio-ignore="true"]')) return;
      event.preventDefault();
      const parent = destination.parentElement;
      if (!parent || source.parentElement !== parent) destination.appendChild(source);
      else if (event.clientY < destination.getBoundingClientRect().top + destination.offsetHeight / 2) parent.insertBefore(source, destination);
      else parent.insertBefore(source, destination.nextSibling);
      const parentNode = source.parentElement;
      if (parentNode) window.parent.postMessage({ type:'BENTO_STRUCTURE_UPDATED', parentId:ensureNodeId(parentNode), childIds:Array.from(parentNode.children).map(child => ensureNodeId(child)) }, window.location.origin);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'BENTO_DESIGN_PREVIEW') apply(event.data.design as BentoDesign);
      if (event.data?.type === 'BENTO_ELEMENT_ASSET' && selectedElement) {
        const url = String(event.data.url || '');
        if (/^https:\/\//i.test(url) && !/[\"'<>]/.test(url)) { if (selectedElement instanceof HTMLImageElement) selectedElement.src = url; else (selectedElement as HTMLElement).style.backgroundImage = 'url("' + url + '")'; }
      }
      if (event.data?.type === 'BENTO_COMPONENT_MARK' && selectedElement) { selectedElement.setAttribute('data-bento-component', String(event.data.id)); apply(activeDesign); }
      if (event.data?.type === 'BENTO_ELEMENT_ACTION' && selectedElement) {
        if (event.data.action === 'duplicate') { const clone = selectedElement.cloneNode(true) as HTMLElement; clone.removeAttribute('data-bento-node-id'); selectedElement.parentElement?.insertBefore(clone, selectedElement.nextSibling); const parent = selectedElement.parentElement; if (parent) window.parent.postMessage({ type:'BENTO_STRUCTURE_UPDATED', parentId:ensureNodeId(parent), childIds:Array.from(parent.children).map(child => ensureNodeId(child)) }, window.location.origin); }
        if (event.data.action === 'delete') { const nodeId = ensureNodeId(selectedElement); selectedElement.remove(); window.parent.postMessage({ type:'BENTO_ELEMENT_DELETED', nodeId }, window.location.origin); selectedElement = null; }
      }
      if (event.data?.type === 'BENTO_EDITOR_MODE') {
        editorMode = Boolean(event.data.enabled);
        document.body.style.cursor = editorMode ? 'crosshair' : '';
        if (editorMode) {
          document.querySelectorAll('section,article,header,nav,aside,main,div,ul,ol,li').forEach(node => { (node as HTMLElement).draggable = true; });
          document.addEventListener('click', onClick, true);
        }
        else {
          document.removeEventListener('click', onClick, true);
          document.querySelectorAll('[draggable="true"]').forEach(node => { (node as HTMLElement).draggable = false; });
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
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('dragover', onDragOver, true);
    document.addEventListener('drop', onDrop, true);
    const onResize = () => apply(activeDesign);
    window.addEventListener('resize', onResize);
    void load();
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('dragover', onDragOver, true);
      document.removeEventListener('drop', onDrop, true);
      window.removeEventListener('resize', onResize);
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
