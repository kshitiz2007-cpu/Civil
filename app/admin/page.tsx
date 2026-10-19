'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import AdminOverview from './AdminOverview';
import AdminInbox from './AdminInbox';
import AiQuizBuilder from './AiQuizBuilder';
import ResourceManager from './ResourceManager';
import CsvImporter from './CsvImporter';
import PaymentsManager from './PaymentsManager';
import StudentsManager from './StudentsManager';
import QuizManager from './QuizManager';
import AdminAnalytics from './AdminAnalytics';
import ThemeSelector from '@/components/ThemeSelector';

import {
  LayoutDashboard,
  FileQuestion,
  Users,
  FileText,
  CreditCard,
  Sparkles,
  CalendarClock,
  TableProperties,
  LogOut,
  MessageSquare,
  Activity,
  Landmark,
  Plus,
  ShieldCheck,
  Clock3,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

const ADMIN_TABS = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
  { id: 'analytics', label: 'Performance Observation', icon: Activity },
  { id: 'quizzes', label: 'Test Engine Control', icon: FileQuestion },
  { id: 'students', label: 'Aspirant Directory', icon: Users },
  { id: 'scheduled', label: 'All-India Live Mocks', icon: CalendarClock },
  { id: 'aigen', label: 'AI Paper Setter', icon: Sparkles },
  { id: 'csvimport', label: 'Bulk CSV Import', icon: TableProperties },
  { id: 'resources', label: 'Compendium Vault', icon: FileText },
  { id: 'inbox', label: 'Mentor Desk', icon: MessageSquare },
  { id: 'payments', label: 'Fee Verifications', icon: CreditCard },
];

interface ScheduledMock {
  id: string;
  title: string;
  paper: string;
  windowStart: string;
  durationMins: number;
  negativeMarking: string;
  proctored: boolean;
  registeredCount: number;
  status: 'Scheduled' | 'Live Window' | 'Completed';
}

