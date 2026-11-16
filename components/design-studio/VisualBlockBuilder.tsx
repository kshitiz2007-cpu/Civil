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
  ...['home.topbar|Login top bar','home.institutional-overview|Institutional overview','home.institutional-badge|Institution badge','home.hero-title|Hero title','home.hero-description|Hero description','home.feature-grid|Feature grid','home.feature-ev|Expected value feature','home.feature-deduction|Statement deduction feature','home.feature-themes|Theme feature','home.login-card|Sign-in card','home.login-brand|Sign-in brand','home.login-heading|Sign-in heading','home.login-actions|Portal actions','home.login-assurances|Sign-in assurances','home.footer|Page footer'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Login page'};}),
 ],
 dashboard: [
  ...['dashboard.sidebar|Desktop navigation','dashboard.header|Dashboard header','dashboard.broadcast-notice|Academic notice','dashboard.hero|Hero overview','dashboard.hero-metric|Hero metric','dashboard.stats|Statistics strip','dashboard.stat-tests|Tests statistic','dashboard.stat-mean|Mean score statistic','dashboard.stat-papers|Active papers statistic','dashboard.stat-resources|Resources statistic','dashboard.practice|Recommended practice','dashboard.practice-card|Practice paper card','dashboard.analytics|Performance analytics','dashboard.analytics-layout|Analytics layout','dashboard.mobile-navigation|Mobile navigation'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Dashboard'};}),
 ],
 quiz: [
  ...['quiz.toolbar|Quiz toolbar','quiz.question-workspace|Question workspace','quiz.question-telemetry|Question telemetry','quiz.question-and-options|Question card','quiz.answer-option|Individual answer option','quiz.bottom-navigation|Question navigation','quiz.question-palette|Question palette','quiz.palette-item|Palette item','quiz.result.toolbar|Result toolbar','quiz.result.scorecard|Result scorecard','quiz.result.solution-review|Solution review','quiz.result.answer-card|Result answer card'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Quiz player / result'};}),
 ],
 quizzes: [
  ...['quizzes.page|Quiz catalogue canvas','quizzes.header|Catalogue header','quizzes.subject-browser|Subject browser','quizzes.subject-card|Subject tile','quizzes.paper-browser|Paper browser','quizzes.paper-card|Individual paper card'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Quiz catalogue'};}),
 ],
 resources: [
  ...['resources.sidebar|Library navigation','resources.header|Resources header','resources.subject-browser|Subject browser','resources.subject-card|Subject tile','resources.material-browser|Material browser','resources.material-card|Resource card'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Resources'};}),
 ],
 history: [
  ...['history.page|Attempt history canvas','history.sidebar|History navigation','history.header|History header','history.attempt-list|Attempt list','history.attempt-card|Individual attempt'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'History'};}),
 ],
 leaderboard: [
  ...['leaderboard.page|Leaderboard canvas','leaderboard.header|Leaderboard header','leaderboard.rankings|Rankings list','leaderboard.rank-card|Individual rank card'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Leaderboard'};}),
 ],
 admin: [
  ...['admin.sidebar|Admin navigation','admin.main-content|Admin workspace','admin.design-studio|Visual Designer','admin.overview|Command center','admin.inbox|Mentor inbox','admin.quizzes|Quiz manager','admin.aigen|AI paper setter','admin.resources|Resource manager','admin.students|Student directory','admin.analytics|Analytics','admin.payments|Payments','admin.csvimport|CSV importer','admin.scheduled.header|Live mock heading','admin.scheduled.form|Live mock form','admin.scheduled.list|Scheduled mocks','admin.overview.header|Overview header','admin.overview.telemetry|Overview telemetry','admin.inbox.composer|Inbox composer','admin.quizzes.header|Quiz manager header','admin.aigen.header|AI builder header','admin.aigen.configuration|AI builder configuration','admin.aigen.output|Generated paper output','admin.resources.header|Resource manager header','admin.resources.publish-form|Resource publish form','admin.students.header|Student directory header','admin.analytics.dashboard|Analytics dashboard','admin.payments.header|Payments header','admin.csv.header|CSV importer header','admin.csv.workspace|CSV import workspace'].map(v=>{const [id,label]=v.split('|');return {id,label,group:'Admin console'};}),
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
