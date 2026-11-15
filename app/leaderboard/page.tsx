'use client';

import { useEffect, useState } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StudentBottomNav from '@/components/StudentBottomNav';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, ChevronLeft, Target, BookOpen, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_quizzes: number;
  average_score: number;
  total_points: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      // 1. Get current logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setCurrentUser(session.user);

      // 2. Fetch all profiles and attempts
      const [ { data: profiles }, { data: attempts } ] = await Promise.all([
        supabase.from('profiles').select('id, name').neq('role', 'admin'),
        supabase.from('attempts').select('user_id, score')
      ]);

      if (profiles && attempts) {
        // 3. Aggregate data per student
        const statsMap: Record<string, { totalScore: number, count: number, name: string }> = {};
        
        profiles.forEach(p => {
          statsMap[p.id] = { totalScore: 0, count: 0, name: p.name || 'Anonymous Student' };
        });

        attempts.forEach(a => {
          if (statsMap[a.user_id]) {
            statsMap[a.user_id].totalScore += a.score;
            statsMap[a.user_id].count += 1;
          }
        });

        // 4. Calculate final rankings
        const ranked: LeaderboardEntry[] = Object.keys(statsMap)
          .filter(id => statsMap[id].count > 0) // Only show students who took at least 1 quiz
          .map(id => ({
            user_id: id,
            name: statsMap[id].name,
            total_quizzes: statsMap[id].count,
            average_score: Math.round(statsMap[id].totalScore / statsMap[id].count),
            total_points: statsMap[id].totalScore // Using total score as tie-breaker/points system
          }))
          .sort((a, b) => b.total_points - a.total_points || b.average_score - a.average_score)
          .slice(0, 50); // Top 50

        setLeaderboard(ranked);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [router]);

  if (loading) return <LoadingSkeleton label="Loading leaderboard page" />;

  // Helper to get medal colors for top 3
  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-amber-100 text-amber-600 border-amber-300 shadow-amber-500/20 shadow-lg scale-105 z-10'; // Gold
    if (index === 1) return 'bg-slate-100 text-slate-500 border-slate-300 shadow-md'; // Silver
    if (index === 2) return 'bg-orange-100 text-orange-700 border-orange-300 shadow-md'; // Bronze
    return 'bg-white/40 text-gray-600 border-white/60';
  };

  return (
    <div className="app-theme min-h-screen max-w-3xl mx-auto p-4 md:p-6 pb-28 text-[var(--app-text)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 animate-fade-in">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-3 bg-white/60 hover:bg-white rounded-xl shadow-sm transition-all text-emerald-800 border border-white/60"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-emerald-950 font-serif flex items-center gap-3">
            Hall of Fame <Trophy className="w-7 h-7 text-amber-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Top performing students across all quizzes</p>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
        {leaderboard.length === 0 ? (
          <div className="glass-card border border-dashed border-emerald-300/20 bg-white/[.035] p-8 text-center sm:p-12">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Trophy className="h-7 w-7" /></span>
            <h3 className="mb-1 text-lg font-extrabold text-[var(--app-text)]">No ranks yet</h3>
            <p className="mx-auto max-w-sm text-sm text-[var(--app-muted)]">Be the first to complete a quiz and claim the #1 spot!</p>
            <button onClick={() => router.push('/quizzes')} className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-extrabold text-emerald-100 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Explore mock tests <span aria-hidden="true">→</span></button>
          </div>
        ) : (
          leaderboard.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUser?.id;
            const isTop3 = index < 3;
            
            return (
              <div 
                key={entry.user_id} 
                className={`glass-card p-4 md:p-5 flex items-center gap-4 transition-all relative border-2 ${getRankStyle(index)} ${isCurrentUser ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 flex items-center justify-center font-bold text-lg md:text-xl shadow-sm">
                  {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold truncate flex items-center gap-2">
                    {entry.name}
                    {isCurrentUser && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs md:text-sm font-semibold opacity-80">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {entry.total_quizzes} Quizzes</span>
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {entry.average_score}% Avg</span>
                  </div>
                </div>

                {/* Score / Points */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black font-serif tracking-tighter">
                    {entry.total_points}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    Points
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <StudentBottomNav active="leaderboard" />
    </div>
  );
}