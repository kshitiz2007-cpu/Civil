'use client';

import { useRef, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
};

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(94, 234, 212, 0.13)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    cardRef.current.style.setProperty('--spotlight-x', `${x}px`);
    cardRef.current.style.setProperty('--spotlight-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`rb-spotlight-card ${className}`}
      style={{ '--spotlight-color': spotlightColor } as CSSProperties}
    >
      {children}
    </div>
  );
}
