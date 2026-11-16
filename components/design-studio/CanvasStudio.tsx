'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as ts from 'typescript';
import { Code2, Eye, Layers3, Monitor, Plus, Smartphone, Tablet, Trash2, Undo2, Redo2, Download, Sparkles, MousePointer2, PanelLeftClose, PanelRightClose } from 'lucide-react';

type NodeKind = 'section'|'heading'|'text'|'button'|'card'|'image'|'grid'|'input'|'navbar';
type DesignNode = { id:string; kind:NodeKind; name:string; text:string; styles:Record<string,string>; children?:DesignNode[] };
type Device = 'desktop'|'tablet'|'mobile';
const STORAGE_KEY='civil-canvas-studio-v1';
const uid=()=> 'node-'+Math.random().toString(36).slice(2,9);
const makeNode=(kind:NodeKind):DesignNode=>({
 id:uid(),kind,name:kind[0].toUpperCase()+kind.slice(1),
 text:({section:'New section',heading:'Build something remarkable',text:'A short description that explains the value of this section.',button:'Get started',card:'Feature card',image:'Image placeholder',grid:'Explore what is possible',input:'Your email address',navbar:'Your brand'} as Record<NodeKind,string>)[kind],
 styles: kind==='section'?{padding:'64px 28px',background:'#0b1220',color:'#f8fafc',borderRadius:'24px',minHeight:'180px'}:
 kind==='heading'?{fontSize:'42px',fontWeight:'800',lineHeight:'1.1',margin:'0 0 16px',color:'inherit'}:
 kind==='text'?{fontSize:'16px',lineHeight:'1.7',opacity:'0.78',margin:'0 0 20px'}:
 kind==='button'?{display:'inline-block',padding:'13px 22px',borderRadius:'999px',background:'#8b5cf6',color:'#ffffff',fontWeight:'700',border:'0',cursor:'pointer'}:
 kind==='card'?{padding:'24px',borderRadius:'20px',background:'#182235',border:'1px solid #334155',color:'#f8fafc',minHeight:'140px'}:
 kind==='grid'?{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'16px',padding:'24px',background:'transparent'}:
 kind==='image'?{width:'100%',height:'220px',objectFit:'cover',borderRadius:'18px',background:'#263449'}:
 kind==='input'?{padding:'12px 16px',borderRadius:'12px',background:'#111827',border:'1px solid #475569',color:'#fff',width:'100%'}:
 kind==='navbar'?{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 28px',background:'#111827',color:'#fff'}:{}
});
const STARTER:DesignNode[]=[
 {...makeNode('navbar'),text:'CIVIL STUDIO'},
 {...makeNode('section'),name:'Hero section',children:[makeNode('heading'),makeNode('text'),makeNode('button')]},
 {...makeNode('grid'),children:[{...makeNode('card'),text:'Design system'},{...makeNode('card'),text:'Responsive layouts'},{...makeNode('card'),text:'Live code preview'}]}
];

const TAG_KIND:Record<string,NodeKind>={section:'section',nav:'navbar',h1:'heading',h2:'heading',h3:'heading',p:'text',button:'button',article:'card',img:'image',input:'input',textarea:'input',div:'section'};
function parseCssRules(css:string){
 const rules:Record<string,Record<string,string>>={};
 const pattern=/\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g;let match:RegExpExecArray|null;
 while((match=pattern.exec(css))){const styles:Record<string,string>={};match[2].split(';').forEach(pair=>{const i=pair.indexOf(':');if(i<0)return;const key=pair.slice(0,i).trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase());const value=pair.slice(i+1).trim();if(key&&value)styles[key]=value;});rules[match[1]]=styles;}
 return rules;
}
function parseTsxLayers(code:string,css:string):{nodes:DesignNode[];error:string}{
 const source=ts.createSourceFile('CanvasPage.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const diagnostic=(source as ts.SourceFile & {parseDiagnostics?:ts.Diagnostic[]}).parseDiagnostics?.[0];
 if(diagnostic)return {nodes:[],error:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')};
 const rules=parseCssRules(css);let root:ts.JsxElement|undefined;
 const visit=(node:ts.Node)=>{if(ts.isJsxElement(node)){if(!root&&node.openingElement.tagName.getText(source)==='div'&&node.getText(source).includes('canvas-root'))root=node;}ts.forEachChild(node,visit);};
 visit(source);
 if(!root)return {nodes:[],error:'Visual sync supports a component that returns one root JSX element with standard HTML elements.'};
 const read=(el:ts.JsxElement|ts.JsxSelfClosingElement):DesignNode|null=>{
  const opening=ts.isJsxElement(el)?el.openingElement:el;
  const tag=opening.tagName.getText(source).toLowerCase();
  const classAttr=opening.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)==='className') as ts.JsxAttribute|undefined;
  const className=classAttr?.initializer&&ts.isStringLiteral(classAttr.initializer)?classAttr.initializer.text:'';
  const kind=tag==='div'&&rules[className]?.display==='grid'?'grid':TAG_KIND[tag];
  if(!kind)return null;
  const idMatch=className.match(/node-([a-zA-Z0-9_-]+)/);
  const id=idMatch?'node-'+idMatch[1]:uid();
  const styles={...(rules[className]||{})};
  const textParts:string[]=[];const children:DesignNode[]=[];
  if(ts.isJsxElement(el)){
   for(const child of el.children){
    if(ts.isJsxText(child)){const value=child.getText(source).replace(/\s+/g,' ').trim();if(value)textParts.push(value);}
    else if(ts.isJsxElement(child)||ts.isJsxSelfClosingElement(child)){
     const childTag=(ts.isJsxElement(child)?child.openingElement:child).tagName.getText(source).toLowerCase();
     if(['strong','b','span','em'].includes(childTag)){if(ts.isJsxElement(child))textParts.push(child.children.map(c=>ts.isJsxText(c)?c.getText(source).trim():'').join(''));}
     else {const parsed=read(child);if(parsed)children.push(parsed);}
    }else if(ts.isJsxExpression(child)&&child.expression)return null;
   }
  }
  const attrText=(name:string)=>{const a=opening.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)===name) as ts.JsxAttribute|undefined;return a?.initializer&&ts.isStringLiteral(a.initializer)?a.initializer.text:'';};
  const content=kind==='image'?attrText('alt'):kind==='input'?attrText('placeholder'):textParts.join(' ')||({section:'Section',heading:'Heading',text:'Text',button:'Button',card:'Card',grid:'Grid',navbar:'Navigation'} as Record<string,string>)[kind]||kind;
  return {id,kind,name:kind[0].toUpperCase()+kind.slice(1),text:children.length?content:(textParts.join(' ')||content),styles,children:children.length?children:undefined};
 };
 const parsed=root.children.filter((n):n is ts.JsxElement|ts.JsxSelfClosingElement=>ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)).map(read).filter((n):n is DesignNode=>Boolean(n));
 if(!parsed.length&&root.children.some(n=>ts.isJsxExpression(n)))return {nodes:[],error:'Custom expressions and React components cannot be converted into visual layers yet. The code preview remains available; use supported HTML elements for two-way visual sync.'};
 return {nodes:parsed,error:''};
}

