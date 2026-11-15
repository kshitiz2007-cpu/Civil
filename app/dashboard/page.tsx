'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Activity, ArrowRight, Award, BookOpen, CheckCircle2, Clock3, FileText,
  History, Layers, Loader2, LogOut, Sparkles, Target, TrendingUp,
  Flame, Zap, CalendarDays, ChevronRight,
} from 'lucide-react';
import StudentChatWidget from '@/components/StudentChatWidget';
import ThemeSelector from '@/components/ThemeSelector';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import CountUp from '@/components/reactbits/CountUp';
import AnimatedContent from '@/components/reactbits/AnimatedContent';

type Attempt = { id: string; quiz_id: string; quiz_title?: string; score: number; completed_at?: string };
type Quiz = { id: string; title: string; description?: string; duration?: number; questions?: unknown[] };
type IconComponent = typeof Activity;

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
      } catch (error) {
        console.error('Dashboard data could not be loaded:', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/'; };
  const average = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) / attempts.length)
    : 0;
  const recentScores = useMemo(() => attempts.slice(0, 7).reverse(), [attempts]);
  const completedIds = new Set(attempts.map(item => item.quiz_id));
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Scholar';
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#07111f]">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><Loader2 className="h-7 w-7 animate-spin"/></span>
        <p className="text-sm text-slate-400">Preparing your learning space…</p>
      </div>
    </div>;
  }

  return (
    <div className="app-theme min-h-screen text-[var(--app-text)]">
      <div className="dashboard-ambient pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[.09] blur-[130px]"/>
        <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-emerald-400/[.08] blur-[130px]"/>
      </div>

      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col border-r border-white/[.07] px-5 py-6 backdrop-blur-2xl md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-200 to-cyan-300 text-slate-950 shadow-lg shadow-emerald-400/15"><Sparkles className="h-5 w-5"/></span>
          <div><p className="font-bold tracking-tight">Gyankunj</p><p className="text-[11px] tracking-[.2em] text-slate-500">ACADEMY</p></div>
        </div>
        <p className="mb-3 mt-11 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">Workspace</p>
        <nav className="space-y-1">
          <NavItem icon={Activity} label="Overview" active onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}/>
          <NavItem icon={Layers} label="Mock tests" onClick={() => router.push('/quizzes')}/>
          <NavItem icon={FileText} label="Study resources" onClick={() => router.push('/resources')}/>
          <NavItem icon={History} label="My results" onClick={() => router.push('/history')}/>
        </nav>
        <SpotlightCard className="mt-auto rounded-2xl p-4">
          <div className="relative z-10">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><Zap className="h-4 w-4"/></span>
            <p className="mt-4 text-sm font-semibold">Keep your streak alive</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">A little focused practice today goes a long way.</p>
            <button onClick={() => router.push('/quizzes')} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-200">Find a test <ArrowRight className="h-3.5 w-3.5"/></button>
          </div>
        </SpotlightCard>
        <div className="mt-5 flex items-center gap-3 border-t border-white/[.07] pt-5">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-slate-600 to-slate-800 font-semibold">{firstName.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user?.name || firstName}</p><p className="truncate text-xs text-slate-500">Student account</p></div>
          <button onClick={logout} title="Sign out" className="rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4"/></button>
        </div>
      </aside>

      <main className="dashboard-main relative z-10 mx-auto max-w-[1440px] px-3 pb-24 pt-4 sm:px-6 md:ml-[258px] md:px-9 md:py-9 xl:px-12">
        <header className="dashboard-header mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400"><CalendarDays className="h-3.5 w-3.5 text-emerald-200"/>{today}</div>
            <h1 className="text-[1.7rem] font-semibold tracking-[-.045em] sm:text-3xl lg:text-4xl">Welcome back, <span className="dashboard-gradient-text">{firstName}</span></h1>
            <p className="mt-2 text-sm text-slate-400">Your next breakthrough starts with one focused session.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeSelector compact/>
            <button onClick={logout} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-slate-400 transition hover:bg-white/[.08] hover:text-white md:hidden" aria-label="Sign out"><LogOut className="h-4 w-4"/></button>
          </div>
        </header>

        <AnimatedContent>
          <section className="dashboard-hero relative overflow-hidden rounded-[1.5rem] border border-emerald-200/15 p-4 sm:rounded-[2rem] sm:p-8 lg:p-10">
            <div className="dashboard-hero-orb absolute -right-20 -top-36 h-[25rem] w-[25rem] rounded-full"/>
            <div className="dashboard-hero-grid absolute inset-0 opacity-40"/>
            <div className="relative grid gap-5 lg:grid-cols-[1fr_290px] lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-emerald-100"><Sparkles className="h-3.5 w-3.5"/> Your learning space</span>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.12] tracking-[-.045em] sm:text-4xl lg:text-[2.8rem]">Make progress that <span className="dashboard-gradient-text">adds up.</span></h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300/75">Build confidence through deliberate practice. Pick a mock test, learn from every attempt, and keep moving forward.</p>
                <button onClick={() => router.push('/quizzes')} className="dashboard-primary-button mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5">Explore mock tests <ArrowRight className="h-4 w-4"/></button>
              </div>
              <div className="relative mx-auto grid w-full max-w-[290px] grid-cols-2 gap-3">
                <SpotlightCard className="rounded-2xl p-4">
                  <BookOpen className="relative z-10 h-5 w-5 text-emerald-200"/>
                  <p className="relative z-10 mt-5 text-3xl font-semibold tracking-tight"><CountUp value={attempts.length}/></p>
                  <p className="relative z-10 mt-1 text-[11px] text-slate-400">Tests completed</p>
                </SpotlightCard>
                <SpotlightCard className="rounded-2xl p-4">
                  <Target className="relative z-10 h-5 w-5 text-cyan-200"/>
                  <p className="relative z-10 mt-5 text-3xl font-semibold tracking-tight"><CountUp value={average} suffix="%"/></p>
                  <p className="relative z-10 mt-1 text-[11px] text-slate-400">Average score</p>
                </SpotlightCard>
                <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 backdrop-blur-xl">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-300/10 text-orange-200"><Flame className="h-4 w-4"/></span>
                  <div className="min-w-0"><p className="text-xs font-semibold">Consistency beats intensity</p><p className="mt-0.5 text-[11px] text-slate-500">One step forward, every day.</p></div>
                  <Sparkles className="ml-auto h-4 w-4 shrink-0 text-emerald-200/70"/>
                </div>
              </div>
            </div>
          </section>
        </AnimatedContent>

        <section className="dashboard-metrics mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
          <AnimatedContent delay={60}><MetricCard icon={Layers} label="Available tests" value={quizzes.length} hint="Ready when you are" accent="emerald"/></AnimatedContent>
          <AnimatedContent delay={120}><MetricCard icon={FileText} label="Study resources" value={resourceCount} hint="Explore your materials" accent="cyan"/></AnimatedContent>
          <AnimatedContent delay={180}><MetricCard icon={Award} label="Latest score" value={attempts.length ? attempts[0].score : '—'} suffix={attempts.length ? '%' : ''} hint={attempts[0]?.quiz_title || 'Complete a test to begin'} accent="violet"/></AnimatedContent>
        </section>

        <div className="dashboard-content-grid mt-5 grid gap-4 xl:mt-8 xl:grid-cols-[1.25fr_.75fr] xl:gap-5">
          <AnimatedContent>
            <section className="dashboard-panel h-full rounded-2xl p-3.5 sm:rounded-[1.7rem] sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200/75">Curated for you</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Pick up your practice</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm">Jump back in or try something new.</p></div>
                <button onClick={() => router.push('/quizzes')} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-200 transition hover:text-emerald-100">All tests <ChevronRight className="h-4 w-4"/></button>
              </div>
              <div className="dashboard-quiz-grid mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                {quizzes.map((quiz, index) => {
                  const done = completedIds.has(quiz.id);
                  return <SpotlightCard key={quiz.id} className="rounded-2xl p-4">
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/10 bg-cyan-300/[.08] text-cyan-200"><BookOpen className="h-5 w-5"/></span>
                        {done && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-200"><CheckCircle2 className="h-3 w-3"/>Attempted</span>}
                      </div>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-slate-600">Practice set 0{index + 1}</p>
                      <h3 className="mt-1 line-clamp-1 font-semibold">{quiz.title}</h3>
                      <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-400">{quiz.description || 'Strengthen your understanding with a focused practice session.'}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5"/>{quiz.duration || '—'} min</span>
                        <button onClick={() => router.push(`/quiz/${quiz.id}`)} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-200 hover:text-white">{done ? 'Try again' : 'Start test'} <ArrowRight className="h-3.5 w-3.5"/></button>
                      </div>
                    </div>
                  </SpotlightCard>;
                })}
                {quizzes.length === 0 && <p className="col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">New practice tests will appear here as they become available.</p>}
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={100}>
            <section className="dashboard-panel h-full rounded-[1.7rem] p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200/75">Your analytics</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Score trend</h2><p className="mt-1 text-xs text-slate-500">Your latest seven attempts</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/[.08] text-emerald-200"><TrendingUp className="h-5 w-5"/></span></div>
              {recentScores.length ? <>
                <div className="dashboard-score-chart mt-8 flex h-40 items-end gap-2 border-b border-white/10 pb-2">
                  {recentScores.map((attempt, index) => <div key={attempt.id} className="group flex h-full flex-1 flex-col justify-end">
                    <div className="mb-2 text-center text-[10px] text-emerald-100 opacity-0 transition group-hover:opacity-100">{attempt.score}%</div>
                    <div className="score-bar w-full rounded-t-lg" style={{ height: `${Math.max(8, Math.min(100, Number(attempt.score) || 0))}%`, animationDelay: `${index * 70}ms` }} title={`${attempt.quiz_title || 'Quiz'} · ${attempt.score}%`}/>
                  </div>)}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>Older</span><span>Latest</span></div>
                <div className="dashboard-average mt-5 flex items-center justify-between rounded-2xl border border-white/[.06] bg-white/[.035] p-4"><span className="text-xs text-slate-400">Overall average</span><span className="text-xl font-semibold text-emerald-100"><CountUp value={average} suffix="%"/></span></div>
              </> : <div className="mt-7 rounded-2xl border border-dashed border-white/10 px-4 py-9 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/[.05] text-slate-400"><Target className="h-5 w-5"/></span><p className="mt-3 text-sm font-semibold">Your progress starts here</p><p className="mt-1 text-xs text-slate-500">Finish a mock test to see your score trend.</p><button onClick={() => router.push('/quizzes')} className="mt-4 text-xs font-bold text-emerald-200">Browse tests <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></button></div>}
            </section>
          </AnimatedContent>
        </div>

        <AnimatedContent delay={80}>
          <section className="dashboard-panel dashboard-recent mt-4 overflow-hidden rounded-2xl sm:mt-5 sm:rounded-[1.7rem]">
            <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 sm:px-6 sm:py-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-200/75">Stay on track</p><h2 className="mt-1 text-lg font-semibold">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Your latest completed tests</p></div>
              <button onClick={() => router.push('/history')} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-200">Full history <ArrowRight className="h-3.5 w-3.5"/></button>
            </div>
            {attempts.length ? <div className="divide-y divide-white/[.055]">
              {attempts.slice(0, 4).map(attempt => <div key={attempt.id} className="dashboard-activity-row flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[.025] sm:px-6">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200/10 bg-emerald-300/[.07] text-emerald-200"><CheckCircle2 className="h-5 w-5"/></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{attempt.quiz_title || 'Quiz attempt'}</p><p className="mt-1 text-[11px] text-slate-500">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently completed'}</p></div></div>
                <span className="shrink-0 rounded-full border border-emerald-200/10 bg-emerald-300/[.08] px-3 py-1.5 text-xs font-bold text-emerald-100">{attempt.score}%</span>
              </div>)}
            </div> : <p className="p-8 text-center text-sm text-slate-400">You haven’t completed a test yet. Your results will show up here.</p>}
          </section>
        </AnimatedContent>

        <footer className="mt-5 flex items-center justify-between gap-3 text-[11px] text-slate-600 sm:mt-8"><span>Stay curious. Keep learning.</span><span>{quizzes.length} tests <span className="px-1 text-slate-700">·</span> {resourceCount} resources</span></footer>
      </main>

      <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl p-2 backdrop-blur-2xl md:hidden">
        <MobileItem icon={Activity} label="Home" active onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}/>
        <MobileItem icon={Layers} label="Tests" onClick={() => router.push('/quizzes')}/>
        <MobileItem icon={FileText} label="Files" onClick={() => router.push('/resources')}/>
        <MobileItem icon={History} label="Results" onClick={() => router.push('/history')}/>
      </nav>
      <StudentChatWidget user={user}/>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: IconComponent; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`dashboard-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'is-active' : 'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}><Icon className="h-4 w-4"/>{label}</button>;
}

function MobileItem({ icon: Icon, label, active, onClick }: { icon: IconComponent; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${active ? 'text-emerald-200' : 'text-slate-400'}`}><Icon className="h-5 w-5"/>{label}</button>;
}

function MetricCard({ icon: Icon, label, value, suffix = '', hint, accent }: { icon: IconComponent; label: string; value: number | string; suffix?: string; hint: string; accent: 'emerald' | 'cyan' | 'violet' }) {
  const accentClass = accent === 'emerald' ? 'text-emerald-200 bg-emerald-300/10' : accent === 'cyan' ? 'text-cyan-200 bg-cyan-300/10' : 'text-violet-200 bg-violet-300/10';
  return <SpotlightCard className="dashboard-metric-card rounded-xl p-2.5 sm:rounded-2xl sm:p-5">
    <div className="relative z-10 flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{typeof value === 'number' ? <CountUp value={value}/> : value}{suffix}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${accentClass}`}><Icon className="h-4.5 w-4.5"/></span></div>
    <p className="relative z-10 mt-2 truncate text-[11px] text-slate-600">{hint}</p>
  </SpotlightCard>;
}
