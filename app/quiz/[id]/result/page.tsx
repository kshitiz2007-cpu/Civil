'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Home,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Languages,
  Target,
  Clock3,
  ShieldAlert,
  Sparkles,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ThemeSelector from '@/components/ThemeSelector';

type ReviewLanguage = 'en' | 'hi' | 'both';
type FilterMode = 'all' | 'wrong' | 'skipped' | 'correct';

export default function QuizResultPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<ReviewLanguage>('both');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  useEffect(() => {
    async function fetchResult() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = '/';
          return;
        }
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('quiz_id', quizId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();
        if (error || !data) console.error('Could not fetch result:', error);
        else setAttempt(data);
      } catch (err) {
        console.error('Error loading result:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [quizId]);

  const analytics = useMemo(() => {
    if (!attempt) return null;
    const total = Number(attempt.total || attempt.details?.length || 0);
    const correct = Number(attempt.correct || 0);
    const wrong = Number(attempt.wrong || 0);
    const skipped = Number(attempt.skipped || 0);
    const attempted = correct + wrong;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const maxMarks = total * 2;
    const positiveEarned = +(correct * 2).toFixed(2);
    const negativeLost = +(wrong * 0.66).toFixed(2);
    const netMarks = Math.max(0, +(positiveEarned - negativeLost).toFixed(2));

    // Confidence breakdown
    const details: any[] = attempt.details || [];
    const byConfidence = {
      sure: { total: 0, correct: 0 },
      fifty: { total: 0, correct: 0 },
      guess: { total: 0, correct: 0 },
    };
    let totalTimeSeconds = 0;

    details.forEach((d) => {
      totalTimeSeconds += Number(d.time_spent || 0);
      const c = d.confidence as 'sure' | 'fifty' | 'guess' | undefined;
      if (c && byConfidence[c]) {
        byConfidence[c].total += 1;
        if (d.isCorrect) byConfidence[c].correct += 1;
      }
    });

    return {
      total,
      correct,
      wrong,
      skipped,
      attempted,
      accuracy,
      maxMarks,
      positiveEarned,
      negativeLost,
      netMarks,
      byConfidence,
      totalTimeSeconds,
    };
  }, [attempt]);

  if (loading)
    return (
      <div className="app-theme grid min-h-screen place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--app-accent)]" />
      </div>
    );

  if (!attempt || !analytics)
    return (
      <main className="app-theme grid min-h-screen place-items-center p-4 text-center">
        <div className="theme-surface w-full max-w-md rounded-3xl p-8">
          <h1 className="mb-2 text-2xl font-bold">Evaluation Not Found</h1>
          <p className="mb-6 text-sm text-[var(--app-muted)]">
            We could not load your examination response sheet.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-xl bg-[var(--app-accent)] px-6 py-3 font-bold text-slate-950"
          >
            Return to Sanctuary
          </button>
        </div>
      </main>
    );

  const isPassing = attempt.score >= 50;
  const text = (en?: string | null, hi?: string | null) => {
    const hindi = hi || en;
    if (language === 'hi') return hindi || '—';
    if (language === 'en') return en || hindi || '—';
    return (
      <>
        {en && <span className="block">{en}</span>}
        {hi && (
          <span className="mt-1.5 block font-hindi text-[var(--app-muted)]">
            {hi}
          </span>
        )}
      </>
    );
  };

  const filteredDetails = (attempt.details || []).filter((item: any) => {
    const skipped = item.selected_answer === 'Skipped';
    if (filterMode === 'correct') return item.isCorrect;
    if (filterMode === 'wrong') return !item.isCorrect && !skipped;
    if (filterMode === 'skipped') return skipped;
    return true;
  });

  return (
    <main className="app-theme min-h-screen px-4 py-6 sm:px-6 md:py-10 text-[var(--app-text)]">
      <div className="mx-auto max-w-5xl pb-12">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-text)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sanctuary
          </button>
          <ThemeSelector />
        </div>

        {/* UPSC Prelims Analytical Scorecard */}
        <section className="theme-surface relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-9">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--app-border)] pb-6">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isPassing
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                {isPassing
                  ? 'Cleared Institutional Cutoff (≥50%)'
                  : 'Below Cutoff — Focus on Negative Control'}
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
                {attempt.quiz_title}
              </h1>
              {attempt.quiz_title_hi && (
                <p className="mt-1 font-hindi text-base text-[var(--app-muted)]">
                  {attempt.quiz_title_hi}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-4 text-center shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Net UPSC Marks
              </p>
              <p className="mt-1 text-3xl font-black text-[var(--app-accent)]">
                {analytics.netMarks}{' '}
                <span className="text-base font-medium text-[var(--app-muted)]">
                  / {analytics.maxMarks}
                </span>
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--app-muted)]">
                Net Score: {attempt.score}%
              </p>
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-muted)]">Accuracy</span>
              <p className="mt-1 text-2xl font-bold text-[var(--app-accent)]">
                {analytics.accuracy}%
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                {analytics.attempted}/{analytics.total} attempted
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-muted)]">
                Correct (+2.0)
              </span>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {analytics.correct}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                +{analytics.positiveEarned} marks
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-muted)]">
                Wrong (-0.66)
              </span>
              <p className="mt-1 text-2xl font-bold text-rose-400">
                {analytics.wrong}
              </p>
              <p className="mt-0.5 text-[11px] text-rose-300/80">
                -{analytics.negativeLost} penalty
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-muted)]">
                Unattempted
              </span>
              <p className="mt-1 text-2xl font-bold">{analytics.skipped}</p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                0 penalty bleed
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 col-span-2 sm:col-span-1">
              <span className="text-xs text-[var(--app-muted)]">
                Pacing Speed
              </span>
              <p className="mt-1 text-2xl font-bold">
                {analytics.total
                  ? `${Math.round(
                      analytics.totalTimeSeconds / analytics.total
                    )}s`
                  : '—'}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                Avg time / question
              </p>
            </div>
          </div>

          {/* Conviction & Elimination Matrix */}
          <div className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--app-accent)] mb-3">
              <Sparkles className="h-4 w-4" /> Attempt Conviction & Elimination
              Calibration
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              {(
                [
                  {
                    id: 'sure',
                    title: '100% Conviction',
                    data: analytics.byConfidence.sure,
                  },
                  {
                    id: 'fifty',
                    title: '50-50 Option Elimination',
                    data: analytics.byConfidence.fifty,
                  },
                  {
                    id: 'guess',
                    title: 'Calculated Guess',
                    data: analytics.byConfidence.guess,
                  },
                ] as const
              ).map((bucket) => {
                const rate = bucket.data.total
                  ? Math.round((bucket.data.correct / bucket.data.total) * 100)
                  : 0;
                return (
                  <div
                    key={bucket.id}
                    className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{bucket.title}</span>
                      <span className="text-[var(--app-accent)]">
                        {bucket.data.total ? `${rate}% Acc` : '—'}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--app-muted)]">
                      {bucket.data.correct} correct out of {bucket.data.total}{' '}
                      tagged questions
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Answer Review & Explanations Section */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Detailed Bilingual Solution Key
              </h2>
              <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                Verify statement logic and revise core concepts from faculty
                notes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-1 text-xs">
                <Filter className="ml-2 h-3.5 w-3.5 text-[var(--app-muted)]" />
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'wrong', label: `Wrong (${analytics.wrong})` },
                    { id: 'skipped', label: `Skipped (${analytics.skipped})` },
                    { id: 'correct', label: `Correct (${analytics.correct})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterMode(f.id)}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      filterMode === f.id
                        ? 'bg-[var(--app-accent)] text-slate-950'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Language Switcher */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-1 text-xs">
                <Languages className="ml-2 h-3.5 w-3.5 text-[var(--app-accent)]" />
                {(['both', 'en', 'hi'] as ReviewLanguage[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setLanguage(value)}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      language === value
                        ? 'bg-[var(--app-accent)] text-slate-950'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    {value === 'both'
                      ? 'EN + HI'
                      : value === 'en'
                      ? 'EN'
                      : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredDetails.map((item: any, index: number) => {
              const skipped = item.selected_answer === 'Skipped';
              const Icon = item.isCorrect
                ? CheckCircle2
                : skipped
                ? MinusCircle
                : XCircle;
              const borderStyle = item.isCorrect
                ? 'border-emerald-500/30'
                : skipped
                ? 'border-amber-500/30'
                : 'border-rose-500/35';

              return (
                <article
                  key={item.question_id || index}
                  className={`theme-surface rounded-3xl border p-5 sm:p-6 ${borderStyle}`}
                >
                  <div className="flex items-start gap-3.5">
                    <Icon
                      className={`mt-1 h-5 w-5 shrink-0 ${
                        item.isCorrect
                          ? 'text-emerald-400'
                          : skipped
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">
                            Question {index + 1}
                          </span>
                          {item.confidence && (
                            <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--app-accent)]">
                              {item.confidence === 'sure'
                                ? '100% Sure'
                                : item.confidence === 'fifty'
                                ? '50-50 Logic'
                                : 'Guess'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
                          {item.time_spent !== undefined && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" /> {item.time_spent}s
                            </span>
                          )}
                          <span
                            className={`font-bold ${
                              item.isCorrect
                                ? 'text-emerald-400'
                                : skipped
                                ? 'text-[var(--app-muted)]'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.isCorrect
                              ? '+2.00'
                              : skipped
                              ? '0.00'
                              : '-0.66'}
                          </span>
                        </div>
                      </div>

                      <h3 className="mb-4 text-base sm:text-lg font-semibold leading-relaxed">
                        {text(
                          item.question,
                          item.question_hi || item.questionHi
                        )}
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div
                          className={`rounded-2xl border p-3.5 ${
                            item.isCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/10'
                              : skipped
                              ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                              : 'border-rose-500/30 bg-rose-500/10'
                          }`}
                        >
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                            Your Response
                          </span>
                          <div className="font-semibold">
                            {text(
                              item.selected_answer,
                              item.selected_answer_hi ||
                                item.selectedAnswerHi ||
                                (skipped ? 'छोड़ा गया' : undefined)
                            )}
                          </div>
                        </div>

                        {!item.isCorrect && (
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              Official Key
                            </span>
                            <div className="font-semibold">
                              {text(
                                item.correct_answer,
                                item.correct_answer_hi || item.correctAnswerHi
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {(item.explanation ||
                        item.explanation_hi ||
                        item.explanationHi) && (
                        <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs sm:text-sm leading-relaxed">
                          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--app-accent)]">
                            Faculty Value-Add & Explanation
                          </span>
                          <div>
                            {text(
                              item.explanation,
                              item.explanation_hi || item.explanationHi
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push('/dashboard')}
            className="theme-surface flex-1 rounded-xl py-3.5 text-sm font-bold hover:border-[var(--app-accent)] transition"
          >
            <Home className="mr-2 inline h-4 w-4" /> Return to Sanctuary
          </button>
          <button
            onClick={() => router.push(`/quiz/${quizId}`)}
            className="flex-1 rounded-xl bg-[var(--app-accent)] py-3.5 text-sm font-bold text-slate-950 hover:opacity-90 transition"
          >
            <RotateCcw className="mr-2 inline h-4 w-4" /> Re-attempt Paper
          </button>
        </div>
      </div>
    </main>
  );
}
