'use client';

import { useRouter } from 'next/navigation';
import { Activity, Layers, FileText, History, Trophy } from 'lucide-react';

export type StudentNavTab = 'home' | 'tests' | 'files' | 'results' | 'leaderboard';

const items = [
  { id: 'home', label: 'Home', icon: Activity, href: '/dashboard' },
  { id: 'tests', label: 'Tests', icon: Layers, href: '/quizzes' },
  { id: 'files', label: 'Files', icon: FileText, href: '/resources' },
  { id: 'results', label: 'Results', icon: History, href: '/history' },
  { id: 'leaderboard', label: 'Ranks', icon: Trophy, href: '/leaderboard' },
] as const;

export default function StudentBottomNav({ active }: { active: StudentNavTab }) {
  const router = useRouter();
  return (
    <nav aria-label="Student navigation" className="student-bottom-nav fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl items-center justify-around rounded-2xl border p-1.5 backdrop-blur-2xl md:hidden">
      {items.map(({ id, label, icon: Icon, href }) => {
        const selected = active === id;
        return (
          <button key={id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => router.push(href)} className={`student-bottom-nav-item flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[9px] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:text-[10px] ${selected ? 'is-active' : 'text-slate-400 hover:text-white'}`}>
            <Icon aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
