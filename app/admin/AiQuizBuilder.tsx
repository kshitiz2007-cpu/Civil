'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Loader2, Sparkles, Save } from 'lucide-react';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface GeneratedQuestion {
  text: string;
  textHi: string;
  options: string[];
  optionsHi: string[];
  correct: number;
  explanation: string;
  explanationHi: string;
}

export default function AiQuizBuilder() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<{ title: string; category: string; questions: GeneratedQuestion[] } | null>(null);
  const generateQuiz = async () => {
    if (!prompt.trim()) return alert('Please enter a topic!');
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fullPrompt = `Create 5 multiple choice questions about "${prompt}" in English and Hindi.
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Quiz title in English",
  "category": "General",
  "questions": [
    {
      "text": "Question in English",
      "textHi": "प्रश्न हिंदी में",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionsHi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      "correct": 0,
      "explanation": "Clear explanation in English",
      "explanationHi": "स्पष्ट व्याख्या हिंदी में"
    }
  ]
}
Use the same option order in both languages. correct must be an index from 0 to 3.`;
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      if (!Array.isArray(parsedData.questions) || parsedData.questions.some((q: GeneratedQuestion) => !q.text || !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3)) {
        throw new Error('The generated quiz has an invalid question format. Please generate it again.');
      }
      setGeneratedQuiz(parsedData);
    } catch (error) {
      console.error('AI Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate quiz. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!generatedQuiz) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('quizzes').insert([{
        id: `q_${Date.now()}`,
        title: generatedQuiz.title,
        category: generatedQuiz.category || 'General',
        section: generatedQuiz.category || 'General',
        time_limit: 30,
        is_paid: false,
        price: 0,
        questions: generatedQuiz.questions.map((question, index) => ({ id: `ai_${Date.now()}_${index}`, ...question })),
        active: false
      }]);
      if (error) throw error;
      alert('Bilingual quiz saved to drafts!');
      setGeneratedQuiz(null);
      setPrompt('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error saving quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-white/85 via-emerald-50/70 to-sky-50/80 p-5 shadow-sm sm:p-7">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-emerald-950"><Sparkles className="h-5 w-5 text-emerald-600" /> AI bilingual quiz builder</h2>
        <p className="mb-4 text-sm text-slate-600">Generate English and Hindi questions, answer options, and explanations. Review them before publishing.</p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a topic, e.g. Indian Constitution, Fundamental Rights" className="mb-4 min-h-28 w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        <button onClick={generateQuiz} disabled={loading || !prompt.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 py-3 font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}{loading ? 'Generating…' : 'Generate bilingual quiz'}
        </button>
      </section>
      {generatedQuiz && <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/85 p-4 sm:flex-row sm:items-center">
          <div><h3 className="font-bold text-slate-900">{generatedQuiz.title}</h3><p className="text-sm text-slate-500">{generatedQuiz.questions.length} questions · English + हिंदी</p></div>
          <button onClick={saveToDatabase} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}Save as draft</button>
        </div>
        {generatedQuiz.questions.map((question, index) => <article key={index} className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Question {index + 1} · EN</p><h4 className="font-bold text-slate-900">{question.text}</h4>
          <p className="mb-4 mt-1 font-serif text-slate-700">{question.textHi}</p>
          <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className={`rounded-xl border p-3 text-sm ${optionIndex === question.correct ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}><p className="font-semibold text-slate-800">{String.fromCharCode(65 + optionIndex)}. {option}{optionIndex === question.correct && <span className="ml-2 text-xs font-bold text-emerald-700">Correct</span>}</p><p className="mt-1 font-serif text-slate-600">{question.optionsHi?.[optionIndex] || ''}</p></div>)}</div>
          {(question.explanation || question.explanationHi) && <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/80 p-4 text-sm"><p className="font-bold text-sky-900">Explanation · EN</p><p className="mt-1 text-slate-700">{question.explanation || '—'}</p><p className="mt-3 font-bold text-sky-900">व्याख्या · HI</p><p className="mt-1 font-serif text-slate-700">{question.explanationHi || '—'}</p></div>}
        </article>)}
      </section>}
    </div>
  );
}
