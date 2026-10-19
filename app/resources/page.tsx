'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
<<<<<<< HEAD
import { FALLBACK_RESOURCES } from '@/lib/mockData';
=======
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
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
  FileText,
  Layers,
  ExternalLink,
  Download,
  Activity,
  History,
  LogOut,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';

interface Resource {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
  category: string;
  section: string;
}

const SUBJECT_CONFIG = [
  { id: 'Polity', group: 'GS Paper II', icon: Scale },
  { id: 'History', group: 'GS Paper I', icon: Landmark },
  { id: 'Geography', group: 'GS Paper I', icon: Globe },
  { id: 'Economy', group: 'GS Paper III', icon: TrendingUp },
  { id: 'Environment', group: 'GS Paper III', icon: Leaf },
  { id: 'Science & Tech', group: 'GS Paper III', icon: Microscope },
  { id: 'Current Affairs', group: 'PIB / PRS / Hindu', icon: Newspaper },
  { id: 'Maths', group: 'CSAT Numeracy', icon: Calculator },
  { id: 'Reasoning', group: 'CSAT Logic', icon: Lightbulb },
];

export default function StudentResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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
<<<<<<< HEAD

        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) setUser(profile);
        }
=======
        if (!session) return router.push('/');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUser(profile);
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83

        const { data } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

<<<<<<< HEAD
        setResources(
          data && data.length > 0
            ? (data as Resource[])
            : (FALLBACK_RESOURCES as Resource[])
        );
      } catch {
        setResources(FALLBACK_RESOURCES as Resource[]);
=======
        if (data) setResources(data);
      } catch (err) {
        console.error('Error loading resources', err);
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
      } finally {
        setLoading(false);
      }
    }
    loadData();
<<<<<<< HEAD
  }, []);
=======
  }, [router]);
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getResourceCount = (subjectId: string) =>
    resources.filter((r) => r.category === subjectId).length;

  const filteredResources = resources.filter((r) => {
    if (!activeSubject) return false;
    const matchesSubject = r.category === activeSubject;
    const matchesSearch = r.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const groupedResources = filteredResources.reduce((acc, resource) => {
    const subsection =
      resource.section &&
      resource.section.trim() !== '' &&
      resource.section !== resource.category
        ? resource.section
        : 'Core Value-Added Compendiums';
    if (!acc[subsection]) acc[subsection] = [];
    acc[subsection].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  if (loading) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );
  }

  return (
    <div className="app-theme min-h-screen text-[var(--app-text)]">
<<<<<<< HEAD
=======
      {/* Desktop Sidebar */}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
      <aside className="theme-surface-solid fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--app-border)] px-5 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-[var(--app-accent)]">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold tracking-tight leading-none">Gyankunj IAS</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
              Study Compendiums
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
          <button
            onClick={() => router.push('/quizzes')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition"
          >
            <Layers className="h-4 w-4" /> Prelims Test Series
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)] border border-[var(--app-border)]">
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
              Digital Library
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

<<<<<<< HEAD
=======
      {/* Main Content */}
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-28 pt-6 md:ml-64 md:px-10 md:py-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() =>
                activeSubject
                  ? setActiveSubject(null)
                  : router.push('/dashboard')
              }
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2.5 text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent)]">
                Value-Added Notes & PIB / PRS Summaries
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                {activeSubject
                  ? `${activeSubject} Compendiums`
                  : 'Digital Reference Vault'}
              </h1>
            </div>
          </div>
          <ThemeSelector />
        </header>

        {!activeSubject && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)] flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[var(--app-accent)]" />
                Syllabus Subject Vaults
              </h2>
              <span className="text-xs text-[var(--app-muted)]">
                {resources.length} curated files
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SUBJECT_CONFIG.map((subject) => {
                const Icon = subject.icon;
                const count = getResourceCount(subject.id);
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
                    <div className="mt-4 pt-3 border-t border-[var(--app-border)] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--app-muted)]">
                        {count} {count === 1 ? 'Document' : 'Documents'}
                      </span>
                      <span className="text-[var(--app-accent)] font-bold inline-flex items-center gap-1">
                        Browse <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeSubject && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--app-muted)]" />
              <input
                type="text"
                placeholder={`Search ${activeSubject} handouts, NCERT gists, or PIB notes...`}
                className="glass-input w-full pl-12 pr-5 py-3.5 text-sm rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {Object.keys(groupedResources).length === 0 ? (
                <div className="theme-surface p-12 text-center rounded-3xl">
                  <FileText className="w-10 h-10 text-[var(--app-muted)] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold">
                    No materials uploaded in {activeSubject} yet
                  </h3>
                  <p className="text-xs text-[var(--app-muted)] mt-1">
<<<<<<< HEAD
                    Check Polity, Economy, Environment, or History for pre-loaded
                    compendiums.
=======
                    Check back soon for new faculty handouts.
>>>>>>> b15c9e30bc2a92b8eb9ef08a25d335e8d4babc83
                  </p>
                </div>
              ) : (
                Object.entries(groupedResources).map(
                  ([subsection, sectionResources]) => {
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
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 text-[var(--app-muted)] transition-transform ${
                              isOpen ? 'rotate-90 text-[var(--app-accent)]' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {sectionResources.map((resource) => (
                              <div
                                key={resource.id}
                                className="theme-surface rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-[var(--app-accent)] transition"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-border)] shrink-0">
                                    {resource.file_type === 'pdf' ? (
                                      <FileText className="w-5 h-5" />
                                    ) : (
                                      <ExternalLink className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold truncate">
                                      {resource.title}
                                    </h3>
                                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                                      {(
                                        resource.file_type || 'Reference'
                                      ).toUpperCase()}{' '}
                                      · {resource.category}
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={resource.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 p-3 bg-[var(--app-accent)] text-slate-950 rounded-xl hover:opacity-90 transition"
                                >
                                  {resource.file_type === 'pdf' ? (
                                    <Download className="w-4 h-4" />
                                  ) : (
                                    <ExternalLink className="w-4 h-4" />
                                  )}
                                </a>
                              </div>
                            ))}
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