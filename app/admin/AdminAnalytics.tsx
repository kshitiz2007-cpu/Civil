'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Activity,
  Award,
  BookOpen,
  Download,
  FileText,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

type Student = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

type Attempt = {
  id: string;
  user_id: string;
  score: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  total?: number;
  category?: string | null;
  quiz_title: string | null;
  completed_at: string | null;
};

type CohortFilter = 'all' | 'merit' | 'borderline' | 'at-risk';

export default function AdminAnalytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<CohortFilter>('all');
  const [loading, setLoading] = useState(true);
  const [referenceTime, setReferenceTime] = useState(0);

  // Mentor observation notes keyed by student ID
  const [mentorNotes, setMentorNotes] = useState<Record<string, string>>({});
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('gyankunj-mentor-notes');
      if (saved) setMentorNotes(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: profiles }, { data: results }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id,name,email,created_at')
          .neq('role', 'admin')
          .order('created_at', { ascending: false }),
        supabase
          .from('attempts')
          .select(
            'id,user_id,score,correct,wrong,skipped,total,category,quiz_title,completed_at'
          )
          .order('completed_at', { ascending: false }),
      ]);
      if (!active) return;
      const roster = (profiles || []) as Student[];
      setStudents(roster);
      setAttempts((results || []) as Attempt[]);
      setSelectedId((prev) => prev || roster[0]?.id || '');
      setReferenceTime(Date.now());
      setLoading(false);
    }
    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  // Enrich each student with diagnostic metrics
  const enrichedRoster = useMemo(() => {
    return students.map((s) => {
      const userAttempts = attempts.filter((a) => a.user_id === s.id);
      const count = userAttempts.length;
      const avg = count
        ? Math.round(
            userAttempts.reduce((sum, a) => sum + Number(a.score || 0), 0) /
              count
          )
        : 0;
      const totalCorrect = userAttempts.reduce(
        (sum, a) => sum + Number(a.correct || 0),
        0
      );
      const totalWrong = userAttempts.reduce(
        (sum, a) => sum + Number(a.wrong || 0),
        0
      );
      const totalAttempted = totalCorrect + totalWrong;
      const accuracy = totalAttempted
        ? Math.round((totalCorrect / totalAttempted) * 100)
        : avg;
      const negBleed = +(totalWrong * 0.66).toFixed(1);

      let status: 'merit' | 'borderline' | 'at-risk' = 'borderline';
      if (count > 0 && avg >= 60) status = 'merit';
      else if (count === 0 || avg < 45) status = 'at-risk';

      return {
        ...s,
        count,
        avg,
        accuracy,
        negBleed,
        totalCorrect,
        totalWrong,
        status,
        latestScore: count ? userAttempts[0].score : null,
      };
    });
  }, [students, attempts]);

  const batchAverage = useMemo(() => {
    if (!attempts.length) return 0;
    return Math.round(
      attempts.reduce((sum, a) => sum + Number(a.score || 0), 0) /
        attempts.length
    );
  }, [attempts]);

  const topperAverage = useMemo(() => {
    const active = enrichedRoster.filter((s) => s.count > 0);
    if (!active.length) return 0;
    return Math.max(...active.map((s) => s.avg));
  }, [enrichedRoster]);

  const filtered = useMemo(() => {
    return enrichedRoster.filter((s) => {
      const matchesSearch = `${s.name} ${s.email}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCohort =
        cohortFilter === 'all' || s.status === cohortFilter;
      return matchesSearch && matchesCohort;
    });
  }, [enrichedRoster, query, cohortFilter]);

  const selected = enrichedRoster.find((s) => s.id === selectedId);
  const results = attempts.filter((a) => a.user_id === selectedId);
  const recent = results.slice(0, 8);

  // Selected student subject breakdown
  const selectedSubjectBreakdown = useMemo(() => {
    const pillars = [
      'Polity',
      'History',
      'Geography',
      'Economy',
      'Environment',
      'Science & Tech',
      'Current Affairs',
    ];
    return pillars.map((sub) => {
      const subRes = results.filter(
        (a) =>
          (a.category || '').toLowerCase() === sub.toLowerCase() ||
          (a.quiz_title || '').toLowerCase().includes(sub.toLowerCase())
      );
      const mean = subRes.length
        ? Math.round(
            subRes.reduce((s, a) => s + Number(a.score || 0), 0) /
              subRes.length
          )
        : null;
      return { subject: sub, count: subRes.length, mean };
    });
  }, [results]);

  const completedLast30 = referenceTime
    ? attempts.filter(
        (a) =>
          a.completed_at &&
          referenceTime - new Date(a.completed_at).getTime() < 30 * 86400000
      ).length
    : 0;

  const saveMentorNote = (studentId: string, text: string) => {
    const updated = { ...mentorNotes, [studentId]: text };
    setMentorNotes(updated);
    try {
      window.localStorage.setItem(
        'gyankunj-mentor-notes',
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const exportCsv = () => {
    const rows = [
      [
        'Aspirant Name',
        'Email',
        'Cohort Track',
        'Evaluations Completed',
        'Mean Score (%)',
        'Accuracy (%)',
        'Negative Marks Bleed',
        'Latest Score (%)',
        'Faculty Mentor Observation',
      ],
    ];
    enrichedRoster.forEach((student) => {
      rows.push([
        student.name || 'Aspirant',
        student.email || '',
        student.status.toUpperCase(),
        String(student.count),
        String(student.avg),
        String(student.accuracy),
        `-${student.negBleed}`,
        student.latestScore !== null ? String(student.latestScore) : 'N/A',
        mentorNotes[student.id] || '',
      ]);
    });
    const csv = rows
      .map((row) => row.map((cell) => JSON.stringify(String(cell))).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gyankunj-cohort-diagnostics.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 text-[var(--app-text)]">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-accent)]">
            Faculty Observation & Cohort Telemetry
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            360° Performance Observation Suite
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Identify topper benchmarks, negative-marking bleed, subject
            vulnerabilities, and at-risk aspirants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Export Diagnostic Dossier (CSV)
          </button>
        </div>
      </header>

      {/* Top Summary Strip */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Enrolled Cohort"
          value={students.length}
          sub={`${
            enrichedRoster.filter((s) => s.status === 'merit').length
          } on Merit Track (≥60%)`}
        />
        <Metric
          icon={BookOpen}
          label="30-Day Evaluations"
          value={completedLast30}
          sub={`${attempts.length} cumulative submissions`}
        />
        <Metric
          icon={TrendingUp}
          label="Institution Mean vs Topper"
          value={attempts.length ? `${batchAverage}%` : '—'}
          sub={`Topper Mean: ${topperAverage}%`}
        />
        <Metric
          icon={ShieldAlert}
          label="At-Risk / Inactive Aspirants"
          value={enrichedRoster.filter((s) => s.status === 'at-risk').length}
          sub="Scoring <45% or 0 evaluations"
        />
      </div>

      {/* Main Split View: Roster Quadrant Filter + 360° Aspirant Dossier */}
      <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.55fr)]">
        {/* Left Directory with Cohort Quadrant Filter */}
        <div className="theme-surface overflow-hidden rounded-3xl flex flex-col">
          <div className="border-b border-[var(--app-border)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Aspirant Cohort Directory</h3>
              <span className="text-xs text-[var(--app-muted)]">
                {filtered.length} shown
              </span>
            </div>

            {/* Quadrant Filter Pills */}
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1 text-[11px]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'merit', label: 'Merit' },
                  { id: 'borderline', label: 'Steady' },
                  { id: 'at-risk', label: 'At-Risk' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCohortFilter(tab.id)}
                  className={`rounded-lg py-1.5 font-bold transition ${
                    cohortFilter === tab.id
                      ? 'bg-[var(--app-accent)] text-slate-950'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--app-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search aspirant name or email..."
                className="glass-input w-full py-2 pl-9 pr-3 text-xs"
              />
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
            {loading ? (
              <p className="p-5 text-xs text-[var(--app-muted)]">
                Loading aspirant telemetry…
              </p>
            ) : filtered.length ? (
              filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    selectedId === s.id
                      ? 'bg-[var(--app-accent-soft)] border border-[var(--app-accent)]'
                      : 'border border-transparent hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] border border-[var(--app-border)] font-bold text-sm text-[var(--app-accent)]">
                    {(s.name || s.email || 'A').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold">
                        {s.name || 'Aspirant'}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          s.status === 'merit'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : s.status === 'borderline'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-[var(--app-muted)]">
                      {s.count} papers · {s.avg}% mean · {s.accuracy}% acc
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-[var(--app-muted)]">
                No aspirants match this filter.
              </p>
            )}
          </div>
        </div>

        {/* Right 360° Individual Aspirant Diagnostic View */}
        <div className="space-y-5">
          {selected ? (
            <>
              {/* Profile Header Card */}
              <div className="theme-surface flex flex-col justify-between gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-xl font-bold text-[var(--app-accent)]">
                    {(selected.name || selected.email || 'A')
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {selected.name || 'Aspirant'}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          selected.status === 'merit'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : selected.status === 'borderline'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {selected.status === 'merit'
                          ? 'Merit Track (≥60%)'
                          : selected.status === 'borderline'
                          ? 'Steady Track (45–59%)'
                          : 'At-Risk / Intervention Needed'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      {selected.email} · Joined{' '}
                      {new Date(selected.created_at).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${selected.email}?subject=Gyankunj%20IAS%20Mentorship%20Feedback`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
                >
                  <Mail className="w-3.5 h-3.5" /> Dispatch Mentor Email
                </a>
              </div>

              {/* 4 Diagnostic KPIs for Selected Aspirant */}
              <div className="grid gap-3.5 sm:grid-cols-4">
                <div className="theme-surface rounded-2xl p-4">
                  <span className="text-xs text-[var(--app-muted)]">
                    Papers Evaluated
                  </span>
                  <p className="mt-2 text-2xl font-bold">{selected.count}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                    +{selected.totalCorrect} Correct / -{selected.totalWrong}{' '}
                    Wrong
                  </p>
                </div>

                <div className="theme-surface rounded-2xl p-4">
                  <span className="text-xs text-[var(--app-muted)]">
                    Mean Net Score
                  </span>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-accent)]">
                    {selected.count ? `${selected.avg}%` : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                    Batch Mean: {batchAverage}%
                  </p>
                </div>

                <div className="theme-surface rounded-2xl p-4">
                  <span className="text-xs text-[var(--app-muted)]">
                    Strike Accuracy
                  </span>
                  <p className="mt-2 text-2xl font-bold">
                    {selected.count ? `${selected.accuracy}%` : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                    Correct / Attempted ratio
                  </p>
                </div>

                <div className="theme-surface rounded-2xl p-4">
                  <span className="text-xs text-[var(--app-muted)]">
                    Penalty Bleed
                  </span>
                  <p className="mt-2 text-2xl font-bold text-rose-400">
                    -{selected.negBleed}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                    Marks lost to -0.66
                  </p>
                </div>
              </div>

              {/* Subject-Wise Proficiency & Faculty Mentor Observation Grid */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* GS Subject Strengths & Weaknesses */}
                <div className="theme-surface rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold">
                        GS Subject Proficiency Radar
                      </h4>
                      <p className="text-[11px] text-[var(--app-muted)]">
                        Identify strong vs vulnerable syllabus pillars
                      </p>
                    </div>
                    <Target className="w-4 h-4 text-[var(--app-accent)]" />
                  </div>
                  <div className="space-y-2.5">
                    {selectedSubjectBreakdown.map((item) => (
                      <div key={item.subject} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{item.subject}</span>
                          <span className="text-[var(--app-muted)]">
                            {item.mean !== null
                              ? `${item.mean}% (${item.count})`
                              : 'Unattempted'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                          <div
                            className={`h-full rounded-full ${
                              (item.mean || 0) >= 55
                                ? 'bg-emerald-400'
                                : (item.mean || 0) >= 40
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                            style={{
                              width: `${item.mean ?? 6}%`,
                              opacity: item.mean !== null ? 1 : 0.25,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Mentor Observation Log */}
                <div className="theme-surface rounded-3xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[var(--app-accent)]" />
                        Faculty Mentorship Dossier Note
                      </h4>
                      {noteSaved && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--app-muted)] mb-3">
                      Record qualitative observations on attempt discipline,
                      50-50 guessing habits, or Mains answer readiness.
                    </p>
                    <textarea
                      rows={4}
                      value={mentorNotes[selected.id] || ''}
                      onChange={(e) =>
                        setMentorNotes((prev) => ({
                          ...prev,
                          [selected.id]: e.target.value,
                        }))
                      }
                      placeholder="e.g. Strong conceptual hold in Polity, but loses ~6 marks per mock due to aggressive guessing in Economy statement questions..."
                      className="glass-input w-full text-xs leading-relaxed"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      saveMentorNote(
                        selected.id,
                        mentorNotes[selected.id] || ''
                      )
                    }
                    className="mt-3 w-full rounded-xl bg-[var(--app-accent)] py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
                  >
                    Save Mentor Observation
                  </button>
                </div>
              </div>

              {/* Recent Evaluations List */}
              <div className="theme-surface overflow-hidden rounded-3xl">
                <div className="border-b border-[var(--app-border)] p-5">
                  <h3 className="text-sm font-bold">
                    Individual Evaluation History
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                    Paper-by-paper breakdown of accuracy and negative penalty
                  </p>
                </div>
                {recent.length ? (
                  <div className="divide-y divide-[var(--app-border)]">
                    {recent.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {a.quiz_title || 'Mock Paper'}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                            {a.completed_at
                              ? new Date(a.completed_at).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : 'Date unavailable'}
                            {a.correct !== undefined &&
                              ` · +${a.correct} Correct · -${
                                a.wrong || 0
                              } Wrong (${+(
                                Number(a.wrong || 0) * 0.66
                              ).toFixed(2)} penalty)`}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            Number(a.score) >= 50
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {a.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-8 text-center text-xs text-[var(--app-muted)]">
                    No test evaluations recorded for this aspirant yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="theme-surface rounded-3xl p-12 text-center text-sm text-[var(--app-muted)]">
              {loading
                ? 'Loading performance telemetry…'
                : 'Select an aspirant from the directory to inspect their 360° diagnostic dossier.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="theme-surface rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--app-muted)]">{label}</span>
        <Icon className="h-4 w-4 text-[var(--app-accent)]" />
      </div>
      <p className="mt-2.5 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--app-muted)]">{sub}</p>
    </div>
  );
}
