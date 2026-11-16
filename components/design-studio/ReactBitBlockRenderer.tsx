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

  return null;
}
