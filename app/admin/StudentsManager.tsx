'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  Loader2,
  Mail,
  BookOpen,
  Award,
  ShieldBan,
  ShieldCheck,
  Target,
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  total_quizzes: number;
  avg_score: number;
  accuracy: number;
}

const BATCHES = [
  'Foundation 2027',
  'Prelims Target Batch',
  'Mains Mentorship',
  'CSAT Intensive',
];

export default function StudentsManager() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchMap, setBatchMap] = useState<Record<string, string>>({});
  const [suspendedMap, setSuspendedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const b = window.localStorage.getItem('gyankunj-student-batches');
      const s = window.localStorage.getItem('gyankunj-student-suspended');
      if (b) setBatchMap(JSON.parse(b));
      if (s) setSuspendedMap(JSON.parse(s));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const [{ data: profiles }, { data: attempts }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .neq('role', 'admin')
          .order('created_at', { ascending: false }),
        supabase
          .from('attempts')
          .select('user_id, score, correct, wrong'),
      ]);

      if (profiles && attempts) {
        const statsMap: Record<
          string,
          { totalScore: number; count: number; correct: number; wrong: number }
        > = {};
        attempts.forEach((a: any) => {
          if (!statsMap[a.user_id])
            statsMap[a.user_id] = {
              totalScore: 0,
              count: 0,
              correct: 0,
              wrong: 0,
            };
          statsMap[a.user_id].totalScore += Number(a.score || 0);
          statsMap[a.user_id].count += 1;
          statsMap[a.user_id].correct += Number(a.correct || 0);
          statsMap[a.user_id].wrong += Number(a.wrong || 0);
        });

        const mergedData: StudentData[] = profiles.map((p: any) => {
          const stats = statsMap[p.id] || {
            totalScore: 0,
            count: 0,
            correct: 0,
            wrong: 0,
          };
          const avg =
            stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
          const totalAtt = stats.correct + stats.wrong;
          const acc = totalAtt
            ? Math.round((stats.correct / totalAtt) * 100)
            : avg;
          return {
            id: p.id,
            name: p.name || 'Aspirant',
            email: p.email || '',
            created_at: p.created_at,
            total_quizzes: stats.count,
            avg_score: avg,
            accuracy: acc,
          };
        });

        setStudents(mergedData);
      }
      setLoading(false);
    }

    fetchStudents();
  }, []);

  const handleAssignBatch = (id: string, batch: string) => {
    setBatchMap((prev) => {
      const next = { ...prev, [id]: batch };
      try {
        window.localStorage.setItem(
          'gyankunj-student-batches',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleSuspend = (id: string) => {
    setSuspendedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(
          'gyankunj-student-suspended',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
            Enrollment & Cohort Administration
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[var(--app-accent)]" /> Aspirant
            Roster & Batch Control
          </h2>
          <p className="text-sm text-[var(--app-muted)] mt-1">
            Assign UPSC study batches, monitor evaluation engagement, and govern
            portal access across {students.length} enrolled aspirants.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" />
          <input
            type="text"
            placeholder="Filter by aspirant name or email..."
            className="glass-input w-full pl-10 py-2.5 text-xs sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="theme-surface rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 animate-spin text-[var(--app-accent)]" />
              <p className="text-xs font-bold text-[var(--app-muted)] uppercase tracking-widest">
                Loading Aspirant Roster...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <Users className="w-12 h-12 text-[var(--app-muted)] mb-3 opacity-50" />
              <h3 className="text-base font-bold">No matching aspirants</h3>
              <p className="text-xs text-[var(--app-muted)] mt-1">
                Adjust your search filter to view enrolled students.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm min-w-[860px]">
              <thead className="bg-[var(--app-surface-muted)] text-[10px] uppercase text-[var(--app-muted)] font-bold tracking-wider border-b border-[var(--app-border)]">
                <tr>
                  <th className="px-5 py-4">Aspirant Profile</th>
                  <th className="px-4 py-4">Assigned Batch</th>
                  <th className="px-4 py-4">Evaluation Telemetry</th>
                  <th className="px-4 py-4">Enrolled Date</th>
                  <th className="px-4 py-4">Access Status</th>
                  <th className="px-5 py-4 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filteredStudents.map((student) => {
                  const isSuspended = !!suspendedMap[student.id];
                  const currentBatch =
                    batchMap[student.id] || 'Foundation 2027';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[var(--app-surface-muted)] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-accent)] font-bold shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {student.name}
                            </div>
                            <div className="text-xs text-[var(--app-muted)] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={currentBatch}
                          onChange={(e) =>
                            handleAssignBatch(student.id, e.target.value)
                          }
                          className="glass-input py-1.5 px-2.5 text-xs font-semibold"
                        >
                          {BATCHES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-semibold">
                            <BookOpen className="w-3.5 h-3.5 text-[var(--app-accent)]" />{' '}
                            {student.total_quizzes} Papers
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-semibold">
                            <Award className="w-3.5 h-3.5 text-amber-400" />{' '}
                            {student.avg_score}% Mean
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-semibold">
                            <Target className="w-3.5 h-3.5 text-[var(--app-secondary)]" />{' '}
                            {student.accuracy}% Acc
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs text-[var(--app-muted)]">
                        {new Date(student.created_at).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isSuspended
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isSuspended ? 'Restricted' : 'Active Scholar'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`mailto:${student.email}`}
                            className="p-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            title="Email Aspirant"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleToggleSuspend(student.id)}
                            className={`p-2 rounded-xl border transition ${
                              isSuspended
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                : 'border-rose-500/25 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            }`}
                            title={
                              isSuspended
                                ? 'Restore Portal Access'
                                : 'Restrict Portal Access'
                            }
                          >
                            {isSuspended ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <ShieldBan className="w-4 h-4" />
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
    </div>
  );
}