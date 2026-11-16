'use client';

import { useRef, useState } from 'react';
import {
  Palette, Layers3, Component, ImagePlus, Monitor, Tablet, Smartphone,
  RotateCcw, Plus, Trash2, GripVertical, Eye, Upload, SlidersHorizontal,
} from 'lucide-react';
import { DEFAULT_STUDIO, StudioBreakpoint, useDesignStudio } from '@/components/design-studio/DesignStudioProvider';
import { supabase } from '@/lib/supabaseClient';

type Panel = 'global' | 'pages' | 'structure' | 'components' | 'assets';
const PAGE_OPTIONS = [
  ['home','Home page','/'], ['dashboard','Dashboard','/dashboard'], ['quizzes','Quiz catalogue','/quizzes'],
  ['quiz','Quiz runner','/quiz/[id]'], ['history','Attempt history','/history'],
  ['leaderboard','Leaderboard','/leaderboard'], ['resources','Resources','/resources'], ['admin','Admin console','/admin'],
];
const TOKENS = [
  { key:'--app-bg', label:'Application background', type:'color' },
  { key:'--app-panel', label:'Panel surface', type:'text' },
  { key:'--app-panel-strong', label:'Elevated surface', type:'color' },
  { key:'--app-text', label:'Primary text', type:'color' },
  { key:'--app-muted', label:'Muted text', type:'color' },
  { key:'--app-border', label:'Border', type:'text' },
  { key:'--app-accent', label:'Primary accent', type:'color' },
  { key:'--app-accent-strong', label:'Accent strong', type:'color' },
  { key:'--app-accent-soft', label:'Accent tint', type:'text' },
  { key:'--app-secondary', label:'Secondary accent', type:'color' },
  { key:'--studio-radius', label:'Corner radius', type:'text' },
  { key:'--studio-spacing', label:'Base spacing', type:'text' },
  { key:'--studio-content-width', label:'Content max width', type:'text' },
  { key:'--studio-font-scale', label:'Font scale', type:'number' },
];
const STARTER_SECTIONS = ['Announcement banner','Page header','Primary content','Secondary content','Footer'];
const COMPONENT_PRESETS = [
  { id:'studio-button', name:'Button', values:{'background':'var(--app-accent)','color':'#06130f','border-radius':'12px','padding':'10px 16px','font-weight':'700'} },
  { id:'studio-card', name:'Card', values:{'background':'var(--app-panel)','border':'1px solid var(--app-border)','border-radius':'var(--studio-radius)','padding':'20px','box-shadow':'0 12px 32px rgba(0,0,0,.16)'} },
  { id:'studio-input', name:'Input', values:{'background':'var(--app-surface-muted)','color':'var(--app-text)','border':'1px solid var(--app-border)','border-radius':'12px','padding':'10px 12px'} },
];
export default function DesignStudio() {
  const { config, save } = useDesignStudio();
  const [panel,setPanel] = useState<Panel>('global');
  const [page,setPage] = useState('home');
  const [breakpoint,setBreakpoint] = useState<StudioBreakpoint>('desktop');
  const [scope,setScope] = useState<'global'|'page'>('global');
  const [dragIndex,setDragIndex] = useState<number|null>(null);
  const [preview,setPreview] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newSection,setNewSection] = useState('');
  const [componentChoice,setComponentChoice] = useState('studio-button');
  const pageName = PAGE_OPTIONS.find(p=>p[0]===page)?.[1] || page;
  const sections = config.structure[page] || STARTER_SECTIONS;
  const update = (key:string,value:string) => {
    if (panel==='breakpoints') {
      const next={...config, breakpoints:{...config.breakpoints}, pageBreakpoints:{...config.pageBreakpoints}};
      if(scope==='global') next.breakpoints[breakpoint]={...next.breakpoints[breakpoint],[key]:value};
      else next.pageBreakpoints[page]={...(next.pageBreakpoints[page]||{}),[breakpoint]:{...(next.pageBreakpoints[page]?.[breakpoint]||{}),[key]:value}};
      save(next); return;
    }
    if(scope==='global') save({...config,global:{...config.global,[key]:value}});
    else save({...config,pages:{...config.pages,[page]:{...(config.pages[page]||{}),[key]:value}}});
  };
  const updateComponent = (key:string,value:string) => save({...config,components:{...config.components,[componentChoice]:{...(config.components[componentChoice]||{}),[key]:value}}});
  const moveSection=(from:number,to:number)=>{
    if(to<0||to>=sections.length)return;
    const next=[...sections]; const [item]=next.splice(from,1); next.splice(to,0,item);
    save({...config,structure:{...config.structure,[page]:next}});
  };
  const addSection=()=>{if(!newSection.trim())return;save({...config,structure:{...config.structure,[page]:[...sections,newSection.trim()]}});setNewSection('');};
  const addPreset=()=>{
    const preset=COMPONENT_PRESETS.find(x=>x.id===componentChoice);
    if(!preset)return;
    save({...config,components:{...config.components,[preset.id]:config.components[preset.id]||preset.values}});
  };
  const reset=()=>{if(window.confirm('Reset all design tokens, page overrides, components and layout metadata to defaults?'))save(DEFAULT_STUDIO);};
  const upload=async(files:FileList|null)=>{
    if(!files)return;
    const additions=await Promise.all(Array.from(files).map(async file=>{
      const id=crypto.randomUUID();
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
      const path=`studio/${id}-${safeName}`;
      const { error }=await supabase.storage.from('design-assets').upload(path,file,{upsert:false,contentType:file.type});
      if(!error){
        const { data }=supabase.storage.from('design-assets').getPublicUrl(path);
        return {id,name:file.name,type:file.type,data:data.publicUrl,path};
      }
      return await new Promise<{id:string;name:string;type:string;data:string}>((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve({id,name:file.name,type:file.type,data:String(reader.result)});reader.onerror=reject;reader.readAsDataURL(file);
      });
    }));
    save({...config,assets:[...config.assets,...additions]});
  };
  const nav: {id:Panel;label:string;icon:any}[]=[
    {id:'global',label:'Design tokens',icon:Palette},{id:'pages',label:'Page styling',icon:SlidersHorizontal},
    {id:'structure',label:'Page structure',icon:Layers3},{id:'components',label:'Components',icon:Component},
    {id:'assets',label:'Asset library',icon:ImagePlus},
  ];
  const tokenValues = panel==='breakpoints'
    ? (scope==='global'?config.breakpoints[breakpoint]:(config.pageBreakpoints[page]?.[breakpoint]||{}))
    : (scope==='global'?config.global:(config.pages[page]||{}));
  const visibleTokens = panel==='breakpoints' ? TOKENS : TOKENS;
  return <div className="space-y-5 text-[var(--app-text)]">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Admin / Experience architecture</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Design System Studio</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--app-muted)]">One control room for the application’s visual language, page-level overrides, reusable style recipes and responsive design tokens.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>setPreview(v=>!v)} className="theme-control"><Eye size={15}/>{preview?'Hide':'Show'} preview</button>
        <button onClick={reset} className="theme-control"><RotateCcw size={15}/>Reset</button>
      </div>
    </header>
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="theme-surface h-fit rounded-2xl p-2">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Studio workspace</p>
        {nav.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setPanel(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${panel===item.id?'bg-[var(--app-accent-soft)] text-[var(--app-accent)]':'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'}`}><Icon size={17}/>{item.label}</button>;})}
        <div className="mx-2 my-3 border-t border-[var(--app-border)]"/>
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Responsive target</div>
        {(['desktop','tablet','mobile'] as StudioBreakpoint[]).map(bp=><button key={bp} onClick={()=>{setBreakpoint(bp);setPanel('breakpoints');}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${breakpoint===bp&&panel==='breakpoints'?'text-[var(--app-accent)] bg-[var(--app-accent-soft)]':'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'}`}>{bp==='desktop'?<Monitor size={15}/>:bp==='tablet'?<Tablet size={15}/>:<Smartphone size={15}/>} {bp[0].toUpperCase()+bp.slice(1)}<span className="ml-auto text-[10px] opacity-60">{bp==='desktop'?'≥1024':bp==='tablet'?'768–1023':'≤767'}px</span></button>)}
      </aside>
      <main className="min-w-0 space-y-4">
        <section className="theme-surface rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold">{panel==='global'?'Global design tokens':panel==='pages'?'Individual page styling':panel==='breakpoints'? `${breakpoint[0].toUpperCase()+breakpoint.slice(1)} breakpoint overrides`:panel==='structure'?'Structural page editor':panel==='components'?'Reusable component recipes':'Asset management'}</h2>
              <p className="mt-1 text-xs text-[var(--app-muted)]">{panel==='breakpoints'?'Overrides apply only at the selected viewport width.':'Changes save in this browser and are applied live to the application theme.'}</p></div>
            {(panel==='global'||panel==='pages'||panel==='breakpoints')&&<div className="flex gap-1 rounded-xl bg-[var(--app-surface-muted)] p-1"><button onClick={()=>setScope('global')} className={`rounded-lg px-3 py-2 text-xs font-bold ${scope==='global'?'bg-[var(--app-panel-strong)] text-[var(--app-text)]':'text-[var(--app-muted)]'}`}>Global</button><button onClick={()=>setScope('page')} className={`rounded-lg px-3 py-2 text-xs font-bold ${scope==='page'?'bg-[var(--app-panel-strong)] text-[var(--app-text)]':'text-[var(--app-muted)]'}`}>This page</button></div>}
          </div>
          {(panel==='pages'||panel==='structure'||panel==='breakpoints')&&<div className="mt-4 flex flex-wrap items-center gap-2"><label className="text-xs font-semibold text-[var(--app-muted)]">Editing page</label><select value={page} onChange={e=>setPage(e.target.value)} className="glass-input min-w-48 text-xs">{PAGE_OPTIONS.map(p=><option key={p[0]} value={p[0]}>{p[1]} · {p[2]}</option>)}</select>{panel==='breakpoints'&&<span className="rounded-lg bg-[var(--app-accent-soft)] px-2.5 py-2 text-xs font-bold text-[var(--app-accent)]">{breakpoint} only</span>}</div>}
          {(panel==='global'||panel==='pages'||panel==='breakpoints')&&<div className="mt-5 grid gap-3 md:grid-cols-2">
            {visibleTokens.map(token=>{const value=tokenValues[token.key]??(scope==='page'&&panel!=='breakpoints'?'':config.global[token.key]??'');return <label key={token.key} className="block rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <span className="mb-2 flex items-center justify-between text-xs font-semibold">{token.label}<code className="text-[10px] text-[var(--app-muted)]">{token.key}</code></span>
              <div className="flex gap-2">{token.type==='color'&&<input aria-label={`${token.label} color`} type="color" value={/^#[0-9a-f]{6}$/i.test(value)?value:'#34d399'} onChange={e=>update(token.key,e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"/>}<input value={value} type={token.type==='number'?'number':'text'} onChange={e=>update(token.key,e.target.value)} placeholder={scope==='page'?'Inherit global value':'Set value'} className="glass-input min-w-0 flex-1 text-xs"/>{scope==='page'&&value&&<button title="Clear override" onClick={()=>{const next={...config,pages:{...config.pages,[page]:{...(config.pages[page]||{})}}};delete next.pages[page][token.key];save(next);}} className="theme-control"><RotateCcw size={13}/></button>}</div>
            </label>;})}
          </div>}
          {panel==='structure'&&<div className="mt-5 space-y-3">
            <div className="rounded-xl border border-dashed border-[var(--app-border-strong)] p-3 text-xs text-[var(--app-muted)]">Drag sections to reorder the page blueprint. This creates editable layout metadata; connecting arbitrary existing JSX to a fully dynamic renderer requires migrating that page to registered studio blocks.</div>
            {sections.map((section,index)=><div key={`${section}-${index}`} draggable onDragStart={()=>setDragIndex(index)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragIndex!==null)moveSection(dragIndex,index);setDragIndex(null);}} className={`flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 ${dragIndex===index?'opacity-40':''}`}><GripVertical size={17} className="cursor-grab text-[var(--app-muted)]"/><span className="grid size-7 place-items-center rounded-lg bg-[var(--app-accent-soft)] text-xs font-bold text-[var(--app-accent)]">{index+1}</span><span className="flex-1 text-sm font-semibold">{section}</span><button onClick={()=>moveSection(index,index-1)} className="theme-control px-2">↑</button><button onClick={()=>moveSection(index,index+1)} className="theme-control px-2">↓</button><button onClick={()=>save({...config,structure:{...config.structure,[page]:sections.filter((_,i)=>i!==index)}})} className="theme-control px-2 text-rose-400"><Trash2 size={14}/></button></div>)}
            <div className="flex gap-2"><input value={newSection} onChange={e=>setNewSection(e.target.value)} placeholder="New section name…" className="glass-input flex-1 text-sm"/><button onClick={addSection} className="theme-control"><Plus size={15}/>Add section</button></div>
          </div>}
          {panel==='components'&&<div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2"><select value={componentChoice} onChange={e=>setComponentChoice(e.target.value)} className="glass-input min-w-44 text-xs">{COMPONENT_PRESETS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={addPreset} className="theme-control"><Plus size={14}/>Add recipe</button></div>
            <div className="grid gap-3 md:grid-cols-2">{Object.entries(config.components).map(([id,styles])=><div key={id} className="rounded-xl border border-[var(--app-border)] p-3"><div className="mb-2 flex items-center justify-between"><b className="text-sm">{id.replace('studio-','')}</b><button onClick={()=>{const next={...config.components};delete next[id];save({...config,components:next});}} className="text-rose-400"><Trash2 size={14}/></button></div>{Object.entries(styles).map(([key,value])=><label key={key} className="mb-2 block"><span className="text-[10px] text-[var(--app-muted)]">{key}</span><input value={value} onChange={e=>save({...config,components:{...config.components,[id]:{...styles,[key]:e.target.value}}})} className="glass-input mt-1 w-full text-xs"/></label>)}<div className="mt-3"><div className={id} style={styles as React.CSSProperties}>{id==='studio-button'?'Button preview':id==='studio-input'?<input className={id} placeholder="Input preview"/>:'Card component preview'}</div></div></div>)}</div>
            <p className="text-xs text-[var(--app-muted)]">Recipes generate CSS classes (for example <code>.studio-button</code>) that can be assigned to registered components. Existing bespoke JSX needs those classes applied to consume a recipe.</p>
          </div>}
          {panel==='assets'&&<div className="mt-5 space-y-4">
            <div onClick={()=>fileRef.current?.click()} className="cursor-pointer rounded-2xl border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] p-8 text-center"><Upload className="mx-auto mb-2 text-[var(--app-accent)]"/><p className="text-sm font-bold">Upload images, logos and visual assets</p><p className="mt-1 text-xs text-[var(--app-muted)]">Choose files from your device. Stored locally in this browser for this prototype.</p><input ref={fileRef} hidden type="file" multiple accept="image/*,image/svg+xml" onChange={e=>upload(e.target.files)}/></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{config.assets.map(asset=><div key={asset.id} className="overflow-hidden rounded-xl border border-[var(--app-border)]"><div className="grid aspect-square place-items-center bg-[var(--app-surface-muted)]"><img src={asset.data} alt={asset.name} className="max-h-full max-w-full object-contain"/></div><div className="flex items-center gap-2 p-2"><span className="min-w-0 flex-1 truncate text-[10px]">{asset.name}</span><button onClick={async()=>{if(asset.path) await supabase.storage.from('design-assets').remove([asset.path]);save({...config,assets:config.assets.filter(a=>a.id!==asset.id)});}} className="text-rose-400"><Trash2 size={13}/></button></div></div>)}</div>
            {!config.assets.length&&<p className="text-center text-xs text-[var(--app-muted)]">Your asset library is empty.</p>}
          </div>}
        </section>
        {preview&&<section className="theme-surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3"><div className="flex items-center gap-2"><Eye size={15} className="text-[var(--app-accent)]"/><b className="text-xs">Live token preview</b><span className="text-[10px] text-[var(--app-muted)]">{pageName}</span></div><div className="flex gap-1 text-[var(--app-muted)]"><Monitor size={14}/><Tablet size={14}/><Smartphone size={14}/></div></div>
          <div className="p-4 sm:p-6" style={{background:config.pages[page]?.['--app-bg']||config.global['--app-bg'],color:config.pages[page]?.['--app-text']||config.global['--app-text']}}>
            <div className="mx-auto space-y-4" style={{maxWidth:config.global['--studio-content-width']||'1280px'}}>
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest" style={{color:config.global['--app-accent']}}>Gyankunj Civil Services</p><h3 className="text-xl font-extrabold">{pageName} preview</h3></div><span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{background:config.global['--app-accent-soft'],color:config.global['--app-accent']}}>Preview</span></div>
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4" style={{background:config.global['--app-panel'],borderColor:config.global['--app-border'],borderRadius:config.global['--studio-radius']}}><p className="text-xs opacity-70">Surface / Card</p><p className="mt-2 text-lg font-bold">Design tokens</p><p className="text-xs opacity-70">Typography and surface treatment</p></div><div className="rounded-xl border p-4" style={{background:config.global['--app-panel'],borderColor:config.global['--app-border'],borderRadius:config.global['--studio-radius']}}><p className="text-xs opacity-70">Secondary surface</p><p className="mt-2 text-lg font-bold">Reusable blocks</p><p className="text-xs opacity-70">Consistent component language</p></div><div className="rounded-xl border p-4" style={{background:config.global['--app-panel'],borderColor:config.global['--app-border'],borderRadius:config.global['--studio-radius']}}><p className="text-xs opacity-70">Action state</p><button className="mt-3 rounded-lg px-4 py-2 text-xs font-bold" style={{background:config.global['--app-accent'],color:'#06130f'}}>Primary action</button></div></div>
            </div>
          </div>
        </section>}
      </main>
    </div>
  </div>;
}
