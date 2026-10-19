'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
<<<<<<< HEAD
import { FALLBACK_ATTEMPTS, FALLBACK_QUIZZES } from '@/lib/mockData';
=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  FileText,
  History,
  Landmark,
  Layers,
  Loader2,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
<<<<<<< HEAD
  Sliders,
=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
<<<<<<< HEAD
  X,
  Zap,
=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
} from 'lucide-react';
import StudentChatWidget from '@/components/StudentChatWidget';
import ThemeSelector from '@/components/ThemeSelector';

type Attempt = {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  category?: string;
  score: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  total?: number;
  completed_at?: string;
};

type Quiz = {
  id: string;
  title: string;
  category?: string;
  section?: string;
  description?: string;
  duration?: number;
  time_limit?: number;
<<<<<<< HEAD
  questions?: any[];
=======
  questions?: unknown[];
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
};

const GS_PILLARS = [
  'Polity',
  'History',
  'Economy',
  'Geography',
  'Environment',
  'Science & Tech',
  'Current Affairs',
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
<<<<<<< HEAD
  const [resourceCount, setResourceCount] = useState(4);
  const [loading, setLoading] = useState(true);
  const [broadcastNotice, setBroadcastNotice] = useState<string>('');

  // Custom Smart Drill Builder Modal
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [drillSubject, setDrillSubject] = useState('All Subjects');
  const [drillCount, setDrillCount] = useState(5);

=======
  const [resourceCount, setResourceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [broadcastNotice, setBroadcastNotice] = useState<string>('');

>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
  // Calm Pomodoro / Deep Study Timer (25 min default)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
<<<<<<< HEAD

        let profile: any = null;
        let quizData: any[] | null = null;
        let attemptData: any[] | null = null;
        let count: number | null = null;

        if (session?.user?.id) {
          const [profRes, qRes, aRes, rRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle(),
            supabase
              .from('quizzes')
              .select('*')
              .eq('active', true)
              .order('created_at', { ascending: false })
              .limit(8),
            supabase
              .from('attempts')
              .select(
                'id,quiz_id,quiz_title,category,score,correct,wrong,skipped,total,completed_at'
              )
              .eq('user_id', session.user.id)
              .order('completed_at', { ascending: false }),
            supabase
              .from('resources')
              .select('*', { count: 'exact', head: true }),
          ]);
          profile = profRes.data;
          quizData = qRes.data;
          attemptData = aRes.data;
          count = rRes.count;

          if (
            profile?.role === 'admin' ||
            session.user.email === 'kshitiz2007@gmail.com' ||
            session.user.email === 'admin@civilprep.in'
          ) {
            window.location.href = '/admin';
            return;
          }
        }

        if (!active) return;

        setUser(
          profile || {
            id: session?.user?.id || 'demo_user',
            name:
              session?.user?.user_metadata?.full_name || 'Aarav Sharma (CSE Cohort)',
            email: session?.user?.email || 'aspirant@gyankunj.in',
          }
        );

        const mergedQuizzes =
          quizData && quizData.length > 0
            ? (quizData as Quiz[])
            : (FALLBACK_QUIZZES as unknown as Quiz[]);
        setQuizzes(mergedQuizzes);

        let localAttempts: Attempt[] = [];
        try {
          localAttempts = JSON.parse(
            window.localStorage.getItem('gyankunj-local-attempts') || '[]'
          );
        } catch {
          // ignore
        }

        const mergedAttempts =
          attemptData && attemptData.length > 0
            ? [...localAttempts, ...(attemptData as Attempt[])]
            : localAttempts.length > 0
            ? localAttempts
            : (FALLBACK_ATTEMPTS as unknown as Attempt[]);

        setAttempts(mergedAttempts);
        setResourceCount(count || 4);
=======
        if (!session) {
          window.location.href = '/';
          return;
        }
        const [
          { data: profile },
          { data: quizData },
          { data: attemptData },
          { count },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          supabase
            .from('quizzes')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('attempts')
            .select(
              'id,quiz_id,quiz_title,category,score,correct,wrong,skipped,total,completed_at'
            )
            .eq('user_id', session.user.id)
            .order('completed_at', { ascending: false }),
          supabase.from('resources').select('*', { count: 'exact', head: true }),
        ]);
        if (!active) return;
        if (
          profile?.role === 'admin' ||
          session.user.email === 'kshitiz2007@gmail.com' ||
          session.user.email === 'admin@civilprep.in'
        ) {
          window.location.href = '/admin';
          return;
        }
        setUser(
          profile || {
            id: session.user.id,
            name: session.user.user_metadata?.full_name,
            email: session.user.email,
          }
        );
        setQuizzes((quizData || []) as Quiz[]);
        setAttempts((attemptData || []) as Attempt[]);
        setResourceCount(count || 0);
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83

        try {
          const savedNotice = window.localStorage.getItem(
            'gyankunj-admin-broadcast'
          );
          if (savedNotice) setBroadcastNotice(savedNotice);
        } catch {
          // ignore
        }
