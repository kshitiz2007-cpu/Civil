'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Languages, Loader2, Send, SkipForward } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ThemeSelector from '@/components/ThemeSelector';

export default function QuizPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadQuiz() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/'; return; }
      const [{ data: profile }, { data: quizData, error }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
      ]);
      if (!alive) return;
      if (error || !quizData) { alert('This quiz is no longer available.'); router.replace('/quizzes'); return; }
      setUser(profile || { id: session.user.id, email: session.user.email });
      setQuiz(quizData);
      setTimeLeft((quizData.time_limit || 30) * 60);
      setLoading(false);
    }
    loadQuiz();
    return () => { alive = false; };
  }, [quizId, router]);

  useEffect(() => {
    if (loading || submitting || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((value) => value <= 1 ? 0 : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading, submitting, timeLeft]);

  useEffect(() => {
    if (!loading && timeLeft === 0 && quiz) submit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, quiz]);

  const questions = quiz?.questions || [];
  const question = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const shownText = language === 'hi' && question?.textHi ? question.textHi : question?.text;
  const shownOptions = language === 'hi' && question?.optionsHi?.length ? question.optionsHi : question?.options || [];
  const time = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const hasHindi = Boolean(question?.textHi);

  const goNext = () => setCurrent((value) => Math.min(value + 1, questions.length - 1));
  const goPrevious = () => setCurrent((value) => Math.max(value - 1, 0));
  const skip = () => { if (current < questions.length - 1) goNext(); };

  async function submit() {
    if (!quiz || !user || submitting) return;
    setSubmitting(true);
    try {
      let correct = 0, wrong = 0, skipped = 0;
      const details = questions.map((item: any) => {
        const choice = answers[item.id];
        const isCorrect = choice === item.correct;
        if (choice === undefined) skipped += 1; else if (isCorrect) correct += 1; else wrong += 1;
        return { question: item.text, question_hi: item.textHi || null, selected_answer: choice === undefined ? 'Skipped' : item.options[choice], selected_answer_hi: choice === undefined ? null : item.optionsHi?.[choice] || null, correct_answer: item.options[item.correct], correct_answer_hi: item.optionsHi?.[item.correct] || null, isCorrect, explanation: item.explanation || null, explanation_hi: item.explanationHi || null };
      });
      const attempt = { id: `a_${Date.now()}`, user_id: user.id, user_name: user.name || user.email || 'Student', quiz_id: quiz.id, quiz_title: quiz.title, quiz_title_hi: quiz.titleHi || '', category: quiz.category || 'General', score: questions.length ? Math.round((correct / questions.length) * 100) : 0, correct, wrong, skipped, total: questions.length, details, completed_at: new Date().toISOString() };
      const { error } = await supabase.from('attempts').insert([attempt]);
      if (error) throw error;
      window.location.href = `/quiz/${quiz.id}/result`;
    } catch (error: any) {
      alert(error.message || 'Could not submit your quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const status = useMemo(() => questions.map((item: any) => answers[item.id] !== undefined ? 'answered' : marked.includes(item.id) ? 'marked' : 'open'), [answers, marked, questions]);
  if (loading) return <div className="app-theme grid min-h-screen place-items-center"><Loader2 className="h-9 w-9 animate-spin text-[var(--app-accent)]"/></div>;
  if (!quiz || !question) return null;

  return <div className="app-theme quiz-player">
    <header className="quiz-topbar sticky top-0 z-40 border-b border-[var(--app-border)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <button onClick={() => router.push('/quizzes')} className="quiz-exit inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-bold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"><ChevronLeft className="h-4 w-4"/><span className="hidden sm:inline">Exit quiz</span><span className="sm:hidden">Exit</span></button>
        <div className="min-w-0 flex-1 text-center sm:text-left"><p className="truncate text-[10px] font-black uppercase tracking-[.18em] text-[var(--app-accent)]">{quiz.category || 'Practice test'}</p><h1 className="truncate text-sm font-extrabold sm:text-base">{quiz.title}</h1></div>
        <div className={`quiz-timer inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-black tabular-nums ${timeLeft <= 60 ? 'is-urgent' : ''}`}><Clock3 className="h-4 w-4"/>{time}</div>
      </div>
      <div className="h-1 w-full bg-white/[.06]"><div className="quiz-progress-fill h-full" style={{ width: `${progress}%` }}/></div>
    </header>

    <main className="quiz-layout mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_270px]">
      <section className="min-w-0">
        <div className="quiz-summary mb-3 flex items-center justify-between gap-3 sm:mb-5">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[var(--app-muted)]">Your assessment</p><p className="mt-1 text-xs font-semibold text-[var(--app-text)] sm:text-sm">{answeredCount} answered <span className="text-[var(--app-muted)]">· {unansweredCount} remaining</span></p></div>
          <div className="rounded-xl border border-[var(--app-border)] bg-white/[.045] px-3 py-2 text-right"><p className="text-lg font-black leading-none text-[var(--app-accent)]">{progress}%</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Complete</p></div>
        </div>

        <div className="quiz-mobile-palette mb-3 lg:hidden">
          <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--app-muted)]">Question palette</span><span className="text-[10px] text-[var(--app-muted)]">{current + 1}/{questions.length}</span></div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">{questions.map((item: any, index: number) => <button key={item.id} onClick={() => setCurrent(index)} aria-label={`Go to question ${index + 1}`} className={`quiz-palette-dot ${index === current ? 'is-current' : ''} ${status[index] === 'answered' ? 'is-answered' : status[index] === 'marked' ? 'is-marked' : ''}`}>{index + 1}</button>)}</div>
        </div>

        <article className="quiz-question-card">
          <div className="quiz-question-top">
            <div className="flex min-w-0 items-center gap-2"><span className="quiz-q-number">{String(current + 1).padStart(2,'0')}</span><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--app-accent)]">Question {current + 1}</p><p className="text-[10px] text-[var(--app-muted)]">of {questions.length} questions</p></div></div>
            <button onClick={() => setMarked((items) => items.includes(question.id) ? items.filter((id) => id !== question.id) : [...items, question.id])} className={`quiz-mark-button ${marked.includes(question.id) ? 'is-marked' : ''}`}><Flag className="h-3.5 w-3.5"/><span>{marked.includes(question.id) ? 'Marked' : 'Review'}</span></button>
          </div>

          {hasHindi && <div className="quiz-language-switch"><Languages className="h-4 w-4 text-[var(--app-accent)]"/><button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>English</button><button onClick={() => setLanguage('hi')} className={language === 'hi' ? 'active' : ''}>हिंदी</button></div>}

          <h2 className={`quiz-question-text ${language === 'hi' ? 'font-serif' : ''}`}>{shownText}</h2>
          <div className="quiz-options">{shownOptions.map((option: string, index: number) => { const selected = answers[question.id] === index; return <button key={index} onClick={() => setAnswers((items) => ({ ...items, [question.id]: index }))} aria-pressed={selected} className={`quiz-option ${selected ? 'is-selected' : ''}`}><span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span><span className={`min-w-0 flex-1 text-left ${language === 'hi' ? 'font-serif' : ''}`}>{option}</span><span className="quiz-option-check"><CheckCircle2 className="h-5 w-5"/></span></button>; })}</div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--app-muted)]"><span>{answers[question.id] !== undefined ? 'Answer saved' : 'Choose one answer'}</span><span>{marked.includes(question.id) ? 'Flagged for review' : 'You can change your answer'}</span></div>
        </article>

        <div className="quiz-actions mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
          <button onClick={goPrevious} disabled={!current} className="quiz-secondary"><ChevronLeft className="h-4 w-4"/>Previous</button>
          <button onClick={skip} disabled={current === questions.length - 1} className="quiz-secondary"><SkipForward className="h-4 w-4"/>Skip</button>
          {current === questions.length - 1 ? <button onClick={submit} disabled={submitting} className="quiz-primary col-span-2 sm:col-span-1">{submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}{submitting ? 'Submitting…' : 'Submit test'}</button> : <button onClick={goNext} className="quiz-primary col-span-2 sm:col-span-1">Next question<ChevronRight className="h-4 w-4"/></button>}
        </div>
      </section>

      <aside className="quiz-navigator hidden h-fit lg:sticky lg:top-24 lg:block">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--app-accent)]">Navigate</p><h2 className="mt-1 text-base font-extrabold">Questions</h2></div><span className="text-xs font-bold text-[var(--app-muted)]">{answeredCount}/{questions.length}</span></div>
        <div className="mt-4 grid grid-cols-5 gap-2">{questions.map((item: any, index: number) => <button key={item.id} onClick={() => setCurrent(index)} aria-label={`Go to question ${index + 1}`} className={`quiz-palette-dot ${index === current ? 'is-current' : ''} ${status[index] === 'answered' ? 'is-answered' : status[index] === 'marked' ? 'is-marked' : ''}`}>{index + 1}</button>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-[var(--app-muted)]"><span>● Answered</span><span className="text-amber-300">● Review</span><span className="text-white/40">● Not visited</span><span className="text-[var(--app-accent)]">● Current</span></div>
        <div className="mt-5 rounded-xl border border-[var(--app-border)] bg-white/[.035] p-3"><div className="flex justify-between text-xs"><span className="text-[var(--app-muted)]">Completion</span><b>{progress}%</b></div><div className="quiz-progress-track mt-2"><div className="quiz-progress-fill" style={{width:`${progress}%`}}/></div><p className="mt-2 text-[10px] text-[var(--app-muted)]">{unansweredCount} questions left unanswered</p></div>
        <button onClick={submit} disabled={submitting} className="quiz-submit-wide mt-4 w-full">{submitting ? 'Submitting…' : 'Finish and submit'}</button>
      </aside>
    </main>
  </div>;
