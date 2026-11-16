'use client';

import { useEffect, useMemo, useState } from 'react';
import { GripVertical, Plus, Trash2, ArrowUp, ArrowDown, Save, Layers3 } from 'lucide-react';
import type { StudioConfig, VisualBlock } from './DesignStudioProvider';
import VisualBlockRenderer from './VisualBlockRenderer';

const CATALOG: Omit<VisualBlock, 'id'>[] = [
  { type:'heading', title:'New section heading', effect:'rise' },
  { type:'text', title:'Supporting text', text:'Add a clear explanation for this section.', effect:'fade' },
  { type:'button', title:'Call to action', buttonLabel:'Explore now', href:'/quizzes', variant:'solid', icon:'arrow', effect:'none' },
  { type:'card', title:'Feature card', text:'Describe a feature, resource or key benefit.', icon:'star', effect:'rise' },
  { type:'icon', title:'Icon highlight', text:'', icon:'check', effect:'none' },
  { type:'stat', title:'Performance metric', text:'92%', icon:'chart', effect:'rise' },
  { type:'image', title:'Feature image', src:'', effect:'fade' },
  { type:'divider', title:'Divider', effect:'none' },
];
const SLOT_REGISTRY: Record<string, { id:string; label:string; group:string }[]> = {
 home: [
  {id:'home.topbar',label:'Login top bar',group:'Login page'},{id:'home.institutional-overview',label:'Institutional overview',group:'Login page'},
  {id:'home.hero-title',label:'Hero title',group:'Login page'},{id:'home.hero-description',label:'Hero description',group:'Login page'},
  {id:'home.feature-ev',label:'Expected value feature',group:'Login page'},{id:'home.feature-deduction',label:'Statement deduction feature',group:'Login page'},
  {id:'home.feature-themes',label:'Theme feature',group:'Login page'},{id:'home.login-card',label:'Sign-in card',group:'Login page'},
 ],
 dashboard: [
  {id:'dashboard.sidebar',label:'Desktop navigation',group:'Dashboard'},{id:'dashboard.header',label:'Dashboard header',group:'Dashboard'},
  {id:'dashboard.hero',label:'Hero overview',group:'Dashboard'},{id:'dashboard.stats',label:'Statistics strip',group:'Dashboard'},
  {id:'dashboard.practice',label:'Recommended practice',group:'Dashboard'},{id:'dashboard.analytics',label:'Performance analytics',group:'Dashboard'},
  {id:'dashboard.mobile-navigation',label:'Mobile navigation',group:'Dashboard'},
 ],
 quiz: [
  {id:'quiz.toolbar',label:'Quiz toolbar',group:'Quiz player'},{id:'quiz.question-telemetry',label:'Question telemetry',group:'Quiz player'},
  {id:'quiz.question-workspace',label:'Question workspace',group:'Quiz player'},{id:'quiz.question-and-options',label:'Question and options',group:'Quiz player'},
  {id:'quiz.bottom-navigation',label:'Question navigation',group:'Quiz player'},{id:'quiz.question-palette',label:'Question palette',group:'Quiz player'},
  {id:'quiz.result.toolbar',label:'Result toolbar',group:'Quiz result'},
 ],
 quizzes: [
  {id:'quizzes.page',label:'Quiz catalogue canvas',group:'Quiz catalogue'},{id:'quizzes.header',label:'Catalogue header',group:'Quiz catalogue'},
  {id:'quizzes.subject-browser',label:'Subject browser',group:'Quiz catalogue'},{id:'quizzes.paper-browser',label:'Paper browser',group:'Quiz catalogue'},
 ],
 resources: [
  {id:'resources.sidebar',label:'Library navigation',group:'Resources'},{id:'resources.header',label:'Resources header',group:'Resources'},
  {id:'resources.subject-browser',label:'Subject browser',group:'Resources'},{id:'resources.material-browser',label:'Material browser',group:'Resources'},
 ],
 history: [
  {id:'history.page',label:'Attempt history canvas',group:'History'},{id:'history.sidebar',label:'History navigation',group:'History'},
  {id:'history.header',label:'History header',group:'History'},{id:'history.attempt-list',label:'Attempt list',group:'History'},
 ],
 leaderboard: [
  {id:'leaderboard.page',label:'Leaderboard canvas',group:'Leaderboard'},{id:'leaderboard.header',label:'Leaderboard header',group:'Leaderboard'},
  {id:'leaderboard.rankings',label:'Rankings list',group:'Leaderboard'},
 ],
 admin: [
  {id:'admin.sidebar',label:'Admin navigation',group:'Admin console'},{id:'admin.main-content',label:'Admin workspace',group:'Admin console'},
  {id:'admin.design-studio',label:'Visual Designer',group:'Admin console'},{id:'admin.overview',label:'Command center',group:'Admin console'},
  {id:'admin.inbox',label:'Mentor inbox',group:'Admin console'},{id:'admin.quizzes',label:'Quiz manager',group:'Admin console'},
  {id:'admin.aigen',label:'AI paper setter',group:'Admin console'},{id:'admin.resources',label:'Resource manager',group:'Admin console'},
  {id:'admin.students',label:'Student directory',group:'Admin console'},{id:'admin.analytics',label:'Analytics',group:'Admin console'},
  {id:'admin.payments',label:'Payments',group:'Admin console'},{id:'admin.csvimport',label:'CSV importer',group:'Admin console'},
  {id:'admin.scheduled.header',label:'Live mock heading',group:'Admin console'},{id:'admin.scheduled.form',label:'Live mock form',group:'Admin console'},
  {id:'admin.scheduled.list',label:'Scheduled mocks',group:'Admin console'},
 ],
};
const makeId = () => `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

export default function VisualBlockBuilder({
  page, selectedSlot, config, save,
}: {
  page: string;
  selectedSlot?: string;
  config: StudioConfig;
  save: (next: StudioConfig) => void;
}) {
  const slots = SLOT_REGISTRY[page] || [];
  const [activeSlot,setActiveSlot] = useState(selectedSlot || slots[0]?.id || '');
  const [draggedIndex,setDraggedIndex] = useState<number|null>(null);
  const [draggedBlock,setDraggedBlock] = useState<Omit<VisualBlock,'id'>|null>(null);
  const [editing,setEditing] = useState<string|null>(null);
  useEffect(()=>{setActiveSlot(SLOT_REGISTRY[page]?.[0]?.id || '');setEditing(null);},[page]);
  const slot = selectedSlot || activeSlot;
  const key = `${page}::${slot}`;
  const blocks = config.slotBlocks?.[key] || [];
  const orderedSlots = useMemo(()=>[...slots].sort((a,b)=>(config.slotOrder?.[`${page}::${a.id}`] ?? 0)-(config.slotOrder?.[`${page}::${b.id}`] ?? 0)),[slots,config.slotOrder,page]);

  const saveBlocks = (next:VisualBlock[]) => save({...config,slotBlocks:{...(config.slotBlocks||{}),[key]:next}});
  const addBlock = (template:Omit<VisualBlock,'id'>) => {
    const block:VisualBlock={...template,id:makeId()};
    saveBlocks([...blocks,block]);
    setEditing(block.id);
  };
  const updateBlock = (id:string,patch:Partial<VisualBlock>) => saveBlocks(blocks.map(block=>block.id===id?{...block,...patch}:block));
  const moveBlock = (from:number,to:number) => {
    if(to<0||to>=blocks.length)return;
    const next=[...blocks];const [item]=next.splice(from,1);next.splice(to,0,item);saveBlocks(next);
  };
  const moveSlot = (from:number,to:number) => {
    if(to<0||to>=orderedSlots.length)return;
    const next=[...orderedSlots];const [item]=next.splice(from,1);next.splice(to,0,item);
    const slotOrder={...(config.slotOrder||{})};
    next.forEach((entry,index)=>{slotOrder[`${page}::${entry.id}`]=index+1;});
    save({...config,slotOrder});
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-bold">Visual component builder</h3><p className="mt-1 text-xs text-[var(--app-muted)]">Drag a component into a registered page section. Added blocks render on the actual page and are saved in the draft.</p></div>
      <span className="rounded-lg bg-[var(--app-accent-soft)] px-3 py-2 text-xs font-bold text-[var(--app-accent)]">{blocks.length} blocks in this section</span>
    </div>
    <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="rounded-xl border border-[var(--app-border)] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Component library</p>
          <div className="space-y-2">{CATALOG.map(item=><div key={item.type} draggable onDragStart={event=>{setDraggedBlock(item);event.dataTransfer.setData('text/plain',item.type);event.dataTransfer.effectAllowed='copy';}} onClick={()=>addBlock(item)} className="flex cursor-grab items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 text-xs font-semibold hover:border-[var(--app-accent)]"><Plus size={14} className="text-[var(--app-accent)]"/>{item.type[0].toUpperCase()+item.type.slice(1)}<span className="ml-auto text-[10px] text-[var(--app-muted)]">Drag / add</span></div>)}</div>
        </div>
        <div className="rounded-xl border border-[var(--app-border)] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Registered sections</p>
          {slots.length ? <div className="space-y-1">{orderedSlots.map((entry,index)=><div key={entry.id} className={`flex items-center gap-1 rounded-lg px-2 py-2 ${slot===entry.id?'bg-[var(--app-accent-soft)] text-[var(--app-accent)]':'hover:bg-[var(--app-surface-muted)]'}`}><button onClick={()=>{setActiveSlot(entry.id);setEditing(null);}} className="min-w-0 flex-1 text-left text-xs font-semibold">{entry.label}</button><button title="Move section up" onClick={()=>moveSlot(index,index-1)} className="p-1 text-[var(--app-muted)]"><ArrowUp size={12}/></button><button title="Move section down" onClick={()=>moveSlot(index,index+1)} className="p-1 text-[var(--app-muted)]"><ArrowDown size={12}/></button></div>)}</div> : <p className="text-xs text-[var(--app-muted)]">This page has no registered editable slots yet. Select Dashboard, Quiz, Resources or Home to add blocks.</p>}
        </div>
      </aside>
      <div className="min-w-0 space-y-3">
        <div onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(draggedBlock){addBlock(draggedBlock);setDraggedBlock(null);}}} className="rounded-xl border-2 border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] p-4">
          <div className="mb-3 flex items-center gap-2"><Layers3 size={16} className="text-[var(--app-accent)]"/><div><p className="text-sm font-bold">{slots.find(item=>item.id===slot)?.label || 'Select a section'}</p><p className="text-[10px] text-[var(--app-muted)]">{slot || 'No registered slot selected'}</p></div></div>
          {blocks.length ? <div className="space-y-2">{blocks.map((block,index)=><div key={block.id} draggable onDragStart={()=>setDraggedIndex(index)} onDragOver={event=>event.preventDefault()} onDrop={()=>{if(draggedIndex!==null)moveBlock(draggedIndex,index);setDraggedIndex(null);}} className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3 ${draggedIndex===index?'opacity-40':''}`}>
            <div className="flex items-center gap-2"><GripVertical size={15} className="cursor-grab text-[var(--app-muted)]"/><button onClick={()=>setEditing(editing===block.id?null:block.id)} className="min-w-0 flex-1 text-left text-xs font-bold">{block.type.toUpperCase()} · {block.title}</button><button onClick={()=>moveBlock(index,index-1)} className="p-1 text-[var(--app-muted)]"><ArrowUp size={13}/></button><button onClick={()=>moveBlock(index,index+1)} className="p-1 text-[var(--app-muted)]"><ArrowDown size={13}/></button><button onClick={()=>saveBlocks(blocks.filter(item=>item.id!==block.id))} className="p-1 text-rose-400"><Trash2 size={14}/></button></div>
            {editing===block.id&&<div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] text-[var(--app-muted)]">Title<input value={block.title} onChange={e=>updateBlock(block.id,{title:e.target.value})} className="glass-input mt-1 w-full text-xs"/></label>
              {block.type!=='divider'&&block.type!=='heading'&&<label className="text-[10px] text-[var(--app-muted)]">Text / value<input value={block.text||''} onChange={e=>updateBlock(block.id,{text:e.target.value})} className="glass-input mt-1 w-full text-xs"/></label>}
              {block.type==='button'&&<><label className="text-[10px] text-[var(--app-muted)]">Button label<input value={block.buttonLabel||''} onChange={e=>updateBlock(block.id,{buttonLabel:e.target.value})} className="glass-input mt-1 w-full text-xs"/></label><label className="text-[10px] text-[var(--app-muted)]">Link URL<input value={block.href||''} onChange={e=>updateBlock(block.id,{href:e.target.value})} className="glass-input mt-1 w-full text-xs"/></label></>}
              {block.type==='image'&&<label className="text-[10px] text-[var(--app-muted)]">Image URL<input value={block.src||''} onChange={e=>updateBlock(block.id,{src:e.target.value})} placeholder="/images/banner.webp or https://…" className="glass-input mt-1 w-full text-xs"/></label>}
              {['card','icon'].includes(block.type)&&<label className="text-[10px] text-[var(--app-muted)]">Hugeicons icon<select value={block.icon||'star'} onChange={e=>updateBlock(block.id,{icon:e.target.value})} className="glass-input mt-1 w-full text-xs">{['star','home','arrow','check','book','chart'].map(icon=><option key={icon}>{icon}</option>)}</select></label>}
              <label className="text-[10px] text-[var(--app-muted)]">Motion effect<select value={block.effect||'none'} onChange={e=>updateBlock(block.id,{effect:e.target.value as VisualBlock['effect']})} className="glass-input mt-1 w-full text-xs">{['none','fade','rise','float','pulse'].map(effect=><option key={effect}>{effect}</option>)}</select></label>
              <label className="text-[10px] text-[var(--app-muted)]">Background CSS<input value={block.styles?.background||''} onChange={e=>updateBlock(block.id,{styles:{...(block.styles||{}),background:e.target.value}})} placeholder="transparent / #10211d / gradient" className="glass-input mt-1 w-full text-xs"/></label>
              <label className="text-[10px] text-[var(--app-muted)]">Text colour<input value={block.styles?.color||''} onChange={e=>updateBlock(block.id,{styles:{...(block.styles||{}),color:e.target.value}})} placeholder="inherit / #ffffff" className="glass-input mt-1 w-full text-xs"/></label>
              <label className="text-[10px] text-[var(--app-muted)]">Corner radius<input value={block.styles?.borderRadius||''} onChange={e=>updateBlock(block.id,{styles:{...(block.styles||{}),borderRadius:e.target.value}})} placeholder="16px" className="glass-input mt-1 w-full text-xs"/></label>
              <label className="text-[10px] text-[var(--app-muted)]">Padding<input value={block.styles?.padding||''} onChange={e=>updateBlock(block.id,{styles:{...(block.styles||{}),padding:e.target.value}})} placeholder="16px" className="glass-input mt-1 w-full text-xs"/></label>
              {block.type==='button'&&<label className="text-[10px] text-[var(--app-muted)]">Button style<select value={block.variant||'solid'} onChange={e=>updateBlock(block.id,{variant:e.target.value as VisualBlock['variant']})} className="glass-input mt-1 w-full text-xs"><option value="solid">Solid</option><option value="outline">Outline</option><option value="soft">Soft</option></select></label>}
              <div className="sm:col-span-2"><p className="mb-1 text-[10px] font-semibold text-[var(--app-muted)]">Live component preview</p><div className="rounded-lg border border-[var(--app-border)] p-2"><VisualBlockRenderer block={block}/></div></div>
            </div>}
          </div>)}</div> : <div className="py-10 text-center text-xs text-[var(--app-muted)]"><Plus className="mx-auto mb-2" size={20}/>Drop a component here, or click a component in the library.</div>}
        </div>
        <p className="text-[10px] leading-relaxed text-[var(--app-muted)]">Section ordering writes a stable order value to registered slot wrappers. It affects sibling sections when their parent uses CSS Grid or Flexbox. Nested page layouts remain constrained by their existing React structure; this editor does not relocate arbitrary React stateful components.</p>
      </div>
    </div>
  </div>;
}