const DEFAULT_SCHEDULED_MOCKS: ScheduledMock[] = [
  {
    id: 'aimt_1',
    title: 'All-India UPSC Prelims Simulator — Open Mock I (GS Paper I)',
    paper: 'GS Paper I · 100 Qs',
    windowStart: 'Sunday, 09:30 AM IST',
    durationMins: 120,
    negativeMarking: '-0.66 (1/3rd)',
    proctored: true,
    registeredCount: 412,
    status: 'Live Window',
  },
  {
    id: 'aimt_2',
    title: 'All-India CSAT Qualifying Simulator — Open Mock I (GS Paper II)',
    paper: 'CSAT Paper II · 80 Qs',
    windowStart: 'Sunday, 02:30 PM IST',
    durationMins: 120,
    negativeMarking: '-0.83 (1/3rd)',
    proctored: true,
    registeredCount: 389,
    status: 'Scheduled',
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Scheduled Live Mocks state
  const [scheduledMocks, setScheduledMocks] = useState<ScheduledMock[]>(
    DEFAULT_SCHEDULED_MOCKS
  );
  const [newMockTitle, setNewMockTitle] = useState('');
  const [newMockPaper, setNewMockPaper] = useState('GS Paper I · 100 Qs');
  const [newMockWindow, setNewMockWindow] = useState('Next Sunday, 09:30 AM IST');
  const [newMockDuration, setNewMockDuration] = useState(120);
  const [newMockProctored, setNewMockProctored] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          window.location.href = '/';
          return;
        }

        const email = session.user.email || '';

        if (
          email === 'kshitiz2007@gmail.com' ||
          email === 'admin@civilprep.in'
        ) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'admin') {
          window.location.href = '/dashboard';
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Admin check failed:', err);
        window.location.href = '/dashboard';
      }
    }

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleAddScheduledMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMockTitle.trim()) return;
    const item: ScheduledMock = {
      id: `aimt_${Date.now()}`,
      title: newMockTitle.trim(),
      paper: newMockPaper,
      windowStart: newMockWindow,
      durationMins: newMockDuration,
      negativeMarking: '-0.66 (1/3rd)',
      proctored: newMockProctored,
      registeredCount: 0,
      status: 'Scheduled',
    };
    setScheduledMocks((prev) => [item, ...prev]);
    setNewMockTitle('');
  };

  if (loading) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="app-theme relative flex min-h-screen w-full flex-col font-sans md:flex-row text-[var(--app-text)]">
      {/* Sidebar Navigation */}
      <aside className="theme-surface-solid relative z-20 flex w-full shrink-0 flex-col border-b border-[var(--app-border)] md:h-screen md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block md:p-6 md:pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-accent)]">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold tracking-tight leading-none">
                  Dean & Faculty Console
                </h1>
                <p className="text-[10px] font-semibold text-[var(--app-accent)] tracking-wider uppercase mt-1">
                  Gyankunj Civil Services
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <ThemeSelector compact />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="md:hidden p-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto px-4 pb-3 md:px-4 md:py-2 md:flex-1 custom-scrollbar">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm transition-all border ${
                  isActive
                    ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-[var(--app-border)] font-bold'
                    : 'text-[var(--app-muted)] border-transparent hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block p-4 border-t border-[var(--app-border)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl transition-colors text-xs font-bold border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Console
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 h-screen w-full flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <AdminOverview setActiveTab={setActiveTab} />
          )}
          {activeTab === 'inbox' && <AdminInbox />}
          {activeTab === 'quizzes' && <QuizManager />}
          {activeTab === 'aigen' && <AiQuizBuilder />}
          {activeTab === 'resources' && <ResourceManager />}
          {activeTab === 'students' && <StudentsManager />}
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'payments' && <PaymentsManager />}
          {activeTab === 'csvimport' && <CsvImporter />}

          {/* SCHEDULED ALL-INDIA LIVE MOCKS MODULE */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <header>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
                  Synchronized National Testing
                </p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold">
                  All-India Live Mock Scheduler & Proctoring
                </h2>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Schedule time-gated All-India Prelims Simulators with synchronized rank list generation and strict proctoring controls.
                </p>
              </header>

              {/* Schedule New Window Form */}
              <form
                onSubmit={handleAddScheduledMock}
                className="theme-surface rounded-3xl p-5 sm:p-6 space-y-4"
              >
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--app-accent)]" /> Schedule
                  New All-India Examination Window
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                      Simulator Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. All-India Prelims Open Simulator II (GS-I)"
                      value={newMockTitle}
                      onChange={(e) => setNewMockTitle(e.target.value)}
                      className="glass-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                      Paper Pattern
                    </label>
                    <select
                      value={newMockPaper}
                      onChange={(e) => setNewMockPaper(e.target.value)}
                      className="glass-input w-full text-sm"
                    >
                      <option value="GS Paper I · 100 Qs">
                        GS Paper I · 100 Qs (+2 / -0.66)
                      </option>
                      <option value="CSAT Paper II · 80 Qs">
                        CSAT Paper II · 80 Qs (+2.5 / -0.83)
                      </option>
                      <option value="Sectional Mini · 50 Qs">
                        Sectional Mini · 50 Qs (+2 / -0.66)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                      Examination Window
                    </label>
                    <input
                      type="text"
                      value={newMockWindow}
                      onChange={(e) => setNewMockWindow(e.target.value)}
                      className="glass-input w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMockProctored}
                        onChange={(e) => setNewMockProctored(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span className="font-semibold">
                        Enforce Tab-Lock Proctoring & Auto-Submit on 3 Warnings
                      </span>
                    </label>
                    <span className="text-[var(--app-muted)]">
                      Duration: {newMockDuration} mins
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90"
                  >
                    Publish Live Mock Window
                  </button>
                </div>
              </form>

              {/* Scheduled Mocks List */}
              <div className="grid gap-4">
                {scheduledMocks.map((mock) => (
                  <div
                    key={mock.id}
                    className="theme-surface rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            mock.status === 'Live Window'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {mock.status}
                        </span>
                        <span className="text-xs font-semibold text-[var(--app-accent)]">
                          {mock.paper}
                        </span>
                        {mock.proctored && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                            Strict Proctoring Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold">
                        {mock.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--app-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" /> {mock.windowStart} ·{' '}
                          {mock.durationMins} mins
                        </span>
                        <span>Marking: {mock.negativeMarking}</span>
                        <span>
                          Registered Cohort: {mock.registeredCount} Aspirants
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setScheduledMocks((prev) =>
                            prev.map((m) =>
                              m.id === mock.id
                                ? {
                                    ...m,
                                    status:
                                      m.status === 'Live Window'
                                        ? 'Completed'
                                        : 'Live Window',
                                  }
                                : m
                            )
                          )
                        }
                        className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-2 text-xs font-bold hover:border-[var(--app-accent)] flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                        {mock.status === 'Live Window'
                          ? 'Conclude & Publish AIR'
                          : 'Open Live Window'}
                      </button>
                      <button
                        onClick={() =>
                          setScheduledMocks((prev) =>
                            prev.filter((m) => m.id !== mock.id)
                          )
                        }
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                        title="Remove scheduled mock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}