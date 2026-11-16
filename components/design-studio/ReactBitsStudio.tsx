'use client';

import { useEffect, useState } from 'react';
import ReactBitBlockRenderer from './ReactBitBlockRenderer';
import type { StudioConfig, VisualBlock } from './DesignStudioProvider';
import { Code2, Copy, ExternalLink, Eye, Save, Sparkles } from 'lucide-react';

type Bit = { id:string; name:string; category:string; description:string; source:string; css:string; dependency:string };
const STARTERS:Bit[] = [
 {id:'blur-text',name:'Blur Text',category:'Text animations',description:'Soft-focus reveal for hero headings.',dependency:'React only',source:'\'use client\';\n\nimport { useEffect, useState } from \'react\';\n\nexport default function BlurText({ text = \'Make your ideas stand out\' }: { text?: string }) {\n  const [visible, setVisible] = useState(false);\n  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);\n  return <h2 className={visible ? \'blur-text is-visible\' : \'blur-text\'}>{text}</h2>;\n}',css:'.blur-text { filter: blur(12px); opacity: 0; transform: translateY(12px); transition: all .8s ease; }\n.blur-text.is-visible { filter: blur(0); opacity: 1; transform: translateY(0); }'},
 {id:'aurora',name:'Aurora Background',category:'Backgrounds',description:'Layered ambient gradients for a hero section.',dependency:'CSS only',source:'export default function AuroraBackground() {\n  return <div aria-hidden="true" className="aurora-bg"><span /><span /><span /></div>;\n}',css:'.aurora-bg { position:relative; isolation:isolate; overflow:hidden; min-height:220px; background:#07131a; }\n.aurora-bg span { position:absolute; width:55%; height:130%; filter:blur(54px); opacity:.7; border-radius:50%; animation:aurora-drift 9s ease-in-out infinite alternate; }\n.aurora-bg span:nth-child(1) { background:#0ea5a4; left:-10%; top:-25%; }\n.aurora-bg span:nth-child(2) { background:#6366f1; right:-12%; top:-20%; animation-delay:-3s; }\n.aurora-bg span:nth-child(3) { background:#22c55e; left:35%; bottom:-90%; animation-delay:-6s; }\n@keyframes aurora-drift { to { transform:translate3d(12%,8%,0) scale(1.15); } }'},
 {id:'spotlight-card',name:'Spotlight Card',category:'Components',description:'Card with a pointer-following radial highlight.',dependency:'React pointer events',source:'\'use client\';\n\nimport { useState } from \'react\';\n\nexport default function SpotlightCard({ children }: { children: React.ReactNode }) {\n  const [point, setPoint] = useState({x:50,y:50});\n  return <div className="spotlight-card" onPointerMove={e => { const r=e.currentTarget.getBoundingClientRect(); setPoint({x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}); }} style={{\'--x\':point.x+\'%\',\'--y\':point.y+\'%\'} as React.CSSProperties}>{children}</div>;\n}',css:'.spotlight-card { position:relative; overflow:hidden; border:1px solid #47556966; border-radius:18px; padding:24px; color:#f8fafc; background:radial-gradient(260px circle at var(--x,50%) var(--y,50%),#2dd4bf33,transparent 70%),#101b24; }\n.spotlight-card:hover { border-color:#2dd4bf; }'},
 {id:'magnet-button',name:'Magnet Button',category:'Micro interactions',description:'Tactile button with hover lift and glow.',dependency:'CSS only',source:'export default function MagnetButton({ label = \'Explore more\' }: { label?: string }) {\n  return <button className="magnet-button">{label}</button>;\n}',css:'.magnet-button { border:0; border-radius:999px; padding:13px 22px; color:#06211b; background:#5eead4; font-weight:750; cursor:pointer; transition:transform .2s ease,box-shadow .2s ease; }\n.magnet-button:hover { transform:translateY(-3px) scale(1.025); box-shadow:0 12px 30px #2dd4bf40; }'},
 {id:'shiny-text',name:'Shiny Text',category:'Text animations',description:'Animated metallic light sweep across headings.',dependency:'Motion + CSS',source:'export default function ShinyText({ text = "Shine bright" }) { return <h2 className="shiny-text">{text}</h2>; }',css:'.shiny-text{background:linear-gradient(100deg,#64748b 20%,#fff 42%,#5eead4 50%,#64748b 75%);background-size:220% 100%;background-clip:text;color:transparent;animation:shiny 3s linear infinite}@keyframes shiny{to{background-position:-220% center}}'},
 {id:'gradient-text',name:'Gradient Text',category:'Text animations',description:'Vibrant gradient typography.',dependency:'CSS only',source:'export default function GradientText({ text = "Build something bold" }) { return <h2 className="gradient-text">{text}</h2>; }',css:'.gradient-text{background:linear-gradient(110deg,#5eead4,#38bdf8,#a78bfa);background-clip:text;color:transparent;font-weight:900}'},
 {id:'fuzzy-text',name:'Fuzzy Text',category:'Text animations',description:'Subtle blur and focus animation.',dependency:'Motion',source:'export default function FuzzyText({ text = "Focus in" }) { return <h2 className="fuzzy-text">{text}</h2>; }',css:'.fuzzy-text{animation:fuzzy 2.5s ease-in-out infinite}@keyframes fuzzy{50%{filter:blur(1.2px);opacity:.82}}'},
 {id:'split-text',name:'Split Text',category:'Text animations',description:'Word-by-word entrance animation.',dependency:'Motion',source:'export default function SplitText({ text = "Every word matters" }) { return <h2>{text.split(" ").map((word,i)=><span key={i} style={{animationDelay:i*70+"ms"}}>{word} </span>)}</h2>; }',css:'.split-text span{display:inline-block;animation:split-in .5s both}@keyframes split-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'},
 {id:'tilted-card',name:'Tilted Card',category:'Components',description:'3D tilt card with spring hover.',dependency:'Motion',source:'export default function TiltedCard({ title = "Perspective" }) { return <article className="tilted-card">{title}</article>; }',css:'.tilted-card{padding:28px;border-radius:18px;background:linear-gradient(145deg,#172554,#111827);color:white;transition:transform .25s}.tilted-card:hover{transform:perspective(700px) rotateX(5deg) rotateY(-7deg) scale(1.02)}'},
 {id:'glare-hover',name:'Glare Hover',category:'Components',description:'Glare-lit interactive surface.',dependency:'Motion + CSS',source:'export default function GlareHover({ children }) { return <div className="glare-hover">{children || "Hover to reveal the light"}</div>; }',css:'.glare-hover{padding:24px;border:1px solid #5eead488;border-radius:18px;background:linear-gradient(120deg,#0f172a,#334155 45%,#0f172a);color:white;transition:transform .2s}.glare-hover:hover{transform:scale(1.015)}'},
 {id:'particles',name:'Particles',category:'Backgrounds',description:'Floating glowing particle field.',dependency:'Motion',source:'export default function Particles({ title = "A field of ideas" }) { return <div className="particles">{title}</div>; }',css:'.particles{min-height:180px;display:grid;place-items:center;color:white;background-color:#07131d;background-image:radial-gradient(#5eead4 1px,transparent 1.5px);background-size:22px 22px;border-radius:18px}'},
 {id:'beams',name:'Beams',category:'Backgrounds',description:'Atmospheric diagonal light beams.',dependency:'CSS only',source:'export default function Beams({ title = "Light in motion" }) { return <div className="beams">{title}</div>; }',css:'.beams{min-height:180px;display:grid;place-items:center;color:white;border-radius:18px;background-color:#080d19;background-image:repeating-linear-gradient(115deg,transparent 0 35px,#5eead455 37px,transparent 40px 78px)}'},
 {id:'click-spark',name:'Click Spark',category:'Micro interactions',description:'Tactile animated action button.',dependency:'Motion',source:'export default function ClickSpark({ label = "Explore" }) { return <button className="click-spark">{label} ✦</button>; }',css:'.click-spark{border:0;border-radius:999px;padding:13px 22px;background:#5eead4;color:#06211b;font-weight:800;transition:transform .18s,box-shadow .18s}.click-spark:hover{transform:scale(1.04);box-shadow:0 0 28px #5eead455}'},
 {id:'card-swap',name:'Card Swap',category:'Components',description:'Layered card stack with hover motion.',dependency:'Motion',source:'export default function CardSwap() { return <div className="card-swap"><article>01 · Discover</article><article>02 · Learn</article><article>03 · Achieve</article></div>; }',css:'.card-swap{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.card-swap article{padding:16px;border:1px solid #5eead466;border-radius:14px;background:#172554;color:white;transition:transform .2s}.card-swap article:hover{transform:translateY(-8px) rotate(-2deg)}'},
 {id:'target-cursor',name:'Target Cursor',category:'Micro interactions',description:'Animated target-style focus indicator.',dependency:'Motion + CSS',source:'export default function TargetCursor({ label = "Focus target" }) { return <div className="target-cursor">⌖<small>{label}</small></div>; }',css:'.target-cursor{display:grid;place-items:center;min-height:120px;color:#5eead4;font-size:42px}.target-cursor small{font-size:12px}'},
 {id:'text-pressure',name:'Text Pressure',category:'Text animations',description:'Responsive kinetic typography.',dependency:'Motion',source:'export default function TextPressure({ text = "Make an impact" }) { return <h2 className="text-pressure">{text}</h2>; }',css:'.text-pressure{font-size:clamp(28px,6vw,56px);font-weight:950;letter-spacing:-.06em;transition:transform .2s}.text-pressure:hover{transform:scaleX(1.04) scaleY(.92)}'},
 {id:'electric-border',name:'Electric Border',category:'Components',description:'Glowing animated electric outline.',dependency:'Motion + CSS',source:'export default function ElectricBorder({ children }) { return <div className="electric-border">{children || "Electric surface"}</div>; }',css:'.electric-border{padding:24px;border:2px solid #5eead4;border-radius:18px;color:white;background:#0b1422;animation:electric 2s infinite}@keyframes electric{50%{box-shadow:0 0 22px #5eead499}}'},
 {id:'dither',name:'Dither',category:'Backgrounds',description:'Pixel-grid halftone texture.',dependency:'CSS only',source:'export default function Dither({ title = "Pixel atmosphere" }) { return <div className="dither">{title}</div>; }',css:'.dither{display:grid;place-items:center;min-height:150px;border-radius:18px;color:white;font-weight:900;background-color:#111827;background-image:radial-gradient(#5eead4 1px,transparent 1.5px);background-size:8px 8px}'},
];
const STORE='design-studio-react-bits-v1';

