'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_DESIGN, type BentoDesign, type DesignValues } from '@/components/DesignSystemProvider';
import {
  Activity, ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleHelp,
  Clock3, Eye, Globe, Layers3, Monitor, MousePointer2, Palette, Redo2,
  RotateCcw, Save, Smartphone, Tablet, Undo2, WandSparkles, X,
} from 'lucide-react';

type Device = 'desktop' | 'tablet' | 'mobile';
type SelectedElement = {
  selector: string;
  tag: string;
  label: string;
  classes: string[];
  styles: Record<string, string>;
};
type Field = { key: string; label: string; type?: 'color' | 'select' | 'text'; options?: string[]; suffix?: string };

const pages = [
  { id: 'login', label: 'Login & signup', path: '/', description: 'Authentication experience' },
  { id: 'dashboard', label: 'Student dashboard', path: '/dashboard', description: 'Student home and widgets' },
  { id: 'quizzes', label: 'Quizzes & tests', path: '/quizzes', description: 'Test discovery and quiz interface' },
  { id: 'resources', label: 'Study resources', path: '/resources', description: 'Resource library and categories' },
  { id: 'history', label: 'Results & history', path: '/history', description: 'Scores, attempts and progress' },
  { id: 'leaderboard', label: 'Leaderboard', path: '/leaderboard', description: 'Rankings and performance' },
  { id: 'admin', label: 'Admin workspace', path: '/admin', description: 'Administration and management' },
];

const globalFields: Field[] = [
  { key: 'background', label: 'App background', type: 'color' },
  { key: 'surface', label: 'Cards & surfaces', type: 'color' },
  { key: 'text', label: 'Primary text', type: 'color' },
  { key: 'muted', label: 'Secondary text', type: 'color' },
  { key: 'accent', label: 'Brand accent', type: 'color' },
  { key: 'border', label: 'Borders', type: 'color' },
  { key: 'font', label: 'Font family', type: 'select', options: ['DM Sans', 'Manrope', 'Inter', 'Geist', 'Arial', 'Georgia', 'system-ui'] },
  { key: 'radius', label: 'Base corner radius', suffix: 'px' },
  { key: 'spacing', label: 'Base spacing', suffix: 'px' },
];

