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
  Sparkles,
  Filter,
  Zap,
  Bookmark,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { FALLBACK_ATTEMPTS, FALLBACK_QUIZZES } from '@/lib/mockData';
import { openWatermarkStudio } from '@/lib/pdfExporter';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchResult() {
      try {
        // 1. Check local storage first for immediate post-test evaluation
        try {
          const localAttempt = window.localStorage.getItem(
            `gyankunj-latest-attempt-${quizId}`
          );
          if (localAttempt) {
            setAttempt(JSON.parse(localAttempt));
            setLoading(false);
            return;
          }
        } catch {
          // ignore
        }

        // 2. Otherwise query Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const { data } = await supabase
            .from('attempts')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('quiz_id', quizId)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setAttempt(data);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to demo evaluation so the page never dead-ends
        setAttempt(FALLBACK_ATTEMPTS[0]);
      } catch {
        setAttempt(FALLBACK_ATTEMPTS[0]);
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

    const details: any[] = attempt.details || [];
    const byConfidence = {
      sure: { total: 0, correct: 0, netMarks: 0 },
      fifty: { total: 0, correct: 0, netMarks: 0 },
      guess: { total: 0, correct: 0, netMarks: 0 },
    };
    let totalTimeSeconds = 0;

    details.forEach((d) => {
      totalTimeSeconds += Number(d.time_spent || 0);
      const c = d.confidence as 'sure' | 'fifty' | 'guess' | undefined;
      if (c && byConfidence[c]) {
        byConfidence[c].total += 1;
        if (d.isCorrect) {
          byConfidence[c].correct += 1;
          byConfidence[c].netMarks = +(byConfidence[c].netMarks + 2.0).toFixed(2);
        } else if (d.selected_answer !== 'Skipped') {
          byConfidence[c].netMarks = +(byConfidence[c].netMarks - 0.66).toFixed(2);
        }
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

  const launchErrorRemediationDrill = () => {
    if (!attempt?.details) return;
    const missedDetails = attempt.details.filter((d: any) => !d.isCorrect);
    if (!missedDetails.length) return;

    const sourceQuiz =
      FALLBACK_QUIZZES.find((q) => q.id === quizId) || FALLBACK_QUIZZES[0];

    const remediationQuestions = missedDetails.map((d: any, i: number) => {
      const origQ = sourceQuiz.questions.find((q) => q.id === d.question_id);
      return (
        origQ || {
          id: d.question_id || `rem_${i}`,
          text: d.question,
          textHi: d.question_hi,
          options: d.options || [
            d.correct_answer,
            d.selected_answer !== 'Skipped' ? d.selected_answer : 'Option B',
            'None of the above',
            'All of the above',
          ],
          optionsHi: d.options_hi,
          correct: d.correct_index ?? 0,
          explanation: d.explanation,
          explanationHi: d.explanation_hi,
        }
      );
    });

    const drillId = `remediation-${Date.now()}`;
    const customQuiz = {
      id: drillId,
      title: `Remediation Drill: ${attempt.quiz_title}`,
      category: attempt.category || 'General Studies',
      time_limit: Math.max(5, remediationQuestions.length * 2),
      positive_marks: 2.0,
      negative_marking: 0.66,
      questions: remediationQuestions,
    };

    try {
      window.localStorage.setItem(
        `gyankunj-custom-quiz-${drillId}`,
        JSON.stringify(customQuiz)
      );
    } catch {
      // ignore
    }
    router.push(`/quiz/${drillId}`);
  };

  if (loading)
    return (
      <div className="app-theme grid min-h-screen place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--app-accent)]" />
      </div>
    );

  if (!attempt || !analytics) return null;

  const isPassing = attempt.score >= 50;
  const text = (en?: string | null, hi?: string | null) => {
    const hindi = hi || en;
    if (language === 'hi') return hindi || '—';
    if (language === 'en') return en || hindi || '—';
    return (
      <>
        {en && <span className="block whitespace-pre-line">{en}</span>}
        {hi && (
          <span className="mt-1.5 block font-hindi text-[var(--app-muted)] whitespace-pre-line">
            {hi}
          </span>
        )}
      </>
    );
  };

  const filteredDetails = (attempt.details || []).filter((item: any) => {
    const skipped = item.selected_answer === 'Skipped';
    if (filterMode === 'correct' && !item.isCorrect) return false;
    if (filterMode === 'wrong' && (item.isCorrect || skipped)) return false;
    if (filterMode === 'skipped' && !skipped) return false;
    if (
      searchQuery.trim() &&
      !`${item.question} ${item.explanation || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <main className="app-theme min-h-screen px-4 py-6 sm:px-6 md:py-10 text-[var(--app-text)]">
      <div className="mx-auto max-w-5xl pb-12">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-text)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sanctuary
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const quizObj =
                  FALLBACK_QUIZZES.find((q) => String(q.id) === String(attempt.quiz_id)) ||
                  FALLBACK_QUIZZES[0];
                openWatermarkStudio(quizObj, 'paper', attempt.details);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-400 hover:text-slate-950 transition"
            >
              📄 Export Question Paper PDF
            </button>
            <button
              type="button"
              onClick={() => {
                const quizObj =
                  FALLBACK_QUIZZES.find((q) => String(q.id) === String(attempt.quiz_id)) ||
                  FALLBACK_QUIZZES[0];
                openWatermarkStudio(quizObj, 'solution', attempt.details);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2.5 text-xs font-extrabold text-sky-300 hover:bg-sky-400 hover:text-slate-950 transition"
            >
              🔑 Export Answer Key PDF
            </button>
            {analytics.wrong + analytics.skipped > 0 && (
              <button
                onClick={launchErrorRemediationDrill}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
              >
                <Zap className="h-4 w-4" /> Retry Wrong & Skipped (
                {analytics.wrong + analytics.skipped})
              </button>
            )}
            <ThemeSelector />
          </div>
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
                  : 'Below Cutoff — Focus on Elimination & Negative Control'}
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
              <p className="mt-1 font-mono-tabular text-3xl font-black text-[var(--app-accent)]">
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

          {/* Conviction & Elimination Calibration Matrix */}
          <div className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--app-accent)]">
                <Sparkles className="h-4 w-4" /> Attempt Conviction & Net Marks
                Yield Matrix
              </div>
              <span className="text-[11px] text-[var(--app-muted)]">
                Evaluates whether 50-50 elimination netted positive marks
              </span>
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
                      <span
                        className={`font-mono-tabular font-bold ${
                          bucket.data.netMarks >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {bucket.data.netMarks >= 0
                          ? `+${bucket.data.netMarks}m`
                          : `${bucket.data.netMarks}m`}
                      </span>
                    </div>
                    <p className="mt-1 text-[var(--app-muted)]">
                      {bucket.data.correct}/{bucket.data.total} correct ({rate}%
                      accuracy)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Answer Review & Explanations Section */}
        <section>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search solutions..."
                  className="glass-input pl-8 pr-3 py-1.5 text-xs w-44"
                />
              </div>

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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">
                            Question {index + 1}
                          </span>
                          {item.topic && (
                            <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-panel)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-text)]">
                              {item.topic}
                            </span>
                          )}
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
                            <span className="inline-flex items-center gap-1 font-mono-tabular">
                              <Clock3 className="h-3.5 w-3.5" /> {item.time_spent}s
                            </span>
                          )}
                          <span
                            className={`font-mono-tabular font-bold ${
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
                            Faculty Value-Add & Concept Notes
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
            <RotateCcw className="mr-2 inline h-4 w-4" /> Re-attempt Full Paper
          </button>
        </div>
      </div>
    </main>
  );
}
