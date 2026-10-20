'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  HelpCircle,
  Keyboard,
  Languages,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  PenTool,
  Play,
  Scissors,
  Send,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { FALLBACK_QUIZZES } from '@/lib/mockData';
import { openWatermarkStudio } from '@/lib/pdfExporter';
import ThemeSelector from '@/components/ThemeSelector';

type ConfidenceLevel = 'sure' | 'fifty' | 'guess';
type LanguageMode = 'en' | 'hi' | 'split';
type EngineMode = 'exam' | 'tutor';
type PaletteFilter = 'all' | 'answered' | 'unanswered' | 'marked' | 'bookmarked';

export default function QuizPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  // Core OMR & Telemetry States
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [bookmarked, setBookmarked] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [eliminated, setEliminated] = useState<Record<string, number[]>>({});
  const [statementMarks, setStatementMarks] = useState<
    Record<string, Record<number, 'true' | 'false' | null>>
  >({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceLevel>>({});
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const [revealedInTutor, setRevealedInTutor] = useState<Record<string, boolean>>({});
  const [scratchpadText, setScratchpadText] = useState<Record<string, string>>({});

  // Engine Controls & Modes
  const [engineMode, setEngineMode] = useState<EngineMode>('exam');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [calmTimerMode, setCalmTimerMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [language, setLanguage] = useState<LanguageMode>('en');
  const [paletteFilter, setPaletteFilter] = useState<PaletteFilter>('all');

  // Modals & Drawers
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  // Load Quiz from Supabase or Built-in Fallback / Custom Drill Storage
  useEffect(() => {
    let alive = true;
    async function loadQuiz() {
      try {
        // Check if custom remediation/smart drill exists in localStorage
        let customQuiz: any = null;
        try {
          const savedCustom = window.localStorage.getItem(`gyankunj-custom-quiz-${quizId}`);
          if (savedCustom) customQuiz = JSON.parse(savedCustom);
        } catch {
          // ignore
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        let profile: any = null;
        let quizData: any = customQuiz;

        if (session?.user?.id) {
          const [profRes, qRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            !quizData
              ? supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle()
              : Promise.resolve({ data: quizData, error: null }),
          ]);
          profile = profRes.data;
          if (!quizData && qRes.data) quizData = qRes.data;
        } else if (!quizData) {
          const { data: qData } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .maybeSingle();
          if (qData) quizData = qData;
        }

        if (!quizData) {
          quizData =
            FALLBACK_QUIZZES.find((q) => q.id === quizId) || FALLBACK_QUIZZES[0];
        }

        if (!alive) return;

        setUser(
          profile || {
            id: session?.user?.id || 'demo_user',
            name: session?.user?.user_metadata?.full_name || 'Aarav Sharma (IAS Target)',
            email: session?.user?.email || 'aspirant@gyankunj.in',
          }
        );
        setQuiz(quizData);

        const firstId = quizData.questions?.[0]?.id;
        if (firstId) setVisited({ [firstId]: true });
        setTimeLeft((quizData.time_limit || 30) * 60);

        // Load saved bookmarks
        try {
          const savedBm = window.localStorage.getItem('gyankunj-bookmarks');
          if (savedBm) setBookmarked(JSON.parse(savedBm));
        } catch {
          // ignore
        }
      } catch {
        const fallback =
          FALLBACK_QUIZZES.find((q) => q.id === quizId) || FALLBACK_QUIZZES[0];
        if (alive) {
          setUser({
            id: 'demo_user',
            name: 'Aarav Sharma',
            email: 'aspirant@gyankunj.in',
          });
          setQuiz(fallback);
          setTimeLeft((fallback.time_limit || 20) * 60);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadQuiz();
    return () => {
      alive = false;
    };
  }, [quizId]);

  const questions = quiz?.questions || [];
  const question = questions[current];

  useEffect(() => {
    if (question?.id) {
      setVisited((prev) => ({ ...prev, [question.id]: true }));
    }
  }, [current, question?.id]);

  // Tab-Focus Integrity Monitor (in Strict Exam Mode)
  useEffect(() => {
    if (engineMode !== 'exam' || loading || submitting) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings((w) => {
          const next = w + 1;
          triggerToast(
            `Proctoring Alert (${next}/3): Please remain on the examination tab.`
          );
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [engineMode, loading, submitting, triggerToast]);

  // Countdown + Per-Question Time Telemetry
  useEffect(() => {
    if (loading || submitting || isPaused || timeLeft <= 0) return;
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
  }, [loading, submitting, isPaused, timeLeft, question?.id]);

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

  const toggleEliminateOption = useCallback(
    (qId: string, optIndex: number) => {
      setEliminated((prev) => {
        const existing = prev[qId] || [];
        const isEliminated = existing.includes(optIndex);
        const next = isEliminated
          ? existing.filter((i) => i !== optIndex)
          : [...existing, optIndex];
        return { ...prev, [qId]: next };
      });
      if (answers[qId] === optIndex) {
        setAnswers((prev) => {
          const copy = { ...prev };
          delete copy[qId];
          return copy;
        });
      }
    },
    [answers]
  );

  const clearResponse = useCallback(() => {
    if (!question?.id) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[question.id];
      return copy;
    });
  }, [question?.id]);

  const selectOption = useCallback(
    (optIndex: number) => {
      if (!question?.id) return;
      if ((eliminated[question.id] || []).includes(optIndex)) {
        triggerToast('Option is struck out. Restore it first to select.');
        return;
      }
      setAnswers((prev) => ({ ...prev, [question.id]: optIndex }));
      if (!confidence[question.id]) {
        const elimCount = (eliminated[question.id] || []).length;
        setConfidence((prev) => ({
          ...prev,
          [question.id]:
            elimCount === 2 ? 'fifty' : elimCount === 1 ? 'guess' : 'sure',
        }));
      }
    },
    [question?.id, eliminated, confidence, triggerToast]
  );

  const toggleBookmark = useCallback(
    (tag = 'High-Yield Revision') => {
      if (!question?.id) return;
      setBookmarked((prev) => {
        const copy = { ...prev };
        if (copy[question.id]) {
          delete copy[question.id];
          triggerToast('Removed from Revision Vault');
        } else {
          copy[question.id] = tag;
          triggerToast(`Saved to Revision Vault (${tag})`);
        }
        try {
          window.localStorage.setItem('gyankunj-bookmarks', JSON.stringify(copy));
        } catch {
          // ignore
        }
        return copy;
      });
    },
    [question?.id, triggerToast]
  );

  const toggleMarkReview = useCallback(() => {
    if (!question?.id) return;
    setMarked((items) =>
      items.includes(question.id)
        ? items.filter((id) => id !== question.id)
        : [...items, question.id]
    );
  }, [question?.id]);

  const goNext = useCallback(
    () => setCurrent((value) => Math.min(value + 1, questions.length - 1)),
    [questions.length]
  );
  const goPrevious = useCallback(
    () => setCurrent((value) => Math.max(value - 1, 0)),
    []
  );

  // Full Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        goPrevious();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (e.shiftKey && question?.id) {
          e.preventDefault();
          toggleEliminateOption(question.id, idx);
        } else {
          e.preventDefault();
          selectOption(idx);
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey) {
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        e.preventDefault();
        selectOption(idx);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMarkReview();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearResponse();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setZenMode((z) => !z);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goNext,
    goPrevious,
    selectOption,
    toggleEliminateOption,
    toggleMarkReview,
    clearResponse,
    question?.id,
  ]);

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
          subject: item.subject || quiz.category || 'General Studies',
          topic: item.topic || null,
          options: item.options,
          options_hi: item.optionsHi || null,
          selected_index: choice !== undefined ? choice : null,
          correct_index: item.correct,
          selected_answer:
            choice === undefined ? 'Skipped' : item.options[choice],
          selected_answer_hi:
            choice === undefined ? null : item.optionsHi?.[choice] || null,
          correct_answer: item.options[item.correct],
          correct_answer_hi: item.optionsHi?.[item.correct] || null,
          isCorrect,
          marks_awarded: +marksAwarded.toFixed(2),
          confidence:
            confidence[item.id] || (choice !== undefined ? 'sure' : null),
          eliminated_count: (eliminated[item.id] || []).length,
          time_spent: timeSpentMap[item.id] || 0,
          bookmarked: Boolean(bookmarked[item.id]),
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

      // Save locally first so result page ALWAYS works even in offline/demo mode
      try {
        window.localStorage.setItem(
          `gyankunj-latest-attempt-${quiz.id}`,
          JSON.stringify(attempt)
        );
        const existingHistory = JSON.parse(
          window.localStorage.getItem('gyankunj-local-attempts') || '[]'
        );
        window.localStorage.setItem(
          'gyankunj-local-attempts',
          JSON.stringify([attempt, ...existingHistory.slice(0, 49)])
        );
      } catch {
        // ignore
      }

      // Also persist to Supabase if available
      if (user.id !== 'demo_user') {
        await supabase.from('attempts').insert([attempt]);
      }

      router.push(`/quiz/${quiz.id}/result`);
    } catch {
      router.push(`/quiz/${quiz.id}/result`);
    }
  }

  useEffect(() => {
    if (!loading && timeLeft === 0 && quiz && engineMode === 'exam') {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, quiz, engineMode]);

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
      answeredMarked: paletteStatus.filter(
        (s: string) => s === 'answered-marked'
      ).length,
      marked: paletteStatus.filter((s: string) => s === 'marked').length,
      visited: paletteStatus.filter((s: string) => s === 'visited').length,
      unvisited: paletteStatus.filter((s: string) => s === 'unvisited').length,
      bookmarked: questions.filter((q: any) => Boolean(bookmarked[q.id])).length,
    };
  }, [paletteStatus, questions, bookmarked]);

  // Expected Value (EV) & Strategic Risk Telemetry
  const strategicMetrics = useMemo(() => {
    let sureCount = 0;
    let fiftyCount = 0;
    let guessCount = 0;
    Object.keys(answers).forEach((qId) => {
      const c = confidence[qId] || 'sure';
      if (c === 'sure') sureCount += 1;
      else if (c === 'fifty') fiftyCount += 1;
      else guessCount += 1;
    });
    // Expected net marks mathematical projection based on conviction probabilities:
    // Sure (~88% acc) => EV +1.68/q, 50-50 (~55% acc) => EV +0.80/q, Guess (~30% acc) => EV +0.14/q
    const projectedMarks = +(
      sureCount * 1.68 +
      fiftyCount * 0.8 +
      guessCount * 0.14
    ).toFixed(1);
    return { sureCount, fiftyCount, guessCount, projectedMarks };
  }, [answers, confidence]);

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
      ? 'text-base sm:text-lg leading-relaxed'
      : 'text-sm sm:text-base leading-relaxed';

  const currentEliminated = eliminated[question.id] || [];
  const currentConfidence = confidence[question.id] || 'sure';
  const remainingViableChoices = 4 - currentEliminated.length;
  const isTutorRevealed = Boolean(revealedInTutor[question.id]);

  // Parse question lines so numbered statements can be interactively marked True/False
  const parseQuestionStatements = (rawText: string) => {
    const lines = (rawText || '').split('\n');
    return lines.map((line, idx) => {
      const isNumberedStatement = /^\s*(\d+\.|Statement\s+[I1-9]+|कथन\s+\d+)/i.test(
        line
      );
      const stState = statementMarks[question.id]?.[idx] || null;

      if (!isNumberedStatement) {
        return (
          <p key={idx} className={idx > 0 ? 'mt-2.5' : ''}>
            {line}
          </p>
        );
      }

      return (
        <div
          key={idx}
          className={`mt-2.5 flex items-start justify-between gap-3 rounded-xl border p-3 transition ${
            stState === 'true'
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : stState === 'false'
              ? 'border-rose-500/40 bg-rose-500/10 line-through opacity-75'
              : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
          }`}
        >
          <span className="flex-1">{line}</span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setStatementMarks((prev) => ({
                  ...prev,
                  [question.id]: {
                    ...(prev[question.id] || {}),
                    [idx]: stState === 'true' ? null : 'true',
                  },
                }))
              }
              title="Mark Statement True (✓)"
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                stState === 'true'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-emerald-400'
              }`}
            >
              ✓ True
            </button>
            <button
              type="button"
              onClick={() =>
                setStatementMarks((prev) => ({
                  ...prev,
                  [question.id]: {
                    ...(prev[question.id] || {}),
                    [idx]: stState === 'false' ? null : 'false',
                  },
                }))
              }
              title="Strike Statement False (✗)"
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                stState === 'false'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-rose-400'
              }`}
            >
              ✗ False
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="app-theme min-h-screen flex flex-col">
      {/* Non-blocking Toast Banner */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-panel-strong)] px-4 py-3 text-xs font-bold text-[var(--app-text)] shadow-2xl">
          <Sparkles className="h-4 w-4 text-[var(--app-accent)]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Examination Command Bar */}
      <header className="theme-surface-solid sticky top-0 z-30 border-b border-[var(--app-border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/quizzes')}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
            >
              ← Exit Hall
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                  {quiz.category || 'UPSC Prelims'}
                </span>
                <span className="text-xs text-[var(--app-muted)]">·</span>
                <span className="text-[10px] font-semibold text-[var(--app-muted)]">
                  +{positiveMarks.toFixed(1)} / -{negativeMarks.toFixed(2)} (1/3rd Penalty)
                </span>
                {tabWarnings > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    Tab Alerts: {tabWarnings}/3
                  </span>
                )}
              </div>
              <h1 className="line-clamp-1 text-sm font-bold">{quiz.title}</h1>
            </div>
          </div>

          {/* Right Engine Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Exam Mode vs Interactive Tutor Mode Switcher */}
            <div className="inline-flex items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-0.5 text-xs">
              <button
                onClick={() => setEngineMode('exam')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  engineMode === 'exam'
                    ? 'bg-[var(--app-accent)] text-slate-950'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                }`}
                title="Strict UPSC Prelims Hall Simulation"
              >
                Exam Hall
              </button>
              <button
                onClick={() => setEngineMode('tutor')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  engineMode === 'tutor'
                    ? 'bg-[var(--app-accent)] text-slate-950'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                }`}
                title="Instant Answer Verification & Explanation Mode"
              >
                Tutor Mode
              </button>
            </div>

            {/* Watermarked Question Paper & Answer Key PDF Export */}
            <button
              type="button"
              onClick={() => openWatermarkStudio(quiz, 'paper')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-400 hover:text-slate-950 transition"
              title="Export Watermarked Question Paper PDF"
            >
              <span>📄 Question Paper PDF</span>
            </button>
            <button
              type="button"
              onClick={() => openWatermarkStudio(quiz, 'solution')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-300 hover:bg-sky-400 hover:text-slate-950 transition"
              title="Export Watermarked Bilingual Answer Key PDF"
            >
              <span>🔑 Answer Key PDF</span>
            </button>

            {/* Scratchpad Button */}
            <button
              onClick={() => setShowScratchpad((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                showScratchpad
                  ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                  : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
              }`}
              title="Toggle CSAT / Rough Work Scratchpad"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Rough Sheet</span>
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hidden md:inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)]"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>

            {/* Font scale pills */}
            <div className="hidden xl:flex items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-0.5 text-xs">
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
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                zenMode
                  ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                  : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
              }`}
              title="Toggle Zen Focus Mode (Z)"
            >
              {zenMode ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline">
                {zenMode ? 'Standard' : 'Focus'}
              </span>
            </button>

            <ThemeSelector compact />

            {/* Timer + Pause Control */}
            <div className="inline-flex items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-0.5">
              <button
                onClick={() => setCalmTimerMode((c) => !c)}
                title="Click to toggle seconds display for reduced timer anxiety"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono-tabular text-xs font-bold transition ${
                  timeLeft <= 180
                    ? 'text-rose-400'
                    : 'text-[var(--app-text)]'
                }`}
              >
                <Clock3 className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                <span>{formattedTime}</span>
                {calmTimerMode ? (
                  <EyeOff className="h-3 w-3 opacity-60" />
                ) : (
                  <Eye className="h-3 w-3 opacity-60" />
                )}
              </button>
              <button
                onClick={() => setIsPaused((p) => !p)}
                title={isPaused ? 'Resume Timer' : 'Pause Timer'}
                className="rounded-lg p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Strip */}
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
            : 'grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'
        }`}
      >
        {/* Left Question Canvas */}
        <section className="flex flex-col justify-between">
          <div>
            {/* Question Telemetry & Action Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] px-3 py-1.5 text-xs font-bold text-[var(--app-accent)]">
                  Q {current + 1} / {questions.length}
                </span>
                {question.topic && (
                  <span className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs font-semibold text-[var(--app-text)]">
                    {question.topic}
                  </span>
                )}
                {question.difficulty && (
                  <span className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--app-muted)]">
                    {question.difficulty}
                  </span>
                )}
                <span
                  className={`rounded-xl border px-2.5 py-1.5 font-mono-tabular text-xs font-semibold ${
                    currentQuestionTime > 90
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)]'
                  }`}
                  title="UPSC Ideal Target: ≤72s per question"
                >
                  ⏱ {currentQuestionTime}s {currentQuestionTime <= 72 ? '(Optimal)' : '(Slow)'}
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
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
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
                  onClick={() => toggleBookmark('Revision Vault')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    bookmarked[question.id]
                      ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
                      : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                  title="Bookmark Question to Revision Notebook"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {bookmarked[question.id] ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>

                <button
                  onClick={toggleMarkReview}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    marked.includes(question.id)
                      ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                      : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                  title="Mark for Review (M)"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>
                    {marked.includes(question.id) ? 'Marked' : 'Review'}
                  </span>
                </button>
              </div>
            </div>

            {/* Question Statement & Options Card */}
            <article className="theme-surface rounded-3xl p-5 sm:p-8">
              {/* Interactive Statement Parser */}
              {language === 'split' && hasHindi ? (
                <div className="grid gap-5 md:grid-cols-2 border-b border-[var(--app-border)] pb-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                        English Version (Interactive Statements)
                      </span>
                      {question.pyqRef && (
                        <span className="text-[10px] font-semibold text-[var(--app-muted)]">
                          {question.pyqRef}
                        </span>
                      )}
                    </div>
                    <div className={`font-semibold ${fontSizeClass}`}>
                      {parseQuestionStatements(question.text)}
                    </div>
                  </div>
                  <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0 border-[var(--app-border)]">
                    <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--app-secondary)]">
                      हिन्दी संस्करण
                    </span>
                    <div
                      className={`font-hindi font-medium whitespace-pre-line ${fontSizeClass}`}
                    >
                      {question.textHi}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b border-[var(--app-border)] pb-6">
                  {question.pyqRef && (
                    <div className="mb-2 text-[11px] font-semibold text-[var(--app-accent)]">
                      Source / Reference: {question.pyqRef}
                    </div>
                  )}
                  <div
                    className={`font-semibold ${fontSizeClass} ${
                      language === 'hi' ? 'font-hindi whitespace-pre-line' : ''
                    }`}
                  >
                    {language === 'hi' && question.textHi
                      ? question.textHi
                      : parseQuestionStatements(question.text)}
                  </div>
                </div>
              )}

              {/* Option Elimination & Expected Value (EV) Telemetry Strip */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--app-muted)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    Use <strong className="text-[var(--app-text)]">Eliminate</strong>{' '}
                    to rule out options.
                  </span>
                  {currentEliminated.length > 0 && (
                    <span
                      className={`rounded-lg px-2.5 py-0.5 font-bold ${
                        remainingViableChoices <= 2
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {remainingViableChoices === 2
                        ? '50-50 Reached · Math EV: +0.67 Marks (Favorable Attempt!)'
                        : remainingViableChoices === 3
                        ? '1 Ruled Out · Math EV: +0.22 Marks (Moderate Risk)'
                        : 'Narrowed to 1 Choice!'}
                    </span>
                  )}
                </div>

                {answers[question.id] !== undefined && (
                  <button
                    onClick={clearResponse}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:underline"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Clear Response (C)
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="mt-4 grid gap-3">
                {(question.options || []).map((optEn: string, index: number) => {
                  const optHi = question.optionsHi?.[index];
                  const selected = answers[question.id] === index;
                  const isStruck = currentEliminated.includes(index);
                  const isCorrectChoice = question.correct === index;

                  let cardStyle =
                    'border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)]/60';
                  if (isStruck) {
                    cardStyle =
                      'border-[var(--app-border)] bg-[var(--app-surface-muted)] opacity-40';
                  } else if (isTutorRevealed) {
                    if (isCorrectChoice) {
                      cardStyle =
                        'border-emerald-500 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.5)]';
                    } else if (selected && !isCorrectChoice) {
                      cardStyle =
                        'border-rose-500 bg-rose-500/15 shadow-[0_0_0_1px_rgba(244,63,94,0.5)]';
                    }
                  } else if (selected) {
                    cardStyle =
                      'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-[0_0_0_1px_var(--app-accent)]';
                  }

                  return (
                    <div
                      key={index}
                      className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${cardStyle}`}
                    >
                      <button
                        type="button"
                        disabled={isStruck}
                        onClick={() => selectOption(index)}
                        className="flex flex-1 items-start gap-3.5 text-left disabled:cursor-not-allowed"
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold transition ${
                            isTutorRevealed && isCorrectChoice
                              ? 'bg-emerald-500 text-slate-950'
                              : isTutorRevealed && selected && !isCorrectChoice
                              ? 'bg-rose-500 text-white'
                              : selected
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
                            : 'Strike out / Eliminate this option (Shift + 1-4)'
                        }
                        className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          isStruck
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : 'border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] opacity-75 hover:opacity-100 hover:text-[var(--app-text)]'
                        }`}
                      >
                        <Scissors className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {isStruck ? 'Restore' : 'Eliminate'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Conviction Tagging & Tutor Instant Explanation Controls */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--app-muted)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                    Conviction Tag:
                  </span>
                  {(
                    [
                      { id: 'sure', label: '100% Sure' },
                      { id: 'fifty', label: '50-50 Logic' },
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        currentConfidence === tag.id &&
                        answers[question.id] !== undefined
                          ? 'bg-[var(--app-accent)] text-slate-950'
                          : 'border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                {engineMode === 'tutor' && (
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedInTutor((prev) => ({
                        ...prev,
                        [question.id]: !prev[question.id],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:opacity-90"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {isTutorRevealed
                      ? 'Hide Solution Key'
                      : 'Check Answer & Explanation'}
                  </button>
                )}
              </div>

              {/* Instant Faculty Explanation (when Tutor Mode is active & revealed) */}
              {engineMode === 'tutor' && isTutorRevealed && (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm leading-relaxed">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-emerald-300">
                      Official Answer: Option{' '}
                      {String.fromCharCode(65 + Number(question.correct))}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-200">
                      Faculty Value-Add Note
                    </span>
                  </div>
                  <p className="text-[var(--app-text)]">
                    {question.explanation ||
                      'Review the statement logic carefully.'}
                  </p>
                  {question.explanationHi && (
                    <p className="mt-2 font-hindi text-[var(--app-muted)]">
                      {question.explanationHi}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible Rough Work / CSAT Scratchpad */}
              {showScratchpad && (
                <div className="mt-5 rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-panel-strong)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--app-accent)]">
                      <PenTool className="h-3.5 w-3.5" /> Rough Work & Statement
                      Deduction Pad (Q{current + 1})
                    </span>
                    <button
                      onClick={() =>
                        setScratchpadText((prev) => ({
                          ...prev,
                          [question.id]: '',
                        }))
                      }
                      className="text-[11px] text-[var(--app-muted)] hover:text-rose-400"
                    >
                      Clear Pad
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={scratchpadText[question.id] || ''}
                    onChange={(e) =>
                      setScratchpadText((prev) => ({
                        ...prev,
                        [question.id]: e.target.value,
                      }))
                    }
                    placeholder="Jot down chronology, article numbers, CSAT equations, or statement elimination notes here..."
                    className="glass-input w-full font-mono text-xs"
                  />
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
              onClick={goNext}
              disabled={current === questions.length - 1}
              className="theme-surface rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <SkipForward className="mr-1 inline h-4 w-4" /> Skip
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

        {/* Right UPSC 6-State Smart Question Palette */}
        {!zenMode && (
          <aside className="theme-surface h-fit rounded-3xl p-5 lg:sticky lg:top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
              <div>
                <h2 className="text-sm font-bold">Smart OMR Palette</h2>
                <p className="text-[11px] text-[var(--app-muted)]">
                  {answeredCount} of {questions.length} attempted
                </p>
              </div>
              <span className="rounded-lg bg-[var(--app-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--app-accent)]">
                {progress}%
              </span>
            </div>

            {/* Palette Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: `All (${questions.length})` },
                  { id: 'unanswered', label: `Left (${unansweredCount})` },
                  { id: 'marked', label: `Review (${marked.length})` },
                  { id: 'bookmarked', label: `★ (${counts.bookmarked})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPaletteFilter(f.id)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    paletteFilter === f.id
                      ? 'bg-[var(--app-accent)] text-slate-950'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {questions.map((item: any, index: number) => {
                const st = paletteStatus[index];
                const isBm = Boolean(bookmarked[item.id]);

                if (paletteFilter === 'answered' && answers[item.id] === undefined)
                  return null;
                if (paletteFilter === 'unanswered' && answers[item.id] !== undefined)
                  return null;
                if (paletteFilter === 'marked' && !marked.includes(item.id))
                  return null;
                if (paletteFilter === 'bookmarked' && !isBm) return null;

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
                    className={`relative grid aspect-square place-items-center rounded-xl text-xs transition ${
                      index === current
                        ? 'ring-2 ring-[var(--app-accent)] ring-offset-2 ring-offset-[var(--app-bg)]'
                        : ''
                    } ${styleClass}`}
                  >
                    {index + 1}
                    {isBm && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Conviction & EV Telemetry Box */}
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-[var(--app-accent)]">
                <span>Attempt Strategy Telemetry</span>
                <span>EV ~{strategicMetrics.projectedMarks}m</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="rounded-lg bg-[var(--app-panel)] p-1.5">
                  <div className="font-bold text-emerald-400">
                    {strategicMetrics.sureCount}
                  </div>
                  <div className="text-[var(--app-muted)]">100% Sure</div>
                </div>
                <div className="rounded-lg bg-[var(--app-panel)] p-1.5">
                  <div className="font-bold text-sky-300">
                    {strategicMetrics.fiftyCount}
                  </div>
                  <div className="text-[var(--app-muted)]">50-50 Logic</div>
                </div>
                <div className="rounded-lg bg-[var(--app-panel)] p-1.5">
                  <div className="font-bold text-amber-300">
                    {strategicMetrics.guessCount}
                  </div>
                  <div className="text-[var(--app-muted)]">Guess</div>
                </div>
              </div>
            </div>

            {/* 5-State Legend */}
            <div className="space-y-1.5 border-t border-[var(--app-border)] pt-3 text-xs text-[var(--app-muted)]">
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
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--app-accent)] px-4 py-3 text-xs font-bold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting Evaluation…' : 'Finish & Submit OMR'}
            </button>
          </aside>
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="theme-surface-solid w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[var(--app-accent)]" /> CBT
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="rounded-lg p-1 text-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              {[
                ['1 – 4 or A – D', 'Select Option A / B / C / D'],
                ['Shift + 1 – 4', 'Eliminate / Strike-out Option'],
                ['→ or N', 'Next Question'],
                ['← or P', 'Previous Question'],
                ['M', 'Toggle Mark for Review'],
                ['C', 'Clear Selected Response'],
                ['Z', 'Toggle Zen Focus Mode'],
              ].map(([k, desc]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[var(--app-muted)]">{desc}</span>
                  <span className="kbd-badge">{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pre-Submission Summary Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="theme-surface-solid w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-[var(--app-accent)]">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-xl font-bold text-[var(--app-text)]">
                Confirm OMR Examination Submission
              </h3>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[var(--app-muted)]">
              Verify your attempt distribution before locking your response
              sheet. Answered & Marked questions count toward your final UPSC
              Prelims score.
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-emerald-400">
                  {answeredCount}
                </p>
                <p className="text-[10px] text-[var(--app-muted)]">Answered</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-amber-300">
                  {marked.length}
                </p>
                <p className="text-[10px] text-[var(--app-muted)]">
                  For Review
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-[var(--app-text)]">
                  {unansweredCount}
                </p>
                <p className="text-[10px] text-[var(--app-muted)]">
                  Skipped (0m)
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xl font-bold text-[var(--app-accent)]">
                  ~{strategicMetrics.projectedMarks}
                </p>
                <p className="text-[10px] text-[var(--app-muted)]">
                  Expected EV
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
                <CheckCircle2 className="h-4 w-4" /> Lock & Generate Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}