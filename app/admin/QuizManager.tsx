'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FileQuestion, Loader2, Trash2, Save, 
  CheckCircle, ToggleLeft, ToggleRight, Search
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  category: string;
  time_limit: number;
  active: boolean;
  created_at: string;
}

const CATEGORIES = [
  'History', 'Geography', 'Polity', 'Economy',
  'Science & Tech', 'Environment', 'Current Affairs',
  'Maths', 'Reasoning', 'GS'
];

export default function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'active' | 'hidden'>('all');
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesQuery = quiz.title.toLowerCase().includes(query.toLowerCase()) || quiz.category?.toLowerCase().includes(query.toLowerCase());
    const matchesVisibility = visibility === 'all' || (visibility === 'active' ? quiz.active : !quiz.active);
    return matchesQuery && matchesVisibility;
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setQuizzes(data);
    setLoading(false);
  };

  const handleUpdateCategory = async (id: string, newCat: string) => {
    setActionLoadingId(id);
    const { error } = await supabase.from('quizzes').update({ category: newCat }).eq('id', id);
    if (!error) {
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, category: newCat } : q));
      showSuccess(id);
    } else alert("Failed to update category.");
    setActionLoadingId(null);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    const newStatus = !currentStatus;
    const { error } = await supabase.from('quizzes').update({ active: newStatus }).eq('id', id);
    if (!error) {
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, active: newStatus } : q));
      showSuccess(id);
    } else alert("Failed to update status.");
    setActionLoadingId(null);
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz forever? This will also delete all student attempts for this quiz!')) return;
    setActionLoadingId(id);
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (!error) {
      setQuizzes(quizzes.filter(q => q.id !== id));
    } else alert("Failed to delete quiz.");
    setActionLoadingId(null);
  };

  const showSuccess = (id: string) => {
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20">
      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/60 bg-white/30">
           <h3 className="font-black text-emerald-950 flex items-center gap-2 text-xl">
             <FileQuestion className="w-6 h-6 text-emerald-600" /> Organize Existing Quizzes
           </h3>
           <p className="text-sm text-gray-600 mt-1 font-medium">Instantly move old quizzes to valid subject folders and toggle their visibility.</p>
        </div>
        <div className="flex flex-col gap-3 border-b border-white/40 p-4 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quizzes or subjects" className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500"/></label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"><option value="all">All quizzes ({quizzes.length})</option><option value="active">Visible</option><option value="hidden">Hidden</option></select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Quiz Title</th>
                  <th className="px-6 py-4">Subject Folder (Move)</th>
                  <th className="px-6 py-4 text-center">Visibility (Active)</th>
                  <th className="px-6 py-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/20">
                {filteredQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-white/60 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 line-clamp-1">{q.title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{q.time_limit} mins</div>
                    </td>

                    {/* Category Dropdown */}
                    <td className="px-6 py-4">
                      <select 
                        className={`p-2 rounded-xl text-sm font-bold border transition-colors outline-none cursor-pointer ${successId === q.id ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}
                        value={q.category || ''}
                        onChange={(e) => handleUpdateCategory(q.id, e.target.value)}
                        disabled={actionLoadingId === q.id}
                      >
                        {!CATEGORIES.includes(q.category) && <option value={q.category}>{q.category} (Old)</option>}
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>

                    {/* Active/Draft Toggle */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleActive(q.id, q.active)}
                        disabled={actionLoadingId === q.id}
                        className={`flex items-center justify-center w-28 mx-auto gap-2 p-2 rounded-xl border transition-all ${q.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {q.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        <span className="text-xs font-bold uppercase">{q.active ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Delete Button */}
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => deleteQuiz(q.id)} disabled={actionLoadingId === q.id} className="p-2 bg-white rounded-xl border border-gray-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm">
                        {actionLoadingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}