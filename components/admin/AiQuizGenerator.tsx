'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, UploadCloud, Save, Loader2, X, Plus } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Question {
  text: string;
  textHi: string;
  options: string[];
  optionsHi: string[];
  correct: number;
}

export default function AiQuizBuilder() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('GS');

  const generateQuiz = async () => {
    if (!topic) return alert('Please enter a topic or paste text.');
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are an expert educator. Generate a multiple-choice quiz about: "${topic}".
        Create exactly ${numQuestions} questions.
        The output MUST be a valid JSON array of objects. 
        Do not include any markdown formatting like \`\`\`json.
        Each object must have exactly this structure:
        {
          "text": "Question in English",
          "textHi": "Question in Hindi",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "optionsHi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
          "correct": 0 // Index of the correct option (0-3)
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text()// fix```json/g, '')// fix
```/g, '').trim();
      
      const parsedQuestions = JSON.parse(responseText);
      setGeneratedQuestions(parsedQuestions);
      setQuizTitle(`Generated Quiz: ${topic.substring(0, 30)}...`);
    } catch (error) {
      console.error(error);
      alert('Failed to generate quiz. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!generatedQuestions || !quizTitle) return;
    setLoading(true);

    const newQuiz = {
      id: `q_${Date.now()}`,
      title: quizTitle,
      category: quizCategory,
      section: quizCategory,
      time_limit: numQuestions, // 1 minute per question default
      is_paid: false,
      price: 0,
      active: false, // Save as draft by default
      questions: generatedQuestions.map((q, i) => ({ id: `gen_${i}`, ...q }))
    };

    const { error } = await supabase.from('quizzes').insert([newQuiz]);

    setLoading(false);
    if (error) {
      alert('Error saving quiz: ' + error.message);
    } else {
      alert('Quiz successfully saved to drafts!');
      setGeneratedQuestions(null);
      setTopic('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-emerald-950 font-serif flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500"/> AI Quiz Generator
        </h2>
      </div>

      {!generatedQuestions ? (
        <div className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Topic or Source Text
              </label>
              <textarea 
                className="glass-input min-h-[150px] resize-y" 
                placeholder="Paste study material, a news article, or just type a topic like 'Indian Constitution Part 3'..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Number of Questions
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  min="1" max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </label>
                <select 
                  className="glass-input"
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                >
                  <option value="GS">General Studies</option>
                  <option value="CA">Current Affairs</option>
                  <option value="Maths">Mathematics</option>
                  <option value="Reasoning">Reasoning</option>
                </select>
              </div>
            </div>

            <button 
              onClick={generateQuiz}
              disabled={loading}
              className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
              {loading ? 'Generating with Gemini...' : 'Generate Bilingual Quiz'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Review & Save</h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                className="glass-input flex-1 font-bold" 
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Quiz Title"
              />
            </div>
          </div>

          <div className="space-y-4">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="glass-card p-5 relative group border-l-4 border-emerald-500">
                <button 
                  onClick={() => setGeneratedQuestions(generatedQuestions.filter((_, idx) => idx !== i))}
                  className="absolute top-4 right-4 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                >
                  <X className="w-4 h-4"/>
                </button>
                
                <p className="font-bold text-gray-900 mb-1"><span className="text-emerald-600">Q{i + 1} (EN):</span> {q.text}</p>
                <p className="font-serif text-gray-700 mb-4"><span className="text-orange-600 font-sans font-bold">Q{i + 1} (HI):</span> {q.textHi}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className={`p-2 rounded-lg border ${q.correct === optIdx ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="mb-1">{String.fromCharCode(65 + optIdx)}. {opt}</div>
                      <div className="font-serif text-gray-600">{q.optionsHi[optIdx]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 sticky bottom-6 z-10">
            <button 
              onClick={() => setGeneratedQuestions(null)}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl shadow-md border border-gray-200 transition-all"
            >
              Discard & Start Over
            </button>
            <button 
              onClick={saveToDatabase}
              disabled={loading}
              className="flex-[2] bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
              Save as Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}