const PAGE_SLOTS: Record<string, { id: string; label: string }[]> = {
 home: [
  {id:'home.topbar',label:'Login top bar'},{id:'home.institutional-overview',label:'Institutional overview'},{id:'home.institutional-badge',label:'Institution badge'},
  {id:'home.hero-title',label:'Hero title'},{id:'home.hero-description',label:'Hero description'},{id:'home.feature-grid',label:'Feature grid'},
  {id:'home.feature-ev',label:'Expected value feature'},{id:'home.feature-deduction',label:'Statement deduction feature'},{id:'home.feature-themes',label:'Theme feature'},
  {id:'home.login-card',label:'Sign-in card'},{id:'home.login-brand',label:'Sign-in brand mark'},{id:'home.login-heading',label:'Sign-in heading'},
  {id:'home.login-actions',label:'Portal actions'},{id:'home.login-assurances',label:'Sign-in assurances'},{id:'home.footer',label:'Page footer'}
 ],
 dashboard: [
  {id:'dashboard.sidebar',label:'Desktop navigation'},{id:'dashboard.header',label:'Dashboard header'},{id:'dashboard.broadcast-notice',label:'Academic notice'},
  {id:'dashboard.hero',label:'Hero overview'},{id:'dashboard.hero-metric',label:'Hero metric card'},{id:'dashboard.stats',label:'Statistics strip'},
  {id:'dashboard.stat-tests',label:'Tests statistic'},{id:'dashboard.stat-mean',label:'Mean score statistic'},{id:'dashboard.stat-papers',label:'Active papers statistic'},
  {id:'dashboard.stat-resources',label:'Resources statistic'},{id:'dashboard.practice',label:'Recommended practice'},{id:'dashboard.practice-card',label:'Practice paper card'},
  {id:'dashboard.analytics',label:'Performance analytics'},{id:'dashboard.analytics-layout',label:'Analytics layout'},{id:'dashboard.mobile-navigation',label:'Mobile navigation'}
 ],
 quizzes: [
  {id:'quizzes.page',label:'Quiz catalogue canvas'},{id:'quizzes.header',label:'Catalogue header'},{id:'quizzes.subject-browser',label:'Subject browser'},
  {id:'quizzes.subject-card',label:'Subject tile'},{id:'quizzes.paper-browser',label:'Paper browser'},{id:'quizzes.paper-card',label:'Individual paper card'}
 ],
 quiz: [
  {id:'quiz.toolbar',label:'Quiz toolbar'},{id:'quiz.question-workspace',label:'Question workspace'},{id:'quiz.question-telemetry',label:'Question telemetry'},
  {id:'quiz.question-and-options',label:'Question card'},{id:'quiz.answer-option',label:'Individual answer option'},{id:'quiz.bottom-navigation',label:'Question navigation'},
  {id:'quiz.question-palette',label:'Question palette'},{id:'quiz.palette-item',label:'Question palette item'},
  {id:'quiz.result.toolbar',label:'Result toolbar'},{id:'quiz.result.scorecard',label:'Result scorecard'},
  {id:'quiz.result.solution-review',label:'Solution review'},{id:'quiz.result.answer-card',label:'Result answer card'}
 ],
 resources: [
  {id:'resources.sidebar',label:'Library navigation'},{id:'resources.header',label:'Resources header'},{id:'resources.subject-browser',label:'Subject browser'},
  {id:'resources.subject-card',label:'Subject tile'},{id:'resources.material-browser',label:'Material browser'},{id:'resources.material-card',label:'Resource card'}
 ],
 history: [
  {id:'history.page',label:'Attempt history canvas'},{id:'history.sidebar',label:'History navigation'},{id:'history.header',label:'History header'},
  {id:'history.attempt-list',label:'Attempt list'},{id:'history.attempt-card',label:'Individual attempt card'}
 ],
 leaderboard: [
  {id:'leaderboard.page',label:'Leaderboard canvas'},{id:'leaderboard.header',label:'Leaderboard header'},
  {id:'leaderboard.rankings',label:'Rankings list'},{id:'leaderboard.rank-card',label:'Individual rank card'}
 ],
 admin: [
  {id:'admin.sidebar',label:'Admin navigation'},{id:'admin.main-content',label:'Admin workspace'},{id:'admin.design-studio',label:'Visual Designer'},
  {id:'admin.overview',label:'Command center'},{id:'admin.inbox',label:'Mentor inbox'},{id:'admin.quizzes',label:'Quiz manager'},
  {id:'admin.aigen',label:'AI paper setter'},{id:'admin.resources',label:'Resource manager'},{id:'admin.students',label:'Student directory'},
  {id:'admin.analytics',label:'Analytics'},{id:'admin.payments',label:'Payments'},{id:'admin.csvimport',label:'CSV importer'},
  {id:'admin.scheduled.header',label:'Live mock heading'},{id:'admin.scheduled.form',label:'Live mock form'},{id:'admin.scheduled.list',label:'Scheduled mocks'},
  {id:'admin.overview.header',label:'Overview header'},{id:'admin.overview.telemetry',label:'Overview telemetry'},
  {id:'admin.inbox.composer',label:'Inbox message composer'},{id:'admin.quizzes.header',label:'Quiz manager header'},
  {id:'admin.aigen.header',label:'AI builder header'},{id:'admin.aigen.configuration',label:'AI builder configuration'},{id:'admin.aigen.output',label:'AI generated paper output'},
  {id:'admin.resources.header',label:'Resource manager header'},{id:'admin.resources.publish-form',label:'Resource publish form'},
  {id:'admin.students.header',label:'Student directory header'},{id:'admin.analytics.dashboard',label:'Analytics dashboard'},
  {id:'admin.payments.header',label:'Payments header'},{id:'admin.csv.header',label:'CSV importer header'},{id:'admin.csv.workspace',label:'CSV import workspace'}
 ],
};

