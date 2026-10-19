'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  History,
  Trophy,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Award,
  Activity,
  Layers,
  FileText,
  LogOut,
  Landmark,
} from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          window.location.href = '/';
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUser(profile);

        const { data } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        if (data) setAttempts(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );
  }

  return (
    <div className="app-theme min-h-screen text-[var(--app-text)]">
      {/* Desktop Sidebar */}
      <aside className="theme-surface-solid fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--app-border)] px-5 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-[var(--app-accent)]">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold tracking-tight leading-none">Gyankunj IAS</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
              Evaluation Archive
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Activity className="h-4 w-4" /> Study Sanctuary
          </button>
          <button
            onClick={() => router.push('/quizzes')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Layers className="h-4 w-4" /> Prelims Test Series
          </button>
          <button
            onClick={() => router.push('/resources')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <FileText className="h-4 w-4" /> Study Compendiums
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)] border border-[var(--app-border)]">
            <History className="h-4 w-4" /> Evaluation Archive
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Trophy className="h-4 w-4" /> All-India Merit List
          </button>
        </nav>

        <div className="mt-5 flex items-center gap-3 border-t border-[var(--app-border)] pt-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--app-accent-soft)] text-sm font-bold text-[var(--app-accent)]">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.name || 'Aspirant'}
            </p>
            <p className="truncate text-[11px] text-[var(--app-muted)]">
              Evaluation Dossier
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-28 pt-6 md:ml-64 md:px-10 md:py-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2.5 text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent)]">
                OMR & Performance Dossier
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Evaluation Archive
              </h1>
            </div>
          </div>
          <ThemeSelector />
        </header>

        <div className="theme-surface rounded-3xl overflow-hidden divide-y divide-[var(--app-border)]">
          {attempts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Trophy className="w-10 h-10 text-[var(--app-muted)] mb-3 opacity-60" />
              <h3 className="text-base font-bold mb-1">
                No completed evaluations yet
              </h3>
              <p className="text-[var(--app-muted)] text-xs mb-5">
                Attempt a sectional or full-length Prelims paper to populate
                your archive.
              </p>
              <button
                onClick={() => router.push('/quizzes')}
                className="px-5 py-2.5 bg-[var(--app-accent)] text-slate-950 text-xs font-bold rounded-xl"
              >
                Browse Test Series
              </button>
            </div>
          ) : (
            attempts.map((attempt) => {
              const isPassing = attempt.score >= 50;
              const netMarks = Math.max(
                0,
                +(
                  Number(attempt.correct || 0) * 2 -
                  Number(attempt.wrong || 0) * 0.66
                ).toFixed(2)
              );
              const totalAttempted =
                Number(attempt.correct || 0) + Number(attempt.wrong || 0);
              const accuracy = totalAttempted
                ? Math.round(
                    (Number(attempt.correct || 0) / totalAttempted) * 100
                  )
                : attempt.score;

              return (
                <div
                  key={attempt.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[var(--app-surface-muted)] transition"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`p-3 rounded-2xl shrink-0 border ${
                        isPassing
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">
                        {attempt.quiz_title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-[var(--app-muted)]">
                        <span>
                          {new Date(attempt.completed_at).toLocaleDateString(
                            'en-IN',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          +{attempt.correct} Correct
                        </span>
                        <span>·</span>
                        <span className="text-rose-400 font-semibold">
                          -{attempt.wrong} Wrong
                        </span>
                        <span>·</span>
                        <span>{accuracy}% Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-5 border-t sm:border-t-0 border-[var(--app-border)] pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black text-[var(--app-accent)]">
                        {attempt.score}%
                      </p>
                      <p className="text-[11px] text-[var(--app-muted)]">
                        Net: {netMarks} Marks
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        router.push(`/quiz/${attempt.quiz_id}/result`)
                      }
                      className="px-4 py-2 bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)] font-bold text-xs border border-[var(--app-border)] rounded-xl transition flex items-center gap-1.5"
                    >
                      Solution Key <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}