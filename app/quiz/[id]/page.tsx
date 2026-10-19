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

  const submit = async () => {
    if (!quiz || !user || submitting) return;
    setSubmitting(true);
    try {
      let correct = 0, wrong = 0, skipped = 0;
      const details = questions.map((item: any) => {
        const choice = answers[item.id];
        const isCorrect = choice === item.correct;
        if (choice === undefined) skipped += 1; else if (isCorrect) correct += 1; else wrong += 1;
        return { question: item.text, selected_answer: choice === undefined ? 'Skipped' : item.options[choice], correct_answer: item.options[item.correct], isCorrect, explanation: item.explanation || null };
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

  return <div className="app-theme">
    <header className="relative z-20 border-b border-[var(--app-border)] bg-[var(--app-panel)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button onClick={() => router.push('/quizzes')} className="text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)]">← Exit quiz</button>
        <div className="flex items-center gap-2"><ThemeSelector compact /><div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-bold ${timeLeft <= 60 ? 'border-rose-300/40 bg-rose-400/10 text-rose-100' : 'border-[var(--app-border)] bg-[var(--app-panel-strong)] text-[var(--app-text)]'}`}><Clock3 className="h-4 w-4"/>{time}</div></div>
      </div>
    </header>
    <main className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_250px] sm:px-6">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--app-accent)]">{quiz.category || 'Practice test'}</p><h1 className="mt-1 text-xl font-semibold sm:text-2xl">{quiz.title}</h1></div><div className="rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-1.5 text-xs font-medium text-[var(--app-muted)]">{answeredCount} answered · {unansweredCount} to review</div></div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[var(--app-accent-strong)] to-[var(--app-accent)] transition-all" style={{ width: `${progress}%` }}/></div></div>
        <article className="theme-surface rounded-3xl p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-[var(--app-muted)]">Question {current + 1} of {questions.length}</p><button onClick={() => setMarked((items) => items.includes(question.id) ? items.filter((id) => id !== question.id) : [...items, question.id])} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${marked.includes(question.id) ? 'border-amber-200/40 bg-amber-300/10 text-amber-100' : 'border-[var(--app-border)] text-[var(--app-muted)]'}`}><Flag className="h-3.5 w-3.5"/>{marked.includes(question.id) ? 'Marked' : 'Mark for review'}</button></div>
          {hasHindi && <div className="mt-5 flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-black/10 p-2"><Languages className="ml-2 h-4 w-4 text-[var(--app-accent)]"/><button onClick={() => setLanguage('en')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${language === 'en' ? 'bg-white/15 text-white' : 'text-[var(--app-muted)]'}`}>English</button><button onClick={() => setLanguage('hi')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${language === 'hi' ? 'bg-white/15 text-white' : 'text-[var(--app-muted)]'}`}>हिंदी</button></div>}
          <h2 className={`mt-7 text-xl font-semibold leading-relaxed sm:text-2xl ${language === 'hi' ? 'font-serif' : ''}`}>{shownText}</h2>
          <div className="mt-8 grid gap-3">{shownOptions.map((option: string, index: number) => { const selected = answers[question.id] === index; return <button key={index} onClick={() => setAnswers((items) => ({ ...items, [question.id]: index }))} className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${selected ? 'border-[var(--app-accent)] bg-white/10 shadow-[0_0_0_1px_var(--app-accent)]' : 'border-[var(--app-border)] bg-black/10 hover:border-[var(--app-accent)]/60'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${selected ? 'bg-[var(--app-accent)] text-slate-950' : 'bg-white/10 text-[var(--app-muted)]'}`}>{String.fromCharCode(65 + index)}</span><span className={`pt-0.5 text-base leading-6 ${language === 'hi' ? 'font-serif' : ''}`}>{option}</span></button>; })}</div>
        </article>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><button onClick={goPrevious} disabled={!current} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="mr-1 inline h-4 w-4"/>Previous</button><button onClick={skip} disabled={current === questions.length - 1} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"><SkipForward className="mr-1 inline h-4 w-4"/>Skip for now</button>{current === questions.length - 1 ? <button onClick={submit} disabled={submitting} className="rounded-xl bg-[var(--app-accent)] px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{submitting ? 'Submitting…' : <><Send className="mr-1 inline h-4 w-4"/>Submit quiz</>}</button> : <button onClick={goNext} className="rounded-xl bg-[var(--app-accent)] px-4 py-3 font-semibold text-slate-950">Next<ChevronRight className="ml-1 inline h-4 w-4"/></button>}</div>
      </section>
      <aside className="theme-surface h-fit rounded-3xl p-5 lg:sticky lg:top-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Question navigator</h2><span className="text-xs text-[var(--app-muted)]">{progress}% done</span></div><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((item: any, index: number) => <button key={item.id} onClick={() => setCurrent(index)} className={`grid aspect-square place-items-center rounded-lg text-xs font-bold transition ${index === current ? 'ring-2 ring-[var(--app-accent)]' : ''} ${status[index] === 'answered' ? 'bg-[var(--app-accent)] text-slate-950' : status[index] === 'marked' ? 'bg-amber-300 text-amber-950' : 'bg-white/10 text-[var(--app-muted)] hover:bg-white/15'}`}>{index + 1}</button>)}</div><div className="mt-5 space-y-2 text-xs text-[var(--app-muted)]"><p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-[var(--app-accent)]"/>Answered</p><p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-amber-300"/>Marked for review</p><p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-white/10"/>Not visited</p></div><button onClick={submit} disabled={submitting} className="mt-6 w-full rounded-xl border border-[var(--app-accent)]/50 bg-[var(--app-accent)]/10 px-3 py-3 text-sm font-semibold text-[var(--app-accent)]">{submitting ? 'Submitting…' : 'Finish and submit'}</button></aside>
    </main>
  </div>;
}