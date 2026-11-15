'use client';

import StudentBottomNav from '@/components/StudentBottomNav';export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  History, Trophy, ChevronRight, ArrowLeft, 
  Loader2, Award, LayoutDashboard, Layers, 
  FileText, LogOut, Sparkles 
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          window.location.href = '/'; 
          return;
        }

        // Fetch User Profile for the Sidebar
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUser(profile);

        // Fetch History
        const { data } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        if (data) {
          setAttempts(data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex selection:bg-emerald-500/30">
      
      {/* 1. GLOWING AURORA BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[20%] w-[25rem] h-[25rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 2. DESKTOP GLASS SIDEBAR */}
      <aside className="hidden md:flex w-72 h-screen flex-col bg-white/[0.02] border-r border-white/10 backdrop-blur-2xl relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-8 pb-6">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 font-serif">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20">
              <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            Gyankunj
          </h1>
        </div>

        <nav className="flex-1 px-5 py-4 space-y-3">
          <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-4 px-4 py-4 text-white/50 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
            <LayoutDashboard className="w-5 h-5 group-hover:text-emerald-300 transition-colors" /> Dashboard
          </button>
          
          <button onClick={() => router.push('/quizzes')} className="w-full flex items-center gap-4 px-4 py-4 text-white/50 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
            <Layers className="w-5 h-5 group-hover:text-emerald-300 transition-colors" /> Mock Tests
          </button>
          
          <button onClick={() => router.push('/resources')} className="w-full flex items-center gap-4 px-4 py-4 text-white/50 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
            <FileText className="w-5 h-5 group-hover:text-blue-300 transition-colors" /> Study Files
          </button>
          
          {/* Active Tab */}
          <button className="w-full flex items-center gap-4 px-4 py-4 bg-white/10 text-emerald-300 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] font-bold transition-all">
            <History className="w-5 h-5" /> My Results
          </button>
        </nav>

        <div className="p-5 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl transition-colors font-bold border border-rose-500/20">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MOBILE FLOATING GLASS DOCK */}
      <StudentBottomNav active="results" />

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10">
        <div className="history-page mx-auto max-w-5xl p-3 pb-28 text-white sm:p-5 md:p-8 md:pb-10">
          
          {/* Header */}
          <div className="history-header mb-4 flex items-center gap-3 md:mt-0 md:mb-7">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl md:text-4xl font-black text-white/90 drop-shadow-sm flex items-center gap-3 font-serif tracking-tight">
                <History className="h-5 w-5 text-emerald-400 sm:h-8 sm:w-8" /> 
                My Test History
              </h1>
              <p className="text-[11px] leading-snug md:text-base text-emerald-100/70 font-medium mt-1">Review your past performance and check your answers.</p>
            </div>
          </div>

          {/* CONTENT (Glass Containers) */}
          <div className="history-grid grid grid-cols-2 gap-2.5 sm:gap-4">
            {attempts.length === 0 ? (
              <div className="col-span-2 p-7 sm:p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No tests taken yet!</h3>
                <p className="text-white/50 text-sm mb-6">Your completed quizzes and scores will appear here.</p>
                <button 
                  onClick={() => router.push('/quizzes')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Explore Mock Tests
                </button>
              </div>
            ) : (
              attempts.map((attempt) => {
                const isPassing = attempt.score >= 40; 
                
                return (
                  <article key={attempt.id} className="history-card flex min-w-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.035] p-2.5 shadow-lg backdrop-blur-xl transition hover:border-emerald-300/20 hover:bg-white/10 sm:gap-3 sm:rounded-3xl sm:p-4">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className={`shrink-0 rounded-xl border p-2 sm:p-2.5 ${isPassing ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-rose-500/30 bg-rose-500/15 text-rose-300'}`}>
                        <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 break-words text-[11px] font-bold leading-snug text-white sm:text-sm">{attempt.quiz_title}</h4>
                        <p className="mt-1 text-[9px] font-medium text-white/45 sm:text-[11px]">{new Date(attempt.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/5 bg-black/10 p-2">
                      <div><p className="text-sm font-black leading-none text-emerald-300 sm:text-base">{attempt.correct ?? 0}</p><p className="mt-1 text-[8px] font-semibold text-white/45 sm:text-[10px]">Correct</p></div>
                      <div><p className="text-sm font-black leading-none text-rose-300 sm:text-base">{attempt.wrong ?? 0}</p><p className="mt-1 text-[8px] font-semibold text-white/45 sm:text-[10px]">Wrong</p></div>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-white/10 pt-2">
                      <p className={`text-lg font-black tracking-tight sm:text-2xl ${isPassing ? 'text-emerald-300' : 'text-rose-300'}`}>{attempt.score}%</p>
                      <button onClick={() => router.push(`/quiz/${attempt.quiz_id}/result`)} className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-[9px] font-bold text-white transition hover:bg-emerald-500/20 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                        Review <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

        </div>
      </main>
    </div>
  );
}