<<<<<<< HEAD
      } catch {
        if (active) {
          setUser({
            id: 'demo_user',
            name: 'Aarav Sharma',
            email: 'aspirant@gyankunj.in',
          });
          setQuizzes(FALLBACK_QUIZZES as unknown as Quiz[]);
          setAttempts(FALLBACK_ATTEMPTS as unknown as Attempt[]);
        }
=======
      } catch (error) {
        console.error('Dashboard data could not be loaded:', error);
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [focusRunning]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

<<<<<<< HEAD
  const launchCustomDrill = () => {
    const pool: any[] = [];
    const sourceList =
      quizzes.length > 0 ? quizzes : (FALLBACK_QUIZZES as unknown as Quiz[]);

    sourceList.forEach((q) => {
      if (
        drillSubject === 'All Subjects' ||
        (q.category || '').toLowerCase() === drillSubject.toLowerCase()
      ) {
        (q.questions || []).forEach((item: any) => {
          pool.push({ ...item, subject: q.category || 'General Studies' });
        });
      }
    });

    const selectedQuestions = (
      pool.length > 0 ? pool : FALLBACK_QUIZZES.flatMap((q) => q.questions)
    ).slice(0, drillCount);

    const drillId = `custom-drill-${Date.now()}`;
    const customQuiz = {
      id: drillId,
      title: `Custom Smart Drill — ${drillSubject} (${selectedQuestions.length} Qs)`,
      category: drillSubject === 'All Subjects' ? 'GS Mixed' : drillSubject,
      time_limit: Math.max(5, selectedQuestions.length * 2),
      positive_marks: 2.0,
      negative_marking: 0.66,
      questions: selectedQuestions,
    };

    try {
      window.localStorage.setItem(
        `gyankunj-custom-quiz-${drillId}`,
        JSON.stringify(customQuiz)
      );
    } catch {
      // ignore
    }
    setShowDrillModal(false);
    router.push(`/quiz/${drillId}`);
  };

=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
  const average = attempts.length
    ? Math.round(
        attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) /
          attempts.length
      )
    : 0;

<<<<<<< HEAD
=======
  // Calculate UPSC Accuracy & Negative Bleed across attempts
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
  const accuracyStats = useMemo(() => {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalQuestions = 0;
    attempts.forEach((a) => {
      totalCorrect += Number(a.correct || 0);
      totalWrong += Number(a.wrong || 0);
      totalQuestions += Number(a.total || 0);
    });
    const totalAttempted = totalCorrect + totalWrong;
    const accuracy = totalAttempted
      ? Math.round((totalCorrect / totalAttempted) * 100)
      : average;
    const netMarksLost = +(totalWrong * 0.66).toFixed(1);
    return {
      accuracy,
      netMarksLost,
      totalCorrect,
      totalWrong,
      totalAttempted,
      totalQuestions,
    };
  }, [attempts, average]);

