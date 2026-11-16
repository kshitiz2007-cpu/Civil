'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDesignStudio } from './DesignStudioProvider';

export type StudioSlotProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export default function StudioSlot({ id, children, className = '' }: StudioSlotProps) {
  const { config } = useDesignStudio();
  const pathname = usePathname();
  const page = pathname === '/' ? 'home' : pathname.split('/').filter(Boolean)[0] || 'home';
  const upgrade = config.componentUpgrades?.[page + '::' + id]?.component || 'none';
  const [point, setPoint] = useState({ x: 50, y: 50 });
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };
  const style = { '--studio-x': point.x + '%', '--studio-y': point.y + '%' } as CSSProperties;
  const base = 'studio-slot studio-slot-' + upgrade + ' ' + className;
  return (
    <div data-studio-slot={id} data-studio-component={upgrade} className={base} style={style} onPointerMove={upgrade === 'SpotlightCard' ? move : undefined}>
      {upgrade === 'Aurora' && <span aria-hidden="true" className="studio-slot-aurora-layer"><i /><i /><i /></span>}
      <div className="studio-slot-content">{children}</div>
    </div>
  );
}
