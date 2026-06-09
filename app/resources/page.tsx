'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, ChevronLeft, Loader2, Search, Landmark, Globe, 
  Scale, TrendingUp, Microscope, Leaf, Newspaper, Calculator, 
  Lightbulb, FileText, Layers, ExternalLink, Download, LayoutDashboard, 
  History, LogOut, Sparkles, ChevronRight // <-- Added explicitly to imports
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
  category: string;
  section: string;
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

export default function StudentResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUser(profile);

        const { data } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) setResources(data);
      } catch (err) {
        console.error("Error loading resources", err);
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

  const getResourceCount = (subjectId: string) => resources.filter(r => r.category === subjectId).length;

  const filteredResources = resources.filter(r => {
    if (!activeSubject) return false;
    const matchesSubject = r.category === activeSubject;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const groupedResources = filteredResources.reduce((acc, resource) => {
    const subsection = resource.section && resource.section.trim() !== "" && resource.section !== resource.category 
      ? resource.section 
      : 'General Materials';
    if (!acc[subsection]) acc[subsection] = [];
    acc[subsection].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex selection:bg-emerald-500/30">
      
      {/* GLOWING AURORA BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[20%] w-[25rem] h-[25rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* DESKTOP GLASS SIDEBAR */}
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
          <button className="w-full flex items-center gap-4 px-4 py-4 bg-white/10 text-emerald-300 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] font-bold transition-all">
            <FileText className="w-5 h-5" /> Study Files
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

      {/* MOBILE FLOATING GLASS DOCK */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl z-50 flex justify-between px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center p-2 text-white/50 hover:text-white transition-colors">
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => router.push('/quizzes')} className="flex flex-col items-center p-2 text-white/50 hover:text-white transition-colors">
          <Layers className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Tests</span>
        </button>
        <button className="flex flex-col items-center p-2 text-emerald-300 relative">
          <div className="absolute inset-0 bg-white/10 rounded-xl"></div>
          <FileText className="w-6 h-6 mb-1 relative z-10" />
          <span className="text-[10px] font-bold relative z-10">Files</span>
        </button>
        <button onClick={() => router.push('/history')} className="flex flex-col items-center p-2 text-white/50 hover:text-white transition-colors">
          <History className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">History</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto p-5 md:p-8 pb-32 space-y-8 animate-fade-in text-white">
          
          {/* Header */}
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={() => activeSubject ? setActiveSubject(null) : router.push('/dashboard')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white/90 drop-shadow-sm flex items-center gap-3 font-serif tracking-tight">
                {activeSubject ? `${activeSubject} Library` : 'Study Materials'}
              </h1>
              <p className="text-sm md:text-base text-emerald-100/70 font-medium mt-1">
                {activeSubject ? 'Browse documents and links' : 'Choose a subject to view available materials'}
              </p>
            </div>
          </div>

          {/* VIEW 1: MAIN SUBJECT FOLDERS */}
          {!activeSubject && (
            <div className="animate-fade-in space-y-10">
              <section>
                <h2 className="text-lg font-bold text-white/80 mb-6 px-2 flex items-center gap-2 uppercase tracking-widest text-sm">
                  <FolderOpen className="w-5 h-5 text-emerald-400" /> Subject Folders
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {SUBJECT_CONFIG.map((subject) => {
                    const Icon = subject.icon;
                    const count = getResourceCount(subject.id);
                    return (
                      <div 
                        key={subject.id}
                        onClick={() => setActiveSubject(subject.id)}
                        className={`bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] cursor-pointer hover:-translate-y-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all group border border-white/20 border-b-4 ${subject.border}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-4 rounded-2xl ${subject.bg} ${subject.color} group-hover:scale-110 transition-transform shadow-inner border border-white/10`}>
                            <Icon className="w-7 h-7" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors tracking-tight">
                            {subject.id}
                          </h3>
                          <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">
                            {count} Files
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )}

          {/* VIEW 2: SUBSECTIONS & RESOURCES (ACCORDIONS) */}
          {activeSubject && (
            <div className="animate-fade-in space-y-8">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeSubject} materials...`} 
                  className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-white/50 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Accordion List wrapper */}
              <div className="flex flex-col gap-4">
                {Object.keys(groupedResources).length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl p-12 text-center border-dashed border-2 border-white/20 rounded-[2rem]">
                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-1">No materials found</h3>
                    <p className="text-sm text-white/50">Check back soon for new {activeSubject} resources.</p>
                  </div>
                ) : (
                  Object.entries(groupedResources).map(([subsection, sectionResources]) => {
                    const isOpen = !!openSections[subsection];
                    
                    return (
                      <div key={subsection} className="space-y-4">
                        {/* Clickable Accordion Header */}
                        <button 
                          onClick={() => toggleSection(subsection)}
                          className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 hover:bg-white/15 transition-all shadow-md group text-left"
                        >
                          <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-tight group-hover:text-emerald-300 transition-colors">
                            <Layers className="w-5 h-5 text-emerald-400" /> {subsection}
                          </h2>
                          <ChevronRight className={`w-5 h-5 text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-90 text-emerald-400' : ''}`} />
                        </button>
                        
                        {/* Collapsible Content Grid */}
                        {isOpen && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300 p-1">
                            {sectionResources.map((resource) => (
                              <div key={resource.id} className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 border border-white/20 shadow-lg flex items-center justify-between gap-4 hover:bg-white/15 transition-all group">
                                
                                <div className="flex items-center gap-4 overflow-hidden">
                                  <div className={`p-4 rounded-2xl shrink-0 shadow-inner border border-white/10 ${
                                    resource.file_type === 'pdf' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                                  }`}>
                                    {resource.file_type === 'pdf' ? <FileText className="w-6 h-6" /> : <ExternalLink className="w-6 h-6" />}
                                  </div>
                                  <div className="overflow-hidden">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors truncate">
                                      {resource.title}
                                    </h3>
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                      {(resource.file_type || 'LINK').toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                <a 
                                  href={resource.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 p-4 bg-white/10 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-md border border-white/10 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                >
                                  {resource.file_type === 'pdf' ? <Download className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                                </a>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}