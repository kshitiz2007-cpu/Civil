'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// All your custom Admin Modules!
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
  LayoutDashboard, FileQuestion, Users, FileText,
  CreditCard, Sparkles, CalendarClock, TableProperties,
  LogOut,MessageSquare,Activity
} from 'lucide-react';

// Sidebar Navigation Configuration
const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare },
  { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
  { id: 'aigen', label: 'AI Generate', icon: Sparkles },
  { id: 'resources', label: 'Resources', icon: FileText },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'analytics', label: 'Performance', icon: Activity },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarClock },
  { id: 'csvimport', label: 'CSV Import', icon: TableProperties },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Authenticate and Verify Admin Privileges
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          window.location.href = '/'; 
          return;
        }

        const email = session.user.email || '';
        
        // SUPER ADMIN OVERRIDE
        if (email === 'kshitiz2007@gmail.com' || email === 'admin@civilprep.in') {
          setLoading(false);
          return;
        }

        // Standard Admin check
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'admin') {
          window.location.href = '/dashboard';
          return;
        }

        // Stop the loading spinner!
        setLoading(false);

      } catch (err) {
        console.error("Admin check failed:", err);
        window.location.href = '/dashboard'; 
      }
    }

    checkAdmin();
  }, []); // <-- This empty array is crucial to prevent the infinite loop!

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="app-theme relative flex min-h-screen w-full flex-col font-sans md:flex-row">

      {/* 1. GLOWING AURORA BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[20%] w-[25rem] h-[25rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 2. SIDEBAR NAVIGATION (Glassmorphism) */}
      <aside className="theme-surface-solid relative z-20 flex w-full shrink-0 flex-col border-b md:h-screen md:w-72 md:border-b-0 md:border-r">
        
        {/* Header - Stays left on mobile, block on desktop */}
        <div className="flex items-center justify-between p-4 md:block md:p-8 md:pb-6"><div className="absolute right-4 top-4 hidden md:block"><ThemeSelector compact /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              Admin Panel
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-emerald-400/80 tracking-widest uppercase mt-2 hidden md:block">Gyankunj Academy</p>
          </div>
          
          {/* Mobile Logout Button (Hidden on Desktop) */}
          <button 
            onClick={handleLogout}
            className="md:hidden p-2 text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Horizontal scroll on mobile, Vertical stack on desktop */}
        <nav 
          className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible px-4 pb-4 md:px-5 md:py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-fade-in md:flex-1" 
          style={{ animationDelay: '100ms' }}
        >
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-4 px-4 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 text-sm md:text-base border ${
                  isActive
                    ? 'bg-white/10 text-emerald-300 border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'text-white/50 border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-emerald-300' : 'opacity-70'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Logout Button (Hidden on Mobile) */}
        <div className="hidden md:block p-5 border-t border-white/10 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl transition-colors font-bold border border-rose-500/20"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <main className="relative z-10 h-screen w-full flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Limit max width on large screens to keep content readable */}
        <div className="max-w-7xl mx-auto w-full text-white">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}

          {/* INBOX TAB */}
          {activeTab === 'inbox' && <AdminInbox />}

          {/* QUIZZES TAB */}
          {activeTab === 'quizzes' && <QuizManager />}

          {/* AI GENERATE TAB */}
          {activeTab === 'aigen' && <AiQuizBuilder />}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && <ResourceManager />}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && <StudentsManager />}
          {activeTab === 'analytics' && <AdminAnalytics />}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && <PaymentsManager />}

          {/* CSV IMPORT TAB */}
          {activeTab === 'csvimport' && <CsvImporter />}

          {/* SCHEDULED TAB */}
          {activeTab === 'scheduled' && (
            <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/20 rounded-2xl md:rounded-[2rem] w-full mt-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
              <CalendarClock className="w-12 h-12 md:w-16 md:h-16 text-emerald-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-serif tracking-tight drop-shadow-sm">Live Events Module</h3>
              <p className="text-xs md:text-sm text-white/50 mb-6 max-w-md">
                This module will handle the logic for setting up live, time-gated "All India Mock Tests".
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}