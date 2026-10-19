'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  Languages,
  Loader2,
  Maximize2,
  Minimize2,
  Scissors,
  Send,
  ShieldCheck,
  SkipForward,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ThemeSelector from '@/components/ThemeSelector';

type ConfidenceLevel = 'sure' | 'fifty' | 'guess';
type LanguageMode = 'en' | 'hi' | 'split';

export default function QuizPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [eliminated, setEliminated] = useState<Record<string, number[]>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceLevel>>({});
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [calmTimerMode, setCalmTimerMode] = useState(false); // Hides ticking seconds to reduce anxiety
  const [zenMode, setZenMode] = useState(false); // Distraction-free reading focus mode
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [language, setLanguage] = useState<LanguageMode>('en');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadQuiz() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }
      const [{ data: profile }, { data: quizData, error }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(),
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
      ]);
      if (!alive) return;
      if (error || !quizData) {
        alert('This test paper is no longer available.');
        router.replace('/quizzes');
        return;
      }
      setUser(profile || { id: session.user.id, email: session.user.email });
      setQuiz(quizData);
      const firstId = quizData.questions?.[0]?.id;
      if (firstId) setVisited({ [firstId]: true });
      setTimeLeft((quizData.time_limit || 30) * 60);
      setLoading(false);
    }
    loadQuiz();
    return () => {
      alive = false;
    };
  }, [quizId, router]);

  // Countdown + Per-Question Time Telemetry
  const questions = quiz?.questions || [];
  const question = questions[current];

  useEffect(() => {
    if (question?.id) {
      setVisited((prev) => ({ ...prev, [question.id]: true }));
    }
  }, [current, question?.id]);

  useEffect(() => {
    if (loading || submitting || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => (value <= 1 ? 0 : value - 1));
      if (question?.id) {
        setTimeSpentMap((prev) => ({
          ...prev,
          [question.id]: (prev[question.id] || 0) + 1,
        }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, submitting, timeLeft, question?.id]);

  useEffect(() => {
    if (!loading && timeLeft === 0 && quiz) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, quiz]);

  const positiveMarks = Number(quiz?.positive_marks || 2.0);
  const negativeMarks =
    quiz?.negative_marking !== undefined ? Number(quiz.negative_marking) : 0.66;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;
  const hasHindi = Boolean(question?.textHi);

  const formattedTime = calmTimerMode
    ? `${Math.ceil(timeLeft / 60)} min left`
    : `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(
        timeLeft % 60
      ).padStart(2, '0')}`;

  const currentQuestionTime = question?.id ? timeSpentMap[question.id] || 0 : 0;

  const toggleEliminateOption = (qId: string, optIndex: number) => {
    setEliminated((prev) => {
      const existing = prev[qId] || [];
      const isEliminated = existing.includes(optIndex);
      const next = isEliminated
        ? existing.filter((i) => i !== optIndex)
        : [...existing, optIndex];
      return { ...prev, [qId]: next };
    });
    // If the option was selected and just got eliminated, clear selection
    if (answers[qId] === optIndex) {
      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const clearResponse = () => {
    if (!question?.id) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[question.id];
      return copy;
    });
  };

  const selectOption = (optIndex: number) => {
    if (!question?.id) return;
    // If option is struck out, unstrike it first or ignore
    if ((eliminated[question.id] || []).includes(optIndex)) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optIndex }));
    if (!confidence[question.id]) {
      setConfidence((prev) => ({ ...prev, [question.id]: 'sure' }));
    }
  };

  const goNext = () =>
    setCurrent((value) => Math.min(value + 1, questions.length - 1));
  const goPrevious = () => setCurrent((value) => Math.max(value - 1, 0));
  const skip = () => {
    if (current < questions.length - 1) goNext();
  };

  async function submit() {
    if (!quiz || !user || submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let rawMarks = 0;
      const maxMarks = questions.length * positiveMarks;

      const details = questions.map((item: any) => {
        const choice = answers[item.id];
        const isCorrect = choice === item.correct;
        let marksAwarded = 0;
        if (choice === undefined) {
          skipped += 1;
        } else if (isCorrect) {
          correct += 1;
          marksAwarded = positiveMarks;
        } else {
          wrong += 1;
          marksAwarded = -negativeMarks;
        }
        rawMarks += marksAwarded;

        return {
          question_id: item.id,
          question: item.text,
          question_hi: item.textHi || null,
          selected_answer:
            choice === undefined ? 'Skipped' : item.options[choice],
          selected_answer_hi:
            choice === undefined ? null : item.optionsHi?.[choice] || null,
          correct_answer: item.options[item.correct],
          correct_answer_hi: item.optionsHi?.[item.correct] || null,
          isCorrect,
          marks_awarded: +marksAwarded.toFixed(2),
          confidence: confidence[item.id] || (choice !== undefined ? 'sure' : null),
          eliminated_count: (eliminated[item.id] || []).length,
          time_spent: timeSpentMap[item.id] || 0,
          explanation: item.explanation || null,
          explanation_hi: item.explanationHi || null,
        };
      });

      const netScorePercent = maxMarks
        ? Math.max(0, Math.round((rawMarks / maxMarks) * 100))
        : 0;

      const attempt = {
        id: `a_${Date.now()}`,
        user_id: user.id,
        user_name: user.name || user.email || 'Aspirant',
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        quiz_title_hi: quiz.titleHi || '',
        category: quiz.category || 'General Studies',
        score: netScorePercent,
        correct,
        wrong,
        skipped,
        total: questions.length,
        details,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('attempts').insert([attempt]);
      if (error) throw error;
      window.location.href = `/quiz/${quiz.id}/result`;
    } catch (error: any) {
      alert(error.message || 'Could not submit your test paper. Please retry.');
      setSubmitting(false);
    }
  }

  // 5-State UPSC Question Palette Status
  const paletteStatus = useMemo(
    () =>
      questions.map((item: any) => {
        const hasAns = answers[item.id] !== undefined;
        const isMarked = marked.includes(item.id);
        const isVis = visited[item.id];
        if (hasAns && isMarked) return 'answered-marked';
        if (hasAns) return 'answered';
        if (isMarked) return 'marked';
        if (isVis) return 'visited';
        return 'unvisited';
      }),
    [answers, marked, visited, questions]
  );

  const counts = useMemo(() => {
    return {
      answered: paletteStatus.filter((s: string) => s === 'answered').length,
      answeredMarked: paletteStatus.filter((s: string) => s === 'answered-marked')
        .length,
      marked: paletteStatus.filter((s: string) => s === 'marked').length,
      visited: paletteStatus.filter((s: string) => s === 'visited').length,
      unvisited: paletteStatus.filter((s: string) => s === 'unvisited').length,
    };
  }, [paletteStatus]);

  if (loading)
    return (
      <div className="app-theme grid min-h-screen place-items-center">
        <Loader2 className="h-9 w-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );
  if (!quiz || !question) return null;

  const fontSizeClass =
    fontSize === 'xl'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : fontSize === 'lg'
      ? 'text-lg sm:text-xl leading-relaxed'
      : 'text-base sm:text-lg leading-relaxed';

  const currentEliminated = eliminated[question.id] || [];
  const currentConfidence = confidence[question.id] || 'sure';

  return (
    <div className="app-theme min-h-screen flex flex-col">
      {/* Calming Examination Header */}
      <header className="theme-surface-solid sticky top-0 z-30 border-b border-[var(--app-border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/quizzes')}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              ← Exit Hall
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                  {quiz.category || 'UPSC Prelims'}
                </span>
                <span className="text-xs text-[var(--app-muted)]">·</span>
                <span className="text-[11px] font-semibold text-[var(--app-muted)]">
                  +{positiveMarks.toFixed(1)} Correct / -{negativeMarks.toFixed(2)}{' '}
                  Negative
                </span>
              </div>
              <h1 className="line-clamp-1 text-sm font-bold">{quiz.title}</h1>
            </div>
          </div>

          {/* Right Controls: Font Size, Zen Focus, Theme, Calm Timer */}
          <div className="flex items-center gap-2">
            {/* Font scale pills */}
            <div className="hidden md:flex items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-0.5 text-xs">
              {(['base', 'lg', 'xl'] as const).map((sz, i) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`rounded-lg px-2 py-1 font-bold transition ${
                    fontSize === sz
                      ? 'bg-[var(--app-accent)] text-slate-950'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  {i === 0 ? 'A-' : i === 1 ? 'A' : 'A+'}
                </button>
              ))}
            </div>

            {/* Zen Focus Toggle */}
            <button
              onClick={() => setZenMode((z) => !z)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                zenMode
                  ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                  : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
              }`}
              title="Toggle Zen Focus Mode (hides side palette for calm reading)"
            >
              {zenMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" /> Standard View
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" /> Calm Focus
                </>
              )}
            </button>

            <ThemeSelector compact />

            {/* Calm Timer Pill */}
            <button
              onClick={() => setCalmTimerMode((c) => !c)}
              title="Click to toggle seconds display for reduced timer anxiety"
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-xs sm:text-sm font-bold transition ${
                timeLeft <= 180
                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-300'
                  : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)]'
              }`}
            >
              <Clock3 className="h-4 w-4 text-[var(--app-accent)]" />
              <span>{formattedTime}</span>
              {calmTimerMode ? (
                <EyeOff className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <Eye className="h-3.5 w-3.5 opacity-60" />
              )}
            </button>
          </div>
        </div>

        {/* Soft Progress Strip */}
        <div className="h-1 w-full bg-[var(--app-surface-muted)]">
          <div
            className="h-full bg-[var(--app-accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main
        className={`relative z-10 mx-auto w-full flex-1 px-4 py-6 sm:px-6 ${
          zenMode
            ? 'max-w-4xl'
            : 'grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'
        }`}
      >
        {/* Question Canvas */}
        <section className="flex flex-col justify-between">
          <div>
            {/* Question Metadata & Controls Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] px-3 py-1.5 text-xs font-bold text-[var(--app-accent)]">
                  Question {current + 1} of {questions.length}
                </span>
                <span className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-muted)]">
                  Time on Q: {currentQuestionTime}s
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasHindi && (
                  <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-1">
                    <Languages className="ml-1.5 h-3.5 w-3.5 text-[var(--app-accent)]" />
                    {(
                      [
                        { id: 'en', label: 'EN' },
                        { id: 'hi', label: 'हिन्दी' },
                        { id: 'split', label: 'Bilingual' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setLanguage(m.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          language === m.id
                            ? 'bg-[var(--app-accent)] text-slate-950'
                            : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() =>
                    setMarked((items) =>
                      items.includes(question.id)
                        ? items.filter((id) => id !== question.id)
                        : [...items, question.id]
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    marked.includes(question.id)
                      ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                      : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {marked.includes(question.id)
                    ? 'Marked for Review'
                    : 'Mark for Review'}
                </button>
              </div>
            </div>

            {/* Question Statement & Options Card */}
            <article className="theme-surface rounded-3xl p-5 sm:p-8">
              {/* Statement Text */}
              {language === 'split' && hasHindi ? (
                <div className="grid gap-4 md:grid-cols-2 border-b border-[var(--app-border)] pb-6">
                  <div>
                    <span className="mb-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                      English Version
                    </span>
                    <h2 className={`font-semibold whitespace-pre-line ${fontSizeClass}`}>
                      {question.text}
                    </h2>
                  </div>
                  <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0 border-[var(--app-border)]">
                    <span className="mb-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--app-secondary)]">
                      हिन्दी संस्करण
                    </span>
                    <h2
                      className={`font-hindi font-medium whitespace-pre-line ${fontSizeClass}`}
                    >
                      {question.textHi}
                    </h2>
                  </div>
                </div>
              ) : (
                <h2
                  className={`font-semibold whitespace-pre-line border-b border-[var(--app-border)] pb-6 ${fontSizeClass} ${
                    language === 'hi' ? 'font-hindi' : ''
                  }`}
                >
                  {language === 'hi' && question.textHi
                    ? question.textHi
                    : question.text}
                </h2>
              )}

              {/* Helper instruction bar for UPSC Option Elimination */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--app-muted)]">
                <span>
                  Select the most appropriate option below. Use{' '}
                  <strong className="text-[var(--app-text)]">Eliminate</strong>{' '}
                  to strike out ruled-out choices.
                </span>
                {answers[question.id] !== undefined && (
                  <button
                    onClick={clearResponse}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:underline"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Clear Response
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="mt-4 grid gap-3">
                {(question.options || []).map((optEn: string, index: number) => {
                  const optHi = question.optionsHi?.[index];
                  const selected = answers[question.id] === index;
                  const isStruck = currentEliminated.includes(index);

                  return (
                    <div
                      key={index}
                      className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-4 transition sm:p-4.5 ${
                        isStruck
                          ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)] opacity-45'
                          : selected
                          ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-[0_0_0_1px_var(--app-accent)]'
                          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)]/60'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isStruck}
                        onClick={() => selectOption(index)}
                        className="flex flex-1 items-start gap-3.5 text-left disabled:cursor-not-allowed"
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold transition ${
                            selected
                              ? 'bg-[var(--app-accent)] text-slate-950'
                              : 'border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)]'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>

                        <div
                          className={`flex-1 pt-0.5 text-sm sm:text-base ${
                            isStruck ? 'line-through' : ''
                          }`}
                        >
                          {language === 'split' && optHi ? (
                            <div className="grid gap-1 sm:grid-cols-2">
                              <span>{optEn}</span>
                              <span className="font-hindi text-[var(--app-muted)]">
                                {optHi}
                              </span>
                            </div>
                          ) : language === 'hi' && optHi ? (
                            <span className="font-hindi">{optHi}</span>
                          ) : (
                            <span>{optEn}</span>
                          )}
                        </div>
                      </button>

                      {/* Option Elimination (50-50 Strike-through) Button */}
                      <button
                        type="button"
                        onClick={() => toggleEliminateOption(question.id, index)}
                        title={
                          isStruck
                            ? 'Restore this option'
                            : 'Strike out / Eliminate this option'
                        }
                        className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          isStruck
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] opacity-75 hover:opacity-100 hover:text-[var(--app-text)]'
                        }`}
                      >
                        <Scissors className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {isStruck ? 'Restored' : 'Eliminate'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Conviction / Attempt Strategy Tagging */}
              {answers[question.id] !== undefined && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--app-muted)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                    <span>Tag your attempt conviction (for post-test analytics):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'sure', label: '100% Sure' },
                        { id: 'fifty', label: '50-50 Elimination' },
                        { id: 'guess', label: 'Calculated Guess' },
                      ] as const
                    ).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setConfidence((prev) => ({
                            ...prev,
                            [question.id]: tag.id,
                          }))
                        }
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          currentConfidence === tag.id
                            ? 'bg-[var(--app-accent)] text-slate-950'
                            : 'border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <button
              onClick={goPrevious}
              disabled={!current}
              className="theme-surface rounded-xl px-4 py-3 text-xs sm:text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--app-accent)] transition"
            >
              <ChevronLeft className="mr-1 inline h-4 w-4" /> Previous
            </button>
            <button
              onClick={skip}
              disabled={current === questions.length - 1}
              className="theme-surface rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <SkipForward className="mr-1 inline h-4 w-4" /> Skip Question
            </button>
            {current === questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="rounded-xl bg-[var(--app-accent)] px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:opacity-90 disabled:opacity-50 transition"
              >
                <Send className="mr-1.5 inline h-4 w-4" /> Review & Submit
              </button>
            ) : (
              <button
                onClick={goNext}
                className="rounded-xl bg-[var(--app-accent)] px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:opacity-90 transition"
              >
                Save & Next <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        {/* Right UPSC 5-State Question Palette (Hidden in Zen Focus Mode) */}
        {!zenMode && (
          <aside className="theme-surface h-fit rounded-3xl p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
              <div>
                <h2 className="text-sm font-bold">UPSC Question Palette</h2>
                <p className="text-[11px] text-[var(--app-muted)]">
                  {answeredCount} of {questions.length} attempted
                </p>
              </div>
              <span className="rounded-lg bg-[var(--app-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--app-accent)]">
                {progress}%
              </span>
            </div>

            {/* Question Grid */}
            <div className="mt-4 grid grid-cols-5 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {questions.map((item: any, index: number) => {
                const st = paletteStatus[index];
                let styleClass =
                  'bg-[var(--app-surface-muted)] text-[var(--app-muted)] border border-[var(--app-border)]';
                if (st === 'answered') {
                  styleClass = 'bg-emerald-500 text-slate-950 font-bold';
                } else if (st === 'answered-marked') {
                  styleClass = 'bg-indigo-500 text-white font-bold';
                } else if (st === 'marked') {
                  styleClass = 'bg-amber-400 text-slate-950 font-bold';
                } else if (st === 'visited') {
                  styleClass =
                    'border-rose-400/40 bg-rose-500/15 text-rose-300 font-semibold';
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrent(index)}
                    className={`grid aspect-square place-items-center rounded-xl text-xs transition ${
                      index === current
                        ? 'ring-2 ring-[var(--app-accent)] ring-offset-2 ring-offset-[var(--app-bg)]'
                        : ''
                    } ${styleClass}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* 5-State Legend */}
            <div className="mt-5 space-y-2 border-t border-[var(--app-border)] pt-4 text-xs text-[var(--app-muted)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  Answered
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {counts.answered}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  Answered & Marked
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {counts.answeredMarked}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                  Marked for Review
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {counts.marked}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/40" />
                  Visited (Unanswered)
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {counts.visited}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm border border-[var(--app-border)] bg-[var(--app-surface-muted)]" />
                  Not Visited
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {counts.unvisited}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-[var(--app-accent)] px-4 py-3 text-xs font-bold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting Evaluation…' : 'Finish & Submit Paper'}
            </button>
          </aside>
        )}
      </main>

      {/* Pre-Submission Summary Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="theme-surface-solid w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-[var(--app-accent)]">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-xl font-bold text-[var(--app-text)]">
                Confirm Examination Submission
              </h3>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[var(--app-muted)]">
              Please verify your attempt summary before locking your OMR
              response sheet. Answered & Marked for Review questions will be
              counted toward your final evaluation.
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-emerald-400">
                  {answeredCount}
                </p>
                <p className="text-[11px] text-[var(--app-muted)]">
                  Total Answered
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-amber-300">
                  {marked.length}
                </p>
                <p className="text-[11px] text-[var(--app-muted)]">
                  Marked for Review
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 col-span-2 sm:col-span-1">
                <p className="text-xl font-bold text-[var(--app-text)]">
                  {unansweredCount}
                </p>
                <p className="text-[11px] text-[var(--app-muted)]">
                  Unanswered (0 Marks)
                </p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  You have {unansweredCount} unattempted questions. Unattempted
                  questions carry 0 negative penalty.
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] py-3 text-xs sm:text-sm font-bold text-[var(--app-text)]"
              >
                Return to Paper
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-[var(--app-accent)] py-3 text-xs sm:text-sm font-bold text-slate-950 hover:opacity-90 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Final Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}