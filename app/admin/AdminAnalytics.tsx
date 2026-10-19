'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, Award, BookOpen, Search, TrendingUp, Users } from 'lucide-react';

type Student = { id: string; name: string; email: string; created_at: string };
type Attempt = { id: string; user_id: string; score: number; quiz_title: string | null; completed_at: string | null };

export default function AdminAnalytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: profiles }, { data: results }] = await Promise.all([
        supabase.from('profiles').select('id,name,email,created_at').neq('role', 'admin').order('created_at', { ascending: false }),
        supabase.from('attempts').select('id,user_id,score,quiz_title,completed_at').order('completed_at', { ascending: false }),
      ]);
      if (!active) return;
      const roster = (profiles || []) as Student[];
      setStudents(roster);
      setAttempts((results || []) as Attempt[]);
      setSelectedId(roster[0]?.id || '');
      setLoading(false);
    }
    load();
    const timer = window.setInterval(load, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const filtered = useMemo(() => students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const selected = students.find((s) => s.id === selectedId);
  const results = attempts.filter((a) => a.user_id === selectedId);
  const average = results.length ? Math.round(results.reduce((sum, a) => sum + Number(a.score || 0), 0) / results.length) : 0;
  const recent = results.slice(0, 8);
  const completedLast30 = attempts.filter((a) => a.completed_at && Date.now() - new Date(a.completed_at).getTime() < 30 * 86400000).length;

  return (
    <section className="space-y-6 text-white">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Insights</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Student performance</h2><p className="mt-2 text-sm text-white/60">Spot progress, consistency, and students who may need support.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"><Activity className="mr-2 inline h-4 w-4 text-emerald-300" /> Refreshes every minute</div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Users} label="Learners" value={students.length} />
        <Metric icon={BookOpen} label="Attempts this month" value={completedLast30} />
        <Metric icon={TrendingUp} label="Platform average" value={attempts.length ? `${Math.round(attempts.reduce((sum,a)=>sum+Number(a.score||0),0)/attempts.length)}%` : '—'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.04]">
          <div className="border-b border-white/10 p-5"><h3 className="font-semibold">Learner directory</h3><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-white/40"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students" className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-400/60"/></div></div>
          <div className="max-h-[520px] overflow-y-auto p-2">
            {loading ? <p className="p-5 text-sm text-white/50">Loading learner records…</p> : filtered.length ? filtered.map((s) => {
              const count = attempts.filter(a=>a.user_id===s.id).length;
              return <button key={s.id} onClick={()=>setSelectedId(s.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId===s.id?'bg-emerald-400/15 ring-1 ring-emerald-300/30':'hover:bg-white/[.06]'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 font-semibold text-emerald-200">{(s.name||s.email||'S').slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{s.name||'Student'}</span><span className="block truncate text-xs text-white/45">{s.email}</span></span><span className="text-xs text-white/50">{count} tests</span></button>;
            }) : <p className="p-5 text-sm text-white/50">No learners found.</p>}
          </div>
        </div>
        <div className="space-y-5">
          {selected ? <>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300/20 to-cyan-300/10 text-xl font-bold text-emerald-200">{(selected.name||selected.email||'S').slice(0,1).toUpperCase()}</span><div><h3 className="text-xl font-semibold">{selected.name||'Student'}</h3><p className="mt-1 text-sm text-white/50">{selected.email}</p></div></div><a href={`mailto:${selected.email}`} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-200">Contact student</a></div>
            <div className="grid gap-4 sm:grid-cols-3"><Metric icon={BookOpen} label="Tests completed" value={results.length}/><Metric icon={Award} label="Average score" value={results.length?`${average}%`:'—'}/><Metric icon={TrendingUp} label="Latest result" value={results.length?`${results[0].score}%`:'—'}/></div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.04]"><div className="border-b border-white/10 p-5"><h3 className="font-semibold">Recent quiz results</h3><p className="mt-1 text-sm text-white/50">Individual attempts and completion dates</p></div>{recent.length ? <div className="divide-y divide-white/[.07]">{recent.map((a)=> <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{a.quiz_title||'Quiz attempt'}</p><p className="mt-1 text-xs text-white/45">{a.completed_at?new Date(a.completed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Date unavailable'}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${Number(a.score)>=60?'bg-emerald-300/10 text-emerald-200':'bg-amber-300/10 text-amber-200'}`}>{a.score}%</span></div>)}</div> : <p className="p-8 text-center text-sm text-white/50">No quiz attempts recorded yet.</p>}</div>
          </> : <div className="rounded-3xl border border-white/10 bg-white/[.04] p-12 text-center text-white/50">{loading?'Loading performance data…':'No student profile is available yet.'}</div>}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-center justify-between"><span className="text-sm text-white/55">{label}</span><Icon className="h-4 w-4 text-emerald-300"/></div><p className="mt-3 text-2xl font-semibold">{value}</p></div>;
}
