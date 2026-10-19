'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  FileQuestion,
  CheckCircle2,
  Activity,
  Clock,
  ChevronRight,
  Loader2,
  Sliders,
  ShieldAlert,
  Target,
  Megaphone,
  Award,
  Sparkles,
} from 'lucide-react';

export default function AdminOverview({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const [stats, setStats] = useState({
    quizzes: 0,
    students: 0,
    submissions: 0,
  });
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Institutional Exam Engine Global Controls
  const [defaultNegMarking, setDefaultNegMarking] = useState('0.66');
  const [qualifyingCutoff, setQualifyingCutoff] = useState('50');
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [solutionPolicy, setSolutionPolicy] = useState('instant');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [savedToast, setSavedToast] = useState('');

  useEffect(() => {
    try {
      const savedNotice = window.localStorage.getItem(
        'gyankunj-admin-broadcast'
      );
      if (savedNotice) setBroadcastInput(savedNotice);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          { count: quizCount },
          { count: studentCount },
          { data: attemptsData },
        ] = await Promise.all([
          supabase.from('quizzes').select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student'),
          supabase
            .from('attempts')
            .select(
              'id, user_name, quiz_title, category, score, correct, wrong, skipped, total, completed_at'
            )
            .order('completed_at', { ascending: false })
            .limit(100),
        ]);

        const list = attemptsData || [];
        setStats({
          quizzes: quizCount || 0,
          students: studentCount || 0,
          submissions: list.length,
        });
        setAllAttempts(list);
        setRecentActivities(list.slice(0, 8));
      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute institutional performance telemetry
  const telemetry = useMemo(() => {
    if (!allAttempts.length) {
      return {
        meanScore: 0,
        cutoffClearanceRate: 0,
        highNegativeAlerts: 0,
        subjectBreakdown: [] as {
          subject: string;
          avgScore: number;
          attempts: number;
        }[],
      };
    }
    const cutoffNum = Number(qualifyingCutoff) || 50;
    const totalScore = allAttempts.reduce(
      (sum, a) => sum + Number(a.score || 0),
      0
    );
    const meanScore = Math.round(totalScore / allAttempts.length);
    const cleared = allAttempts.filter(
      (a) => Number(a.score || 0) >= cutoffNum
    ).length;
    const cutoffClearanceRate = Math.round(
      (cleared / allAttempts.length) * 100
    );
    const highNegativeAlerts = allAttempts.filter(
      (a) => Number(a.wrong || 0) >= 5
    ).length;

    const subjects = [
      'Polity',
      'History',
      'Geography',
      'Economy',
      'Environment',
      'Science & Tech',
      'Current Affairs',
    ];
    const subjectBreakdown = subjects.map((sub) => {
      const matching = allAttempts.filter(
        (a) =>
          (a.category || '').toLowerCase() === sub.toLowerCase() ||
          (a.quiz_title || '').toLowerCase().includes(sub.toLowerCase())
      );
      const avg = matching.length
        ? Math.round(
            matching.reduce((s, a) => s + Number(a.score || 0), 0) /
              matching.length
          )
        : 0;
      return { subject: sub, avgScore: avg, attempts: matching.length };
    });

    return {
      meanScore,
      cutoffClearanceRate,
      highNegativeAlerts,
      subjectBreakdown,
    };
  }, [allAttempts, qualifyingCutoff]);

  const handleSaveInstitutionalPolicy = () => {
    try {
      window.localStorage.setItem(
        'gyankunj-admin-broadcast',
        broadcastInput.trim()
      );
      window.localStorage.setItem(
        'gyankunj-admin-policy',
        JSON.stringify({
          defaultNegMarking,
          qualifyingCutoff,
          proctoringEnabled,
          solutionPolicy,
        })
      );
    } catch {
      // ignore
    }
    setSavedToast('Institutional controls & student notice synchronized.');
    setTimeout(() => setSavedToast(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--app-accent)]">
        <Loader2 className="w-9 h-9 animate-spin mb-3" />
        <p className="text-sm font-medium text-[var(--app-muted)]">
          Synchronizing institutional telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
            Academic Governance & Live Telemetry
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Institutional Command Center
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Observe cohort accuracy, negative-marking discipline, and configure
            global UPSC test engine rules.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('analytics')}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
        >
          <Activity className="w-4 h-4" /> Open Deep Cohort Diagnostics
        </button>
      </header>

      {/* 6 Institutional KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <button
          onClick={() => setActiveTab('quizzes')}
          className="theme-surface text-left p-4 rounded-2xl hover:border-[var(--app-accent)] transition group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Test Papers</span>
            <FileQuestion className="w-4 h-4 text-[var(--app-accent)]" />
          </div>
          <p className="mt-2.5 text-2xl font-bold">{stats.quizzes}</p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)] flex items-center gap-1">
            Manage papers <ChevronRight className="w-3 h-3" />
          </p>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className="theme-surface text-left p-4 rounded-2xl hover:border-[var(--app-accent)] transition group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Aspirants</span>
            <Users className="w-4 h-4 text-[var(--app-secondary)]" />
          </div>
          <p className="mt-2.5 text-2xl font-bold">{stats.students}</p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)] flex items-center gap-1">
            Cohort roster <ChevronRight className="w-3 h-3" />
          </p>
        </button>

        <div className="theme-surface p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Evaluations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold">{stats.submissions}</p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)]">
            OMR sheets graded
          </p>
        </div>

        <div className="theme-surface p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Batch Mean</span>
            <Target className="w-4 h-4 text-[var(--app-accent)]" />
          </div>
          <p className="mt-2.5 text-2xl font-bold">{telemetry.meanScore}%</p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)]">
            Target cutoff: {qualifyingCutoff}%
          </p>
        </div>

        <div className="theme-surface p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Cutoff Cleared</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold">
            {telemetry.cutoffClearanceRate}%
          </p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)]">
            Scoring ≥ {qualifyingCutoff}%
          </p>
        </div>

        <div className="theme-surface p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Penalty Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold text-rose-400">
            {telemetry.highNegativeAlerts}
          </p>
          <p className="mt-1 text-[11px] text-[var(--app-muted)]">
            ≥ 5 wrong in a paper
          </p>
        </div>
      </div>

      {/* Institutional Control Panel + Subject Accuracy Matrix */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Global Examination Engine & Broadcast Controls */}
        <section className="theme-surface rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  Examination Engine & Policy Controls
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  Configure institutional marking standards, proctoring, and
                  aspirant advisories
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Default Negative Marking Penalty
              </label>
              <select
                value={defaultNegMarking}
                onChange={(e) => setDefaultNegMarking(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm font-semibold"
              >
                <option value="0.66">
                  -0.66 Marks (1/3rd UPSC CSE Standard)
                </option>
                <option value="0.50">
                  -0.50 Marks (1/4th State PSC Standard)
                </option>
                <option value="0.00">
                  0.00 Marks (NCERT Foundation Mode)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Qualifying Cutoff Benchmark (%)
              </label>
              <select
                value={qualifyingCutoff}
                onChange={(e) => setQualifyingCutoff(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm font-semibold"
              >
                <option value="45">45% (Difficult Full-Length Simulator)</option>
                <option value="50">50% (Standard UPSC Prelims Benchmark)</option>
                <option value="55">55% (Sectional Mastery Target)</option>
                <option value="60">60% (Advanced Merit Target)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Solution Key Release Policy
              </label>
              <select
                value={solutionPolicy}
                onChange={(e) => setSolutionPolicy(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm font-semibold"
              >
                <option value="instant">
                  Immediate Bilingual Solution Key After Submit
                </option>
                <option value="window">
                  Hold Solution Key Until All-India Window Closes
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Examination Hall Proctoring
              </label>
              <button
                type="button"
                onClick={() => setProctoringEnabled((v) => !v)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition ${
                  proctoringEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)]'
                }`}
              >
                {proctoringEnabled
                  ? '✓ Strict Tab-Focus & Elimination Telemetry Active'
                  : 'Standard Unproctored Practice Mode'}
              </button>
            </div>
          </div>

          {/* Live Academic Advisory Banner */}
          <div className="pt-1">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
              <Megaphone className="w-3.5 h-3.5 text-[var(--app-accent)]" />
              Aspirant Sanctuary Broadcast Advisory
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="e.g. All-India Prelims Simulator II opens Sunday 9:30 AM. Revise Polity Parts III & IV."
                value={broadcastInput}
                onChange={(e) => setBroadcastInput(e.target.value)}
                className="glass-input flex-1 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleSaveInstitutionalPolicy}
                className="rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90 shrink-0"
              >
                Apply & Broadcast
              </button>
            </div>
            {savedToast && (
              <p className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {savedToast}
              </p>
            )}
          </div>
        </section>

        {/* Subject-Wise Institutional Performance Radar */}
        <section className="theme-surface rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold">
                GS Pillar Institutional Health
              </h3>
              <p className="text-xs text-[var(--app-muted)]">
                Cohort mean score across General Studies subjects
              </p>
            </div>
            <Target className="w-4 h-4 text-[var(--app-accent)]" />
          </div>

          <div className="space-y-3">
            {telemetry.subjectBreakdown.map((item) => (
              <div key={item.subject} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{item.subject}</span>
                  <span className="text-[var(--app-muted)]">
                    {item.attempts > 0
                      ? `${item.avgScore}% avg (${item.attempts} evaluations)`
                      : 'Awaiting attempts'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.avgScore >= Number(qualifyingCutoff)
                        ? 'bg-emerald-400'
                        : item.avgScore >= 35
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{
                      width: `${item.attempts > 0 ? Math.max(8, item.avgScore) : 5}%`,
                      opacity: item.attempts > 0 ? 1 : 0.25,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Live Evaluation Telemetry Stream */}
      <div className="theme-surface rounded-3xl overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-[var(--app-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-accent)]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Live OMR Evaluation Telemetry
              </h3>
              <p className="text-xs text-[var(--app-muted)]">
                Real-time aspirant submissions with net UPSC marks and negative
                bleed observation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Live Stream
            </span>
          </div>
        </div>

        <div className="divide-y divide-[var(--app-border)]">
          {recentActivities.length === 0 ? (
            <div className="p-12 text-center text-[var(--app-muted)]">
              <Clock className="w-9 h-9 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm text-[var(--app-text)]">
                No recent evaluations recorded
              </p>
              <p className="text-xs mt-1">
                Incoming aspirant test submissions will stream here in real
                time.
              </p>
            </div>
          ) : (
            recentActivities.map((activity) => {
              const date = new Date(activity.completed_at);
              const isPassing =
                Number(activity.score || 0) >= Number(qualifyingCutoff);
              const wrongCount = Number(activity.wrong || 0);
              const negPenalty = +(wrongCount * Number(defaultNegMarking)).toFixed(
                2
              );

              return (
                <div
                  key={activity.id}
                  className="p-4 sm:px-6 hover:bg-[var(--app-surface-muted)] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center shrink-0 font-bold text-[var(--app-accent)]">
                      {(activity.user_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">
                          {activity.user_name}
                        </p>
                        {wrongCount >= 5 && (
                          <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            High Neg Penalty (-{negPenalty})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--app-muted)] truncate mt-0.5">
                        {activity.quiz_title} · +{activity.correct || 0} Correct
                        · -{wrongCount} Wrong · {activity.skipped || 0} Skipped
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-5 border-t sm:border-t-0 border-[var(--app-border)] pt-2.5 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-lg font-black ${
                          isPassing ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {activity.score}%
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                        {isPassing ? 'Cutoff Cleared' : 'Below Cutoff'}
                      </p>
                    </div>

                    <div className="text-right whitespace-nowrap rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1.5 text-xs">
                      <p className="font-semibold">
                        {date.toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-[var(--app-muted)]">
                        {date.toLocaleTimeString('en-IN', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}