'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Plus,
  Trash2,
  FolderOpen,
  Save,
  Loader2,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';

const SUBJECTS = [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science & Tech',
  'Current Affairs',
  'Maths',
  'Reasoning',
];

export default function ResourceManager() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Polity');
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
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();

    if (!title) return alert('Title is required.');
    if (fileType === 'link' && !fileUrl)
      return alert('Web Link URL is required.');
    if (fileType === 'pdf' && !localFile)
      return alert('Please select a local PDF file to upload.');

    setSaving(true);
    let finalUrl = fileUrl;

    try {
      if (fileType === 'pdf' && localFile) {
        const fileExt = localFile.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `uploads/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(filePath, localFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('resources').getPublicUrl(filePath);

        finalUrl = publicUrl;
      }

      const newResource = {
        id: `res_${Date.now()}`,
        title,
        file_type: fileType,
        file_url: finalUrl,
        category,
        section: section || category,
      };

      const { error: dbError } = await supabase
        .from('resources')
        .insert([newResource]);
      if (dbError) throw dbError;

      alert('Compendium successfully published to Vault!');
      setTitle('');
      setFileUrl('');
      setLocalFile(null);
      setSection('');
      fetchResources();
    } catch (error: any) {
      alert('Error adding resource: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this study compendium?'))
      return;

    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      setResources(resources.filter((r) => r.id !== id));
    } catch (error: any) {
      alert('Error deleting resource: ' + error.message);
    }
  }

  async function handleUpdateCategory(
    id: string,
    newCategory: string,
    newSection: string
  ) {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ category: newCategory, section: newSection || newCategory })
        .eq('id', id);

      if (error) throw error;
      fetchResources();
    } catch (error: any) {
      alert('Error updating: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--app-accent)]">
        <Loader2 className="w-9 h-9 animate-spin mb-3" />
        <p className="text-xs font-medium text-[var(--app-muted)]">
          Loading Compendium Vault...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
          Value-Added Handouts & Reference Gists
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold">
          Digital Compendium Vault
        </h2>
      </header>

      <div className="theme-surface rounded-3xl p-5 sm:p-7">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--app-accent)]" /> Publish New
          Study Material
        </h3>

        <form
          onSubmit={handleAddResource}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-1.5">
              Format
            </label>
            <select
              value={fileType}
              onChange={(e) => {
                setFileType(e.target.value);
                setFileUrl('');
                setLocalFile(null);
              }}
              className="glass-input w-full text-xs sm:text-sm font-semibold"
            >
              <option value="pdf">PDF Handout</option>
              <option value="link">Reference URL</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-1.5">
              Compendium Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Laxmikanth Part III Revision Gist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm"
            />
          </div>

          <div>
            {fileType === 'pdf' ? (
              <div>
                <label className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-1.5">
                  Select PDF
                </label>
                <div className="relative glass-input flex items-center justify-between cursor-pointer">
                  <span className="text-xs truncate text-[var(--app-muted)] max-w-[80%]">
                    {localFile ? localFile.name : 'Choose PDF...'}
                  </span>
                  <Upload className="w-4 h-4 text-[var(--app-accent)]" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setLocalFile(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-1.5">
                  Reference URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="glass-input w-full text-xs sm:text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-1.5">
              GS Discipline
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm font-semibold"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--app-accent)] text-slate-950 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Publish Material
            </button>
          </div>
        </form>
      </div>

      <div className="theme-surface rounded-3xl overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-[var(--app-border)] flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-[var(--app-accent)]" />
          <div>
            <h3 className="text-base font-bold">
              Manage Published Compendiums ({resources.length})
            </h3>
            <p className="text-xs text-[var(--app-muted)]">
              Reassign syllabus folders or remove outdated handouts.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[var(--app-border)] max-h-[560px] overflow-y-auto custom-scrollbar">
          {resources.length === 0 ? (
            <div className="p-12 text-center text-[var(--app-muted)] text-xs">
              <FileText className="w-9 h-9 mx-auto mb-2 opacity-40" />
              <p>No study compendiums found in the vault.</p>
            </div>
          ) : (
            resources.map((res) => (
              <div
                key={res.id}
                className="p-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[var(--app-surface-muted)] transition"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] text-[var(--app-accent)] shrink-0">
                    {res.file_type === 'pdf' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold truncate text-sm">{res.title}</h4>
                    <p className="text-[10px] text-[var(--app-muted)] uppercase tracking-wider mt-0.5 font-semibold">
                      {(res.file_type || 'LINK').toUpperCase()} ·{' '}
                      {new Date(res.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={res.category || 'Polity'}
                    onChange={(e) =>
                      handleUpdateCategory(res.id, e.target.value, res.section)
                    }
                    className="glass-input py-1.5 px-2.5 text-xs font-semibold"
                  >
                    {SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={res.section || ''}
                    placeholder="Sub-module..."
                    onBlur={(e) =>
                      handleUpdateCategory(res.id, res.category, e.target.value)
                    }
                    onChange={(e) => {
                      const updated = resources.map((r) =>
                        r.id === res.id ? { ...r, section: e.target.value } : r
                      );
                      setResources(updated);
                    }}
                    className="glass-input py-1.5 px-2.5 text-xs w-36"
                  />

                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20"
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