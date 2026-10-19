'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  UploadCloud,
  FileSpreadsheet,
  Save,
  Loader2,
  CheckCircle,
  Trash2,
  Download,
} from 'lucide-react';

interface ParsedQuestion {
  text: string;
  textHi: string;
  options: string[];
  optionsHi: string[];
  correct: number;
  explanation?: string;
  explanationHi?: string;
}

export default function CsvImporter() {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [fileName, setFileName] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('Polity');
  const [timeLimit, setTimeLimit] = useState(60);

  const downloadTemplate = () => {
    const csvContent = `"Question_EN","Question_HI","Option1_EN","Option2_EN","Option3_EN","Option4_EN","Option1_HI","Option2_HI","Option3_HI","Option4_HI","Correct_Option","Explanation_EN","Explanation_HI"\n"With reference to the Writ Jurisdiction of the Supreme Court under Article 32, consider the following statements:","अनुच्छेद 32 के तहत सर्वोच्च न्यायालय के रिट क्षेत्राधिकार के संदर्भ में, निम्नलिखित कथनों पर विचार करें:","1 only","2 only","Both 1 and 2","Neither 1 nor 2","केवल 1","केवल 2","1 और 2 दोनों","न तो 1 और न ही 2",3,"Article 32 is itself a Fundamental Right and empowers the Supreme Court to issue writs for enforcement of Part III rights.","अनुच्छेद 32 स्वयं एक मौलिक अधिकार है और भाग III के अधिकारों के प्रवर्तन के लिए रिट जारी करने का अधिकार देता है।"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Gyankunj_Bilingual_UPSC_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvRow = (str: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && str[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      return alert('Please upload a valid .csv file');
    }
    setFileName(file.name);
    setQuizTitle(file.name.replace('.csv', ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      const questions: ParsedQuestion[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvRow(lines[i]);
        if (cols.length >= 11) {
          const correctIndex = (parseInt(cols[10]) || 1) - 1;
          questions.push({
            text: cols[0],
            textHi: cols[1],
            options: [cols[2], cols[3], cols[4], cols[5]],
            optionsHi: [cols[6], cols[7], cols[8], cols[9]],
            correct:
              correctIndex >= 0 && correctIndex <= 3 ? correctIndex : 0,
            explanation: cols[11] || '',
            explanationHi: cols[12] || '',
          });
        }
      }
      setParsedQuestions(questions);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const saveToDatabase = async () => {
    if (parsedQuestions.length === 0 || !quizTitle) return;
    setLoading(true);

    const newQuiz = {
      id: `q_${Date.now()}`,
      title: quizTitle,
      category: quizCategory,
      section: quizCategory,
      time_limit: timeLimit,
      is_paid: false,
      price: 0,
      active: true,
      questions: parsedQuestions.map((q, i) => ({
        id: `csv_${Date.now()}_${i}`,
        ...q,
      })),
    };

    const { error } = await supabase.from('quizzes').insert([newQuiz]);

    setLoading(false);
    if (error) {
      alert('Error saving paper: ' + error.message);
    } else {
      alert('Bilingual paper imported and published!');
      setParsedQuestions([]);
      setFileName('');
      setQuizTitle('');
    }
  };

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
          High-Volume Question Bank Ingestion
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-[var(--app-accent)]" /> Bulk
          Bilingual CSV Importer
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="theme-surface rounded-3xl p-5 space-y-3">
            <h3 className="font-bold text-sm">1. Standard 13-Column Schema</h3>
            <p className="text-xs text-[var(--app-muted)] leading-relaxed">
              Prepare your bilingual question bank with English & Hindi
              statements, 4 options each, 1-indexed answer key, and bilingual
              faculty explanations.
            </p>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)] py-2.5 text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-[var(--app-accent)]" /> Download
              UPSC CSV Template
            </button>
          </div>

          {!parsedQuestions.length ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`theme-surface rounded-3xl p-8 border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                isDragging
                  ? 'border-[var(--app-accent)]'
                  : 'border-[var(--app-border)] hover:border-[var(--app-accent)]'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) =>
                  e.target.files && processFile(e.target.files[0])
                }
              />
              <UploadCloud className="w-10 h-10 mb-3 text-[var(--app-accent)]" />
              <h3 className="text-sm font-bold mb-1">
                Drop Bilingual CSV or Click to Browse
              </h3>
              <p className="text-xs text-[var(--app-muted)]">
                Supports UTF-8 Devanagari & English CSV files
              </p>
            </div>
          ) : (
            <div className="theme-surface rounded-2xl p-4 flex items-center justify-between border border-emerald-500/30">
              <div className="flex items-center gap-3 overflow-hidden">
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm truncate">{fileName}</h3>
                  <p className="text-xs text-emerald-300">
                    {parsedQuestions.length} questions validated
                  </p>
                </div>
              </div>
              <button
                onClick={() => setParsedQuestions([])}
                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className={`theme-surface rounded-3xl p-5 space-y-4 transition ${
              parsedQuestions.length
                ? 'opacity-100'
                : 'opacity-50 pointer-events-none'
            }`}
          >
            <h3 className="font-bold text-sm">2. Paper Metadata</h3>
            <div>
              <label className="text-[11px] font-bold text-[var(--app-muted)] uppercase tracking-wider mb-1 block">
                Paper Title
              </label>
              <input
                type="text"
                className="glass-input w-full text-xs sm:text-sm"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--app-muted)] uppercase tracking-wider mb-1 block">
                  GS Subject
                </label>
                <select
                  className="glass-input w-full text-xs sm:text-sm"
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                >
                  <option value="Polity">Polity</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Economy">Economy</option>
                  <option value="Environment">Environment</option>
                  <option value="Science & Tech">Sci & Tech</option>
                  <option value="Current Affairs">Current Affairs</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--app-muted)] uppercase tracking-wider mb-1 block">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  className="glass-input w-full text-xs sm:text-sm"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              onClick={saveToDatabase}
              disabled={loading || !parsedQuestions.length || !quizTitle}
              className="w-full bg-[var(--app-accent)] text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm transition hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Importing...' : 'Publish Imported Paper'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="theme-surface rounded-3xl h-full min-h-[480px] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--app-border)]">
              <h3 className="font-bold text-sm">
                3. Bilingual OMR Question Verification
              </h3>
              <p className="text-xs text-[var(--app-muted)] mt-0.5">
                Inspect parsed English & Hindi statements before committing to
                database.
              </p>
            </div>

            <div className="p-5 flex-1 overflow-auto space-y-3 custom-scrollbar">
              {!parsedQuestions.length ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-16">
                  <FileSpreadsheet className="w-12 h-12 text-[var(--app-muted)] mb-3" />
                  <p className="text-sm font-bold">No CSV file loaded</p>
                  <p className="text-xs text-[var(--app-muted)]">
                    Upload a CSV file on the left to preview parsed items.
                  </p>
                </div>
              ) : (
                parsedQuestions.slice(0, 10).map((q, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs space-y-2"
                  >
                    <p className="font-bold">
                      <span className="text-[var(--app-accent)] mr-1.5">
                        Q{i + 1} (EN):
                      </span>
                      {q.text}
                    </p>
                    <p className="font-hindi text-[var(--app-muted)]">
                      <span className="font-sans font-bold text-[var(--app-secondary)] mr-1.5">
                        HI:
                      </span>
                      {q.textHi}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border ${
                            q.correct === oIdx
                              ? 'border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-300'
                              : 'border-[var(--app-border)]'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                          <div className="font-hindi text-[10px] text-[var(--app-muted)] mt-0.5">
                            {q.optionsHi[oIdx]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}