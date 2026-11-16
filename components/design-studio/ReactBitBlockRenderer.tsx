'use client';

import { useState, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { VisualBlock } from './DesignStudioProvider';

export default function ReactBitBlockRenderer({ block }: { block: VisualBlock }) {
  const reduceMotion = useReducedMotion();
  const [point, setPoint] = useState({ x: 50, y: 50 });
  const color = block.styles?.accent || 'var(--app-accent)';
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

  if (block.component === 'gradient-text') return <h2 className="my-4 bg-clip-text text-2xl font-black text-transparent" style={{backgroundImage:'linear-gradient(110deg,'+color+',#38bdf8,#a78bfa)'}}>{text}</h2>;

  if (block.component === 'fuzzy-text') return <motion.h2 animate={reduceMotion?undefined:{filter:['blur(0px)','blur(1.2px)','blur(0px)'],opacity:[1,.82,1]}} transition={{duration:2.5,repeat:Infinity}} className="my-4 text-2xl font-extrabold" style={{color}}>{text}</motion.h2>;

  if (block.component === 'split-text') return <h2 className="my-4 flex flex-wrap gap-x-2 gap-y-1 text-2xl font-extrabold" aria-label={text}>{text.split(' ').map((word,i)=><motion.span key={i} initial={reduceMotion?false:{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}}>{word}</motion.span>)}</h2>;

  if (block.component === 'tilted-card') return <motion.div whileHover={reduceMotion?undefined:{rotateX:5,rotateY:-7,scale:1.025}} transition={{type:'spring',stiffness:180,damping:16}} className="my-4 rounded-2xl border p-6 text-white shadow-2xl" style={{borderColor:color+'88',borderRadius:radius,background:'linear-gradient(145deg,#172554,#111827)'}}><p className="text-xs uppercase tracking-[.2em]" style={{color}}>{block.title}</p><h3 className="mt-3 text-xl font-bold">{text}</h3><p className="mt-2 text-xs text-slate-300">3D tilt interaction</p></motion.div>;

  if (block.component === 'glare-hover') return <motion.div whileHover={reduceMotion?undefined:{scale:1.015}} className="my-4 overflow-hidden rounded-2xl border p-6 text-white" style={{borderRadius:radius,borderColor:color+'88',background:'linear-gradient(120deg,#0f172a,#1e293b 45%,#0f172a)'}}><div className="mb-3 h-1 w-16 rounded-full" style={{background:color,boxShadow:'0 0 24px '+color}}/><h3 className="font-bold">{block.title}</h3><p className="mt-2 text-sm text-slate-300">{text}</p></motion.div>;

  if (block.component === 'particles') return <div className="relative my-4 grid min-h-40 place-items-center overflow-hidden rounded-2xl border p-6 text-center text-white" style={{borderRadius:radius,borderColor:color+'66',background:'#07131d'}}><div className="absolute inset-0" aria-hidden="true">{Array.from({length:22},(_,i)=><motion.i key={i} className="absolute size-1 rounded-full" style={{left:((i*47)%97)+'%',top:((i*31)%93)+'%',background:color,boxShadow:'0 0 12px '+color}} animate={reduceMotion?undefined:{y:[0,-18,0],opacity:[.2,1,.2]}} transition={{duration:2+(i%5),repeat:Infinity,delay:(i%7)*.2}}/>)}</div><h3 className="relative z-10 text-xl font-bold">{text}</h3></div>;

  if (block.component === 'beams') return <div className="relative my-4 grid min-h-40 place-items-center overflow-hidden rounded-2xl p-6 text-center text-white" style={{borderRadius:radius,background:'#080d19'}}><div className="absolute inset-0 opacity-70" style={{background:'repeating-linear-gradient(115deg,transparent 0 35px,'+color+'55 37px,transparent 40px 78px)',maskImage:'linear-gradient(to bottom,black,transparent)'}}/><h3 className="relative text-xl font-bold">{text}</h3></div>;

  if (block.component === 'click-spark') return <motion.button type="button" whileTap={reduceMotion?undefined:{scale:.94}} whileHover={reduceMotion?undefined:{scale:1.04}} className="my-4 rounded-full px-6 py-3 font-bold" style={{borderRadius:radius,background:color,color:'#06131a',boxShadow:'0 0 28px '+color+'55'}}>{block.buttonLabel||text} ✦</motion.button>;

  if (block.component === 'card-swap') return <div className="my-4 grid gap-2 sm:grid-cols-3">{[0,1,2].map((i)=><motion.div key={i} whileHover={reduceMotion?undefined:{y:-8,rotate:(i-1)*2}} className="rounded-xl border p-4 text-white" style={{borderColor:color+'66',background:['#102a43','#172554','#102f2b'][i],borderRadius:radius}}><span className="text-xs" style={{color}}>0{i+1}</span><p className="mt-3 font-bold">{i===0?block.title:text}</p></motion.div>)}</div>;

  if (block.component === 'target-cursor') return <div className="my-4 grid min-h-32 place-items-center rounded-2xl border border-dashed text-center" style={{borderColor:color+'88',color}}><motion.div animate={reduceMotion?undefined:{rotate:360}} transition={{duration:12,repeat:Infinity,ease:'linear'}} className="grid size-14 place-items-center rounded-full border-2 text-2xl">⌖</motion.div><span className="mt-2 text-xs font-bold">{text}</span></div>;

  if (block.component === 'text-pressure') return <motion.h2 whileHover={reduceMotion?undefined:{scaleX:1.04,scaleY:.92}} className="my-4 text-center text-3xl font-black tracking-tight" style={{color,letterSpacing:'-.06em'}}>{text}</motion.h2>;

  if (block.component === 'electric-border') return <motion.div animate={reduceMotion?undefined:{boxShadow:['0 0 4px '+color,'0 0 22px '+color+'99','0 0 4px '+color]}} transition={{duration:2,repeat:Infinity}} className="my-4 rounded-2xl border-2 p-6 text-center text-white" style={{borderColor:color,borderRadius:radius,background:'#0b1422'}}><h3 className="font-bold">{text}</h3></motion.div>;

  if (block.component === 'dither') return <div className="my-4 grid min-h-36 place-items-center rounded-2xl p-6 text-center font-black text-white" style={{borderRadius:radius,backgroundColor:'#111827',backgroundImage:'radial-gradient('+color+' 1px,transparent 1.5px)',backgroundSize:'8px 8px',backgroundBlendMode:'screen'}}><span className="rounded-xl bg-slate-950/80 px-4 py-3">{text}</span></div>;

  return null;
}
