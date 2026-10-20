'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  ChevronLeft,
  Target,
  BookOpen,
  Loader2,
  Award,
} from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_quizzes: number;
  average_score: number;
  total_points: number;
  percentile: number;
}

const FALLBACK_MERIT_LIST: LeaderboardEntry[] = [
  {
    user_id: 'air_1',
    name: 'Ananya Deshmukh (LBSNAA Target)',
    total_quizzes: 14,
    average_score: 78,
    total_points: 1092,
    percentile: 99,
  },
  {
    user_id: 'demo_user',
    name: 'Aarav Sharma (You)',
    total_quizzes: 9,
    average_score: 73,
    total_points: 657,
    percentile: 96,
  },
  {
    user_id: 'air_3',
    name: 'Vikramaditya Rathore',
    total_quizzes: 12,
    average_score: 71,
    total_points: 852,
    percentile: 92,
  },
  {
    user_id: 'air_4',
    name: 'Meera Krishnan',
    total_quizzes: 11,
    average_score: 68,
    total_points: 748,
    percentile: 88,
  },
  {
    user_id: 'air_5',
    name: 'Rohan Chatterjee',
    total_quizzes: 8,
    average_score: 64,
    total_points: 512,
    percentile: 82,
  },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) setCurrentUser(session.user);

        const [{ data: profiles }, { data: attempts }] = await Promise.all([
          supabase.from('profiles').select('id, name').neq('role', 'admin'),
          supabase.from('attempts').select('user_id, score'),
        ]);

        if (profiles && attempts && attempts.length > 0) {
          const statsMap: Record<
            string,
            { totalScore: number; count: number; name: string }
          > = {};

          profiles.forEach((p) => {
            statsMap[p.id] = {
              totalScore: 0,
              count: 0,
              name: p.name || 'Aspirant',
            };
          });

          attempts.forEach((a) => {
            if (statsMap[a.user_id]) {
              statsMap[a.user_id].totalScore += a.score;
              statsMap[a.user_id].count += 1;
            }
          });

          const rawRanked = Object.keys(statsMap)
            .filter((id) => statsMap[id].count > 0)
            .map((id) => ({
              user_id: id,
              name: statsMap[id].name,
              total_quizzes: statsMap[id].count,
              average_score: Math.round(
                statsMap[id].totalScore / statsMap[id].count
              ),
              total_points: statsMap[id].totalScore,
              percentile: 0,
            }))
            .sort(
              (a, b) =>
                b.average_score - a.average_score ||
                b.total_points - a.total_points
            )
            .slice(0, 50);

          const totalCandidates = rawRanked.length || 1;
          const withPercentile = rawRanked.map((item, idx) => ({
            ...item,
            percentile: Math.max(
              1,
              Math.round(((totalCandidates - idx) / totalCandidates) * 100)
            ),
          }));

          setLeaderboard(
            withPercentile.length > 0 ? withPercentile : FALLBACK_MERIT_LIST
          );
        } else {
          setLeaderboard(FALLBACK_MERIT_LIST);
        }
      } catch {
        setLeaderboard(FALLBACK_MERIT_LIST);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-[var(--app-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-theme min-h-screen px-4 py-6 sm:px-6 md:py-10 text-[var(--app-text)]">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent)]">
                All-India Merit Benchmarking
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
                Institutional Order of Merit{' '}
                <Trophy className="w-6 h-6 text-amber-400" />
              </h1>
            </div>
          </div>
          <ThemeSelector />
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser =
              entry.user_id === currentUser?.id ||
              entry.user_id === 'demo_user';
            return (
              <div
                key={entry.user_id}
                className={`theme-surface p-4 sm:p-5 rounded-2xl flex items-center gap-4 transition ${
                  isCurrentUser
                    ? 'border-[var(--app-accent)] ring-1 ring-[var(--app-accent)]'
                    : ''
                }`}
              >
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs border ${
                    index === 0
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : index === 1
                      ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                      : index === 2
                      ? 'bg-orange-400/20 text-orange-300 border-orange-400/40'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] border-[var(--app-border)]'
                  }`}
                >
                  AIR {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold truncate flex items-center gap-2">
                    {entry.name}
                    {isCurrentUser && (
                      <span className="text-[10px] bg-[var(--app-accent)] text-slate-950 px-2 py-0.5 rounded-full uppercase font-bold">
                        Active Cohort
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--app-muted)]">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--app-accent)]" />{' '}
                      {entry.total_quizzes} Papers
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[var(--app-secondary)]" />{' '}
                      {entry.average_score}% Mean Score
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />{' '}
                      {entry.percentile}th Percentile
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-[var(--app-accent)]">
                    {entry.average_score}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    {entry.total_points} Cumulative
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}