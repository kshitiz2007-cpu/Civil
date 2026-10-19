'use client';
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Award, BookOpen, CheckCircle2, Clock3, FileText, History, Layers, Loader2, LogOut, Sparkles, Target, TrendingUp } from 'lucide-react';
import StudentChatWidget from '@/components/StudentChatWidget';

type Attempt = { id: string; quiz_id: string; quiz_title?: string; score: number; completed_at?: string };
type Quiz = { id: string; title: string; description?: string; duration?: number; questions?: unknown[] };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = '/'; return; }
        const [{ data: profile }, { data: quizData }, { data: attemptData }, { count }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('quizzes').select('*').eq('active', true).order('created_at', { ascending: false }).limit(4),
          supabase.from('attempts').select('id,quiz_id,quiz_title,score,completed_at').eq('user_id', session.user.id).order('completed_at', { ascending: false }),
          supabase.from('resources').select('*', { count: 'exact', head: true }),
        ]);
        if (!active) return;
        if (profile?.role === 'admin' || session.user.email === 'kshitiz2007@gmail.com') { window.location.href = '/admin'; return; }
        setUser(profile || { name: session.user.user_metadata?.full_name, email: session.user.email });
        setQuizzes((quizData || []) as Quiz[]);
        setAttempts((attemptData || []) as Attempt[]);
        setResourceCount(count || 0);
      } catch (error) { console.error('Dashboard data could not be loaded:', error); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/'; };
  const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) / attempts.length) : 0;
  const recentScores = useMemo(() => attempts.slice(0, 7).reverse(), [attempts]);
  const completedIds = new Set(attempts.map(item => item.quiz_id));
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Scholar';

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#07111f]"><Loader2 className="h-9 w-9 animate-spin text-emerald-300"/></div>;

  return <div className="min-h-screen bg-[#07111f] text-slate-100 selection:bg-emerald-300/30">
    <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/[.08] blur-[120px]"/><div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-cyan-500/[.06] blur-[120px]"/></div>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/[.07] bg-[#091523]/90 px-5 py-6 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950"><Sparkles className="h-5 w-5"/></span><div><p className="font-bold tracking-tight">Gyankunj</p><p className="text-xs text-slate-500">Learning space</p></div></div>
      <nav className="mt-10 space-y-1">
        <NavItem icon={Activity} label="Overview" active onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}/>
        <NavItem icon={Layers} label="Mock tests" onClick={()=>router.push('/quizzes')}/>
        <NavItem icon={FileText} label="Study resources" onClick={()=>router.push('/resources')}/>
        <NavItem icon={History} label="My results" onClick={()=>router.push('/history')}/>
      </nav>
      <div className="mt-auto rounded-2xl border border-emerald-300/10 bg-emerald-300/[.06] p-4"><p className="text-sm font-semibold">Small steps add up.</p><p className="mt-1 text-xs leading-5 text-slate-400">A focused practice session today keeps your momentum going.</p><button onClick={()=>router.push('/quizzes')} className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">Find a test <ArrowRight className="h-3.5 w-3.5"/></button></div>
      <div className="mt-5 flex items-center gap-3 border-t border-white/[.07] pt-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 font-semibold">{firstName.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.name||firstName}</p><p className="truncate text-xs text-slate-500">Student account</p></div><button onClick={logout} title="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4"/></button></div>
    </aside>
    <main className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-7 md:ml-64 md:px-10 md:py-10">
      <header className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm text-slate-400">Your learning overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {firstName}<span className="text-emerald-300">.</span></h1><p className="mt-2 text-sm text-slate-400">A clear view of your progress and what to work on next.</p></div><button onClick={logout} className="rounded-xl border border-white/10 p-3 text-slate-400 hover:bg-white/5 md:hidden" aria-label="Sign out"><LogOut className="h-5 w-5"/></button></header>
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/10 bg-gradient-to-br from-emerald-300/[.12] via-cyan-300/[.05] to-transparent p-6 sm:p-8"><div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border border-emerald-200/10"/><div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[.08] px-3 py-1.5 text-xs font-medium text-emerald-100"><Sparkles className="h-3.5 w-3.5"/> Your next milestone awaits</span><h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Build confidence, one test at a time.</h2><p className="mt-2 text-sm leading-6 text-slate-300/75">Practice with a mock test, review what you’ve learned, and keep your preparation moving.</p><button onClick={()=>router.push('/quizzes')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">Explore mock tests <ArrowRight className="h-4 w-4"/></button></div><div className="grid grid-cols-2 gap-3 md:w-64"><div className="rounded-2xl border border-white/10 bg-[#07111f]/40 p-4"><BookOpen className="h-5 w-5 text-emerald-200"/><p className="mt-4 text-2xl font-semibold">{attempts.length}</p><p className="mt-1 text-xs text-slate-400">Tests completed</p></div><div className="rounded-2xl border border-white/10 bg-[#07111f]/40 p-4"><Target className="h-5 w-5 text-cyan-200"/><p className="mt-4 text-2xl font-semibold">{attempts.length?`${average}%`:'—'}</p><p className="mt-1 text-xs text-slate-400">Average score</p></div></div></div></section>
      <section className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard icon={Layers} label="Available tests" value={quizzes.length} hint="Ready when you are"/><StatCard icon={FileText} label="Study resources" value={resourceCount} hint="Materials to explore"/><StatCard icon={Award} label="Recent result" value={attempts.length?`${attempts[0].score}%`:'—'} hint={attempts[0]?.quiz_title||'Complete a test to get started'}/></section>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <section className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5 sm:p-6"><div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Pick up your practice</h2><p className="mt-1 text-sm text-slate-400">A few recommended tests to keep you moving.</p></div><button onClick={()=>router.push('/quizzes')} className="hidden items-center gap-1 text-sm font-medium text-emerald-200 hover:text-emerald-100 sm:flex">All tests <ArrowRight className="h-4 w-4"/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{quizzes.map((quiz)=>{const done=completedIds.has(quiz.id);return <article key={quiz.id} className="rounded-2xl border border-white/[.08] bg-[#0b1827] p-4 transition hover:border-emerald-200/20"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[.09] text-cyan-200"><BookOpen className="h-5 w-5"/></div>{done&&<span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200"><CheckCircle2 className="h-3 w-3"/>Attempted</span>}</div><h3 className="mt-4 line-clamp-1 font-semibold">{quiz.title}</h3><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">{quiz.description||'Strengthen your understanding with a focused practice session.'}</p><div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5"/>{quiz.duration||'—'} min</span><button onClick={()=>router.push(`/quiz/${quiz.id}`)} className="inline-flex items-center gap-1 font-semibold text-emerald-200 hover:text-emerald-100">{done?'Try again':'Start test'}<ArrowRight className="h-3.5 w-3.5"/></button></div></article>})}{quizzes.length===0&&<p className="col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">New practice tests will appear here as they become available.</p>}</div></section>
        <section className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Your score trend</h2><p className="mt-1 text-sm text-slate-400">Most recent attempts</p></div><TrendingUp className="h-5 w-5 text-emerald-200"/></div>{recentScores.length?<div className="mt-7"><div className="flex h-36 items-end gap-2 border-b border-white/10 pb-2">{recentScores.map((a,i)=><div key={a.id} className="group flex h-full flex-1 flex-col justify-end"><div className="mb-2 text-center text-[10px] text-slate-500 opacity-0 transition group-hover:opacity-100">{a.score}%</div><div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500/50 to-emerald-200/90 transition hover:from-emerald-400 hover:to-cyan-200" style={{height:`${Math.max(8,Math.min(100,Number(a.score)||0))}%`}} title={`${a.quiz_title||'Quiz'} · ${a.score}%`}/></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Older</span><span>Latest</span></div><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/[.04] p-4"><span className="text-sm text-slate-400">Average score</span><span className="text-lg font-semibold text-emerald-100">{average}%</span></div></div>:<div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/[.05] text-slate-400"><Target className="h-5 w-5"/></div><p className="mt-3 text-sm font-medium">Your progress starts here</p><p className="mt-1 text-xs text-slate-500">Finish a mock test to see your score trend.</p><button onClick={()=>router.push('/quizzes')} className="mt-4 text-sm font-semibold text-emerald-200">Browse tests <ArrowRight className="ml-1 inline h-4 w-4"/></button></div>}</section>
      </div>
      <section className="mt-6 rounded-3xl border border-white/[.08] bg-white/[.025]"><div className="flex items-center justify-between border-b border-white/[.07] p-5 sm:px-6"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-slate-400">Your latest completed tests</p></div><button onClick={()=>router.push('/history')} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-200">View history <ArrowRight className="h-4 w-4"/></button></div>{attempts.length?<div className="divide-y divide-white/[.06]">{attempts.slice(0,4).map(a=><div key={a.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.05] text-slate-300"><CheckCircle2 className="h-5 w-5"/></div><div className="min-w-0"><p className="truncate text-sm font-medium">{a.quiz_title||'Quiz attempt'}</p><p className="mt-1 text-xs text-slate-500">{a.completed_at?new Date(a.completed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Recently completed'}</p></div></div><span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-sm font-semibold text-emerald-100">{a.score}%</span></div>)}</div>:<p className="p-8 text-center text-sm text-slate-400">You haven’t completed a test yet. Your results will show up here.</p>}</section>
      <footer className="mt-8 flex items-center justify-between text-xs text-slate-600"><span>Stay curious. Keep learning.</span><span>{quizzes.length} tests · {resourceCount} resources</span></footer>
    </main>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-white/10 bg-[#0a1726]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden"><MobileItem icon={Activity} label="Home" active onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}/><MobileItem icon={Layers} label="Tests" onClick={()=>router.push('/quizzes')}/><MobileItem icon={FileText} label="Files" onClick={()=>router.push('/resources')}/><MobileItem icon={History} label="Results" onClick={()=>router.push('/history')}/></nav>
    <StudentChatWidget/>
  </div>;
}

function NavItem({icon:Icon,label,active,onClick}:{icon:typeof Activity;label:string;active?:boolean;onClick:()=>void}) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active?'bg-emerald-300/[.09] font-semibold text-emerald-100':'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}><Icon className="h-4 w-4"/>{label}</button>; }
function MobileItem({icon:Icon,label,active,onClick}:{icon:typeof Activity;label:string;active?:boolean;onClick:()=>void}) { return <button onClick={onClick} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium ${active?'text-emerald-200':'text-slate-400'}`}><Icon className="h-5 w-5"/>{label}</button>; }
function StatCard({icon:Icon,label,value,hint}:{icon:typeof Activity;label:string;value:string|number;hint:string}) { return <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-4 w-4 text-emerald-200"/></div><p className="mt-3 truncate text-2xl font-semibold">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{hint}</p></div>; }
