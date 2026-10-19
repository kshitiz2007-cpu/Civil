'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trophy, CheckCircle2, XCircle, MinusCircle, Home, RotateCcw, Loader2, ArrowLeft, Languages } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type ReviewLanguage = 'en' | 'hi' | 'both';

export default function QuizResultPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<ReviewLanguage>('both');

  useEffect(() => {
    async function fetchResult() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = '/'; return; }
        const { data, error } = await supabase.from('attempts').select('*')
          .eq('user_id', session.user.id).eq('quiz_id', quizId)
          .order('completed_at', { ascending: false }).limit(1).single();
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

  if (loading) return <div className="app-theme grid min-h-screen place-items-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /></div>;
  if (!attempt) return (
    <main className="app-theme grid min-h-screen place-items-center p-4 text-center">
      <div className="theme-surface w-full max-w-md rounded-3xl p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Result not found</h1>
        <p className="mb-6 text-slate-600">We couldn't load your quiz result.</p>
        <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white">Go to Dashboard</button>
      </div>
    </main>
  );

  const isPassing = attempt.score >= 40;
  const showEnglish = language !== 'hi';
  const showHindi = language !== 'en';
  const text = (en?: string | null, hi?: string | null) => {
    const hindi = hi || en;
    if (language === 'hi') return hindi || '—';
    if (language === 'en') return en || hindi || '—';
    return <>{en && <span>{en}</span>}{hi && <span className="mt-1 block font-serif text-slate-600">{hi}</span>}</>;
  };
  const label = (en: string, hi: string) => language === 'en' ? en : language === 'hi' ? hi : `${en} / ${hi}`;

  return (
    <main className="app-theme min-h-screen px-4 py-6 text-slate-900 sm:px-6 md:py-10">
      <div className="mx-auto max-w-4xl pb-10">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-xl shadow-sky-900/5 backdrop-blur-xl sm:p-10">
          <div className={`absolute inset-x-0 top-0 h-2 ${isPassing ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400' : 'bg-gradient-to-r from-amber-300 to-rose-400'}`} />
          <div className="mb-5 flex justify-start">
            <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard" className="rounded-xl border border-slate-200 bg-white/80 p-3 text-slate-600 transition hover:bg-white hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></button>
          </div>
          <div className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border-2 ${isPassing ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-rose-200 bg-rose-50 text-rose-500'}`}><Trophy className="h-10 w-10" /></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">{attempt.quiz_title}</h1>
          {attempt.quiz_title_hi && <p className="mt-1 font-serif text-xl text-slate-600">{attempt.quiz_title_hi}</p>}
          <p className="mb-8 mt-3 text-slate-600">{label('Quiz completed successfully!', 'क्विज़ सफलतापूर्वक पूरा हुआ!')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { title: label('Final Score', 'अंतिम स्कोर'), value: `${attempt.score}%`, style: 'bg-emerald-50 text-emerald-700' },
              { title: label('Correct', 'सही'), value: attempt.correct, style: 'bg-sky-50 text-sky-700' },
              { title: label('Wrong', 'गलत'), value: attempt.wrong, style: 'bg-rose-50 text-rose-700' },
              { title: label('Skipped', 'छोड़े गए'), value: attempt.skipped, style: 'bg-slate-100 text-slate-700' },
            ].map((item) => <div key={item.title} className={`rounded-2xl p-4 ${item.style}`}><div className="text-3xl font-black">{item.value}</div><div className="mt-1 text-xs font-bold uppercase tracking-wider opacity-70">{item.title}</div></div>)}
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-2xl font-black text-slate-900">{label('Answer review', 'उत्तर समीक्षा')}</h2><p className="mt-1 text-sm text-slate-600">{label('Review each answer and learn from its explanation.', 'हर उत्तर और उसकी व्याख्या से सीखें।')}</p></div>
            <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-white/80 bg-white/75 p-1 shadow-sm" aria-label="Review language">
              <Languages className="ml-2 h-4 w-4 text-emerald-700" />
              {(['both', 'en', 'hi'] as ReviewLanguage[]).map((value) => <button key={value} onClick={() => setLanguage(value)} aria-pressed={language === value} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${language === value ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50'}`}>{value === 'both' ? 'EN + HI' : value === 'en' ? 'English' : 'हिंदी'}</button>)}
            </div>
          </div>

          <div className="space-y-4">
            {(attempt.details || []).map((item: any, index: number) => {
              const skipped = item.selected_answer === 'Skipped';
              const Icon = item.isCorrect ? CheckCircle2 : skipped ? MinusCircle : XCircle;
              const statusClass = item.isCorrect ? 'border-emerald-200 bg-emerald-50/80' : skipped ? 'border-amber-200 bg-amber-50/80' : 'border-rose-200 bg-rose-50/80';
              const answerClass = item.isCorrect ? 'border-emerald-200 bg-white text-emerald-800' : 'border-rose-200 bg-white text-rose-800';
              return <article key={item.question_id || index} className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${statusClass}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`mt-1 h-5 w-5 shrink-0 ${item.isCorrect ? 'text-emerald-600' : skipped ? 'text-amber-600' : 'text-rose-600'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{label('Question', 'प्रश्न')} {index + 1}</p>
                    <h3 className="mb-5 text-lg font-bold leading-relaxed text-slate-900">{text(item.question, item.question_hi || item.questionHi)}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-2xl border p-4 ${answerClass}`}><span className="mb-1 block text-xs font-bold uppercase tracking-wider opacity-65">{label('Your answer', 'आपका उत्तर')}</span><span className="font-semibold">{text(item.selected_answer, item.selected_answer_hi || item.selectedAnswerHi || (skipped ? 'छोड़ा गया' : undefined))}</span></div>
                      {!item.isCorrect && <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-emerald-800"><span className="mb-1 block text-xs font-bold uppercase tracking-wider opacity-65">{label('Correct answer', 'सही उत्तर')}</span><span className="font-semibold">{text(item.correct_answer, item.correct_answer_hi || item.correctAnswerHi)}</span></div>}
                    </div>
                    {(item.explanation || item.explanation_hi || item.explanationHi) && <div className="mt-3 rounded-2xl border border-sky-200 bg-white/85 p-4 text-sm leading-relaxed text-slate-700"><span className="mb-1 block font-bold text-sky-800">{label('Explanation', 'व्याख्या')}</span><div>{text(item.explanation, item.explanation_hi || item.explanationHi)}</div></div>}
                  </div>
                </div>
              </article>;
            })}
          </div>
        </section>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl border border-white/80 bg-white/75 py-4 font-bold text-slate-700 shadow-sm transition hover:bg-white"><Home className="mr-2 inline h-5 w-5" />{label('Back to Dashboard', 'डैशबोर्ड पर जाएँ')}</button>
          <button onClick={() => router.push(`/quiz/${quizId}`)} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:brightness-105"><RotateCcw className="mr-2 inline h-5 w-5" />{label('Retake Quiz', 'क्विज़ फिर से दें')}</button>
        </div>
      </div>
    </main>
  );
}