<<<<<<< HEAD
=======
  // Subject-wise mastery breakdown
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
  const subjectMastery = useMemo(() => {
    return GS_PILLARS.map((subject) => {
      const subAttempts = attempts.filter(
        (a) =>
          (a.category || '').toLowerCase() === subject.toLowerCase() ||
          (a.quiz_title || '').toLowerCase().includes(subject.toLowerCase())
      );
      const avg = subAttempts.length
        ? Math.round(
            subAttempts.reduce((s, a) => s + Number(a.score || 0), 0) /
              subAttempts.length
          )
        : null;
      return { subject, count: subAttempts.length, avg };
    });
  }, [attempts]);

  const recentScores = useMemo(() => attempts.slice(0, 7).reverse(), [attempts]);
  const completedIds = new Set(attempts.map((item) => item.quiz_id));
  const firstName =
    user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Aspirant';
  const focusFormatted = `${String(Math.floor(focusSeconds / 60)).padStart(
    2,
    '0'
  )}:${String(focusSeconds % 60).padStart(2, '0')}`;

  if (loading)
    return (
      <div className="app-theme grid min-h-screen place-items-center">
        <Loader2 className="h-9 w-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );

  return (
    <div className="app-theme text-[var(--app-text)]">
      {/* Desktop Sidebar */}
      <aside className="theme-surface-solid fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--app-border)] px-5 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-[var(--app-accent)]">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold tracking-tight leading-none">Gyankunj IAS</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
              Aspirant Sanctuary
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5">
          <NavItem
            icon={Activity}
            label="Study Sanctuary"
            active
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
          <NavItem
            icon={Layers}
            label="Prelims Test Series"
            onClick={() => router.push('/quizzes')}
          />
          <NavItem
<<<<<<< HEAD
            icon={Zap}
            label="Custom Smart Drill"
            onClick={() => setShowDrillModal(true)}
          />
          <NavItem
=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
            icon={FileText}
            label="Study Compendiums"
            onClick={() => router.push('/resources')}
          />
          <NavItem
            icon={History}
            label="Evaluation Archive"
            onClick={() => router.push('/history')}
          />
          <NavItem
            icon={Trophy}
            label="All-India Merit List"
            onClick={() => router.push('/leaderboard')}
          />
        </nav>

        {/* Calm Deep Focus Widget inside Sidebar */}
        <div className="mt-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
              Calm Study Timer
            </span>
            <Clock3 className="h-3.5 w-3.5 text-[var(--app-muted)]" />
          </div>
<<<<<<< HEAD
          <p className="mt-2 font-mono-tabular text-2xl font-bold tracking-tight">
=======
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight">
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
            {focusFormatted}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
            25-min distraction-free GS revision block
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setFocusRunning((r) => !r)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3 py-2 text-xs font-bold text-slate-950 transition hover:opacity-90"
            >
              {focusRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Start Focus
                </>
              )}
            </button>
            <button
              onClick={() => {
                setFocusRunning(false);
                setFocusSeconds(25 * 60);
              }}
              className="rounded-xl border border-[var(--app-border)] p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
              title="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-[var(--app-border)] pt-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--app-accent-soft)] text-sm font-bold text-[var(--app-accent)]">
            {firstName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.name || firstName}
            </p>
            <p className="truncate text-[11px] text-[var(--app-muted)]">
              CSE Target Cohort
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-6 md:ml-64 md:px-10 md:py-9">
        {/* Top Header */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent)]">
              Civil Services Academic Sanctuary
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Steady progress, {firstName}.
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Consistent daily revision and negative-marking discipline build
              Prelims confidence.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
<<<<<<< HEAD
            <button
              onClick={() => setShowDrillModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3.5 py-2 text-xs font-bold text-slate-950 hover:opacity-90 transition"
            >
              <Sliders className="h-3.5 w-3.5" /> Custom Smart Drill
            </button>
            <ThemeSelector />
=======
            <ThemeSelector />
            <button
              onClick={logout}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2.5 text-[var(--app-muted)] md:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
          </div>
        </header>

        {/* Optional Institutional Broadcast Notice */}
        {broadcastNotice && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-4 py-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--app-accent)]" />
              <span>
                <strong>Academic Notice:</strong> {broadcastNotice}
              </span>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <section className="theme-surface relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
