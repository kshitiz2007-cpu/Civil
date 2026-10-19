'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileQuestion,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Eye,
  Copy,
  X,
  Clock3,
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  category: string;
  section?: string;
  time_limit: number;
  active: boolean;
  created_at: string;
  questions?: any[];
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
  'GS',
];

export default function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'active' | 'hidden'>(
    'all'
  );
  const [inspectQuiz, setInspectQuiz] = useState<Quiz | null>(null);

  // Per-quiz local marking config (persisted in localStorage if columns don't exist in DB)
  const [markingConfig, setMarkingConfig] = useState<
    Record<string, { neg: string; cutoff: string }>
  >({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('gyankunj-quiz-marking');
      if (saved) setMarkingConfig(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const updateQuizMarking = (
    id: string,
    field: 'neg' | 'cutoff',
    value: string
  ) => {
    setMarkingConfig((prev) => {
      const current = prev[id] || { neg: '0.66', cutoff: '50' };
      const updated = { ...prev, [id]: { ...current, [field]: value } };
      try {
        window.localStorage.setItem(
          'gyankunj-quiz-marking',
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
      return updated;
    });
    showSuccess(id);
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesQuery =
      quiz.title.toLowerCase().includes(query.toLowerCase()) ||
      quiz.category?.toLowerCase().includes(query.toLowerCase());
    const matchesVisibility =
      visibility === 'all' ||
      (visibility === 'active' ? quiz.active : !quiz.active);
    return matchesQuery && matchesVisibility;
  });

  useEffect(() => {
    let active = true;
    async function fetchQuizzes() {
      setLoading(true);
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      if (active && data) setQuizzes(data as Quiz[]);
      if (active) setLoading(false);
    }
    fetchQuizzes();
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateCategory = async (id: string, newCat: string) => {
    setActionLoadingId(id);
    const { error } = await supabase
      .from('quizzes')
      .update({ category: newCat })
      .eq('id', id);
    if (!error) {
      setQuizzes(
        quizzes.map((q) => (q.id === id ? { ...q, category: newCat } : q))
      );
      showSuccess(id);
    } else alert('Failed to update subject folder.');
    setActionLoadingId(null);
  };

  const handleUpdateDuration = async (id: string, newDuration: number) => {
    if (!newDuration || newDuration < 1) return;
    setActionLoadingId(id);
    const { error } = await supabase
      .from('quizzes')
      .update({ time_limit: newDuration })
      .eq('id', id);
    if (!error) {
      setQuizzes(
        quizzes.map((q) =>
          q.id === id ? { ...q, time_limit: newDuration } : q
        )
      );
      showSuccess(id);
    }
    setActionLoadingId(null);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('quizzes')
      .update({ active: newStatus })
      .eq('id', id);
    if (!error) {
      setQuizzes(
        quizzes.map((q) => (q.id === id ? { ...q, active: newStatus } : q))
      );
      showSuccess(id);
    } else alert('Failed to update visibility.');
    setActionLoadingId(null);
  };

  const handleCloneQuiz = async (quiz: Quiz) => {
    setActionLoadingId(quiz.id);
    const clone: any = {
      id: `q_${Date.now()}`,
      title: `${quiz.title} (Copy)`,
      category: quiz.category || 'Polity',
      section: quiz.section || quiz.category || 'General',
      time_limit: quiz.time_limit || 30,
      is_paid: false,
      price: 0,
      active: false,
      questions: quiz.questions || [],
    };
    const { error } = await supabase.from('quizzes').insert([clone]);
    if (!error) {
      setQuizzes([
        { ...clone, created_at: new Date().toISOString() },
        ...quizzes,
      ]);
      showSuccess(quiz.id);
    } else {
      alert('Could not clone paper: ' + error.message);
    }
    setActionLoadingId(null);
  };

  const deleteQuiz = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this test paper and its associated OMR attempts?'
      )
    )
      return;
    setActionLoadingId(id);
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (!error) {
      setQuizzes(quizzes.filter((q) => q.id !== id));
    } else alert('Failed to delete paper.');
    setActionLoadingId(null);
  };

  const showSuccess = (id: string) => {
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 1800);
  };

  return (
    <div className="space-y-6 pb-20 text-[var(--app-text)]">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
          Paper Repository & Marking Governance
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <FileQuestion className="w-7 h-7 text-[var(--app-accent)]" /> Test
          Engine & Paper Controller
        </h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Configure GS subject folders, duration limits, negative marking
          penalties, qualifying cutoffs, and live publication status.
        </p>
      </header>

      <div className="theme-surface rounded-3xl overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--app-border)] p-4 sm:p-5 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--app-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search paper title or GS discipline..."
              className="glass-input w-full pl-10 py-2 text-xs sm:text-sm"
            />
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            className="glass-input text-xs sm:text-sm font-semibold"
          >
            <option value="all">All Papers ({quizzes.length})</option>
            <option value="active">
              Published ({quizzes.filter((q) => q.active).length})
            </option>
            <option value="hidden">
              Draft / Hidden ({quizzes.filter((q) => !q.active).length})
            </option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--app-accent)]" />
            </div>
          ) : (
            <table className="w-full text-left min-w-[920px] text-xs sm:text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-[10px] uppercase tracking-wider text-[var(--app-muted)] border-b border-[var(--app-border)]">
                <tr>
                  <th className="px-5 py-4">Paper Title & Questions</th>
                  <th className="px-4 py-4">GS Discipline</th>
                  <th className="px-4 py-4">Duration</th>
                  <th className="px-4 py-4">Marking Scheme</th>
                  <th className="px-4 py-4">Cutoff</th>
                  <th className="px-4 py-4 text-center">Publication</th>
                  <th className="px-5 py-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filteredQuizzes.map((q) => {
                  const cfg = markingConfig[q.id] || {
                    neg: '0.66',
                    cutoff: '50',
                  };
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-[var(--app-surface-muted)] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold line-clamp-1">{q.title}</div>
                        <div className="text-[11px] text-[var(--app-muted)] mt-0.5">
                          {q.questions?.length || 0} Questions · ID:{' '}
                          {q.id.slice(0, 10)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          className={`glass-input py-1.5 px-2.5 text-xs font-semibold ${
                            successId === q.id
                              ? 'border-emerald-400 text-emerald-300'
                              : ''
                          }`}
                          value={q.category || ''}
                          onChange={(e) =>
                            handleUpdateCategory(q.id, e.target.value)
                          }
                          disabled={actionLoadingId === q.id}
                        >
                          {!CATEGORIES.includes(q.category) && (
                            <option value={q.category}>
                              {q.category || 'General'}
                            </option>
                          )}
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                          <input
                            type="number"
                            min={5}
                            max={180}
                            defaultValue={q.time_limit || 30}
                            onBlur={(e) =>
                              handleUpdateDuration(q.id, Number(e.target.value))
                            }
                            className="glass-input w-16 py-1 px-2 text-xs text-center font-bold"
                          />
                          <span className="text-xs text-[var(--app-muted)]">
                            m
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={cfg.neg}
                          onChange={(e) =>
                            updateQuizMarking(q.id, 'neg', e.target.value)
                          }
                          className="glass-input py-1.5 px-2.5 text-xs font-semibold"
                        >
                          <option value="0.66">+2.0 / -0.66 (1/3)</option>
                          <option value="0.50">+2.0 / -0.50 (1/4)</option>
                          <option value="0.00">+2.0 / 0.00 (No Neg)</option>
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={cfg.cutoff}
                          onChange={(e) =>
                            updateQuizMarking(q.id, 'cutoff', e.target.value)
                          }
                          className="glass-input py-1.5 px-2 text-xs font-semibold"
                        >
                          <option value="45">45%</option>
                          <option value="50">50%</option>
                          <option value="55">55%</option>
                          <option value="60">60%</option>
                        </select>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(q.id, q.active)}
                          disabled={actionLoadingId === q.id}
                          className={`inline-flex items-center justify-center w-28 gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition ${
                            q.active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] border-[var(--app-border)]'
                          }`}
                        >
                          {q.active ? (
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                          <span>{q.active ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setInspectQuiz(q)}
                            className="p-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            title="Inspect Questions & Key"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCloneQuiz(q)}
                            disabled={actionLoadingId === q.id}
                            className="p-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            title="Duplicate / Clone Paper"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteQuiz(q.id)}
                            disabled={actionLoadingId === q.id}
                            className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            title="Delete Paper"
                          >
                            {actionLoadingId === q.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Question Inspector Modal */}
      {inspectQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="theme-surface-solid max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] p-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                  {inspectQuiz.category} · {inspectQuiz.questions?.length || 0}{' '}
                  Questions
                </span>
                <h3 className="text-lg font-bold">{inspectQuiz.title}</h3>
              </div>
              <button
                onClick={() => setInspectQuiz(null)}
                className="rounded-xl border border-[var(--app-border)] p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {(inspectQuiz.questions || []).map((q: any, i: number) => (
                <div
                  key={q.id || i}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs sm:text-sm space-y-2"
                >
                  <p className="font-bold">
                    Q{i + 1}. {q.text}
                  </p>
                  {q.textHi && (
                    <p className="font-hindi text-[var(--app-muted)]">
                      {q.textHi}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    {(q.options || []).map((opt: string, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-xl border px-3 py-2 text-xs ${
                          q.correct === idx
                            ? 'border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-300'
                            : 'border-[var(--app-border)]'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}