const styleFields: Field[] = [
  { key: 'color', label: 'Text colour', type: 'color' },
  { key: 'backgroundColor', label: 'Background', type: 'color' },
  { key: 'borderColor', label: 'Border colour', type: 'color' },
  { key: 'borderWidth', label: 'Border width', suffix: 'px' },
  { key: 'borderStyle', label: 'Border style', type: 'select', options: ['none', 'solid', 'dashed', 'dotted', 'double'] },
  { key: 'borderRadius', label: 'Corner radius', suffix: 'px' },
  { key: 'padding', label: 'Padding (all sides)', suffix: 'px' },
  { key: 'paddingTop', label: 'Padding top', suffix: 'px' },
  { key: 'paddingRight', label: 'Padding right', suffix: 'px' },
  { key: 'paddingBottom', label: 'Padding bottom', suffix: 'px' },
  { key: 'paddingLeft', label: 'Padding left', suffix: 'px' },
  { key: 'margin', label: 'Margin (all sides)', suffix: 'px' },
  { key: 'marginTop', label: 'Margin top', suffix: 'px' },
  { key: 'marginRight', label: 'Margin right', suffix: 'px' },
  { key: 'marginBottom', label: 'Margin bottom', suffix: 'px' },
  { key: 'marginLeft', label: 'Margin left', suffix: 'px' },
  { key: 'width', label: 'Width', suffix: 'px / %' },
  { key: 'minWidth', label: 'Minimum width', suffix: 'px' },
  { key: 'maxWidth', label: 'Maximum width', suffix: 'px' },
  { key: 'height', label: 'Height', suffix: 'px' },
  { key: 'maxHeight', label: 'Maximum height', suffix: 'px' },
  { key: 'minHeight', label: 'Minimum height', suffix: 'px' },
  { key: 'fontSize', label: 'Font size', suffix: 'px' },
  { key: 'fontWeight', label: 'Font weight', type: 'select', options: ['300', '400', '500', '600', '700', '800', '900'] },
  { key: 'letterSpacing', label: 'Letter spacing', suffix: 'px' },
  { key: 'lineHeight', label: 'Line height', suffix: 'px' },
  { key: 'textAlign', label: 'Text alignment', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  { key: 'display', label: 'Display', type: 'select', options: ['block', 'flex', 'grid', 'inline-flex', 'inline-block', 'none'] },
  { key: 'flexDirection', label: 'Flex direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
  { key: 'flexWrap', label: 'Flex wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
  { key: 'justifyContent', label: 'Justify content', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
  { key: 'alignItems', label: 'Align items', type: 'select', options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'] },
  { key: 'overflow', label: 'Overflow', type: 'select', options: ['visible', 'hidden', 'auto', 'scroll'] },
  { key: 'gap', label: 'Flex / grid gap', suffix: 'px' },
  { key: 'opacity', label: 'Opacity', suffix: '0–1' },
  { key: 'boxShadow', label: 'Box shadow', type: 'text' },
];

const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
const toCss = (key: string, value: string) => {
  const map: Record<string, string> = {
    backgroundColor: 'background-color', borderColor: 'border-color',
    borderWidth: 'border-width', borderRadius: 'border-radius',
    fontSize: 'font-size', fontWeight: 'font-weight',
    letterSpacing: 'letter-spacing', lineHeight: 'line-height',
    textAlign: 'text-align', maxWidth: 'max-width', minHeight: 'min-height',
    boxShadow: 'box-shadow', justifyContent: 'justify-content',
    alignItems: 'align-items',
  };
  return map[key] || key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
};

export default function DesignStudio() {
  const [design, setDesign] = useState<BentoDesign>(DEFAULT_DESIGN);
  const [scope, setScope] = useState('dashboard');
  const [device, setDevice] = useState<Device>('desktop');
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [panel, setPanel] = useState<'pages' | 'design' | 'inspector' | 'history'>('pages');
  const [status, setStatus] = useState('Loading design settings…');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<BentoDesign[]>([DEFAULT_DESIGN]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const activePage = pages.find(p => p.id === scope) || pages[0];
  const selectedStyles = selected ? (design.elements?.[scope]?.[selected.selector] || {}) : {};

  const remember = useCallback((next: BentoDesign) => {
    setUndoStack(current => [...current.slice(0, historyIndex + 1), next].slice(-60));
    setHistoryIndex(current => Math.min(current + 1, 59));
    setDesign(next);
    setDirty(true);
  }, [historyIndex]);

  const updateGlobal = (key: keyof DesignValues, value: string | number) => {
    const next = structuredClone(design);
    if (scope === 'all') next.global = { ...next.global, [key]: value };
    else next.pages = { ...next.pages, [scope]: { ...(next.pages?.[scope] || {}), [key]: value } };
    remember(next);
  };

  const updateElement = (key: string, value: string) => {
    if (!selected) return;
    const next = structuredClone(design);
    next.elements = next.elements || {};
    const elementScope = scope === 'all' ? 'global' : scope;
    next.elements[elementScope] = next.elements[elementScope] || {};
    next.elements[elementScope][selected.selector] = {
      ...(next.elements[scope][selected.selector] || {}),
      [key]: value,
    };
    remember(next);
  };

  const clearElementStyle = (key: string) => {
    if (!selected) return;
    const next = structuredClone(design);
    const elementScope = scope === 'all' ? 'global' : scope;
    const values = next.elements?.[elementScope]?.[selected.selector];
    if (values) {
      delete values[key];
      if (!Object.keys(values).length) delete next.elements![elementScope][selected.selector];
    }
    remember(next);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('bento_design_settings')
          .select('draft,published').eq('id', 'global').maybeSingle();
        if (error) throw error;
        if (!active) return;
        const initial = (data?.draft || data?.published || DEFAULT_DESIGN) as BentoDesign;
        setDesign(initial);
        setUndoStack([initial]);
        setHistoryIndex(0);
        setStatus(data?.published ? 'Published design loaded' : 'Ready · no published design yet');
        const { data: rows } = await supabase.from('bento_design_revisions')
          .select('id,note,created_at,design').order('created_at', { ascending: false }).limit(25);
        if (active && rows) setRevisions(rows);
      } catch (error) {
        if (active) setStatus(error instanceof Error ? error.message : 'Database migration required');
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'BENTO_ELEMENT_SELECTED') {
        setSelected({
          selector: String(event.data.selector || ''),
          tag: String(event.data.tag || 'element'),
          label: String(event.data.label || 'Selected element'),
          classes: Array.isArray(event.data.classes) ? event.data.classes : [],
          styles: event.data.styles || {},
        });
        setPanel('inspector');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const sendPreview = () => {
    const target = frame.current?.contentWindow;
    if (!target) return;
    target.postMessage({ type: 'BENTO_DESIGN_PREVIEW', design }, window.location.origin);
    target.postMessage({ type: 'BENTO_EDITOR_MODE', enabled: true }, window.location.origin);
  };

  useEffect(() => {
    sendPreview();
  }, [design, scope]);

  const save = async (publish: boolean) => {
    setBusy(true);
    setStatus(publish ? 'Publishing design…' : 'Saving draft…');
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('Admin session expired. Please sign in again.');
      const existing = await supabase.from('bento_design_settings').select('published').eq('id', 'global').maybeSingle();
      if (existing.error) throw existing.error;
      const { error } = await supabase.from('bento_design_settings').upsert({
        id: 'global',
        draft: design,
        published: publish ? design : (existing.data?.published ?? null),
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id,
      }, { onConflict: 'id' });
      if (error) throw error;
      const revision = await supabase.from('bento_design_revisions').insert({
        settings_id: 'global',
        design,
        note: publish ? 'Published from Visual Design Studio' : 'Saved design draft',
        created_by: auth.user.id,
      }).select('id,note,created_at,design').single();
      if (!revision.error && revision.data) setRevisions(rows => [revision.data, ...rows].slice(0, 25));
      setDirty(false);
      setStatus(publish ? 'Published live across Bento' : 'Draft saved securely');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save design');
    } finally {
      setBusy(false);
    }
  };

  const restore = (revision: any) => {
    const next = revision.design as BentoDesign;
    remember(next);
    setStatus('Revision restored as an unsaved draft');
    setPanel('design');
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setDesign(undoStack[nextIndex]);
    setDirty(true);
  };
  const redo = () => {
    if (historyIndex >= undoStack.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setDesign(undoStack[nextIndex]);
    setDirty(true);
  };

  const resetPage = () => {
    const next = structuredClone(design);
    if (scope === 'all') { next.global = DEFAULT_DESIGN.global; delete next.elements?.global; }
    else {
      delete next.pages[scope];
      delete next.elements?.[scope];
    }
    remember(next);
    setSelected(null);
  };

  const renderField = (field: Field, value: string | number, onChange: (value: string | number) => void) => (
    <label key={field.key} className="ds-field">
      <span>{field.label}</span>
      {field.type === 'color' ? (
        <div className="ds-color-control">
          <input type="color" value={isHex(String(value)) ? String(value) : '#ffffff'} onChange={e => onChange(e.target.value)} />
          <input value={String(value)} onChange={e => onChange(e.target.value)} aria-label={field.label + ' value'} />
        </div>
      ) : field.type === 'select' ? (
        <select value={String(value)} onChange={e => onChange(e.target.value)}>
          {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <div className="ds-number-control">
          <input type="text" inputMode={field.suffix?.includes('%') ? 'decimal' : 'numeric'} value={String(value)} onChange={e => onChange(e.target.value)} />
          {field.suffix && <small>{field.suffix}</small>}
        </div>
      )}
    </label>
  );

  const activeTokenValues = scope === 'all'
    ? design.global
    : { ...design.global, ...(design.pages?.[scope] || {}) };

  return (
    <div className="ds-studio">
      <style jsx global>{`
        .ds-studio{color:#eaf2ff;min-height:calc(100vh - 4rem);font-family:Inter,system-ui,sans-serif}
        .ds-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:4px 0 16px}
        .ds-brand{display:flex;align-items:center;gap:11px}.ds-mark{display:grid;place-items:center;width:38px;height:38px;border:1px solid #3b82f655;border-radius:12px;background:linear-gradient(145deg,#2563eb33,#7c3aed22);color:#93c5fd}
        .ds-kicker{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8ba4c7;font-weight:800}.ds-title{font-size:22px;font-weight:800;letter-spacing:-.04em;color:#f8fafc}.ds-subtitle{font-size:11px;color:#8da0bb;margin-top:2px}
        .ds-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.ds-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid #334155;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:700;color:#dbeafe;background:#0f1b2e}.ds-btn:disabled{opacity:.45;cursor:not-allowed}.ds-btn-primary{background:#2563eb;border-color:#3b82f6;color:white}.ds-btn-publish{background:#059669;border-color:#10b981;color:white}
        .ds-status{font-size:10px;color:#9fb1c9;display:flex;align-items:center;gap:6px;margin-right:5px}.ds-dot{width:6px;height:6px;border-radius:50%;background:${dirty?'#f59e0b':'#34d399'}}
        .ds-shell{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100vh - 150px);border:1px solid #26364b;border-radius:16px;overflow:hidden;background:#091321;box-shadow:0 22px 60px #02061766}
        .ds-sidebar{background:#0b1727;border-right:1px solid #26364b;display:flex;flex-direction:column;min-width:0}
        .ds-tabs{display:grid;grid-template-columns:repeat(2,1fr);padding:10px;gap:5px;border-bottom:1px solid #26364b}
        .ds-tab{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 5px;border-radius:8px;color:#91a4bf;font-size:10px;font-weight:700}.ds-tab.active{background:#1e3a5f;color:#bfdbfe}
        .ds-side-content{padding:13px;overflow:auto;max-height:calc(100vh - 230px)}.ds-section-title{font-size:9px;font-weight:800;letter-spacing:.16em;color:#7186a4;text-transform:uppercase;margin:4px 0 10px}
        .ds-page{width:100%;text-align:left;padding:10px;border-radius:9px;margin:3px 0;border:1px solid transparent;color:#b6c4d8}.ds-page strong{display:block;font-size:11px}.ds-page small{display:block;font-size:9px;color:#7186a4;margin-top:3px}.ds-page.active{background:#142b46;border-color:#2e5b8b;color:#eff6ff}
        .ds-preview-wrap{min-width:0;display:flex;flex-direction:column;background:#101b2c}.ds-toolbar{height:47px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid #26364b;gap:10px}.ds-toolbar-label{font-size:10px;color:#b8c8de;display:flex;align-items:center;gap:7px}.ds-device{display:flex;gap:3px;padding:3px;background:#091321;border:1px solid #2b3c52;border-radius:8px}.ds-device button{padding:6px 9px;border-radius:5px;color:#8294ad}.ds-device button.active{background:#29486d;color:white}
        .ds-canvas{background:#dce5ee;min-height:650px;flex:1;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:18px}.ds-frame{height:calc(100vh - 250px);min-height:650px;border:0;background:white;box-shadow:0 12px 40px #02061755;transition:width .2s;max-width:100%}
        .ds-hint{display:flex;align-items:center;gap:8px;padding:9px 13px;background:#10223a;border-top:1px solid #26364b;color:#91a4bf;font-size:10px}
        .ds-inspector{padding:14px;overflow:auto;max-height:calc(100vh - 230px)}.ds-field{display:block;margin:0 0 13px}.ds-field>span{display:block;font-size:10px;color:#aebdd1;margin-bottom:6px}.ds-field input,.ds-field select{width:100%;min-width:0;background:#101e31;color:#e5edf8;border:1px solid #30435b;border-radius:7px;padding:8px;font-size:11px;outline:none}.ds-field input:focus,.ds-field select:focus{border-color:#60a5fa}.ds-color-control{display:flex;gap:6px}.ds-color-control input[type=color]{width:35px;height:34px;padding:3px}.ds-number-control{display:flex;align-items:center;gap:7px}.ds-number-control small{white-space:nowrap;font-size:9px;color:#7186a4}.ds-number-control input{flex:1}
        .ds-selected{padding:10px;background:#12243b;border:1px solid #294565;border-radius:9px;margin-bottom:14px}.ds-selected strong{font-size:11px;display:block;color:#dbeafe;overflow-wrap:anywhere}.ds-selected code{font-size:9px;color:#82b7ef;display:block;margin-top:5px;overflow-wrap:anywhere}
        .ds-muted{font-size:10px;line-height:1.6;color:#7e91aa}.ds-empty{padding:22px 10px;text-align:center;color:#8294ad;font-size:10px;line-height:1.7;border:1px dashed #34465e;border-radius:10px}
        .ds-revision{padding:10px 0;border-bottom:1px solid #26364b}.ds-revision strong{font-size:10px;display:block}.ds-revision small{font-size:9px;color:#7186a4;display:block;margin:4px 0 8px}
        .ds-reset{width:100%;margin-top:10px}.ds-subhead{display:flex;align-items:center;justify-content:space-between;margin:17px 0 10px}
        @media(max-width:950px){.ds-shell{grid-template-columns:190px minmax(0,1fr)}.ds-frame{height:680px}}
        @media(max-width:680px){.ds-studio{min-height:0}.ds-shell{grid-template-columns:1fr;min-height:0}.ds-sidebar{border-right:0;border-bottom:1px solid #26364b}.ds-tabs{grid-template-columns:repeat(4,1fr)}.ds-side-content,.ds-inspector{max-height:360px}.ds-canvas{min-height:570px;padding:8px}.ds-frame{height:620px}.ds-title{font-size:18px}.ds-actions{width:100%}.ds-status{width:100%}}
      `}</style>

      <header className="ds-top">
        <div className="ds-brand">
          <div className="ds-mark"><WandSparkles size={19}/></div>
          <div><div className="ds-kicker">Bento · Native editor</div><div className="ds-title">Visual Design Studio</div><div className="ds-subtitle">Select any element in the live preview to customise it</div></div>
        </div>
        <div className="ds-actions">
          <span className="ds-status"><i className="ds-dot"/>{dirty ? 'Unsaved changes' : status}</span>
          <button className="ds-btn" onClick={undo} disabled={historyIndex <= 0}><Undo2 size={13}/>Undo</button>
          <button className="ds-btn" onClick={redo} disabled={historyIndex >= undoStack.length - 1}><Redo2 size={13}/>Redo</button>
          <button className="ds-btn" onClick={resetPage}><RotateCcw size={13}/>Reset</button>
          <button className="ds-btn ds-btn-primary" onClick={() => save(false)} disabled={busy}><Save size={13}/>Save draft</button>
          <button className="ds-btn ds-btn-publish" onClick={() => save(true)} disabled={busy}><Globe size={13}/>Publish</button>
        </div>
      </header>

      <div className="ds-shell">
        <aside className="ds-sidebar">
          <div className="ds-tabs">
            <button className={panel === 'pages' ? 'ds-tab active' : 'ds-tab'} onClick={() => setPanel('pages')}><Layers3 size={13}/>Pages</button>
            <button className={panel === 'design' ? 'ds-tab active' : 'ds-tab'} onClick={() => setPanel('design')}><Palette size={13}/>Design</button>
            <button className={panel === 'inspector' ? 'ds-tab active' : 'ds-tab'} onClick={() => setPanel('inspector')}><Activity size={13}/>Inspect</button>
            <button className={panel === 'history' ? 'ds-tab active' : 'ds-tab'} onClick={() => setPanel('history')}><Clock3 size={13}/>History</button>
          </div>

          {panel === 'pages' && <div className="ds-side-content">
            <div className="ds-section-title">Bento app pages</div>
            {pages.map(page => <button key={page.id} className={scope === page.id ? 'ds-page active' : 'ds-page'} onClick={() => { setScope(page.id); setSelected(null); }}>
              <strong>{page.label}</strong><small>{page.description}</small>
            </button>)}
            <button className="ds-page" onClick={() => { setScope('all'); setPanel('design'); }}><strong>Global design system</strong><small>Tokens shared across every page</small></button>
            <p className="ds-muted" style={{marginTop:14}}>Choose a page, then click directly on an element in its live preview. Your changes are scoped to that page unless you edit global tokens.</p>
          </div>}

          {panel === 'design' && <div className="ds-side-content">
            <div className="ds-section-title">{scope === 'all' ? 'Global design tokens' : activePage.label + ' overrides'}</div>
            {globalFields.map(field => renderField(field, (activeTokenValues as any)[field.key], value => updateGlobal(field.key as keyof DesignValues, field.key === 'radius' || field.key === 'spacing' ? Number(value) : value)))}
            <button className="ds-btn ds-reset" onClick={resetPage}><RotateCcw size={12}/>Reset {scope === 'all' ? 'global tokens' : 'this page'}</button>
            <p className="ds-muted" style={{marginTop:12}}>Page-level token values override global tokens. Published values are loaded by Bento pages for all visitors.</p>
          </div>}

          {panel === 'inspector' && <div className="ds-inspector">
            {selected ? <>
              <div className="ds-selected"><strong>{selected.label || selected.tag}</strong><code>{selected.tag} · {selected.selector}</code></div>
              <div className="ds-section-title">Element appearance</div>
              {styleFields.map(field => {
                const current = (selectedStyles[field.key] ?? selected.styles[field.key] ?? (field.key === 'borderWidth' ? '0px' : field.key === 'gap' ? '0px' : field.key === 'opacity' ? '1' : ''));
                return <div key={field.key} style={{position:'relative'}}>
                  {renderField(field, current, value => updateElement(field.key, String(value)))}
                  {selectedStyles[field.key] !== undefined && <button title="Reset this property" onClick={() => clearElementStyle(field.key)} style={{position:'absolute',right:0,top:0,fontSize:9,color:'#93c5fd'}}>Reset</button>}
                </div>;
              })}
              <p className="ds-muted">Changes preview instantly. Use the reset action beside a field to return that property to Bento’s original style.</p>
            </> : <div className="ds-empty"><MousePointer2 size={22} style={{margin:'0 auto 10px'}}/><strong>No element selected</strong><br/>Click a button, card, heading, container or other element inside the preview to open its controls.</div>}
          </div>}

          {panel === 'history' && <div className="ds-side-content">
            <div className="ds-section-title">Saved revisions</div>
            {!revisions.length && <div className="ds-empty">No saved revisions yet. Save a draft or publish to create a revision.</div>}
            {revisions.map(revision => <div className="ds-revision" key={revision.id}>
              <strong>{revision.note || 'Design revision'}</strong>
              <small>{new Date(revision.created_at).toLocaleString()}</small>
              <button className="ds-btn" onClick={() => restore(revision)}><RotateCcw size={11}/>Restore draft</button>
            </div>)}
          </div>}
        </aside>

        <section className="ds-preview-wrap">
          <div className="ds-toolbar">
            <div className="ds-toolbar-label"><Eye size={14}/>Live page preview <ChevronRight size={12}/><strong>{activePage.label}</strong></div>
            <div className="ds-device">
              <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={14}/></button>
              <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} title="Tablet"><Tablet size={14}/></button>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={14}/></button>
            </div>
          </div>
          <div className="ds-canvas">
            <iframe
              ref={frame}
              key={activePage.path}
              src={activePage.path}
              title={activePage.label + ' live editor preview'}
              className="ds-frame"
              style={{ width: device === 'mobile' ? 390 : device === 'tablet' ? 768 : '100%' }}
              onLoad={sendPreview}
            />
          </div>
          <div className="ds-hint"><MousePointer2 size={13}/><span>Editor mode is on · Click an element to select it · Preview changes are not public until you publish</span></div>
        </section>
      </div>
    </div>
  );
}
