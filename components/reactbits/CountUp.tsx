'use client';

import { useEffect, useState } from 'react';

type CountUpProps = {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

export default function CountUp({ value, suffix = '', duration = 900, className = '' }: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }

    let frame = 0;
    let start = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const next = Math.round(target * eased);
      if (next !== previous) {
        previous = next;
        setDisplay(next);
      }
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString('en-IN')}{suffix}</span>;
}
