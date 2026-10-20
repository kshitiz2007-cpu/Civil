'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Loader2, Sparkles, Save } from 'lucide-react';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

interface GeneratedQuestion {
  text: string;
  textHi: string;
  options: string[];
  optionsHi: string[];
  correct: number;
  explanation: string;
  explanationHi: string;
}

const CATEGORIES = [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science & Tech',
  'Current Affairs',
  'Maths',
  'Reasoning',
];

export default function AiQuizBuilder() {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Polity');
  const [questionCount, setQuestionCount] = useState(5);
  const [pattern, setPattern] = useState('upsc-statement');
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    title: string;
    category: string;
    questions: GeneratedQuestion[];
  } | null>(null);

  const generateQuiz = async () => {
    if (!prompt.trim()) return alert('Please enter a syllabus topic or text!');
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const styleInstruction =
        pattern === 'upsc-statement'
          ? 'Use authentic UPSC CSE Prelims multi-statement format ("Consider the following statements: 1... 2... Which of the statements given above is/are correct?").'
          : pattern === 'pair-matching'
          ? 'Use UPSC CSE Prelims latest "How many of the above pairs/statements are correct? (Only one, Only two, All three, None)" pattern.'
          : 'Use crisp conceptual Civil Services Prelims questions.';

      const fullPrompt = `Create ${questionCount} multiple choice questions about "${prompt}" for the UPSC Civil Services Prelims Examination in both English and Hindi.
${styleInstruction}
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Descriptive UPSC Prelims Paper Title in English",
  "category": "${category}",
  "questions": [
    {
      "text": "Question in English",
      "textHi": "प्रश्न हिंदी में",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionsHi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      "correct": 0,
      "explanation": "Detailed UPSC faculty explanation in English",
      "explanationHi": "विस्तृत व्याख्या हिंदी में"
    }
  ]
}
Use the same option order in both languages. correct must be an index from 0 to 3.`;

      const result = await model.generateContent(fullPrompt);
      const responseText = result.response
        .text()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsedData = JSON.parse(responseText);
      if (
        !Array.isArray(parsedData.questions) ||
        parsedData.questions.some(
          (q: GeneratedQuestion) =>
            !q.text ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            !Number.isInteger(q.correct) ||
            q.correct < 0 ||
            q.correct > 3
        )
      ) {
        throw new Error(
          'The generated paper has an invalid question format. Please generate again.'
        );
      }
      setGeneratedQuiz({ ...parsedData, category });
    } catch (error) {
      console.error('AI Error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to generate quiz. Check your Gemini API key.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async (publishNow: boolean) => {
    if (!generatedQuiz) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('quizzes').insert([
        {
          id: `q_${Date.now()}`,
          title: generatedQuiz.title,
          category: category || generatedQuiz.category || 'Polity',
          section: category || 'General Studies',
          time_limit: Math.max(15, generatedQuiz.questions.length * 2),
          is_paid: false,
          price: 0,
          questions: generatedQuiz.questions.map((question, index) => ({
            id: `ai_${Date.now()}_${index}`,
            ...question,
          })),
          active: publishNow,
        },
      ]);
      if (error) throw error;
      alert(
        publishNow
          ? 'Bilingual UPSC paper published live!'
          : 'Bilingual UPSC paper saved to drafts!'
      );
      setGeneratedQuiz(null);
      setPrompt('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error saving paper.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
          Automated Bilingual Paper Synthesis
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <Sparkles className="h-7 w-7 text-[var(--app-accent)]" /> AI UPSC
          Prelims Paper Setter
        </h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Synthesize multi-statement UPSC Prelims questions in English and Hindi
          with comprehensive faculty explanations.
        </p>
      </header>

      <section className="theme-surface rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
              GS Discipline Folder
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm font-semibold"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
              UPSC Question Pattern
            </label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm font-semibold"
            >
              <option value="upsc-statement">
                Multi-Statement (1 & 2 only / 1, 2 & 3)
              </option>
              <option value="pair-matching">
                Latest UPSC Pair-Count (Only one / Only two)
              </option>
              <option value="direct">
                Standard Conceptual Prelims Pattern
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
              Question Count
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="glass-input w-full text-xs sm:text-sm font-semibold"
            >
              <option value={5}>5 Questions (Mini Drill)</option>
              <option value={10}>10 Questions (Daily Sectional)</option>
              <option value={20}>20 Questions (Topic Test)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
            Syllabus Topic, PIB Summary, or Editorial Source Text
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Parliamentary Committees, Anti-Defection Law (10th Schedule), Monetary Policy Committee, or paste a PIB / Hindu editorial..."
            className="glass-input min-h-32 w-full text-sm"
          />
        </div>

        <button
          onClick={generateQuiz}
          disabled={loading || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] py-3.5 text-sm font-bold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {loading
            ? 'Synthesizing Bilingual UPSC Paper…'
            : 'Synthesize Bilingual UPSC Paper'}
        </button>
      </section>

      {generatedQuiz && (
        <section className="space-y-4">
          <div className="theme-surface flex flex-col justify-between gap-3 rounded-2xl p-5 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                {category} · {generatedQuiz.questions.length} Bilingual Questions
              </span>
              <h3 className="text-lg font-bold">{generatedQuiz.title}</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => saveToDatabase(false)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 text-xs font-bold"
              >
                <Save className="h-4 w-4" /> Save as Draft
              </button>
              <button
                onClick={() => saveToDatabase(true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-xs font-bold text-slate-950"
              >
                <Sparkles className="h-4 w-4" /> Publish Live Immediately
              </button>
            </div>
          </div>

          {generatedQuiz.questions.map((question, index) => (
            <article
              key={index}
              className="theme-surface rounded-2xl p-5 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--app-accent)]">
                Question {index + 1} · Bilingual Preview
              </p>
              <h4 className="font-bold text-sm sm:text-base whitespace-pre-line">
                {question.text}
              </h4>
              <p className="font-hindi text-sm text-[var(--app-muted)] whitespace-pre-line">
                {question.textHi}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 pt-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`rounded-xl border p-3 text-xs ${
                      optionIndex === question.correct
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-bold'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                    }`}
                  >
                    <p>
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </p>
                    <p className="mt-1 font-hindi text-[var(--app-muted)]">
                      {question.optionsHi?.[optionIndex] || ''}
                    </p>
                  </div>
                ))}
              </div>
              {(question.explanation || question.explanationHi) && (
                <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs space-y-1.5">
                  <p className="font-bold text-[var(--app-accent)]">
                    Faculty Value-Add (EN):
                  </p>
                  <p>{question.explanation || '—'}</p>
                  <p className="font-bold text-[var(--app-secondary)] pt-1">
                    व्याख्या (HI):
                  </p>
                  <p className="font-hindi">{question.explanationHi || '—'}</p>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
