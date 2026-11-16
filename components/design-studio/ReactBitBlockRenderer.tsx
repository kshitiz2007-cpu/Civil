'use client';

import { useState, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { VisualBlock } from './DesignStudioProvider';

export default function ReactBitBlockRenderer({ block }: { block: VisualBlock }) {
  const reduceMotion = useReducedMotion();
  const [point, setPoint] = useState({ x: 50, y: 50 });
  const color = block.styles?.accent || 'var(--app-accent)';
  const gradientFrom = block.styles?.gradientFrom || color;
  const gradientTo = block.styles?.gradientTo || '#38bdf8';
  const gradientAngle = block.styles?.gradientAngle || '135deg';
  const gradient = 'linear-gradient('+gradientAngle+','+gradientFrom+','+gradientTo+')';
  const radius = block.styles?.borderRadius || '18px';
  const text = block.text || block.title;
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  if (block.component === 'blur-text') return (
    <motion.h2 initial={reduceMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 12 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.8 }} className="my-4 text-2xl font-extrabold tracking-tight"
      style={{ color }}>{text}</motion.h2>
  );

  if (block.component === 'aurora') return (
    <div aria-label={block.title || 'Aurora background'} className="relative my-4 grid min-h-40 place-items-center overflow-hidden p-8 text-center"
      style={{ borderRadius: radius, background: '#07131a', isolation: 'isolate' }}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden" style={{ filter: 'blur(38px)', opacity: 0.8 }}>
        <motion.span className="absolute -left-8 -top-12 h-48 w-48 rounded-full" style={{ background: color }}
          animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, 14, 0] }} transition={{ duration: 9, repeat: Infinity }} />
        <motion.span className="absolute -right-8 top-0 h-52 w-52 rounded-full bg-indigo-500"
          animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, 18, 0] }} transition={{ duration: 11, repeat: Infinity }} />
        <motion.span className="absolute bottom-[-5rem] left-1/3 h-44 w-44 rounded-full bg-emerald-400"
          animate={reduceMotion ? undefined : { x: [0, 18, 0] }} transition={{ duration: 12, repeat: Infinity }} />
      </div>
      <div className="text-lg font-bold text-white">{text}</div>
    </div>
  );

  if (block.component === 'spotlight-card') return (
    <div onPointerMove={move} className="my-4 p-6 text-white"
      style={{ borderRadius: radius, border: '1px solid color-mix(in srgb, ' + color + ' 40%, transparent)', background: 'radial-gradient(260px circle at ' + point.x + '% ' + point.y + '%, color-mix(in srgb, ' + color + ' 24%, transparent), transparent 72%), #101b24' }}>
      <h3 className="font-bold">{block.title}</h3>
      {block.text && <p className="mt-2 text-sm text-slate-300">{block.text}</p>}
    </div>
  );

  if (block.component === 'magnet-button') return (
    <motion.a href={block.href && /^\/(?!\/)/.test(block.href) ? block.href : '/'}
      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.025 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className="my-4 inline-flex items-center justify-center px-6 py-3 font-bold"
      style={{ borderRadius: '999px', color: '#06211b', background: color, boxShadow: '0 12px 30px color-mix(in srgb, ' + color + ' 24%, transparent)' }}>
      {block.buttonLabel || text}
    </motion.a>
  );


  if (block.component === 'shiny-text') return <motion.p initial={false} animate={{backgroundPosition:['120% center','-120% center']}} transition={{duration:3.2,repeat:Infinity,ease:'linear'}} className="my-4 bg-clip-text text-center text-2xl font-extrabold text-transparent" style={{borderRadius:radius,backgroundImage:'linear-gradient(100deg,#64748b 20%,#fff 42%, '+color+' 50%,#64748b 75%)',backgroundSize:'220% 100%'}}>{text}</motion.p>;

  if (block.component === 'gradient-text') return <h2 className="my-4 bg-clip-text text-2xl font-black text-transparent" style={{backgroundImage:gradient}}>{text}</h2>;

  if (block.component === 'fuzzy-text') return <motion.h2 animate={reduceMotion?undefined:{filter:['blur(0px)','blur(1.2px)','blur(0px)'],opacity:[1,.82,1]}} transition={{duration:2.5,repeat:Infinity}} className="my-4 text-2xl font-extrabold" style={{color}}>{text}</motion.h2>;

  if (block.component === 'split-text') return <h2 className="my-4 flex flex-wrap gap-x-2 gap-y-1 text-2xl font-extrabold" aria-label={text}>{text.split(' ').map((word,i)=><motion.span key={i} initial={reduceMotion?false:{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}}>{word}</motion.span>)}</h2>;

  if (block.component === 'tilted-card') return <motion.div whileHover={reduceMotion?undefined:{rotateX:5,rotateY:-7,scale:1.025}} transition={{type:'spring',stiffness:180,damping:16}} className="my-4 rounded-2xl border p-6 text-white shadow-2xl" style={{borderColor:color+'88',borderRadius:radius,background:gradient}}><p className="text-xs uppercase tracking-[.2em]" style={{color}}>{block.title}</p><h3 className="mt-3 text-xl font-bold">{text}</h3><p className="mt-2 text-xs text-slate-300">3D tilt interaction</p></motion.div>;

  if (block.component === 'glare-hover') return <motion.div whileHover={reduceMotion?undefined:{scale:1.015}} className="my-4 overflow-hidden rounded-2xl border p-6 text-white" style={{borderRadius:radius,borderColor:color+'88',background:'linear-gradient(120deg,#0f172a,#1e293b 45%,#0f172a)'}}><div className="mb-3 h-1 w-16 rounded-full" style={{background:color,boxShadow:'0 0 24px '+color}}/><h3 className="font-bold">{block.title}</h3><p className="mt-2 text-sm text-slate-300">{text}</p></motion.div>;

  if (block.component === 'particles') return <div className="relative my-4 grid min-h-40 place-items-center overflow-hidden rounded-2xl border p-6 text-center text-white" style={{borderRadius:radius,borderColor:color+'66',background:'#07131d'}}><div className="absolute inset-0" aria-hidden="true">{Array.from({length:22},(_,i)=><motion.i key={i} className="absolute size-1 rounded-full" style={{left:((i*47)%97)+'%',top:((i*31)%93)+'%',background:color,boxShadow:'0 0 12px '+color}} animate={reduceMotion?undefined:{y:[0,-18,0],opacity:[.2,1,.2]}} transition={{duration:2+(i%5),repeat:Infinity,delay:(i%7)*.2}}/>)}</div><h3 className="relative z-10 text-xl font-bold">{text}</h3></div>;

  if (block.component === 'beams') return <div className="relative my-4 grid min-h-40 place-items-center overflow-hidden rounded-2xl p-6 text-center text-white" style={{borderRadius:radius,background:'#080d19'}}><div className="absolute inset-0 opacity-70" style={{background:'repeating-linear-gradient(115deg,transparent 0 35px,'+color+'55 37px,transparent 40px 78px)',maskImage:'linear-gradient(to bottom,black,transparent)'}}/><h3 className="relative text-xl font-bold">{text}</h3></div>;

  if (block.component === 'click-spark') return <motion.button type="button" whileTap={reduceMotion?undefined:{scale:.94}} whileHover={reduceMotion?undefined:{scale:1.04}} className="my-4 rounded-full px-6 py-3 font-bold" style={{borderRadius:radius,background:color,color:'#06131a',boxShadow:'0 0 28px '+color+'55'}}>{block.buttonLabel||text} ✦</motion.button>;

  if (block.component === 'card-swap') return <div className="my-4 grid gap-2 sm:grid-cols-3">{[0,1,2].map((i)=><motion.div key={i} whileHover={reduceMotion?undefined:{y:-8,rotate:(i-1)*2}} className="rounded-xl border p-4 text-white" style={{borderColor:color+'66',background:['#102a43','#172554','#102f2b'][i],borderRadius:radius}}><span className="text-xs" style={{color}}>0{i+1}</span><p className="mt-3 font-bold">{i===0?block.title:text}</p></motion.div>)}</div>;

  if (block.component === 'target-cursor') return <div className="my-4 grid min-h-32 place-items-center rounded-2xl border border-dashed text-center" style={{borderColor:color+'88',color}}><motion.div animate={reduceMotion?undefined:{rotate:360}} transition={{duration:12,repeat:Infinity,ease:'linear'}} className="grid size-14 place-items-center rounded-full border-2 text-2xl">⌖</motion.div><span className="mt-2 text-xs font-bold">{text}</span></div>;

  if (block.component === 'text-pressure') return <motion.h2 whileHover={reduceMotion?undefined:{scaleX:1.04,scaleY:.92}} className="my-4 text-center text-3xl font-black tracking-tight" style={{color,letterSpacing:'-.06em'}}>{text}</motion.h2>;

  if (block.component === 'electric-border') return <motion.div animate={reduceMotion?undefined:{boxShadow:['0 0 4px '+color,'0 0 22px '+color+'99','0 0 4px '+color]}} transition={{duration:2,repeat:Infinity}} className="my-4 rounded-2xl border-2 p-6 text-center text-white" style={{borderColor:color,borderRadius:radius,background:'#0b1422'}}><h3 className="font-bold">{text}</h3></motion.div>;

  if (block.component === 'dither') return <div className="my-4 grid min-h-36 place-items-center rounded-2xl p-6 text-center font-black text-white" style={{borderRadius:radius,backgroundColor:'#111827',backgroundImage:'radial-gradient('+color+' 1px,transparent 1.5px)',backgroundSize:'8px 8px',backgroundBlendMode:'screen'}}><span className="rounded-xl bg-slate-950/80 px-4 py-3">{text}</span></div>;


  if (block.component === 'star-border') return <motion.div whileHover={reduceMotion?undefined:{scale:1.015}} className="my-4 rounded-2xl border-2 p-6 text-white" style={{borderColor:gradientFrom,background:'#101827',boxShadow:'0 0 18px '+gradientFrom+'55'}}><h3 className="font-bold">{block.title}</h3><p className="mt-2 text-sm text-slate-300">{text}</p></motion.div>;
  if (block.component === 'fade-content') return <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:.8}} className="my-4 rounded-xl p-5 text-white" style={{background:gradient}}>{text}</motion.div>;
  if (block.component === 'animated-content') return <motion.div initial={reduceMotion?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.6}} className="my-4 rounded-xl p-5 text-white" style={{background:gradient}}><h3 className="font-bold">{block.title}</h3><p className="mt-2 text-sm">{text}</p></motion.div>;
  if (block.component === 'scroll-reveal') return <motion.p initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="my-4 text-xl font-bold" style={{color:gradientFrom}}>{text}</motion.p>;
  if (block.component === 'count-up') return <motion.div initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} className="my-4 rounded-xl p-5 text-center" style={{background:gradient,color:'#06131a'}}><div className="text-4xl font-black">{block.styles?.value || '100+'}</div><p className="mt-1 text-sm font-semibold">{text}</p></motion.div>;
  if (block.component === 'decrypted-text') return <motion.h2 animate={reduceMotion?undefined:{opacity:[.65,1,.65]}} transition={{duration:2,repeat:Infinity}} className="my-4 font-mono text-xl font-bold" style={{color:gradientFrom}}>{text}</motion.h2>;
  if (block.component === 'infinite-scroll') return <div className="my-4 overflow-hidden rounded-xl border p-3" style={{borderColor:gradientFrom}}><motion.div animate={reduceMotion?undefined:{x:['0%','-50%']}} transition={{duration:14,repeat:Infinity,ease:'linear'}} className="flex w-max gap-8 whitespace-nowrap font-bold text-white">{Array.from({length:6},(_,i)=><span key={i} style={{color:gradientFrom}}>{text} ✦</span>)}</motion.div></div>;
  if (block.component === 'dock') return <nav className="my-4 flex items-center justify-center gap-3 rounded-2xl border p-3" style={{borderColor:gradientFrom,background:'#101827'}}>{['⌂','⌕','✦','⚙'].map((v,i)=><motion.button key={v} whileHover={{scale:1.2,y:-5}} className="grid size-11 place-items-center rounded-xl text-xl" style={{background:gradient,color:'#06131a'}} aria-label={'Dock item '+(i+1)}>{v}</motion.button>)}</nav>;
  if (block.component === 'profile-card') return <div className="my-4 flex items-center gap-4 rounded-2xl border p-5 text-white" style={{borderColor:gradientFrom,background:'#111827'}}><div className="grid size-14 place-items-center rounded-full text-2xl font-black" style={{background:gradient,color:'#06131a'}}>{(block.title||'U').slice(0,1)}</div><div><h3 className="font-bold">{block.title}</h3><p className="text-sm text-slate-300">{text}</p></div></div>;
  if (block.component === 'glass-icons') return <div className="my-4 flex justify-center gap-3">{['✦','⌂','◎','◇'].map((v,i)=><motion.div key={i} whileHover={{y:-5,scale:1.1}} className="grid size-14 place-items-center rounded-2xl border text-xl text-white backdrop-blur-xl" style={{borderColor:gradientFrom+'99',background:gradient+'55'}}>{v}</motion.div>)}</div>;
  if (block.component === 'true-focus') return <motion.h2 animate={reduceMotion?undefined:{filter:['blur(0px)','blur(2px)','blur(0px)']}} transition={{duration:3,repeat:Infinity}} className="my-4 text-center text-2xl font-black" style={{color:gradientFrom}}>{text}</motion.h2>;
  if (block.component === 'scroll-float') return <motion.h2 initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="my-4 text-center text-3xl font-black" style={{background:gradient,backgroundClip:'text',color:'transparent'}}>{text}</motion.h2>;
  if (block.component === 'pixel-transition') return <motion.div whileHover={{filter:'contrast(1.5)'}} className="my-4 rounded-xl p-6 text-center font-black text-white" style={{backgroundImage:'radial-gradient('+gradientFrom+' 1px,transparent 1px),'+gradient,backgroundSize:'7px 7px,cover'}}>{text}</motion.div>;
  if (block.component === 'waves') return <div className="my-4 grid min-h-36 place-items-center rounded-2xl p-5 text-white" style={{background:'repeating-radial-gradient(ellipse at 50% 120%,'+gradientFrom+'33 0 8px,transparent 9px 18px),#07131d'}}>{text}</div>;
  if (block.component === 'silk') return <motion.div animate={reduceMotion?undefined:{backgroundPosition:['0% 50%','100% 50%','0% 50%']}} transition={{duration:12,repeat:Infinity}} className="my-4 grid min-h-36 place-items-center rounded-2xl p-5 text-white" style={{backgroundImage:'linear-gradient(120deg,'+gradientFrom+',#101827,'+gradientTo+')',backgroundSize:'250% 250%'}}>{text}</motion.div>;
  if (block.component === 'lightning') return <motion.div animate={reduceMotion?undefined:{boxShadow:['0 0 4px '+gradientFrom,'0 0 28px '+gradientTo,'0 0 4px '+gradientFrom]}} transition={{duration:2.4,repeat:Infinity}} className="my-4 rounded-xl border p-6 text-center text-white" style={{borderColor:gradientFrom,background:'#07131d'}}><span className="text-3xl" style={{color:gradientTo}}>ϟ</span><p>{text}</p></motion.div>;
  if (block.component === 'galaxy') return <div className="relative my-4 grid min-h-40 place-items-center overflow-hidden rounded-2xl p-6 text-white" style={{background:'radial-gradient(circle at 50% 50%,'+gradientFrom+'66,transparent 55%),#050816'}}>{Array.from({length:30},(_,i)=><i key={i} className="absolute size-1 rounded-full" style={{left:((i*37)%98)+'%',top:((i*53)%95)+'%',background:i%2?gradientFrom:gradientTo}}/>)}<b className="relative">{text}</b></div>;
  if (block.component === 'orb') return <div className="my-4 grid min-h-40 place-items-center rounded-2xl" style={{background:'#07131d'}}><motion.div animate={reduceMotion?undefined:{scale:[1,1.12,1],rotate:360}} transition={{duration:10,repeat:Infinity}} className="grid size-24 place-items-center rounded-full text-center text-xs font-bold text-white" style={{background:'radial-gradient(circle at 30% 25%,white,'+gradientFrom+' 28%,'+gradientTo+' 75%)',boxShadow:'0 0 50px '+gradientFrom+'88'}}>{text}</motion.div></div>;
  if (block.component === 'masonry') return <div className="my-4 columns-2 gap-2 sm:columns-3">{[0,1,2,3,4,5].map(i=><div key={i} className="mb-2 break-inside-avoid rounded-xl p-4 text-white" style={{minHeight:70+i%3*35,background:i%2?gradient:gradientFrom}}>{i===0?text:block.title}</div>)}</div>;
  if (block.component === 'stack') return <div className="my-4 flex justify-center py-5">{[0,1,2].map(i=><motion.div key={i} whileHover={{y:-10}} className="-mr-8 grid h-28 w-36 place-items-center rounded-xl border p-3 text-center text-white shadow-xl" style={{zIndex:3-i,transform:'rotate('+(i-1)*5+'deg)',borderColor:gradientFrom,background:i%2?gradient:'#111827'}}>{i===0?text:block.title}</motion.div>)}</div>;
  if (block.component === 'carousel') return <div className="my-4 grid grid-cols-3 gap-2">{[0,1,2].map(i=><motion.div key={i} whileHover={{scale:1.04}} className="grid min-h-24 place-items-center rounded-xl p-3 text-center text-xs font-bold text-white" style={{background:i===1?gradient:gradientFrom+'66'}}>{i===1?text:block.title}</motion.div>)}</div>;
  if (block.component === 'stepper') return <div className="my-4 flex items-center justify-between gap-2 rounded-xl p-4 text-white" style={{background:'#101827'}}>{['01','02','03'].map((n,i)=><div key={n} className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full text-xs font-bold" style={{background:i===1?gradient:gradientFrom}}>{n}</span>{i<2&&<span className="h-px w-5" style={{background:gradientFrom}}/>}</div>)}</div>;
  if (block.component === 'folder') return <motion.div whileHover={{y:-4}} className="my-4 rounded-xl p-5 text-white" style={{background:gradient}}><div className="mb-2 h-3 w-16 rounded-t-md" style={{background:gradientFrom}}/><b>{block.title}</b><p className="mt-1 text-sm">{text}</p></motion.div>;
  if (block.component === 'pill-nav') return <nav className="my-4 flex flex-wrap justify-center gap-2 rounded-full border p-2" style={{borderColor:gradientFrom,background:'#101827'}}>{['Home','About','Work','Contact'].map((v,i)=><span key={v} className="rounded-full px-4 py-2 text-xs font-semibold" style={{background:i===0?gradient:'transparent',color:i===0?'#06131a':'white'}}>{v}</span>)}</nav>;
  if (block.component === 'flowing-menu') return <div className="my-4 space-y-1">{['Discover','Create','Explore'].map(v=><motion.div key={v} whileHover={{x:12}} className="border-b py-3 text-xl font-bold text-white" style={{borderColor:gradientFrom}}>{v} ↗</motion.div>)}</div>;

  return null;
}
