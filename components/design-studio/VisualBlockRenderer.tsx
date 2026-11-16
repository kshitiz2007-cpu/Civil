'use client';

import { motion, useReducedMotion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon, StarIcon, ArrowRight01Icon, CheckmarkCircle02Icon,
  BookOpen01Icon, ChartLineData01Icon,
} from '@hugeicons/core-free-icons';
import type { VisualBlock } from './DesignStudioProvider';

const ICONS = {
  home: Home01Icon, star: StarIcon, arrow: ArrowRight01Icon,
  check: CheckmarkCircle02Icon, book: BookOpen01Icon, chart: ChartLineData01Icon,
} as const;
const EFFECTS = {
  none: {},
  fade: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.55 } },
  rise: { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55 } },
  float: { animate: { y: [0, -7, 0] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { animate: { scale: [1, 1.025, 1] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
} as const;

export default function VisualBlockRenderer({ block }: { block: VisualBlock }) {
  const icon = ICONS[(block.icon || 'star') as keyof typeof ICONS] || StarIcon;
  const reduceMotion = useReducedMotion();
  const effect = (reduceMotion ? {} : EFFECTS[block.effect || 'none']) as Record<string, unknown>;
  const style = block.styles as React.CSSProperties | undefined;
  if (block.type === 'divider') return <motion.hr {...effect} className="my-4 border-[var(--app-border)]" />;
  if (block.type === 'heading') return <motion.h2 {...effect} style={style} className="my-3 text-2xl font-extrabold tracking-tight">{block.title}</motion.h2>;
  if (block.type === 'text') return <motion.p {...effect} style={style} className="my-3 text-sm leading-relaxed text-[var(--app-muted)]">{block.text || block.title}</motion.p>;
  if (block.type === 'button') return <motion.a {...effect} href={block.href || '#'} style={style} className={`my-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${block.variant === 'outline' ? 'border border-[var(--app-accent)] text-[var(--app-accent)]' : block.variant === 'soft' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-[var(--app-accent)] text-slate-950'}`}>{block.buttonLabel || block.title}<HugeiconsIcon icon={ArrowRight01Icon} size={17}/></motion.a>;
  if (block.type === 'icon') return <motion.div {...effect} style={style} className="my-3 inline-flex items-center gap-3 rounded-xl bg-[var(--app-accent-soft)] p-3 text-[var(--app-accent)]"><HugeiconsIcon icon={icon} size={26}/><span className="text-sm font-semibold">{block.title}</span></motion.div>;
  if (block.type === 'stat') return <motion.div {...effect} style={style} className="my-3 rounded-2xl border border-[var(--app-border)] p-4 text-[var(--app-text)]"><div className="flex items-center gap-2 text-[var(--app-accent)]"><HugeiconsIcon icon={ChartLineData01Icon} size={18}/><span className="text-xs font-semibold uppercase tracking-wide">{block.title}</span></div><p className="mt-2 text-2xl font-extrabold">{block.text || '—'}</p></motion.div>;
  return <motion.div {...effect} style={style} className="my-3 rounded-2xl border border-[var(--app-border)] p-4 text-[var(--app-text)]"><div className="flex items-center gap-2 text-[var(--app-accent)]"><HugeiconsIcon icon={icon} size={20}/><h3 className="font-bold">{block.title}</h3></div>{block.text && <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{block.text}</p>}</motion.div>;
}
