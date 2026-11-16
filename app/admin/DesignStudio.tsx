'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_DESIGN, type BentoDesign, type DesignValues } from '@/components/DesignSystemProvider';
import { Check, Eye, Globe, Monitor, RotateCcw, Save, Smartphone, Tablet, Palette, SlidersHorizontal } from 'lucide-react';

const pages = [
  {id:'all',label:'Entire app',path:'/dashboard',icon:Globe},
  {id:'login',label:'Login & sign up',path:'/',icon:Monitor},
  {id:'dashboard',label:'Student dashboard',path:'/dashboard',icon:Monitor},
  {id:'quizzes',label:'Quizzes',path:'/quizzes',icon:Monitor},
  {id:'resources',label:'Study resources',path:'/resources',icon:Monitor},
  {id:'history',label:'Results & history',path:'/history',icon:Monitor},
  {id:'leaderboard',label:'Leaderboard',path:'/leaderboard',icon:Monitor},
  {id:'admin',label:'Admin panel',path:'/admin',icon:Monitor},
];
const fields: {key:keyof DesignValues;label:string;type:'color'|'range'|'font';min?:number;max?:number;unit?:string}[] = [
  {key:'background',label:'Page background',type:'color'},
  {key:'surface',label:'Cards & panels',type:'color'},
  {key:'text',label:'Primary text',type:'color'},
  {key:'muted',label:'Muted text',type:'color'},
  {key:'accent',label:'Accent & buttons',type:'color'},
  {key:'border',label:'Borders',type:'color'},
  {key:'font',label:'Typography',type:'font'},
  {key:'radius',label:'Corner radius',type:'range',min:0,max:36,unit:'px'},
  {key:'spacing',label:'Layout spacing',type:'range',min:8,max:48,unit:'px'},
];
const fonts=['DM Sans','Manrope','Inter','Arial','Georgia','system-ui'];
export default function DesignStudio(){
  const [design,setDesign]=useState<BentoDesign>(DEFAULT_DESIGN);
  const [scope,setScope]=useState('all');
  const [dirty,setDirty]=useState(false);
  const [status,setStatus]=useState('Loading published design');
  const [device,setDevice]=useState('desktop');
  const frame=useRef<HTMLIFrameElement>(null);
  const selected=useMemo(()=>scope==='all'?design.global:{...design.global,...(design.pages[scope]||{})},[design,scope]);
  useEffect(()=>{let active=true;(async()=>{try{const {data,error}=await supabase.from('bento_design_settings').select('draft,published').eq('id','global').maybeSingle();if(error)throw error;if(active&&data){const value=(data.draft||data.published) as BentoDesign;if(value?.global)setDesign(value);}if(active)setStatus('Connected to Bento design settings');}catch{if(active)setStatus('Setup required: apply the included Supabase migration');}})();return()=>{active=false}},[]);
  useEffect(()=>{const send=()=>frame.current?.contentWindow?.postMessage({type:'BENTO_DESIGN_PREVIEW',design},window.location.origin);send();},[design,scope]);
  const update=(key:keyof DesignValues,value:string|number)=>{setDesign(current=>{if(scope==='all')return {...current,global:{...current.global,[key]:value}};return {...current,pages:{...current.pages,[scope]:{...(current.pages[scope]||{}),[key]:value}}};});setDirty(true);};
  const reset=()=>{setDesign(current=>scope==='all'?{...current,global:DEFAULT_DESIGN.global}:{...current,pages:{...current.pages,[scope]:{}}});setDirty(true);};
  const save=async(publish:boolean)=>{setStatus(publish?'Publishing live design…':'Saving draft…');try{const {data:auth}=await supabase.auth.getUser();if(!auth.user)throw new Error('Your admin session has expired. Sign in again.');const payload={id:'global',draft:design,published:publish?design:undefined,updated_at:new Date().toISOString(),updated_by:auth.user.id};const {error}=await supabase.from('bento_design_settings').upsert(payload,{onConflict:'id'});if(error)throw error;setDirty(false);setStatus(publish?'Published across Bento':'Draft saved');}catch(error){setStatus(error instanceof Error?error.message:'Could not save design');}};
  const previewPage=pages.find(p=>p.id===scope)||pages[0];
  return <div className="w-full space-y-4 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300/80">Bento native design system</p><h2 className="mt-1 text-2xl font-semibold">Visual Design Studio</h2><p className="mt-1 text-sm text-white/55">Edit the actual Bento interface, preview it live, and publish approved styles for every visitor.</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>reset()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><RotateCcw size={15}/>Reset page</button><button onClick={()=>save(false)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><Save size={15}/>Save draft</button><button onClick={()=>save(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950"><Globe size={15}/>Publish live</button></div></div>
    <div className="grid min-h-[720px] gap-4 xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/45">Editing scope</label><select value={scope} onChange={e=>setScope(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-sm text-white">{pages.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select><p className="mt-2 text-xs leading-5 text-white/40">{scope==='all'?'Changes apply to all supported Bento pages.':'Changes override global design values on this page only.'}</p></div>
        <div className="border-t border-white/10 pt-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Palette size={16} className="text-emerald-300"/>Design controls</div><div className="space-y-4">{fields.map(field=><div key={field.key}><label className="mb-2 flex items-center justify-between text-xs text-white/70"><span>{field.label}</span>{field.type==='range'&&<span className="tabular-nums text-white/45">{selected[field.key]}{field.unit}</span>}</label>{field.type==='color'?<div className="flex items-center gap-2"><input type="color" value={String(selected[field.key])} onChange={e=>update(field.key,e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"/><input value={String(selected[field.key])} onChange={e=>update(field.key,e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs uppercase"/></div>:field.type==='font'?<select value={String(selected.font)} onChange={e=>update('font',e.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">{fonts.map(font=><option key={font}>{font}</option>)}</select>:<input type="range" min={field.min} max={field.max} value={Number(selected[field.key])} onChange={e=>update(field.key,Number(e.target.value))} className="w-full accent-emerald-300"/>}</div>)}</div></div>
        <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><p className="text-xs font-semibold">Publish status</p><p className="mt-1 text-xs leading-5 text-white/50">{status}</p>{dirty&&<span className="mt-2 inline-flex items-center gap-1 text-xs text-amber-200"><SlidersHorizontal size={12}/>Unsaved changes</span>}</div>
      </aside>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><Eye size={15} className="text-emerald-300"/>Live Bento preview <span className="text-xs font-normal text-white/40">· {previewPage.label}</span></div><div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">{[['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]].map(([id,Icon]:any)=><button key={id} onClick={()=>setDevice(id)} className={`rounded-md p-2 ${device===id?'bg-white/15 text-white':'text-white/45'}`} aria-label={id}><Icon size={15}/></button>)}</div></div>
        <div className="min-h-[640px] flex-1 bg-white"><iframe ref={frame} key={previewPage.path} src={previewPage.path} title="Live Bento page preview" onLoad={()=>frame.current?.contentWindow?.postMessage({type:'BENTO_DESIGN_PREVIEW',design},window.location.origin)} className="h-[680px] border-0 transition-[width] duration-200" style={{width:device==='mobile'?'390px':device==='tablet'?'768px':'100%',maxWidth:'100%',marginInline:'auto',display:'block'}} /></div>
      </section>
    </div>
    <p className="text-xs leading-5 text-white/40">The editor changes Bento’s shared design tokens and page-specific overrides. Publishing requires the one-time database migration included with this deployment; no content, student records or quiz data is changed.</p>
  </div>;
}
