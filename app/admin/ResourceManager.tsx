'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Plus, Trash2, FolderOpen, Save, Loader2, Link as LinkIcon, Upload } from 'lucide-react';

const SUBJECTS = [
  'History', 'Geography', 'Polity', 'Economy', 
  'Science & Tech', 'Environment', 'Current Affairs', 
  'Maths', 'Reasoning'
];

export default function ResourceManager() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // FORM STATE
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('pdf'); // 'pdf' or 'link'
  const [fileUrl, setFileUrl] = useState('');      // Used for raw web links
  const [localFile, setLocalFile] = useState<File | null>(null); // Used for physical file selections
  const [category, setCategory] = useState('History');
  const [section, setSection] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation checks matching current active state
    if (!title) return alert("Title is required.");
    if (fileType === 'link' && !fileUrl) return alert("Web Link URL is required.");
    if (fileType === 'pdf' && !localFile) return alert("Please select a local PDF file to upload.");
    
    setSaving(true);
    let finalUrl = fileUrl;

    try {
      // 1. Handle uploading directly via client-side Supabase Storage bucket if type is 'pdf'
      if (fileType === 'pdf' && localFile) {
        const fileExt = localFile.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${uniqueFileName}`;

        // Send the binary stream to your storage bucket (Make sure 'resource-vault' bucket exists)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(filePath, localFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Extract and assign the public access string URL
        const { data: { publicUrl } } = supabase.storage
          .from('resources')
          .getPublicUrl(filePath);

        finalUrl = publicUrl;
      }

      // 2. Build the exact item payload for database entry
      const newResource = {
        id: `res_${Date.now()}`,
        title,
        file_type: fileType,
        file_url: finalUrl,
        category,
        section: section || category, 
      };

      const { error: dbError } = await supabase.from('resources').insert([newResource]);
      if (dbError) throw dbError;

      alert("Resource successfully synced!");
      
      // Reset state properties cleanly
      setTitle('');
      setFileUrl('');
      setLocalFile(null);
      setSection('');
      fetchResources(); 
    } catch (error: any) {
      alert("Error adding resource: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
    } catch (error: any) {
      alert("Error deleting resource: " + error.message);
    }
  }

  async function handleUpdateCategory(id: string, newCategory: string, newSection: string) {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ category: newCategory, section: newSection || newCategory })
        .eq('id', id);
        
      if (error) throw error;
      alert("Resource updated!");
      fetchResources();
    } catch (error: any) {
      alert("Error updating: " + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-white/70">Loading database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 text-white">
      
      {/* 1. UPLOAD NEW FILE CARD (Glassmorphism) */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
        
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <Plus className="w-5 h-5 text-emerald-400" />
          </div>
          Upload New File
        </h2>

        <form onSubmit={handleAddResource} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Type</label>
            <select 
              value={fileType} 
              onChange={(e) => {
                setFileType(e.target.value);
                setFileUrl('');
                setLocalFile(null);
              }}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
            >
              <option value="pdf" className="bg-gray-900">PDF Document</option>
              <option value="link" className="bg-gray-900">Web Link</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Title</label>
            <input 
              type="text" required placeholder="e.g. Modern History Notes"
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* DYNAMIC FIELD: Renders upload area for PDF or URL field for general Links */}
          <div className="md:col-span-1">
            {fileType === 'pdf' ? (
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Choose File</label>
                <div className="relative w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/50 flex items-center justify-between cursor-pointer group hover:bg-white/10 transition-all">
                  <span className="text-sm truncate text-white/60 max-w-[80%]">
                    {localFile ? localFile.name : 'Select PDF...'}
                  </span>
                  <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setLocalFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">File URL</label>
                <input 
                  type="url" required placeholder="https://..."
                  value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Subject</label>
            <select 
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
            >
              {SUBJECTS.map(sub => <option key={sub} value={sub} className="bg-gray-900">{sub}</option>)}
            </select>
          </div>

          <div className="md:col-span-1">
            <button 
              type="submit" disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save File
            </button>
          </div>
        </form>
      </div>

      {/* 2. ORGANIZE DATABASE CARD (Glassmorphism) */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/10 bg-white/5">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <FolderOpen className="w-5 h-5 text-blue-400" />
            </div>
            Organize Database
          </h2>
          <p className="text-sm text-white/50 ml-1">Reassign older files to new folders or delete outdated material.</p>
        </div>

        <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto custom-scrollbar">
          {resources.length === 0 ? (
            <div className="p-12 text-center text-white/50">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No resources found in the database.</p>
            </div>
          ) : (
            resources.map((res) => (
              <div key={res.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/5 transition-colors group">
                
                {/* Info */}
                <div className="flex items-center gap-4 flex-1 overflow-hidden w-full">
                  <div className={`p-3 rounded-xl shrink-0 border shadow-inner ${
                    res.file_type === 'pdf' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}>
                    {res.file_type === 'pdf' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-white truncate text-base">{res.title}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-bold">
                      {(res.file_type || 'LINK').toUpperCase()} • {new Date(res.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select 
                    value={res.category || 'History'}
                    onChange={(e) => handleUpdateCategory(res.id, e.target.value, res.section)}
                    className="bg-white/5 border border-white/10 text-white/80 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none flex-1 md:flex-none md:w-40"
                  >
                    {SUBJECTS.map(sub => <option key={sub} value={sub} className="bg-gray-900">{sub}</option>)}
                  </select>

                  <input 
                    type="text"
                    value={res.section || ''}
                    placeholder="Subsection..."
                    onBlur={(e) => handleUpdateCategory(res.id, res.category, e.target.value)}
                    onChange={(e) => {
                      const updated = resources.map(r => r.id === res.id ? {...r, section: e.target.value} : r);
                      setResources(updated);
                    }}
                    className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 md:flex-none md:w-40"
                  />

                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg transition-colors border border-rose-500/20 shrink-0"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}