<<<<<<< HEAD
                <Compass className="h-3.5 w-3.5" /> UPSC CSE Prelims CBT Engine v3.0
              </span>
              <h2 className="mt-3.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Master accuracy, statement deduction & 50-50 EV before speed.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
                In UPSC Prelims, avoiding 6 unnecessary negative guesses saves 4
                full marks. Use our upgraded CBT engine with interactive
                statement True/False tags, option strike-through, and live
                Expected Value (EV) guidance.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/quiz/upsc-gs1-polity-01')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:opacity-90"
                >
                  Launch Polity Simulator <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDrillModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 text-sm font-semibold hover:border-[var(--app-accent)]"
                >
                  <Zap className="h-4 w-4 text-[var(--app-accent)]" /> Build
                  Custom Drill
=======
                <Compass className="h-3.5 w-3.5" /> UPSC CSE Prelims Readiness
              </span>
              <h2 className="mt-3.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Master accuracy and elimination before speed.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
                In UPSC Prelims, avoiding 6 unnecessary negative guesses saves 4
                full marks. Use our calm examination engine with option
                strike-through and conviction tagging on every test.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/quizzes')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:opacity-90"
                >
                  Enter Prelims Test Series <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 text-sm font-semibold hover:border-[var(--app-accent)]"
                >
                  <Trophy className="h-4 w-4 text-[var(--app-accent)]" /> All-India
                  Merit List
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--app-muted)]">
<<<<<<< HEAD
                    Strike Accuracy
=======
                    Net Accuracy
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                  </span>
                  <Target className="h-4 w-4 text-[var(--app-accent)]" />
                </div>
                <p className="mt-3 text-2xl font-bold">
                  {attempts.length ? `${accuracyStats.accuracy}%` : '—'}
                </p>
                <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                  Target ≥ 70% for safe cutoff
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--app-muted)]">
                    Penalty Bleed
                  </span>
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-3 text-2xl font-bold">
                  {attempts.length ? `-${accuracyStats.netMarksLost}` : '0.0'}
                </p>
                <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                  Marks lost to -0.66 penalty
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics Strip */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Tests Evaluated"
            value={attempts.length}
            hint="Completed Prelims & Sectional modules"
          />
          <StatCard
            icon={TrendingUp}
            label="Mean Score"
            value={attempts.length ? `${average}%` : '—'}
            hint={
              average >= 55
                ? 'Above institutional cutoff (50%)'
                : 'Focus on revision & elimination'
            }
          />
          <StatCard
            icon={Layers}
            label="Active Test Papers"
            value={quizzes.length}
            hint="Bilingual EN / HI papers ready"
          />
          <StatCard
            icon={FileText}
            label="Study Compendiums"
            value={resourceCount}
            hint="Standard notes & PIB digests"
          />
        </section>

        {/* Main 2-Column Analytical Section */}
        <div className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          {/* Recommended Practice Modules */}
          <section className="theme-surface rounded-3xl p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  Recommended GS & CSAT Papers
                </h2>
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">
<<<<<<< HEAD
                  Structured practice with UPSC 1/3rd negative marking & Tutor
                  mode
