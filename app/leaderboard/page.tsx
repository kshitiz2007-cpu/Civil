'use client';

import { useEffect, useMemo, useState } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StudentBottomNav from '@/components/StudentBottomNav';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, ChevronLeft, Target, BookOpen, Crown, Sparkles } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_quizzes: number;
  average_score: number;
  total_points: number;
}

type RankingPeriod = 'all' | 'weekly';

export default function LeaderboardPage() {
  const router = useRouter();
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [period, setPeriod] = useState<RankingPeriod>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setCurrentUserId(session.user.id);

        const [{ data: profileData, error: profileError }, { data: attemptData, error: attemptError }] = await Promise.all([
          supabase.from('profiles').select('id, name').neq('role', 'admin'),
          supabase.from('attempts').select('user_id, score, completed_at')
        ]);
        if (profileError) throw profileError;
        if (attemptError) throw attemptError;
        setProfiles(profileData || []);
        setAllAttempts(attemptData || []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [router]);

  const leaderboard = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const stats: Record<string, { totalScore: number; count: number; name: string }> = {};

    profiles.forEach(profile => {
      stats[profile.id] = { totalScore: 0, count: 0, name: profile.name || 'Anonymous Student' };
    });

    allAttempts.forEach(attempt => {
      if (!stats[attempt.user_id]) return;
      if (period === 'weekly') {
        const completedAt = attempt.completed_at ? new Date(attempt.completed_at).getTime() : NaN;
        if (!Number.isFinite(completedAt) || completedAt < sevenDaysAgo || completedAt > now) return;
      }
      const score = Number(attempt.score) || 0;
      stats[attempt.user_id].totalScore += score;
      stats[attempt.user_id].count += 1;
    });

    return Object.entries(stats)
      .filter(([, value]) => value.count > 0)
      .map(([userId, value]): LeaderboardEntry => ({
        user_id: userId,
        name: value.name,
        total_quizzes: value.count,
        average_score: Math.round(value.totalScore / value.count),
        total_points: value.totalScore,
      }))
      .sort((a, b) => b.total_points - a.total_points || b.average_score - a.average_score || a.name.localeCompare(b.name));
  }, [allAttempts, profiles, period]);

  const ownRank = leaderboard.findIndex(entry => entry.user_id === currentUserId);
  const topThree = leaderboard.slice(0, 3);
  const mainList = leaderboard.slice(3, 50);
  const ownEntry = ownRank >= 50 ? leaderboard[ownRank] : null;
  const listEntries = ownEntry ? [...mainList, ownEntry] : mainList;

  if (loading) return <LoadingSkeleton label="Loading leaderboard page" />;

  return (
    <div className="leaderboard-page app-theme min-h-screen mx-auto max-w-4xl px-4 pt-5 pb-28 text-[var(--app-text)] md:px-6 md:pt-8">
      <header className="leaderboard-header mb-6 flex items-center gap-3 sm:mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Back to dashboard"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-emerald-100 shadow-lg transition hover:bg-white/[.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-amber-200/70"><Sparkles className="h-3 w-3" /> Gyankunj rankings</p>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Hall of Fame <Trophy className="h-6 w-6 text-amber-300 sm:h-7 sm:w-7" />
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Celebrate consistency, progress and performance</p>
        </div>
      </header>

      <div className="leaderboard-period mb-6 flex rounded-2xl border border-white/10 bg-slate-950/45 p-1.5" role="group" aria-label="Ranking period">
        <button onClick={() => setPeriod('all')} aria-pressed={period === 'all'} className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${period === 'all' ? 'bg-emerald-300/15 text-emerald-100 shadow-inner ring-1 ring-emerald-200/20' : 'text-slate-400 hover:text-white'}`}>
          All-time rankings
        </button>
        <button onClick={() => setPeriod('weekly')} aria-pressed={period === 'weekly'} className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${period === 'weekly' ? 'bg-emerald-300/15 text-emerald-100 shadow-inner ring-1 ring-emerald-200/20' : 'text-slate-400 hover:text-white'}`}>
          This week · 7 days
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="leaderboard-empty rounded-3xl border border-dashed border-emerald-200/20 p-8 text-center sm:p-12">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Trophy className="h-7 w-7" /></span>
          <h2 className="text-lg font-extrabold text-white">{period === 'weekly' ? 'No weekly rankings yet' : 'No ranks yet'}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{period === 'weekly' ? 'Complete a mock test this week to appear on the weekly leaderboard.' : 'Be the first to complete a quiz and claim the #1 spot!'}</p>
          <button onClick={() => router.push('/quizzes')} className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-extrabold text-emerald-100 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Explore mock tests <span aria-hidden="true">→</span></button>
        </div>
      ) : (
        <>
          <section className="leaderboard-podium mb-7" aria-label="Top three students">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[.18em] text-slate-300">Top performers</h2>
              <span className="text-[10px] text-slate-500">{period === 'weekly' ? 'Last 7 days' : 'All time'}</span>
            </div>
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
              {[topThree[1], topThree[0], topThree[2]].map((entry, displayIndex) => {
                if (!entry) return <div key={displayIndex} className="min-h-[112px]" />;
                const rank = leaderboard.indexOf(entry) + 1;
                const isYou = entry.user_id === currentUserId;
                const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
                return (
                  <article key={entry.user_id} className={`leaderboard-podium-card ${tier} ${rank === 1 ? 'podium-first' : ''} ${isYou ? 'is-you' : ''}`}>
                    <div className="podium-avatar">{rank === 1 ? <Crown className="h-6 w-6" /> : <Medal className="h-6 w-6" />}</div>
                    <span className="podium-rank">{rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}</span>
                    <h3 className="podium-name" title={entry.name}>{entry.name}</h3>
                    {isYou && <span className="podium-you">YOU</span>}
                    <p className="podium-points">{entry.total_points.toLocaleString('en-IN')}</p>
                    <span className="podium-caption">POINTS</span>
                    <div className="podium-base">{rank}</div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="leaderboard-list-section">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[.18em] text-slate-300">Leaderboard</h2>
              <span className="text-[10px] text-slate-500">{leaderboard.length} ranked students</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {listEntries.map(entry => {
                const rank = leaderboard.findIndex(item => item.user_id === entry.user_id) + 1;
                const isYou = entry.user_id === currentUserId;
                return (
                  <article key={entry.user_id} className={`leaderboard-row ${isYou ? 'is-you' : ''}`}>
                    <div className="leaderboard-row-rank">{rank}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-white">{entry.name}</h3>
                        {isYou && <span className="rounded-full border border-emerald-200/25 bg-emerald-300/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-100">You</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-400 sm:text-xs">
                        <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{entry.total_quizzes} quizzes</span>
                        <span className="inline-flex items-center gap-1"><Target className="h-3 w-3" />{entry.average_score}% avg</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black tracking-tight text-amber-100">{entry.total_points.toLocaleString('en-IN')}</p>
                      <p className="text-[8px] font-bold uppercase tracking-[.16em] text-slate-500">Points</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {ownRank >= 0 && (
            <p className="mt-4 text-center text-[10px] text-slate-500">Your rank: <strong className="text-emerald-200">#{ownRank + 1}</strong> out of {leaderboard.length} students</p>
          )}
        </>
      )}
      <StudentBottomNav active="leaderboard" />
    </div>
  );
}