const esc=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cssText=(styles:Record<string,string>)=>Object.entries(styles).map(([k,v])=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v).join(';');
function nodeToJsx(node:DesignNode,depth=0):string{
 const pad='  '.repeat(depth),attrs='className="node-'+node.id+'"';
 const children=(node.children||[]).map(child=>nodeToJsx(child,depth+1)).join('\n');
 if(node.kind==='image')return pad+'<img '+attrs+' alt='+JSON.stringify(node.text)+' src="https://placehold.co/1200x600/182235/ffffff?text=Your+Image" />';
 if(node.kind==='input')return pad+'<input '+attrs+' placeholder='+JSON.stringify(node.text)+' />';
 if(node.kind==='button')return pad+'<button '+attrs+'>'+esc(node.text)+'</button>';
 if(node.kind==='heading')return pad+'<h1 '+attrs+'>'+esc(node.text)+'</h1>';
 if(node.kind==='text')return pad+'<p '+attrs+'>'+esc(node.text)+'</p>';
 const tag=node.kind==='navbar'?'nav':node.kind==='grid'?'div':node.kind==='card'?'article':'section';
 return pad+'<'+tag+' '+attrs+'>'+ (node.kind==='navbar'?'<strong>'+esc(node.text)+'</strong>':esc(node.text))+(children?'\n'+children+'\n'+pad:'')+'</'+tag+'>';
}
function buildDocument(compiled:string,css:string){
 const safeCode=JSON.stringify(compiled).replace(/</g,'\\u003c');
 const safeCss=css.replace(/<\/style/gi,'<\\/style');
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: https:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\' \'unsafe-eval\'; connect-src \'none\'; font-src data: https:"><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,system-ui,sans-serif}body{background:#0b1020;color:#f8fafc;padding:18px}.canvas-root{max-width:1200px;margin:0 auto}.canvas-root>*{margin-bottom:16px}'+safeCss+'</style></head><body><div id="root" class="canvas-root"></div><script>try{const code='+safeCode+';const h=(tag,props,...children)=>{if(typeof tag==="function")return tag({...props,children});const el=document.createElement(tag);for(const [key,value] of Object.entries(props||{})){if(key==="children"||key==="key"||value==null)continue;if(key==="className")el.className=value;else if(key==="style"&&typeof value==="object")Object.assign(el.style,value);else if(key.startsWith("on")&&typeof value==="function")el.addEventListener(key.slice(2).toLowerCase(),value);else if(key==="dangerouslySetInnerHTML")el.innerHTML=value.__html;else if(key in el)try{el[key]=value}catch{el.setAttribute(key,String(value))}else el.setAttribute(key,String(value))}for(const child of children.flat(Infinity)){if(child==null||child===false)continue;el.appendChild(child instanceof Node?child:document.createTextNode(String(child)))}return el};const App=new Function("h",code+";return App;")(h);const root=App();document.getElementById("root").appendChild(root instanceof Node?root:document.createTextNode(String(root)));}catch(e){document.getElementById("root").innerHTML="<pre style=\'white-space:pre-wrap;color:#fda4af;background:#2a1420;padding:16px;border-radius:12px\'>Preview runtime error: "+String(e).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))+"</pre>"}</script></body></html>';
}
export default function CanvasStudio(){
 const [nodes,setNodes]=useState<DesignNode[]>([]);
 const [pages,setPages]=useState<Record<string,DesignNode[]>>({home:[]});
 const [activePage,setActivePage]=useState('home');
 const [newPageName,setNewPageName]=useState('');
 const [syncError,setSyncError]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [device,setDevice]=useState<Device>('desktop');
 const [mode,setMode]=useState<'design'|'code'>('design');
 const [leftOpen,setLeftOpen]=useState(true),[rightOpen,setRightOpen]=useState(true);
 const [jsx,setJsx]=useState(''),[css,setCss]=useState('');
 const [history,setHistory]=useState<DesignNode[][]>([]),[future,setFuture]=useState<DesignNode[][]>([]);
 const [preview,setPreview]=useState(true);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const saved=JSON.parse(raw);if(Array.isArray(saved)){setNodes(saved);setPages({home:saved});}else if(saved&&typeof saved==='object'&&saved.pages){const restored=saved.pages as Record<string,DesignNode[]>;const active=typeof saved.activePage==='string'&&restored[saved.activePage]?saved.activePage:Object.keys(restored)[0]||'home';setPages(restored);setActivePage(active);setNodes(restored[active]||[]);}}}catch{}finally{setLoaded(true);}},[]);
 useEffect(()=>{if(loaded){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({pages:{...pages,[activePage]:nodes},activePage}));}catch{}}},[nodes,pages,activePage,loaded]);
 const selectedNode=useMemo(()=>{const walk=(list:DesignNode[]):DesignNode|undefined=>{for(const n of list){if(n.id===selected)return n;const found=walk(n.children||[]);if(found)return found;}return undefined;};return walk(nodes);},[nodes,selected]);
 const generatedJsx=useMemo(()=> 'const App = () => (\n<div className="canvas-root">\n'+nodes.map(n=>nodeToJsx(n,1)).join('\n')+'\n</div>\n);', [nodes]);
 const generatedCss=useMemo(()=>nodes.map(n=>'.node-'+n.id+'{'+cssText(n.styles)+'}').join('\n'),[nodes]);
 useEffect(()=>{if(mode==='design'){setJsx(generatedJsx);setCss(generatedCss);}},[generatedJsx,generatedCss,mode]);
 const compiledResult=useMemo(()=>{try{const result=ts.transpileModule(jsx,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React,jsxFactory:'h',jsxFragmentFactory:'h.Fragment',strict:false}});const diagnostic=result.diagnostics?.find(d=>d.category===ts.DiagnosticCategory.Error);return {code:diagnostic?'':result.outputText,error:diagnostic?ts.flattenDiagnosticMessageText(diagnostic.messageText,' ') :''};}catch(e){return {code:'',error:e instanceof Error?e.message:'Unable to compile TSX'};}},[jsx]);
 const compiled=compiledResult.code,codeError=compiledResult.error;
 useEffect(()=>{if(frame.current&&preview)frame.current.srcdoc=compiled?buildDocument(compiled,css):buildDocument('const App = () => { throw new Error('+JSON.stringify(codeError||'Fix the TSX compile error to continue')+'); };','');},[compiled,css,preview,codeError]);
 const commit=(next:DesignNode[])=>{setHistory(h=>[...h.slice(-29),nodes]);setFuture([]);setNodes(next);setPages(p=>({...p,[activePage]:next}));};
 const getCurrentPageNodes=()=>{if(mode!=='code')return nodes;const parsed=parseTsxLayers(jsx,css);if(parsed.error){setSyncError(parsed.error);return null;}return parsed.nodes;};
 const switchPage=(id:string)=>{if(!id||id===activePage)return;const current=getCurrentPageNodes();if(!current)return;setPages(p=>({...p,[activePage]:current}));setNodes(pages[id]||[]);setActivePage(id);setSelected(null);setHistory([]);setFuture([]);setSyncError('');setMode('design');};
 const addPage=()=>{const current=getCurrentPageNodes();if(!current)return;const id=(newPageName.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'page')+'-'+Date.now().toString(36);setPages(p=>({...p,[activePage]:current,[id]:[]}));setNodes([]);setActivePage(id);setNewPageName('');setSelected(null);setHistory([]);setFuture([]);setSyncError('');setMode('design');};
 const deletePage=()=>{if(Object.keys(pages).length<=1)return;const ids=Object.keys(pages).filter(id=>id!==activePage);const next=ids[0];setPages(p=>{const copy={...p};delete copy[activePage];return copy;});setNodes(pages[next]||[]);setActivePage(next);setSelected(null);setHistory([]);setFuture([]);setSyncError('');};
 const updateNode=(id:string,patch:Partial<DesignNode>)=>{const walk=(list:DesignNode[]):DesignNode[]=>list.map(n=>n.id===id?{...n,...patch}: {...n,children:n.children?walk(n.children):undefined});commit(walk(nodes));};
 const insert=(kind:NodeKind,parentId?:string)=>{const n=makeNode(kind);if(parentId){const walk=(list:DesignNode[]):DesignNode[]=>list.map(x=>x.id===parentId?{...x,children:[...(x.children||[]),n]}:{...x,children:x.children?walk(x.children):undefined});commit(walk(nodes));}else commit([...nodes,n]);setSelected(n.id);};
 const remove=(id:string)=>{const walk=(list:DesignNode[]):DesignNode[]=>list.filter(n=>n.id!==id).map(n=>({...n,children:n.children?walk(n.children):undefined}));commit(walk(nodes));setSelected(null);};
 const move=(id:string,delta:number)=>{const index=nodes.findIndex(n=>n.id===id);const to=index+delta;if(index<0||to<0||to>=nodes.length)return;const next=[...nodes];const [n]=next.splice(index,1);next.splice(to,0,n);commit(next);};
 const undo=()=>{if(!history.length)return;setFuture(f=>[nodes,...f]);setNodes(history[history.length-1]);setHistory(h=>h.slice(0,-1));};
 const redo=()=>{if(!future.length)return;setHistory(h=>[...h,nodes]);setNodes(future[0]);setFuture(f=>f.slice(1));};
 const updateStyle=(key:string,value:string)=>{if(!selectedNode)return;updateNode(selectedNode.id,{styles:{...selectedNode.styles,[key]:value}});};
 const download=(name:string,value:string,type:string)=>{const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};
 const exportCode=()=>{download(activePage+'-page.tsx',jsx,'text/plain');download(activePage+'.css',css,'text/css');download('civil-studio-project.json',JSON.stringify({version:1,pages:{...pages,[activePage]:mode==='code'?(parseTsxLayers(jsx,css).nodes||nodes):nodes},activePage},null,2),'application/json');};
 const palette:NodeKind[]=['section','navbar','heading','text','button','card','grid','image','input'];
 const renderNode=(node:DesignNode)=>{const Tag=node.kind==='navbar'?'nav':node.kind==='grid'?'div':node.kind==='card'?'article':node.kind==='heading'?'h1':node.kind==='text'?'p':node.kind==='button'?'button':node.kind==='image'?'div':node.kind==='input'?'div':'section';return <div key={node.id} onClick={e=>{e.stopPropagation();setSelected(node.id);}} className={'relative group cursor-pointer '+(selected===node.id?'outline outline-2 outline-violet-400 outline-offset-2':'hover:outline hover:outline-1 hover:outline-violet-300')} style={{...node.styles,position:'relative'}}>{node.kind==='image'?<div style={{height:node.styles.height||'180px',display:'grid',placeItems:'center',background:'#263449',borderRadius:node.styles.borderRadius||'12px',color:'#cbd5e1'}}>Image / upload asset</div>:node.kind==='input'?<input placeholder={node.text} readOnly style={{...node.styles,pointerEvents:'none'}}/>:node.kind==='button'?<button type="button" style={node.styles}>{node.text}</button>:<Tag style={node.kind==='heading'||node.kind==='text'?node.styles:undefined}>{node.kind==='navbar'?<strong>{node.text}</strong>:node.kind==='grid'?node.text:node.kind==='card'?node.text:node.kind==='section'?node.text:node.text}</Tag>}{node.children?.map(renderNode)}<span className="absolute -top-2 -right-2 hidden group-hover:block rounded bg-violet-500 px-1.5 py-0.5 text-[9px] text-white">{node.name}</span></div>;};
 return <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[#0d1020] text-slate-100">
  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#15182b] px-3 py-3 sm:px-4">
   <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-violet-500/20 text-violet-300"><Sparkles size={17}/></span><div><b className="text-sm">Canvas Studio</b><p className="text-[10px] text-slate-400">Visual builder · live TSX · CSS</p></div></div>
   <div className="flex flex-wrap items-center gap-1"><button onClick={undo} disabled={!history.length} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" title="Undo"><Undo2 size={15}/></button><button onClick={redo} disabled={!future.length} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" title="Redo"><Redo2 size={15}/></button><button onClick={()=>{const parsed=parseTsxLayers(jsx,css);if(parsed.error){setSyncError(parsed.error);return;}setNodes(parsed.nodes);setPages(p=>({...p,[activePage]:parsed.nodes}));setSelected(null);setHistory([]);setFuture([]);setSyncError('');setMode('design');}} className={'rounded-lg px-3 py-2 text-xs '+(mode==='design'?'bg-violet-500 text-white':'bg-white/5 text-slate-300')}><MousePointer2 size={13} className="mr-1 inline"/>Design</button><button onClick={()=>{setMode('code');setSyncError('');}} className={'rounded-lg px-3 py-2 text-xs '+(mode==='code'?'bg-violet-500 text-white':'bg-white/5 text-slate-300')}><Code2 size={13} className="mr-1 inline"/>Code</button><button onClick={exportCode} className="rounded-lg bg-white/5 px-3 py-2 text-xs"><Download size={13} className="mr-1 inline"/>Export</button></div>
  </header>
  <div className="grid min-h-[720px] grid-cols-1 xl:grid-cols-[210px_minmax(0,1fr)_270px]">
   {leftOpen&&<aside className="border-b border-white/10 bg-[#111426] p-3 xl:border-b-0 xl:border-r"><div className="mb-3 flex items-center justify-between"><b className="text-xs">Add elements</b><button onClick={()=>setLeftOpen(false)} className="text-slate-400"><PanelLeftClose size={15}/></button></div><div className="grid grid-cols-2 gap-2">{palette.map(k=><button key={k} onClick={()=>insert(k)} draggable onDragStart={e=>e.dataTransfer.setData('text/studio-node',k)} className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-3 text-left text-[11px] capitalize hover:border-violet-400 hover:bg-violet-500/10"><Plus size={13} className="mb-1 text-violet-300"/>{k}</button>)}</div><div className="mt-5 border-t border-white/10 pt-4"><b className="text-xs">Layers</b><div className="mt-2 space-y-1">{nodes.map((n,i)=><div key={n.id} className={'flex items-center gap-1 rounded-lg p-1 '+(selected===n.id?'bg-violet-500/20':'hover:bg-white/5')}><button onClick={()=>setSelected(n.id)} className="min-w-0 flex-1 truncate px-2 py-1 text-left text-[11px]">{n.name}</button><button onClick={()=>move(n.id,-1)} className="px-1 text-[10px] text-slate-400">↑</button><button onClick={()=>move(n.id,1)} className="px-1 text-[10px] text-slate-400">↓</button></div>)}</div></div></aside>}
   <main className="min-w-0 bg-[#0b1020]">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2"><div className="flex min-w-0 items-center gap-2"><button onClick={()=>setLeftOpen(v=>!v)} className="rounded p-1 text-slate-400"><Layers3 size={15}/></button><select aria-label="Current page" value={activePage} onChange={e=>switchPage(e.target.value)} className="max-w-36 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-200">{Object.keys(pages).map(id=><option key={id} value={id}>{id}</option>)}</select><input value={newPageName} onChange={e=>setNewPageName(e.target.value)} placeholder="New page name" className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white"/><button onClick={addPage} disabled={!newPageName.trim()} className="rounded-lg bg-violet-500/15 px-2 py-1 text-[10px] text-violet-200 disabled:opacity-40"><Plus size={11} className="mr-1 inline"/>Page</button><button onClick={deletePage} disabled={Object.keys(pages).length<=1} className="rounded-lg px-2 py-1 text-[10px] text-rose-300 disabled:opacity-30">Delete</button></div><div className="flex items-center gap-1">{(['desktop','tablet','mobile'] as Device[]).map(d=><button key={d} onClick={()=>setDevice(d)} className={'rounded-lg p-2 '+(device===d?'bg-violet-500/20 text-violet-300':'text-slate-400')} title={d}>{d==='desktop'?<Monitor size={15}/>:d==='tablet'?<Tablet size={15}/>:<Smartphone size={15}/>}</button>)}</div><button onClick={()=>setPreview(v=>!v)} className="rounded-lg bg-white/5 px-2 py-1.5 text-[10px]"><Eye size={12} className="mr-1 inline"/>{preview?'Hide preview':'Show preview'}</button></div>
    {mode==='design'?<div className="min-h-[620px] overflow-auto p-3 sm:p-5" onDragOver={e=>e.preventDefault()} onDrop={e=>{const kind=e.dataTransfer.getData('text/studio-node') as NodeKind;if(palette.includes(kind))insert(kind);}}><div className="mx-auto min-h-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl transition-all" style={{width:device==='mobile'?375:device==='tablet'?768:'100%',maxWidth:'100%'}}><div className="border-b border-white/10 px-4 py-2 text-[10px] text-slate-500">● ● ● &nbsp; Preview canvas · {device}</div><div className="p-4 sm:p-6">{nodes.map(renderNode)}{!nodes.length&&<button onClick={()=>insert('section')} className="grid min-h-[440px] w-full place-items-center rounded-xl border-2 border-dashed border-violet-400/30 text-sm text-violet-300">Drop an element here or click to add your first section</button>}</div></div></div>:<div className="grid min-h-[620px] grid-cols-1 gap-2 p-3"><label className="flex min-h-[300px] flex-col text-xs"><span className="mb-2 flex items-center gap-2 font-bold text-violet-300">TSX / JSX <span className="font-normal text-slate-500">· edit code to update preview</span></span><textarea spellCheck={false} value={jsx} onChange={e=>setJsx(e.target.value)} className="min-h-[300px] flex-1 resize-y rounded-xl border border-white/10 bg-[#070b15] p-3 font-mono text-[11px] leading-5 text-emerald-200 outline-none focus:border-violet-400"/></label><label className="flex min-h-[220px] flex-col text-xs"><span className="mb-2 font-bold text-cyan-300">CSS <span className="font-normal text-slate-500">· live style updates</span></span><textarea spellCheck={false} value={css} onChange={e=>setCss(e.target.value)} className="min-h-[220px] flex-1 resize-y rounded-xl border border-white/10 bg-[#070b15] p-3 font-mono text-[11px] leading-5 text-cyan-100 outline-none focus:border-cyan-400"/></label>{(codeError||syncError)&&<p className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{codeError||syncError}</p>}</div>}
   </main>
   {rightOpen&&<aside className="border-t border-white/10 bg-[#111426] p-3 xl:border-l xl:border-t-0"><div className="mb-3 flex items-center justify-between"><b className="text-xs">Properties</b><button onClick={()=>setRightOpen(false)} className="text-slate-400"><PanelRightClose size={15}/></button></div>{selectedNode?<div className="space-y-3"><label className="block text-[10px] text-slate-400">Layer name<input value={selectedNode.name} onChange={e=>updateNode(selectedNode.id,{name:e.target.value})} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white"/></label><label className="block text-[10px] text-slate-400">Content<textarea value={selectedNode.text} onChange={e=>updateNode(selectedNode.id,{text:e.target.value})} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white"/></label><div className="border-t border-white/10 pt-3"><b className="text-[10px] uppercase tracking-wider text-slate-400">Style controls</b>{[['color','Text colour'],['background','Background'],['fontSize','Font size'],['fontWeight','Font weight'],['padding','Padding'],['margin','Margin'],['borderRadius','Corner radius'],['width','Width'],['minHeight','Min height'],['gap','Gap']].map(([key,label])=><label key={key} className="mt-2 block text-[10px] text-slate-400">{label}<input value={selectedNode.styles[key]||''} onChange={e=>updateStyle(key,key==='fontSize'&&!e.target.value?'':e.target.value)} placeholder="inherit" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white"/></label>)}</div><button onClick={()=>remove(selectedNode.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-xs text-rose-300"><Trash2 size={13}/>Delete element</button><button onClick={()=>selectedNode.children?insert('text',selectedNode.id):insert('text')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500/15 p-2 text-xs text-violet-200"><Plus size={13}/>Add child element</button></div>:<p className="text-xs text-slate-500">Select a layer on the canvas to edit its content and visual properties.</p>}</aside>}
  </div>
  {preview&&<div className="border-t border-white/10 bg-[#111426] p-3"><div className="mb-2 flex items-center justify-between"><b className="text-xs">Live code preview</b><span className="text-[10px] text-slate-500">Sandboxed · {device} target</span></div><div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1020]" style={{height:device==='mobile'?560:480}}><iframe ref={frame} title="Live TSX preview" sandbox="allow-scripts" className="h-full w-full border-0" /></div>{(codeError||syncError)&&<p className="mt-2 text-xs text-rose-300">{codeError||syncError}</p>}</div>}
  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#15182b] px-3 py-2 text-[10px] text-slate-500"><span>GUI edits generate TSX + CSS · code edits recompile into the preview</span><span>{Object.keys(pages).length} pages · {nodes.length} top-level layers · undo / redo enabled</span></footer>
 </div>;
}