=======
                  Structured practice with UPSC 1/3rd negative marking enabled
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                </p>
              </div>
              <button
                onClick={() => router.push('/quizzes')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-accent)] hover:underline"
              >
                Full Test Library <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
              {quizzes.map((quiz) => {
                const done = completedIds.has(quiz.id);
<<<<<<< HEAD
                const mins = quiz.time_limit || quiz.duration || 20;
=======
                const mins = quiz.time_limit || quiz.duration || 30;
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                const qCount = Array.isArray(quiz.questions)
                  ? quiz.questions.length
                  : 0;
                return (
                  <article
                    key={quiz.id}
                    className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition hover:border-[var(--app-accent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-accent)]">
                        {quiz.category || 'GS Paper I'}
                      </span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--app-accent)]">
                          <CheckCircle2 className="h-3 w-3" /> Evaluated
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[var(--app-muted)]">
                          +2.0 / -0.66
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 line-clamp-1 font-bold">{quiz.title}</h3>
                    <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-[var(--app-muted)]">
                      {quiz.description ||
                        'Bilingual statement-based questions with detailed faculty explanations.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--app-border)] pt-3 text-xs text-[var(--app-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" /> {mins}m · {qCount} Qs
                      </span>
                      <button
                        onClick={() => router.push(`/quiz/${quiz.id}`)}
                        className="inline-flex items-center gap-1 font-bold text-[var(--app-accent)] hover:underline"
                      >
                        {done ? 'Re-attempt' : 'Begin Paper'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
<<<<<<< HEAD
=======
              {quizzes.length === 0 && (
                <p className="col-span-2 rounded-2xl border border-dashed border-[var(--app-border)] p-8 text-center text-sm text-[var(--app-muted)]">
                  New Prelims and Sectional mock papers will appear here once
                  published by Faculty.
                </p>
              )}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
            </div>
          </section>

          {/* Right Column: Score Trend + GS Subject Proficiency */}
          <div className="space-y-6">
            <section className="theme-surface rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">
                    Performance Trajectory
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                    Last {recentScores.length || 0} evaluations vs 50% qualifying
                    benchmark
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-[var(--app-accent)]" />
              </div>

              {recentScores.length ? (
                <div className="mt-5">
                  <div className="flex h-32 items-end gap-2.5 border-b border-[var(--app-border)] pb-2">
                    {recentScores.map((a) => (
                      <div
                        key={a.id}
                        className="group flex h-full flex-1 flex-col justify-end"
                      >
                        <div className="mb-1 text-center text-[10px] font-semibold text-[var(--app-muted)]">
                          {a.score}%
                        </div>
                        <div
                          className="w-full rounded-t-lg bg-[var(--app-accent)] transition-all group-hover:opacity-80"
                          style={{
                            height: `${Math.max(
<<<<<<< HEAD
                              12,
=======
                              10,
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                              Math.min(100, Number(a.score) || 0)
                            )}%`,
                          }}
                          title={`${a.quiz_title || 'Test'} · ${a.score}%`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-[var(--app-muted)]">
                    <span>Earlier Attempts</span>
                    <span>Latest Evaluation</span>
                  </div>
                </div>
<<<<<<< HEAD
              ) : null}
=======
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--app-border)] p-6 text-center text-xs text-[var(--app-muted)]">
                  Complete your first test paper to unlock your score trajectory
                  and cutoff comparison.
                </div>
              )}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
            </section>

            {/* GS Pillar Balance */}
            <section className="theme-surface rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
<<<<<<< HEAD
                  <h2 className="text-base font-bold">GS Syllabus Coverage</h2>
=======
                  <h2 className="text-base font-bold">
                    GS Syllabus Coverage
                  </h2>
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                  <p className="text-xs text-[var(--app-muted)]">
                    Subject-wise average across UPSC pillars
                  </p>
                </div>
                <Award className="h-4 w-4 text-[var(--app-accent)]" />
              </div>
              <div className="space-y-2.5">
                {subjectMastery.map((item) => (
                  <div key={item.subject} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{item.subject}</span>
                      <span className="text-[var(--app-muted)]">
                        {item.avg !== null
                          ? `${item.avg}% (${item.count} tests)`
<<<<<<< HEAD
                          : 'Ready for drill'}
=======
                          : 'Not attempted'}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--app-accent)] transition-all"
<<<<<<< HEAD
                        style={{
                          width: `${item.avg ?? 12}%`,
                          opacity: item.avg !== null ? 1 : 0.25,
                        }}
=======
                        style={{ width: `${item.avg ?? 6}%`, opacity: item.avg !== null ? 1 : 0.25 }}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
<<<<<<< HEAD
      </main>

      {/* Custom Smart Drill Builder Modal */}
      {showDrillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="theme-surface-solid w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
              <div className="flex items-center gap-2 text-[var(--app-accent)]">
                <Zap className="h-5 w-5" />
                <h3 className="text-lg font-bold text-[var(--app-text)]">
                  Custom Smart Drill Builder
                </h3>
              </div>
              <button
                onClick={() => setShowDrillModal(false)}
                className="rounded-lg p-1 text-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Select UPSC GS Pillar
                </label>
                <select
                  value={drillSubject}
                  onChange={(e) => setDrillSubject(e.target.value)}
                  className="glass-input w-full font-semibold"
                >
                  <option value="All Subjects">
                    All GS Pillars (Mixed Full Syllabus)
                  </option>
                  {GS_PILLARS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDrillCount(n)}
                      className={`rounded-xl border py-2.5 font-bold transition ${
                        drillCount === n
                          ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-slate-950'
                          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)]'
                      }`}
                    >
                      {n} Questions
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={launchCustomDrill}
                className="mt-2 w-full rounded-xl bg-[var(--app-accent)] py-3 text-sm font-bold text-slate-950 hover:opacity-90 transition"
              >
                Synthesize & Start Smart Drill
              </button>
            </div>
          </div>
        </div>
      )}
=======

        {/* Recent Evaluations Table */}
        <section className="theme-surface mt-6 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] p-5 sm:px-6">
            <div>
              <h2 className="font-bold">Recent Evaluation Log</h2>
              <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                Review detailed solutions and bilingual faculty explanations
              </p>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-accent)] hover:underline"
            >
              Complete Archive <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {attempts.length ? (
            <div className="divide-y divide-[var(--app-border)]">
              {attempts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 hover:bg-[var(--app-surface-muted)] transition"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {a.quiz_title || 'Mock Evaluation'}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                        {a.completed_at
                          ? new Date(a.completed_at).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : 'Recently evaluated'}
                        {a.correct !== undefined &&
                          ` · ${a.correct} Correct · ${a.wrong || 0} Wrong`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--app-accent)]">
                      {a.score}%
                    </span>
                    <button
                      onClick={() => router.push(`/quiz/${a.quiz_id}/result`)}
                      className="rounded-xl border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--app-accent)]"
                    >
                      Review Paper
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-[var(--app-muted)]">
              No evaluations recorded yet. Attempt a sectional or full-length
              paper to generate your diagnostic profile.
            </p>
          )}
        </section>
      </main>
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83

      {/* Mobile Bottom Navigation */}
      <nav className="theme-surface-solid fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl p-2 shadow-2xl md:hidden">
        <MobileItem
          icon={Activity}
          label="Sanctuary"
          active
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
        <MobileItem
          icon={Layers}
          label="Tests"
          onClick={() => router.push('/quizzes')}
        />
        <MobileItem
<<<<<<< HEAD
          icon={Zap}
          label="Drill"
          onClick={() => setShowDrillModal(true)}
=======
          icon={FileText}
          label="Notes"
          onClick={() => router.push('/resources')}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
        />
        <MobileItem
          icon={History}
          label="Results"
          onClick={() => router.push('/history')}
        />
        <MobileItem
          icon={Trophy}
          label="Merit"
          onClick={() => router.push('/leaderboard')}
        />
      </nav>

      <StudentChatWidget user={user} />
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Activity;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
        active
          ? 'bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)] border border-[var(--app-border)]'
          : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MobileItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Activity;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${
        active ? 'text-[var(--app-accent)]' : 'text-[var(--app-muted)]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="theme-surface rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--app-muted)]">
          {label}
        </span>
        <Icon className="h-4 w-4 text-[var(--app-accent)]" />
      </div>
      <p className="mt-2.5 truncate text-2xl font-bold">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[var(--app-muted)]">
        {hint}
      </p>
    </div>
  );
}
