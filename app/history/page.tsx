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
              <Sparkles className="w-5 h-5 text-white" />
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
        <div className="max-w-4xl mx-auto p-5 md:p-8 pb-32 space-y-8 animate-fade-in text-white">
          
          {/* Header */}
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white/90 drop-shadow-sm flex items-center gap-3 font-serif tracking-tight">
                <History className="w-8 h-8 text-emerald-400" /> 
                My Test History
              </h1>
              <p className="text-sm md:text-base text-emerald-100/70 font-medium mt-1">Review your past performance and check your answers.</p>
            </div>
          </div>

          {/* CONTENT (Glass Containers) */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden divide-y divide-white/10">
            {attempts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
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
                  <div key={attempt.id} className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-colors group">
                    
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-2xl shrink-0 border ${isPassing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg line-clamp-1">{attempt.quiz_title}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-white/50">
                          <span>{new Date(attempt.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                          <span className="text-emerald-400">{attempt.correct} Correct</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                          <span className="text-rose-400">{attempt.wrong} Wrong</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-6 md:pl-4 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className={`text-3xl font-black tracking-tight drop-shadow-md ${isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {attempt.score}%
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => router.push(`/quiz/${attempt.quiz_id}/result`)}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center gap-2 group-hover:shadow-lg"
                      >
                        Review <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </main>
    </div>
  );
}