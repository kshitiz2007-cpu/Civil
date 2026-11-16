'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type Props = { component: string; children: ReactNode };
export default function ReactBitsSlotReplacement({ component, children }: Props) {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion ? {} : { whileHover: { y: -2 }, transition: { duration: 0.22 } };

  if (component === 'BlurText') return (
    <motion.div {...motionProps} initial={reduceMotion ? false : { opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.65 }}
      className="relative z-10">{children}</motion.div>
  );
  if (component === 'Aurora') return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-50" style={{ filter: 'blur(34px)' }}>
        <motion.span className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-cyan-400"
          animate={reduceMotion ? undefined : { x: [0, 22, 0], y: [0, 12, 0] }} transition={{ duration: 9, repeat: Infinity }} />
        <motion.span className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-fuchsia-500"
          animate={reduceMotion ? undefined : { x: [0, -18, 0], y: [0, 16, 0] }} transition={{ duration: 11, repeat: Infinity }} />
        <motion.span className="absolute bottom-[-4rem] left-1/3 h-36 w-36 rounded-full bg-emerald-400"
          animate={reduceMotion ? undefined : { x: [0, 14, 0] }} transition={{ duration: 12, repeat: Infinity }} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
  if (component === 'SpotlightCard') return (
    <motion.div {...motionProps} className="relative isolate rounded-2xl border border-[var(--app-border-strong)] p-3"
      style={{ background: 'radial-gradient(320px circle at var(--studio-x,50%) var(--studio-y,50%), color-mix(in srgb,var(--app-accent) 20%,transparent), transparent 72%), var(--app-panel)' }}>
      {children}
    </motion.div>
  );
  if (component === 'GlareHover') return (
    <motion.div {...motionProps} className="relative isolate overflow-hidden rounded-2xl border border-white/15"
      whileHover={reduceMotion ? undefined : { boxShadow: '0 0 32px color-mix(in srgb,var(--app-accent) 35%,transparent)' }}>
      {children}
    </motion.div>
  );
  if (component === 'TiltedCard') return (
    <motion.div className="relative" whileHover={reduceMotion ? undefined : { rotateX: 2, rotateY: -2, scale: 1.01 }}
      style={{ transformPerspective: 900, transformStyle: 'preserve-3d' }}>{children}</motion.div>
  );
  if (component === 'Magnet') return (
    <motion.div className="relative" whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}>{children}</motion.div>
  );

  if (component === 'ShinyText' || component === 'GradientText' || component === 'TextPressure' || component === 'TrueFocus' || component === 'ScrollFloat') return <motion.div {...motionProps} className="relative z-10" style={{background:'linear-gradient(110deg,var(--app-accent),#38bdf8,#a78bfa)',backgroundClip:'text',color:'transparent',fontWeight:900}}>{children}</motion.div>;
  if (component === 'FuzzyText' || component === 'DecryptedText') return <motion.div {...motionProps} className="relative z-10" animate={reduceMotion?undefined:{filter:['blur(0px)','blur(1px)','blur(0px)']}} transition={{duration:2.4,repeat:Infinity}}>{children}</motion.div>;
  if (component === 'SplitText' || component === 'FadeContent' || component === 'AnimatedContent' || component === 'ScrollReveal') return <motion.div initial={reduceMotion?false:{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.55}} className="relative z-10">{children}</motion.div>;
  if (component === 'StarBorder' || component === 'ElectricBorder' || component === 'Lightning') return <motion.div {...motionProps} className="relative z-10 rounded-2xl border-2 border-[var(--app-accent)] p-3" whileHover={reduceMotion?undefined:{boxShadow:'0 0 28px var(--app-accent)'}}>{children}</motion.div>;
  if (component === 'Particles' || component === 'Galaxy' || component === 'Dither' || component === 'Waves' || component === 'Silk' || component === 'Beams' || component === 'Orb' || component === 'Aurora') return <div className="relative isolate overflow-hidden rounded-2xl" style={{background:'radial-gradient(ellipse at 20% 20%,color-mix(in srgb,var(--app-accent) 22%,transparent),transparent 65%),var(--app-panel)'}}><div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(var(--app-accent) 1px,transparent 1.5px)',backgroundSize:'18px 18px'}}/><div className="relative z-10">{children}</div></div>;
  if (component === 'CardSwap' || component === 'Masonry' || component === 'Stack' || component === 'Carousel' || component === 'InfiniteScroll' || component === 'ProfileCard' || component === 'Folder' || component === 'Dock' || component === 'GlassIcons' || component === 'PillNav' || component === 'FlowingMenu' || component === 'Stepper' || component === 'PixelTransition') return <motion.div {...motionProps} className="relative z-10 rounded-2xl border border-[var(--app-border)] p-3" whileHover={reduceMotion?undefined:{y:-2,scale:1.005}}>{children}</motion.div>;
  if (component === 'MagnetButton' || component === 'ClickSpark' || component === 'TargetCursor') return <motion.div {...motionProps} className="relative z-10" whileHover={reduceMotion?undefined:{scale:1.02}}>{children}</motion.div>;


  if (component.startsWith('Shadcn')) return <motion.div {...motionProps} className="relative z-10 rounded-xl border border-[var(--app-border)] p-3" whileHover={reduceMotion?undefined:{y:-1}}>{children}</motion.div>;

  return <>{children}</>;
}