export default function ReactBitsStudio({ page, config, save, previewUrl }: { page: string; config: StudioConfig; save: (next: StudioConfig) => void; previewUrl: string }) {
 const [selected,setSelected]=useState(STARTERS[0].id);
 const [source,setSource]=useState(STARTERS[0].source);
 const [css,setCss]=useState(STARTERS[0].css);
 const [name,setName]=useState(STARTERS[0].name);
 const [saved,setSaved]=useState<Bit[]>([]);
 const [liveBlockId,setLiveBlockId]=useState<string|null>(null);
 const [liveMessage,setLiveMessage]=useState('');
 const [message,setMessage]=useState('');
 const [tab,setTab]=useState<'source'|'styles'>('source');
 const [accent,setAccent]=useState('#5eead4');
 const [gradientFrom,setGradientFrom]=useState('#5eead4');
 const [gradientTo,setGradientTo]=useState('#38bdf8');
 const [gradientAngle,setGradientAngle]=useState('135deg');
 const [installCommandText,setInstallCommandText]=useState('');
 const [installStatus,setInstallStatus]=useState('');
 const [installError,setInstallError]=useState('');
 const [radius,setRadius]=useState(18);
 const [previewText,setPreviewText]=useState('Make your ideas stand out');
 const [librarySearch,setLibrarySearch]=useState('');
 const [language,setLanguage]=useState<'TS'|'JS'>('TS');
 const [styling,setStyling]=useState<'CSS'|'TW'>('CSS');
 const slots = PAGE_SLOTS[page] || [];
 const [targetSlot,setTargetSlot]=useState(slots[0]?.id || '');
 useEffect(()=>{setTargetSlot(PAGE_SLOTS[page]?.[0]?.id || '');},[page]);
 const library=[['BlurText','Text Animations'],['SplitText','Text Animations'],['ShinyText','Text Animations'],['GradientText','Text Animations'],['FuzzyText','Text Animations'],['TextPressure','Text Animations'],['DecryptedText','Text Animations'],['CountUp','Text Animations'],['Aurora','Backgrounds'],['Balatro','Backgrounds'],['Beams','Backgrounds'],['Particles','Backgrounds'],['Hyperspeed','Backgrounds'],['Dither','Backgrounds'],['Silk','Backgrounds'],['Lightning','Backgrounds'],['Galaxy','Backgrounds'],['Orb','Backgrounds'],['Waves','Backgrounds'],['SpotlightCard','Components'],['TiltedCard','Components'],['GlareHover','Components'],['CardSwap','Components'],['CircularGallery','Components'],['Stack','Components'],['Masonry','Components'],['InfiniteScroll','Components'],['Dock','Components'],['Carousel','Components'],['Stepper','Components'],['Magnet','Micro Interactions'],['ClickSpark','Micro Interactions'],['TargetCursor','Micro Interactions'],['SplashCursor','Micro Interactions'],['MagnetLines','Micro Interactions'],['Crosshair','Micro Interactions'],['PixelTransition','Transitions'],['FadeContent','Transitions'],['AnimatedContent','Transitions'],['StarBorder','Components'],['ElectricBorder','Components'],['ProfileCard','Components'],['SpotlightCard','Components'],['Folder','Components'],['PillNav','Components'],['FlowingMenu','Components'],['GlassIcons','Components'],['TrueFocus','Text Animations'],['ScrollFloat','Text Animations'],['ScrollReveal','Text Animations']];
 const installCommand=(component:string)=>'npx shadcn@latest add @react-bits/'+component+'-'+language+'-'+styling;
 useEffect(()=>{try{const raw=localStorage.getItem(STORE);if(raw)setSaved(JSON.parse(raw));}catch{}},[]);
 useEffect(()=>{if(!liveBlockId)return;const key=page+'::'+targetSlot;const current=config.slotBlocks?.[key]||[];const nextBlocks=current.map(block=>block.id===liveBlockId?{...block,component:runtimeId as VisualBlock['component'],title:name.trim()||active.name,text:previewText,buttonLabel:previewText,styles:{...(block.styles||{}),accent,gradientFrom,gradientTo,gradientAngle,borderRadius:radius+'px'}}:block);if(nextBlocks.some(block=>block.id===liveBlockId))save({...config,slotBlocks:{...(config.slotBlocks||{}),[key]:nextBlocks}});},[accent,gradientFrom,gradientTo,gradientAngle,radius,previewText,liveBlockId]);
 const active=STARTERS.find(x=>x.id===selected)||saved.find(x=>x.id===selected)||STARTERS[0];
 const choose=(bit:Bit)=>{setLiveBlockId(null);setLiveMessage('');setSelected(bit.id);setName(bit.name);setSource(bit.source);setCss(bit.css);setMessage('');};
 const persist=(items:Bit[])=>{setSaved(items);try{localStorage.setItem(STORE,JSON.stringify(items));}catch{setMessage('Browser storage is full; copy your code as a backup.');}};
 const copy=async(value:string,label:string)=>{try{await navigator.clipboard.writeText(value);setMessage(label+' copied.');}catch{setMessage('Clipboard access is unavailable in this browser.');}};
 const saveCurrent=()=>{const item:Bit={...active,id:selected.startsWith('custom-')?selected:'custom-'+selected,name:name.trim()||'My component',source,css};persist([...saved.filter(x=>x.id!==item.id),item]);setSelected(item.id);setMessage('Source saved in this browser.');};
 const runtimeId = selected.replace(/^custom-/, '');
 const supported = ["blur-text","aurora","spotlight-card","magnet-button","shiny-text","gradient-text","fuzzy-text","split-text","tilted-card","glare-hover","particles","beams","click-spark","card-swap","target-cursor","text-pressure","electric-border","dither","star-border","fade-content","animated-content","scroll-reveal","count-up","decrypted-text","infinite-scroll","dock","profile-card","glass-icons","true-focus","scroll-float","pixel-transition","waves","silk","lightning","galaxy","orb","masonry","stack","carousel","stepper","folder","pill-nav","flowing-menu"].includes(runtimeId);

 const componentAliases:Record<string,string>={
  blurtext:'blur-text',aurorabackground:'aurora',aurora:'aurora',spotlightcard:'spotlight-card',magnet:'magnet-button',magnetbutton:'magnet-button',
  shinytext:'shiny-text',gradienttext:'gradient-text',fuzzytext:'fuzzy-text',splittext:'split-text',tiltedcard:'tilted-card',glarehover:'glare-hover',
  particles:'particles',beams:'beams',clickspark:'click-spark',cardswap:'card-swap',targetcursor:'target-cursor',textpressure:'text-pressure',
  electricborder:'electric-border',dither:'dither',starborder:'star-border',fadecontent:'fade-content',animatedcontent:'animated-content',
  scrollreveal:'scroll-reveal',countup:'count-up',decryptedtext:'decrypted-text',infinitescroll:'infinite-scroll',dock:'dock',
  profilecard:'profile-card',glassicons:'glass-icons',truefocus:'true-focus',scrollfloat:'scroll-float',pixeltransition:'pixel-transition',
  waves:'waves',silk:'silk',lightning:'lightning',galaxy:'galaxy',orb:'orb',masonry:'masonry',stack:'stack',carousel:'carousel',
  stepper:'stepper',folder:'folder',pillnav:'pill-nav',flowingmenu:'flowing-menu'
 };
 const runUniversalInstall=()=>{
  setInstallError('');setInstallStatus('');
  const raw=installCommandText.trim();
  if(!raw){setInstallError('Paste a React Bits / shadcn registry command first.');return;}
  if(/[;&|<>\x60]|\$\(|\beval\b|\bcurl\b|\bwget\b|\brm\s+-rf\b/i.test(raw)){setInstallError('Unsafe shell syntax detected. Only a single supported component registry command is accepted.');return;}
  const registry=raw.match(/@react-bits\\/([A-Za-z0-9_-]+)/i);
  const packageName=raw.match(/(?:npm\\s+install|pnpm\\s+add|yarn\\s+add)\\s+(@?[A-Za-z0-9._/-]+)/i);
  const componentToken=registry?.[1]||(packageName?.[1]||'').split('/').pop()||raw.split(/[\\s/]/).filter(Boolean).pop()||'';
  const normalized=componentToken.replace(/-(?:ts|js)-(?:css|tw)$/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
  const resolved=componentAliases[normalized];
  if(!resolved||!["blur-text","aurora","spotlight-card","magnet-button","shiny-text","gradient-text","fuzzy-text","split-text","tilted-card","glare-hover","particles","beams","click-spark","card-swap","target-cursor","text-pressure","electric-border","dither","star-border","fade-content","animated-content","scroll-reveal","count-up","decrypted-text","infinite-scroll","dock","profile-card","glass-icons","true-focus","scroll-float","pixel-transition","waves","silk","lightning","galaxy","orb","masonry","stack","carousel","stepper","folder","pill-nav","flowing-menu"].includes(resolved)){setInstallError('Command parsed, but this component has no approved live renderer yet. Add a reviewed React adapter before it can be installed into the app. The command was not executed.');return;}
  const starter=STARTERS.find(bit=>bit.id===resolved);
  const display=starter?.name||componentToken.replace(/([a-z])([A-Z])/g,'$1 $2');
  setSelected(resolved);setName(display);setSource(starter?.source||'// Registered React Bits adapter: '+display+'\\n// Runtime rendering is provided by ReactBitBlockRenderer.\\nexport default function '+componentToken+'(){ return <div>'+display+'</div>; }');setCss(starter?.css||'/* Runtime styles are managed by the Design Studio gradient and layout controls. */');
  setLiveBlockId(null);setLiveMessage('');setInstallStatus(display+' resolved to the approved live renderer. Select a page slot and choose Add to live page. No shell command was executed.');
 };
\n const addToLivePage = () => {
   if (!supported || !targetSlot) { setMessage('Choose a supported starter and a registered page section.'); return; }
   const block: VisualBlock = {
     id: 'react-bit-' + Date.now().toString(36), type: 'reactBit',
     component: runtimeId as VisualBlock['component'],
     title: name.trim() || active.name, text: previewText, buttonLabel: previewText,
     href: '/quizzes', styles: { accent, gradientFrom, gradientTo, gradientAngle, borderRadius: radius + 'px' }, effect: 'none',
   };
   const key = page + '::' + targetSlot;
   save({ ...config, slotBlocks: { ...(config.slotBlocks || {}), [key]: [...(config.slotBlocks?.[key] || []), block] } });
   setLiveBlockId(block.id);
   setLiveMessage('Live link active. Playground edits will update this component on the page preview.');
   setMessage(active.name + ' added to ' + (slots.find(slot=>slot.id===targetSlot)?.label || targetSlot) + '. The live page preview below will update automatically. Publish changes when ready.');
 };
 const previewStyle={borderRadius:radius,background:'linear-gradient('+gradientAngle+','+gradientFrom+','+gradientTo+')',border:'1px solid '+gradientFrom+'66'} as React.CSSProperties;
 return <div className="space-y-5">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles size={18} className="text-[var(--app-accent)]"/><h3 className="font-bold">React Bits Component Studio</h3></div><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--app-muted)]">Browse starter effects, paste or edit JSX/TSX and CSS, preview style changes, then save or copy your code.</p></div><a href="https://reactbits.dev/" target="_blank" rel="noreferrer" className="theme-control inline-flex items-center gap-2 text-xs">Official React Bits <ExternalLink size={13}/></a></div>
  <section className="rounded-xl border border-[var(--app-border)] p-3 sm:p-4">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold">React Bits registry browser</p><p className="mt-1 text-xs text-[var(--app-muted)]">Find official components and copy the exact registry install command. The upstream library keeps growing; this curated index is a quick-start catalogue.</p></div><a href="https://reactbits.dev/" target="_blank" rel="noreferrer" className="text-xs underline">Browse full official catalogue</a></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input value={librarySearch} onChange={e=>setLibrarySearch(e.target.value)} placeholder="Search components…" className="glass-input text-xs"/><select value={language} onChange={e=>setLanguage(e.target.value as 'TS'|'JS')} className="glass-input text-xs"><option value="TS">TypeScript</option><option value="JS">JavaScript</option></select><select value={styling} onChange={e=>setStyling(e.target.value as 'CSS'|'TW')} className="glass-input text-xs"><option value="CSS">Plain CSS</option><option value="TW">Tailwind</option></select></div>
   <div className="mt-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"><p className="text-xs font-bold">Universal component command resolver</p><p className="mt-1 text-[10px] leading-5 text-[var(--app-muted)]">Paste a React Bits / shadcn registry command. The studio identifies a reviewed renderer and loads its editable source and live preview.</p><textarea value={installCommandText} onChange={e=>setInstallCommandText(e.target.value)} placeholder="npx shadcn@latest add @react-bits/SpotlightCard-TS-CSS" rows={2} className="glass-input mt-2 w-full resize-y font-mono text-xs"/><div className="mt-2 flex flex-wrap gap-2"><button onClick={runUniversalInstall} className="theme-control text-xs"><Sparkles size={13}/>Resolve & load component</button><button onClick={()=>{setInstallCommandText('');setInstallError('');setInstallStatus('');}} className="theme-control text-xs">Clear</button></div>{installError&&<p role="alert" className="mt-2 text-xs text-rose-400">{installError}</p>}{installStatus&&<p role="status" className="mt-2 text-xs text-emerald-400">{installStatus}</p>}<p className="mt-2 text-[10px] text-[var(--app-muted)]">Security: this UI does not run arbitrary terminal commands or install npm packages in the production server. It resolves supported registry names to reviewed, bundled React renderers. Other libraries need a reviewed adapter/build integration.</p></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{library.filter(([name,category])=>(name+' '+category).toLowerCase().includes(librarySearch.toLowerCase())).map(([name,category])=><div key={name} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"><p className="text-xs font-bold">{name}</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{category}</p><button onClick={()=>copy(installCommand(name),'Install command')} className="theme-control mt-2 w-full justify-center text-[10px]"><Copy size={12}/>Copy install command</button></div>)}</div>
   <p className="mt-3 text-[10px] leading-5 text-[var(--app-muted)]">The official registry copies editable source files into your project and installs declared dependencies. Review each component's imports and dependency list before committing. The library may change; open the official catalogue for current names.</p>
  </section>
  <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
   <aside className="space-y-4"><div className="rounded-xl border border-[var(--app-border)] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Starter gallery</p>{['Text animations','Backgrounds','Components','Micro interactions'].map(category=><div key={category} className="mb-3"><p className="mb-1 text-[10px] font-semibold text-[var(--app-muted)]">{category}</p>{STARTERS.filter(x=>x.category===category).map(bit=><button key={bit.id} onClick={()=>choose(bit)} className={'mb-1 w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold '+(selected===bit.id?'bg-[var(--app-accent-soft)] text-[var(--app-accent)]':'hover:bg-[var(--app-surface-muted)]')}>{bit.name}</button>)}</div>)}</div>
   {saved.length>0&&<div className="rounded-xl border border-[var(--app-border)] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Saved components</p>{saved.map(bit=><button key={bit.id} onClick={()=>choose(bit)} className="mb-1 block w-full rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[var(--app-surface-muted)]">{bit.name}</button>)}</div>}</aside>
   <div className="min-w-0 space-y-4">
    <section className="rounded-xl border border-[var(--app-border)] p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">{active.name}</p><p className="mt-1 text-xs text-[var(--app-muted)]">{active.description} · {active.dependency}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>copy(source,'JSX/TSX')} className="theme-control text-xs"><Copy size={13}/>Copy JSX/TSX</button><button onClick={()=>copy(css,'CSS')} className="theme-control text-xs"><Copy size={13}/>Copy CSS</button><button onClick={()=>copy(source+'\n\n/* CSS */\n'+css,'Combined code')} className="theme-control text-xs"><Code2 size={13}/>Copy all</button><button onClick={saveCurrent} className="theme-control text-xs"><Save size={13}/>Save component</button></div></section>
    <section className="overflow-hidden rounded-xl border border-[var(--app-border)]"><div className="flex items-center justify-between border-b border-[var(--app-border)] p-3"><div className="flex gap-1 rounded-lg bg-[var(--app-surface-muted)] p-1"><button onClick={()=>setTab('source')} className={'rounded-md px-3 py-1.5 text-xs '+(tab==='source'?'bg-[var(--app-panel-strong)] font-bold':'')}>JSX / TSX</button><button onClick={()=>setTab('styles')} className={'rounded-md px-3 py-1.5 text-xs '+(tab==='styles'?'bg-[var(--app-panel-strong)] font-bold':'')}>CSS</button></div><span className="text-[10px] text-[var(--app-muted)]">Editable source</span></div><div className="p-3"><label className="mb-2 block text-[10px] font-semibold text-[var(--app-muted)]">Component name</label><input value={name} onChange={e=>setName(e.target.value)} className="glass-input mb-3 w-full text-xs"/><textarea spellCheck={false} value={tab==='source'?source:css} onChange={e=>tab==='source'?setSource(e.target.value):setCss(e.target.value)} className="min-h-[280px] w-full resize-y rounded-xl border border-[var(--app-border)] bg-[#0b0b13] p-4 font-mono text-xs leading-6 text-violet-100 outline-none" aria-label={tab==='source'?'Editable component source':'Editable component CSS'}/></div></section>
    <section className="rounded-xl border border-[var(--app-border)] p-3 sm:p-4"><div className="mb-3 flex items-center gap-2"><Eye size={15} className="text-[var(--app-accent)]"/><h4 className="text-sm font-bold">Live style playground</h4></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs">Gradient start · HEX<input value={gradientFrom} onChange={e=>setGradientFrom(e.target.value)} placeholder="#5EEAD4" pattern="^#[0-9A-Fa-f]{6}$" className="glass-input mt-1 w-full font-mono text-xs"/></label><label className="text-xs">Gradient end · HEX<input value={gradientTo} onChange={e=>setGradientTo(e.target.value)} placeholder="#38BDF8" pattern="^#[0-9A-Fa-f]{6}$" className="glass-input mt-1 w-full font-mono text-xs"/></label><label className="text-xs">Gradient angle<select value={gradientAngle} onChange={e=>setGradientAngle(e.target.value)} className="glass-input mt-1 w-full text-xs"><option value="90deg">90°</option><option value="120deg">120°</option><option value="135deg">135°</option><option value="180deg">180°</option><option value="225deg">225°</option><option value="270deg">270°</option></select></label><label className="text-xs">Corner radius · {radius}px<input type="range" min="0" max="40" value={radius} onChange={e=>setRadius(Number(e.target.value))} className="mt-3 block w-full"/></label><label className="text-xs sm:col-span-2 lg:col-span-4">Preview heading<input value={previewText} onChange={e=>setPreviewText(e.target.value)} className="glass-input mt-1 w-full text-xs"/></label></div><div className="mt-4 grid min-h-40 place-items-center overflow-hidden rounded-xl border border-[var(--app-border)] bg-[#09131b] p-6"><div className="w-full max-w-xl" style={previewStyle}><ReactBitBlockRenderer block={{id:'playground-preview',type:'reactBit',component:(supported?runtimeId:'spotlight-card') as VisualBlock['component'],title:name||active.name,text:previewText,buttonLabel:previewText,href:'/quizzes',styles:{accent,gradientFrom,gradientTo,gradientAngle,borderRadius:radius+'px'}}}/></div></div><p className="mt-2 text-[10px] leading-5 text-[var(--app-muted)]">This is the same registered React renderer used by the live page. Source text is editable, but pasted arbitrary imports are not executed in the admin runtime.</p>
     <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
      <label className="text-xs">Add component to actual page section
       <select value={targetSlot} onChange={e=>setTargetSlot(e.target.value)} disabled={!slots.length} className="glass-input mt-1 w-full text-xs">
        {slots.map(slot=><option key={slot.id} value={slot.id}>{slot.label}</option>)}
       </select>
      </label>
      <button onClick={addToLivePage} disabled={!supported||!targetSlot} className="theme-control self-end justify-center text-xs disabled:cursor-not-allowed disabled:opacity-40"><Save size={13}/>Add to live page</button>
     </div>
     {!supported&&<p className="mt-2 text-[10px] text-amber-400">This saved/custom source is not in the safe live renderer yet. It can still be edited, copied and exported.</p>}
     {!slots.length&&<p className="mt-2 text-[10px] text-amber-400">No registered component slots are available for this page yet.</p>}
     {liveMessage&&<p role="status" className="mt-2 text-[10px] text-emerald-400">{liveMessage}</p>}
     <div className="mt-5 overflow-hidden rounded-xl border border-[var(--app-border)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] p-3"><div><p className="text-xs font-bold">Live application preview</p><p className="text-[10px] text-[var(--app-muted)]">Actual {page} page · draft configuration · updates as you edit</p></div><a href={previewUrl} target="_blank" rel="noreferrer" className="text-[10px] underline">Open full page</a></div>
      <iframe key={page} src={previewUrl} title="Live application React Bits preview" loading="lazy" className="h-[620px] w-full bg-[#080d19]" />
     </div>
    </section>
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-xs leading-5 text-[var(--app-muted)]"><b className="text-[var(--app-text)]">Integration note:</b> copy source and CSS into separate files, review imports and install only dependencies listed on the component’s official page. This editor is a local source workspace, not a one-click installer. <a className="ml-1 underline" href="https://reactbits.dev/get-started/installation" target="_blank" rel="noreferrer">Official installation guide</a></div>
    {message&&<p role="status" className="text-xs text-[var(--app-accent)]">{message}</p>}
   </div>
  </div>
 </div>;
}
