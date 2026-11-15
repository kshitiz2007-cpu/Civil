'use client';

import StudentBottomNav from '@/components/StudentBottomNav';export const dynamic = "force-dynamic";

import ThemeSelector from '@/components/ThemeSelector';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, ChevronLeft, Loader2, Search, Landmark, Globe, 
  Scale, TrendingUp, Microscope, Leaf, Newspaper, Calculator, 
  Lightbulb, PlayCircle, Clock, FileText, Award, Layers,
  LayoutDashboard, History, LogOut, Sparkles, ChevronRight // <-- FIXED: Added missing ChevronRight
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  category: string;
  section: string;
  time_limit: number;
  questions: any[];
  is_paid: boolean;
  price: number;
}

interface Attempt {
  quiz_id: string;
  score: number;
}

const SUBJECT_CONFIG = [
  { id: 'History', group: 'GS', icon: Landmark, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  { id: 'Geography', group: 'GS', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { id: 'Polity', group: 'GS', icon: Scale, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { id: 'Economy', group: 'GS', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { id: 'Science & Tech', group: 'GS', icon: Microscope, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  { id: 'Environment', group: 'GS', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  { id: 'Current Affairs', group: 'Other', icon: Newspaper, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
  { id: 'Maths', group: 'Other', icon: Calculator, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30' },
  { id: 'Reasoning', group: 'Other', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
];

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  
  // Accordion open/close state tracking
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/');

        // Fetch User Profile for the Sidebar
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUser(profile);

        const [ { data: qData }, { data: aData } ] = await Promise.all([
          supabase.from('quizzes').select('*').eq('active', true).order('created_at', { ascending: false }),
          supabase.from('attempts').select('quiz_id, score').eq('user_id', session.user.id)
        ]);

        if (qData) setQuizzes(qData);
        if (aData) setAttempts(aData);
      } catch (err) {
        console.error("Error loading quizzes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getAttempt = (quizId: string) => attempts.find(a => a.quiz_id === quizId);
  const getQuizCount = (subjectId: string) => quizzes.filter(q => q.category === subjectId).length;

  const filteredQuizzes = quizzes.filter(q => {
    if (!activeSubject) return false;
    const matchesSubject = q.category === activeSubject;
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // GROUP QUIZZES BY SUBSECTION Safely
  const groupedQuizzes = filteredQuizzes.reduce((acc, quiz) => {
    const subsection = quiz.section && quiz.section.trim() !== "" && quiz.section !== quiz.category 
      ? quiz.section 
      : 'General Topics';
    if (!acc[subsection]) acc[subsection] = [];
    acc[subsection].push(quiz);
    return acc;
  }, {} as Record<string, Quiz[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="app-theme relative flex min-h-screen overflow-hidden">
      
      {/* 1. GLOWING AURORA BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[20%] w-[25rem] h-[25rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 2. DESKTOP GLASS SIDEBAR */}
      <aside className="hidden md:flex w-72 h-screen flex-col bg-white/[0.02] border-r border-white/10 backdrop-blur-2xl relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="relative p-8 pb-6"><div className="absolute right-4 top-4"><ThemeSelector compact /></div>
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
          
          <button className="w-full flex items-center gap-4 px-4 py-4 bg-white/10 text-emerald-300 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] font-bold transition-all">
            <Layers className="w-5 h-5" /> Mock Tests
          </button>
          
          <button onClick={() => router.push('/resources')} className="w-full flex items-center gap-4 px-4 py-4 text-white/50 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
            <FileText className="w-5 h-5 group-hover:text-blue-300 transition-colors" /> Study Files
          </button>
          
          <button onClick={() => router.push('/history')} className="w-full flex items-center gap-4 px-4 py-4 text-white/50 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
            <History className="w-5 h-5 group-hover:text-emerald-300 transition-colors" /> My Results
          </button>
        </nav>

        <div className="p-5 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 mb-4 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner border border-white/20">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate drop-shadow-sm">{user?.name || 'Student'}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 truncate">Pro Member</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl transition-colors font-bold border border-rose-500/20">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MOBILE FLOATING GLASS DOCK */}
      <StudentBottomNav active="tests" />

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10">
        <div className="quizzes-main max-w-5xl mx-auto p-4 md:p-8 pb-28 space-y-6 md:space-y-8 animate-fade-in text-white">
          
          {/* Header */}
          <div className="quizzes-header flex items-center gap-4 mt-2 md:mt-0">
            <button 
              onClick={() => activeSubject ? setActiveSubject(null) : router.push('/dashboard')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-white/90 drop-shadow-sm flex items-center gap-3 font-serif tracking-tight">
                {activeSubject ? `${activeSubject} Modules` : 'Test Series'}
              </h1>
              <p className="text-sm md:text-base text-emerald-100/70 font-medium mt-1">
                {activeSubject ? 'Select a chapter test to begin' : 'Choose a subject to view available mock tests'}
              </p>
            </div>
          </div>

          {/* VIEW 1: MAIN SUBJECT FOLDERS */}
          {!activeSubject && (
            <AnimatedContent className="quizzes-subject-view space-y-6 md:space-y-10">
              <section>
                <h2 className="text-xs md:text-sm font-bold text-white/80 mb-3 md:mb-6 px-1 md:px-2 flex items-center gap-2 uppercase tracking-widest">
                  <FolderOpen className="w-5 h-5 text-emerald-400" /> General Studies Sections
                </h2>
                <div className="quizzes-subject-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-6">
                  {SUBJECT_CONFIG.map((subject) => {
                    const Icon = subject.icon;
                    const count = getQuizCount(subject.id);
                    return (
                      <SpotlightCard key={subject.id} className={`quizzes-subject-card group rounded-2xl border-b-2 ${subject.border}`}>
                        <button type="button" onClick={() => setActiveSubject(subject.id)} className="relative z-10 flex h-full w-full flex-col items-start p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:p-6">
                          <div className="mb-4 flex w-full items-start justify-between sm:mb-6">
                            <span className={`quizzes-subject-icon rounded-xl p-2.5 sm:rounded-2xl sm:p-4 ${subject.bg} ${subject.color} border border-white/10 shadow-inner transition-transform group-hover:scale-105`}>
                              <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                            </span>
                            <ChevronRight className="mt-1 h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-emerald-200"/>
                          </div>
                          <h3 className="text-sm font-bold tracking-tight text-white transition-colors group-hover:text-emerald-200 sm:text-xl">{subject.id}</h3>
                          <span className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/45 sm:text-[11px] sm:tracking-[.2em]">{count} Tests</span>
                        </button>
                      </SpotlightCard>
                    )
                  })}
                </div>
              </section>
            </AnimatedContent>
          )}

          {/* VIEW 2: SUBSECTIONS & MODULES (ACCORDIONS) */}
          {activeSubject && (
            <AnimatedContent className="quizzes-module-view space-y-5 md:space-y-8">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50 sm:left-5 sm:h-6 sm:w-6" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeSubject} chapters...`} 
                  className="w-full rounded-2xl border border-white/15 bg-white/[.07] py-3.5 pl-11 pr-4 text-sm text-white shadow-lg backdrop-blur-xl placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-[2rem] sm:py-5 sm:pl-14 sm:pr-6 sm:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Accordion Container Wrapper */}
              <div className="quizzes-accordion-list flex flex-col gap-3 md:gap-4">
                {Object.keys(groupedQuizzes).length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl p-12 text-center border-dashed border-2 border-white/20 rounded-[2rem]">
                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-1">No modules found</h3>
                    <p className="text-sm text-white/50">Check back soon for new {activeSubject} tests.</p>
                  </div>
                ) : (
                  Object.entries(groupedQuizzes).map(([subsection, sectionQuizzes]) => {
                    const isOpen = !!openSections[subsection];
                    
                    return (
                      <div key={subsection} className="space-y-4">
                        {/* Interactive Accordion Tab Controller */}
                        <button 
                          onClick={() => toggleSection(subsection)}
                          className="quiz-section-accordion group relative isolate flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 text-left shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 sm:rounded-3xl sm:p-5"
                        >
                          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white transition-colors group-hover:text-emerald-300 sm:gap-3 sm:text-lg">
                            <Layers className="h-4 w-4 shrink-0 text-emerald-400 sm:h-5 sm:w-5" /> <span className="min-w-0 flex-1 truncate">{subsection}</span><span className="rounded-full border border-white/10 bg-white/[.06] px-2 py-1 text-[9px] font-semibold text-white/50">{sectionQuizzes.length}</span>
                          </h2>
                          <ChevronRight className={`w-5 h-5 text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-90 text-emerald-400' : ''}`} />
                        </button>
                        
                        {/* Collapsible Widescreen Test Modules */}
                        {isOpen && (
                          <div className="quizzes-module-grid grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 p-0.5 sm:gap-4">
                            {sectionQuizzes.map((quiz) => {
                              const pastAttempt = getAttempt(quiz.id);
                              return (
                                <article key={quiz.id} className={`quizzes-module-card group relative isolate flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-[20px] border p-2.5 shadow-[0_12px_30px_rgba(0,0,0,.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:gap-3 sm:rounded-[26px] sm:p-4 ${pastAttempt ? 'quiz-module-completed' : ''}`}>
                                  <div className="quiz-card-glow pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl" />
                                  <div className="relative flex min-w-0 items-start gap-2">
                                    <div className="quiz-card-icon grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 sm:h-10 sm:w-10 sm:rounded-2xl">
                                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="mb-1 text-[7px] font-black uppercase tracking-[.19em] text-white/35 sm:text-[9px]">{pastAttempt ? 'Completed test' : 'Mock test'}</p>
                                      <h3 className="line-clamp-2 break-words text-[11px] font-extrabold leading-snug tracking-tight text-white transition-colors group-hover:text-emerald-200 sm:text-sm">{quiz.title}</h3>
                                    </div>
                                  </div>
                                  <div className="quiz-module-meta relative grid grid-cols-2 gap-1.5 rounded-xl border border-white/[.07] p-2">
                                    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300/10 bg-emerald-300/[.06] px-1.5 py-1.5">
                                      <Clock className="h-3 w-3 shrink-0 text-emerald-200" />
                                      <span className="text-[9px] font-bold text-emerald-50/75 sm:text-[10px]">{quiz.time_limit} min</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-cyan-300/[.06] px-1.5 py-1.5">
                                      <FileText className="h-3 w-3 shrink-0 text-cyan-200" />
                                      <span className="text-[9px] font-bold text-cyan-50/75 sm:text-[10px]">{quiz.questions?.length || 0} Qs</span>
                                    </div>
                                  </div>
                                  <div className="relative mt-auto">
                                    {pastAttempt ? (
                                      <div className="quiz-completed-score flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[9px] font-extrabold text-emerald-100 sm:rounded-2xl sm:py-2.5 sm:text-xs">
                                        <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Previous score: {pastAttempt.score}%
                                      </div>
                                    ) : (
                                      <button onClick={() => router.push(`/quiz/${quiz.id}`)} className="quiz-start-button flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[9px] font-extrabold tracking-wide text-white transition sm:rounded-2xl sm:py-2.5 sm:text-xs">
                                        <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Start test <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                                      </button>
                                    )}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </AnimatedContent>
          )}
        </div>
      </main>
    </div>
  );
}