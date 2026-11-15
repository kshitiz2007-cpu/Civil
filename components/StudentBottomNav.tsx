'use client';

import { useRouter } from 'next/navigation';
import { Activity, Layers, FileText, History } from 'lucide-react';

export type StudentNavTab = 'home' | 'tests' | 'files' | 'results';

const items = [
  { id: 'home', label: 'Home', icon: Activity, href: '/dashboard' },
  { id: 'tests', label: 'Tests', icon: Layers, href: '/quizzes' },
  { id: 'files', label: 'Files', icon: FileText, href: '/resources' },
  { id: 'results', label: 'Results', icon: History, href: '/history' },
] as const;

export default function StudentBottomNav({ active }: { active: StudentNavTab }) {
  const router = useRouter();
  return (
    <nav aria-label="Student navigation" className="student-bottom-nav fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border p-2 backdrop-blur-2xl md:hidden">
      {items.map(({ id, label, icon: Icon, href }) => {
        const selected = active === id;
        return (
          <button key={id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => router.push(href)} className={`student-bottom-nav-item flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${selected ? 'is-active' : 'text-slate-400 hover:text-white'}`}>
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
