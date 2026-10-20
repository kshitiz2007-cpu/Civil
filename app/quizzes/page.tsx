'use client';
export const dynamic = 'force-dynamic';

import ThemeSelector from '@/components/ThemeSelector';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FALLBACK_QUIZZES } from '@/lib/mockData';
import { openWatermarkStudio } from '@/lib/pdfExporter';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  ChevronLeft,
  Loader2,
  Search,
  Landmark,
  Globe,
  Scale,
  TrendingUp,
  Microscope,
  Leaf,
  Newspaper,
  Calculator,
  Lightbulb,
  PlayCircle,
  Clock,
  FileText,
  Award,
  Layers,
  Activity,
  History,
  LogOut,
  ChevronRight,
  Trophy,
  RotateCcw,
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  category: string;
  section?: string;
  time_limit: number;
  questions: any[];
  is_paid?: boolean;
  price?: number;
  negative_marking?: number;
  cutoff?: number;
}

interface Attempt {
  quiz_id: string;
  score: number;
}

const SUBJECT_CONFIG = [
  { id: 'Polity', group: 'GS Paper I', subtitle: 'Constitution, Governance & Rights', icon: Scale },
  { id: 'History', group: 'GS Paper I', subtitle: 'Ancient, Medieval, Modern & Culture', icon: Landmark },
  { id: 'Geography', group: 'GS Paper I', subtitle: 'Physical, Indian & World Geography', icon: Globe },
  { id: 'Economy', group: 'GS Paper I', subtitle: 'Macroeconomics, Budget & Banking', icon: TrendingUp },
  { id: 'Environment', group: 'GS Paper I', subtitle: 'Ecology, Biodiversity & Climate', icon: Leaf },
  { id: 'Science & Tech', group: 'GS Paper I', subtitle: 'Space, Biotech, Defense & IT', icon: Microscope },
  { id: 'Current Affairs', group: 'Dynamic GS', subtitle: 'PIB, Hindu, PRS & Govt Schemes', icon: Newspaper },
  { id: 'Maths', group: 'CSAT Paper II', subtitle: 'Quantitative Numeracy & Data', icon: Calculator },
  { id: 'Reasoning', group: 'CSAT Paper II', subtitle: 'Comprehension & Analytical Logic', icon: Lightbulb },
];

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let qData: any[] | null = null;
        let aData: any[] | null = null;

        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) setUser(profile);

          const [qRes, aRes] = await Promise.all([
            supabase
              .from('quizzes')
              .select('*')
              .eq('active', true)
              .order('created_at', { ascending: false }),
            supabase
              .from('attempts')
              .select('quiz_id, score')
              .eq('user_id', session.user.id),
          ]);
          qData = qRes.data;
          aData = aRes.data;
        } else {
          const { data } = await supabase
            .from('quizzes')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });
          qData = data;
        }

        setQuizzes(
          qData && qData.length > 0
            ? (qData as Quiz[])
            : (FALLBACK_QUIZZES as unknown as Quiz[])
        );
        if (aData) setAttempts(aData);
      } catch {
        setQuizzes(FALLBACK_QUIZZES as unknown as Quiz[]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getAttempt = (quizId: string) =>
    attempts.find((a) => a.quiz_id === quizId);
  const getQuizCount = (subjectId: string) =>
    quizzes.filter((q) => q.category === subjectId).length;

  const filteredQuizzes = quizzes.filter((q) => {
    if (!activeSubject) return false;
    const matchesSubject = q.category === activeSubject;
    const matchesSearch = q.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const groupedQuizzes = filteredQuizzes.reduce((acc, quiz) => {
    const subsection =
      quiz.section &&
      quiz.section.trim() !== '' &&
      quiz.section !== quiz.category
        ? quiz.section
        : 'Standard Sectional Papers';
    if (!acc[subsection]) acc[subsection] = [];
    acc[subsection].push(quiz);
    return acc;
  }, {} as Record<string, Quiz[]>);

  if (loading) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );
  }

  return (
    <div className="app-theme text-[var(--app-text)] min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="theme-surface-solid fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--app-border)] px-5 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-[var(--app-accent)]">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold tracking-tight leading-none">Gyankunj IAS</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
              Prelims Test Series
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Activity className="h-4 w-4" /> Study Sanctuary
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)] border border-[var(--app-border)]">
            <Layers className="h-4 w-4" /> Prelims Test Series
          </button>
          <button
            onClick={() => router.push('/resources')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <FileText className="h-4 w-4" /> Study Compendiums
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <History className="h-4 w-4" /> Evaluation Archive
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Trophy className="h-4 w-4" /> All-India Merit List
          </button>
        </nav>

        <div className="mt-5 flex items-center gap-3 border-t border-[var(--app-border)] pt-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--app-accent-soft)] text-sm font-bold text-[var(--app-accent)]">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.name || 'Aspirant'}
            </p>
            <p className="truncate text-[11px] text-[var(--app-muted)]">
              UPSC Test Series
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-28 pt-6 md:ml-64 md:px-10 md:py-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() =>
                activeSubject
                  ? setActiveSubject(null)
                  : router.push('/dashboard')
              }
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2.5 text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent)]">
                {activeSubject
                  ? `${activeSubject} Sectional Papers`
                  : 'UPSC CSE Prelims & CSAT Repository'}
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                {activeSubject
                  ? `${activeSubject} Modules`
                  : 'Institutional Test Series'}
              </h1>
            </div>
          </div>
          <ThemeSelector />
        </header>

        {/* View 1: Subject Pillars */}
        {!activeSubject && (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)] flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[var(--app-accent)]" />
                  Select General Studies or CSAT Discipline
                </h2>
                <span className="text-xs text-[var(--app-muted)]">
                  {quizzes.length} total active papers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUBJECT_CONFIG.map((subject) => {
                  const Icon = subject.icon;
                  const count = getQuizCount(subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setActiveSubject(subject.id)}
                      className="theme-surface text-left p-5 rounded-3xl transition-all hover:-translate-y-0.5 hover:border-[var(--app-accent)] group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-border)]">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                          {subject.group}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-[var(--app-accent)] transition-colors">
                        {subject.id}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--app-muted)] line-clamp-1">
                        {subject.subtitle}
                      </p>
                      <div className="mt-4 pt-3 border-t border-[var(--app-border)] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--app-muted)]">
                          {count} {count === 1 ? 'Paper' : 'Papers'} Available
                        </span>
                        <span className="text-[var(--app-accent)] font-bold inline-flex items-center gap-1">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* View 2: Subject Papers */}
        {activeSubject && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--app-muted)]" />
              <input
                type="text"
                placeholder={`Filter ${activeSubject} papers by topic or syllabus code...`}
                className="glass-input w-full pl-12 pr-5 py-3.5 text-sm rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {Object.keys(groupedQuizzes).length === 0 ? (
                <div className="theme-surface p-12 text-center rounded-3xl">
                  <FileText className="w-10 h-10 text-[var(--app-muted)] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold">
                    No papers published in {activeSubject} yet
                  </h3>
                  <p className="text-xs text-[var(--app-muted)] mt-1">
                    Select Polity, Economy, Environment, or History for immediate
                    full-length simulator papers.
                  </p>
                </div>
              ) : (
                Object.entries(groupedQuizzes).map(
                  ([subsection, sectionQuizzes]) => {
                    const isOpen = openSections[subsection] ?? true;
                    return (
                      <div key={subsection} className="space-y-3">
                        <button
                          onClick={() => toggleSection(subsection)}
                          className="theme-surface w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left hover:border-[var(--app-accent)] transition"
                        >
                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-[var(--app-accent)]" />
                            <h2 className="text-base font-bold">{subsection}</h2>
                            <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-0.5 text-xs text-[var(--app-muted)]">
                              {sectionQuizzes.length}
                            </span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 text-[var(--app-muted)] transition-transform ${
                              isOpen ? 'rotate-90 text-[var(--app-accent)]' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="grid gap-3">
                            {sectionQuizzes.map((quiz) => {
                              const pastAttempt = getAttempt(quiz.id);
                              const neg =
                                quiz.negative_marking !== undefined
                                  ? quiz.negative_marking
                                  : 0.66;
                              return (
                                <div
                                  key={quiz.id}
                                  className="theme-surface rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--app-accent)] transition"
                                >
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-md bg-[var(--app-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--app-accent)]">
                                        UPSC Prelims Pattern
                                      </span>
                                      <span className="text-xs text-[var(--app-muted)]">
                                        Marking: +2.0 / -{neg}
                                      </span>
                                    </div>
                                    <h3 className="text-lg font-bold">
                                      {quiz.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--app-muted)]">
                                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-surface-muted)] px-2.5 py-1">
                                        <Clock className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                                        {quiz.time_limit || 20} mins
                                      </span>
                                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-surface-muted)] px-2.5 py-1">
                                        <FileText className="w-3.5 h-3.5 text-[var(--app-secondary)]" />
                                        {quiz.questions?.length || 0} Questions
                                      </span>
                                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-surface-muted)] px-2.5 py-1">
                                        Qualifying Cutoff: {quiz.cutoff || 50}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openWatermarkStudio(quiz, 'paper', pastAttempt?.details)}
                                      className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-400 hover:text-slate-950 transition flex items-center gap-1.5"
                                      title="Export Watermarked Question Paper PDF"
                                    >
                                      📄 Question Paper PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openWatermarkStudio(quiz, 'solution', pastAttempt?.details)}
                                      className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold border border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-400 hover:text-slate-950 transition flex items-center gap-1.5"
                                      title="Export Watermarked Bilingual Answer Key PDF"
                                    >
                                      🔑 Answer Key PDF
                                    </button>
                                    {pastAttempt ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/quiz/${quiz.id}/result`
                                            )
                                          }
                                          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)] flex items-center gap-1.5"
                                        >
                                          <Award className="w-4 h-4 text-[var(--app-accent)]" />
                                          Score: {pastAttempt.score}%
                                        </button>
                                        <button
                                          onClick={() =>
                                            router.push(`/quiz/${quiz.id}`)
                                          }
                                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--app-accent)] text-slate-950 hover:opacity-90 flex items-center gap-1.5"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />
                                          Re-attempt
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          router.push(`/quiz/${quiz.id}`)
                                        }
                                        className="w-full md:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[var(--app-accent)] text-slate-950 hover:opacity-90 transition"
                                      >
                                        <PlayCircle className="w-4 h-4" /> Start
                                        Examination
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}