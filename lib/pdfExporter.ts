// ============================================================================
// WATERMARKED PDF TEST PAPER & BILINGUAL SOLUTION EXPORTER ENGINE
// Supports:
//  1. Watermarked Question Paper Booklet (Bilingual EN + HI + Detachable OMR)
//  2. Watermarked Bilingual Solution Key (Answers + Faculty Explanations + OMR Telemetry)
//  3. Multi-layered Anti-Piracy Watermarking (Diagonal Repeating Grid + Security Header/Footer)
//  4. Mobile & Desktop Native In-Page Print-to-PDF + Standalone Booklet Download
//  5. Self-Contained Modal Fallback (works even if WatermarkPdfModal is not mounted)
// ============================================================================

import { supabase } from '@/lib/supabaseClient';
import { INITIAL_QUIZZES } from '@/lib/mockData';

export interface WatermarkPdfConfig {
  instituteName: string;
  studentName: string;
  rollNumber: string;
  emailOrPhone: string;
  bookletSeries: 'A' | 'B' | 'C' | 'D';
  mode: 'paper' | 'solution';
  watermarkOpacity: number; // e.g. 0.14 (6% to 28%)
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkPdfConfig = {
  instituteName: 'GYANKUNJ IAS ACADEMY',
  studentName: 'Aarav Sharma',
  rollNumber: 'UPSC-26-084912',
  emailOrPhone: 'aarav.sharma@gyankunj.ias | +91-98260-XXXXX',
  bookletSeries: 'A',
  mode: 'paper',
  watermarkOpacity: 0.14,
};

function escapeHtml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Normalizes any question object from Supabase, CSV import, or mockData
 */
export function normalizeQuizQuestion(raw: any, index: number, fallbackCategory = 'UPSC GS') {
  const text =
    raw?.text ||
    raw?.question ||
    raw?.question_text ||
    raw?.statement ||
    `Question ${index + 1}`;
  const textHi = raw?.textHi || raw?.question_hi || raw?.text_hi || '';

  let options: string[] = [];
  if (Array.isArray(raw?.options)) {
    options = raw.options.map((o: any) => String(o ?? ''));
  } else if (typeof raw?.options === 'string') {
    try {
      const parsed = JSON.parse(raw.options);
      if (Array.isArray(parsed)) options = parsed.map((o: any) => String(o ?? ''));
    } catch {
      options = raw.options.split('|').map((s: string) => s.trim());
    }
  }
  if (!options.length) {
    const candidates = [
      raw?.option_a ?? raw?.optionA ?? raw?.a,
      raw?.option_b ?? raw?.optionB ?? raw?.b,
      raw?.option_c ?? raw?.optionC ?? raw?.c,
      raw?.option_d ?? raw?.optionD ?? raw?.d,
    ].filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
    if (candidates.length) {
      options = candidates.map((c) => String(c));
    } else {
      options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }
  }

  const optionsHi: string[] = Array.isArray(raw?.optionsHi)
    ? raw.optionsHi
    : Array.isArray(raw?.options_hi)
    ? raw.options_hi
    : [];

  let correctIndex = 0;
  const rawCorrect = raw?.correct ?? raw?.correct_option ?? raw?.correct_index ?? raw?.correct_answer ?? raw?.answer;
  if (typeof rawCorrect === 'number' && !Number.isNaN(rawCorrect)) {
    correctIndex = rawCorrect >= 1 && rawCorrect <= 4 && options.length === 4 && raw?.correct === undefined
      ? rawCorrect - 1
      : rawCorrect;
  } else if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    const upper = trimmed.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
      correctIndex = upper.charCodeAt(0) - 65;
    } else if (/^[0-3]$/.test(trimmed)) {
      correctIndex = Number(trimmed);
    } else {
      const foundIdx = options.findIndex(
        (opt) => opt.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (foundIdx !== -1) correctIndex = foundIdx;
    }
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }

  return {
    id: raw?.id || `q_${index + 1}`,
    topic: raw?.topic || raw?.subject || fallbackCategory,
    pyqRef: raw?.pyqRef || raw?.pyq_ref || raw?.reference || '',
    text,
    textHi,
    options,
    optionsHi,
    correct: correctIndex,
    explanation:
      raw?.explanation ||
      raw?.solution ||
      raw?.faculty_note ||
      'Refer to standard UPSC CSE reference material for detailed statement deduction.',
    explanationHi: raw?.explanationHi || raw?.explanation_hi || '',
  };
}

/**
 * Ensures a quiz object has its full array of normalized questions.
 * Fetches from Supabase or INITIAL_QUIZZES if only quiz metadata was passed.
 */
export async function resolveFullQuizData(quizInput: any): Promise<any> {
  let baseQuiz = quizInput || INITIAL_QUIZZES[0];

  if (typeof baseQuiz === 'string') {
    const foundLocal = INITIAL_QUIZZES.find((q) => q.id === baseQuiz);
    if (foundLocal) {
      baseQuiz = foundLocal;
    } else {
      baseQuiz = { id: baseQuiz, title: 'UPSC CSE Prelims Test Paper' };
    }
  }

  let rawQuestions = baseQuiz?.questions;
  if (typeof rawQuestions === 'string') {
    try {
      rawQuestions = JSON.parse(rawQuestions);
    } catch {
      rawQuestions = [];
    }
  }

  if ((!Array.isArray(rawQuestions) || rawQuestions.length === 0) && baseQuiz?.id) {
    const localMatch = INITIAL_QUIZZES.find((q) => q.id === baseQuiz.id);
    if (localMatch && Array.isArray(localMatch.questions) && localMatch.questions.length > 0) {
      rawQuestions = localMatch.questions;
      baseQuiz = { ...localMatch, ...baseQuiz, questions: rawQuestions };
    } else {
      try {
        const { data } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', baseQuiz.id)
          .single();
        if (data) {
          let dbQuestions = data.questions;
          if (typeof dbQuestions === 'string') {
            try {
              dbQuestions = JSON.parse(dbQuestions);
            } catch {
              dbQuestions = [];
            }
          }
          if (Array.isArray(dbQuestions) && dbQuestions.length > 0) {
            rawQuestions = dbQuestions;
            baseQuiz = { ...data, ...baseQuiz, questions: dbQuestions };
          }
        }
      } catch {
        // Ignore network/Supabase errors and fall back gracefully
      }
    }
  }

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    rawQuestions = INITIAL_QUIZZES[0].questions;
  }

  const normalizedQuestions = rawQuestions.map((q: any, idx: number) =>
    normalizeQuizQuestion(q, idx, baseQuiz?.category || 'UPSC GS')
  );

  return {
    ...baseQuiz,
    title: baseQuiz?.title || baseQuiz?.quiz_title || 'UPSC CSE Prelims Full Length Test',
    titleHi: baseQuiz?.titleHi || baseQuiz?.quiz_title_hi || '',
    category: baseQuiz?.category || 'General Studies',
    time_limit: Number(baseQuiz?.time_limit || Math.max(20, Math.round(normalizedQuestions.length * 1.2))),
    positive_marks: Number(baseQuiz?.positive_marks || 2.0),
    negative_marking: Number(baseQuiz?.negative_marking ?? 0.66),
    questions: normalizedQuestions,
  };
}

/**
 * Generates the complete A4 Watermarked HTML for either a live preview or standalone print window.
 */
export function buildWatermarkedBookletHtml(
  quiz: any,
  config: Partial<WatermarkPdfConfig> = {},
  attemptDetails?: any[],
  standaloneDocument = false
): string {
  const cfg: WatermarkPdfConfig = { ...DEFAULT_WATERMARK_CONFIG, ...config };
  const safeQuiz = quiz || INITIAL_QUIZZES[0];
  const rawQuestions = Array.isArray(safeQuiz.questions) ? safeQuiz.questions : [];
  const questions = rawQuestions.map((q: any, i: number) =>
    normalizeQuizQuestion(q, i, safeQuiz.category || 'UPSC GS')
  );
  const isSolution = cfg.mode === 'solution';
  const posMarks = Number(safeQuiz.positive_marks || 2.0);
  const negMarks = Number(safeQuiz.negative_marking ?? 0.66).toFixed(2);
  const maxMarks = (questions.length * posMarks).toFixed(0);
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const watermarkText = `${escapeHtml(cfg.instituteName.toUpperCase())} • ${escapeHtml(
    cfg.studentName.toUpperCase()
  )} • ROLL: ${escapeHtml(cfg.rollNumber.toUpperCase())} • ${escapeHtml(cfg.emailOrPhone)}`;

  const stampCount = Math.min(60, Math.max(16, Math.ceil(questions.length / 2) * 2));
  const diagonalWatermarkGrid = Array.from({ length: stampCount })
    .map(
      () => `
      <div style="transform: rotate(-28deg); font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: rgba(15, 23, 42, ${cfg.watermarkOpacity}); white-space: nowrap; text-align: center; padding: 28px 6px; user-select: none;">
        ${watermarkText}
      </div>
    `
    )
    .join('');

  const questionsHtml = questions
    .map((q: any, idx: number) => {
      const ansIndex = q.correct ?? 0;
      const ansLetter = String.fromCharCode(65 + ansIndex);
      const attItem = attemptDetails?.[idx];

      const optionsGrid = (q.options || [])
        .map((optEn: string, oIdx: number) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optHi = q.optionsHi?.[oIdx] || '';
          const isCorrectOpt = isSolution && oIdx === ansIndex;
          return `
          <div style="padding: 6px 9px; border-radius: 6px; border: 1px solid ${
            isCorrectOpt ? '#059669' : '#cbd5e1'
          }; background: ${
            isCorrectOpt ? '#ecfdf5' : '#f8fafc'
          }; font-size: 11.5px; display: flex; gap: 6px; align-items: baseline;">
            <strong style="color: ${isCorrectOpt ? '#047857' : '#0f172a'};">(${letter})</strong>
            <div>
              <span style="color:#0f172a;">${escapeHtml(optEn)}</span>
              ${
                optHi
                  ? `<span style="display:block; font-family:'Noto Serif Devanagari', serif; font-size:11px; color:#334155; margin-top:1px;">${escapeHtml(
                      optHi
                    )}</span>`
                  : ''
              }
            </div>
          </div>
        `;
        })
        .join('');

      const solutionBox = isSolution
        ? `
        <div style="margin-top: 8px; padding: 9px 12px; border-radius: 7px; border-left: 4px solid #059669; background: #f0fdf4; font-size: 11.5px;">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px; font-weight:800; color:#065f46; margin-bottom:4px;">
            <span>✓ OFFICIAL ANSWER KEY: OPTION (${ansLetter}) — ${escapeHtml(
              q.options?.[ansIndex] || ''
            )}</span>
            ${
              attItem
                ? `<span>Candidate OMR: ${escapeHtml(attItem.selected_answer)} (${
                    attItem.isCorrect
                      ? `+${posMarks.toFixed(2)}m`
                      : attItem.selected_answer === 'Skipped'
                      ? '0.00m'
                      : `-${negMarks}m`
                  })</span>`
                : ''
            }
          </div>
          <div style="color:#1e293b; line-height:1.48;"><strong>Faculty Explanation:</strong> ${escapeHtml(
            q.explanation || ''
          )}</div>
          ${
            q.explanationHi
              ? `<div style="margin-top:4px; font-family:'Noto Serif Devanagari', serif; color:#334155; line-height:1.58;"><strong>व्याख्या (हिन्दी):</strong> ${escapeHtml(
                  q.explanationHi
                )}</div>`
              : ''
          }
        </div>
      `
        : '';

      return `
        <div style="border-bottom: 1px dashed #cbd5e1; padding: 12px 0; page-break-inside: avoid; position: relative; z-index: 2;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:10.5px; font-weight:800; color:#475569; text-transform:uppercase;">
            <span>Q.${idx + 1} · ${escapeHtml(q.topic || safeQuiz.category || 'UPSC GS')} ${
        q.pyqRef ? `· [${escapeHtml(q.pyqRef)}]` : ''
      }</span>
            <span>+${posMarks.toFixed(2)} / -${negMarks} Marks</span>
          </div>
          <div style="display:grid; grid-template-columns: ${
            q.textHi ? '1fr 1fr' : '1fr'
          }; gap: 12px;">
            <div style="font-size: 12px; line-height: 1.52; white-space: pre-line; color: #0f172a; font-weight: 500; font-family: 'DM Sans', 'Noto Serif Devanagari', sans-serif;">${escapeHtml(
              q.text
            )}</div>
            ${
              q.textHi
                ? `<div style="font-family:'Noto Serif Devanagari', serif; font-size: 12px; line-height: 1.62; white-space: pre-line; color: #1e293b; border-left: 1px solid #e2e8f0; padding-left: 10px;">${escapeHtml(
                    q.textHi
                  )}</div>`
                : ''
            }
          </div>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 8px;">
            ${optionsGrid}
          </div>
          ${solutionBox}
        </div>
      `;
    })
    .join('');

  const omrSheetFooter = !isSolution
    ? `
      <div style="margin-top: 16px; border: 2px solid #0f172a; border-radius: 10px; padding: 12px; background: #f8fafc; page-break-inside: avoid; position: relative; z-index: 2;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1; padding-bottom:6px; margin-bottom:8px; font-size:11px; font-weight:800; color:#0f172a;">
          <span>DETACHABLE OMR RESPONSE SHEET — ${escapeHtml(cfg.instituteName)}</span>
          <span>CANDIDATE: ${escapeHtml(cfg.studentName)} (${escapeHtml(
        cfg.rollNumber
      )}) · SERIES ${escapeHtml(cfg.bookletSeries)}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 7px;">
          ${questions
            .map(
              (_: any, idx: number) => `
            <div style="display:flex; align-items:center; justify-content:space-between; border:1px solid #cbd5e1; border-radius:6px; padding:4px 7px; background:#fff; font-size:10.5px;">
              <strong>Q.${idx + 1}</strong>
              <span style="display:inline-flex; gap:3px;">
                ${['A', 'B', 'C', 'D']
                  .map(
                    (b) =>
                      `<span style="display:inline-grid; place-items:center; width:15px; height:15px; border-radius:999px; border:1px solid #475569; font-size:8.5px; font-weight:700;">${b}</span>`
                  )
                  .join('')}
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
    : '';

  const sheetBody = `
    <div style="position: relative; background: #ffffff; color: #0f172a; font-family: 'DM Sans', 'Noto Serif Devanagari', sans-serif; padding: 6px;">
      <!-- Repeating Anti-Piracy Diagonal Watermark Layer -->
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; display: grid; grid-template-columns: repeat(2, 1fr); align-content: space-around;">
        ${diagonalWatermarkGrid}
      </div>

      <!-- Top Security Trace Banner -->
      <div style="position: relative; z-index: 2; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:6px; background:#0f172a; color:#f8fafc; padding:6px 12px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.04em; margin-bottom:10px;">
        <span>LICENSED TO: ${escapeHtml(cfg.studentName.toUpperCase())} | ROLL NO: ${escapeHtml(
    cfg.rollNumber
  )} | ${escapeHtml(cfg.emailOrPhone)}</span>
        <span>${escapeHtml(cfg.instituteName.toUpperCase())} · trace #${escapeHtml(
    cfg.rollNumber.slice(-6)
  )}</span>
      </div>

      <!-- Institutional UPSC Booklet Cover Box -->
      <div style="position: relative; z-index: 2; border: 2px solid #0f172a; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; background: rgba(248, 250, 252, 0.93);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; border-bottom:1.5px solid #0f172a; padding-bottom:10px;">
          <div>
            <div style="font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#047857;">${escapeHtml(
              cfg.instituteName
            )} · UPSC CSE PRELIMS EXAMINATION</div>
            <h1 style="font-size:16px; font-weight:900; margin:3px 0 2px; color:#0f172a;">${escapeHtml(
              safeQuiz.title
            )}</h1>
            ${
              safeQuiz.titleHi
                ? `<div style="font-family:'Noto Serif Devanagari', serif; font-size:13px; color:#334155; font-weight:600;">${escapeHtml(
                    safeQuiz.titleHi
                  )}</div>`
                : ''
            }
            <span style="display:inline-block; margin-top:5px; padding:2px 8px; border-radius:4px; background:#0f172a; color:#fff; font-size:10px; font-weight:800; text-transform:uppercase;">
              ${
                isSolution
                  ? 'OFFICIAL BILINGUAL ANSWER KEY & EXPLANATIONS'
                  : 'BILINGUAL QUESTION PAPER BOOKLET (EN + हिन्दी)'
              }
            </span>
          </div>
          <div style="text-align:center; border:2px solid #0f172a; border-radius:8px; padding:6px 12px; min-width:86px; background:#fff;">
            <div style="font-size:8.5px; font-weight:800; text-transform:uppercase; color:#475569;">Booklet Series</div>
            <div style="font-size:26px; font-weight:900; line-height:1.05; color:#0f172a;">${escapeHtml(
              cfg.bookletSeries
            )}</div>
            <div style="font-size:9px; font-weight:700; color:#047857;">${dateStr}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; padding-top:8px; font-size:10.5px;">
          <div><strong style="display:block; font-size:9px; color:#64748b; text-transform:uppercase;">Candidate & Roll No</strong>${escapeHtml(
            cfg.studentName
          )} (${escapeHtml(cfg.rollNumber)})</div>
          <div><strong style="display:block; font-size:9px; color:#64748b; text-transform:uppercase;">Registered Contact</strong>${escapeHtml(
            cfg.emailOrPhone
          )}</div>
          <div><strong style="display:block; font-size:9px; color:#64748b; text-transform:uppercase;">Duration & Questions</strong>${
            safeQuiz.time_limit || 20
          } Mins · ${questions.length} Qs</div>
          <div><strong style="display:block; font-size:9px; color:#64748b; text-transform:uppercase;">Marking Scheme</strong>Max ${maxMarks} Marks (+${posMarks.toFixed(
    1
  )} / -${negMarks})</div>
        </div>
      </div>

      <!-- Questions List -->
      <div>${questionsHtml}</div>

      ${omrSheetFooter}

      <!-- Bottom Security Footer -->
      <div style="position: relative; z-index: 2; margin-top: 14px; padding-top: 8px; border-top: 1.5px solid #0f172a; display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px; font-size:9.5px; font-weight:700; color:#475569;">
        <span>© ${escapeHtml(
          cfg.instituteName
        )} — Unauthorized circulation or reproduction of this watermarked PDF is strictly prohibited.</span>
        <span>Licensed Trace: ${escapeHtml(cfg.rollNumber)} · ${escapeHtml(
    cfg.emailOrPhone
  )}</span>
      </div>
    </div>
  `;

  if (!standaloneDocument) return sheetBody;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(safeQuiz.title)} — ${
    isSolution ? 'Watermarked Solution Key' : 'Watermarked Question Paper'
  }</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Noto+Serif+Devanagari:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { margin: 0; padding: 14px; background: #e2e8f0; font-family: 'DM Sans', 'Noto Serif Devanagari', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .a4-sheet { max-width: 210mm; margin: 0 auto; background: #fff; padding: 12mm; border-radius: 10px; box-shadow: 0 20px 50px rgba(0,0,0,0.18); }
    .top-bar { max-width: 210mm; margin: 0 auto 14px; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; font-size: 12px; }
    .print-btn { background: #10b981; color: #052e16; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 12px; }
    @media print {
      body { background: #fff; padding: 0; }
      .top-bar { display: none !important; }
      .a4-sheet { box-shadow: none; max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <span><strong>${escapeHtml(cfg.instituteName)}</strong> · Watermarked ${
    isSolution ? 'Bilingual Solution Key' : 'Question Paper'
  } (${escapeHtml(cfg.rollNumber)})</span>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>
  <div class="a4-sheet">
    ${sheetBody}
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  </script>
</body>
</html>`;
}

/**
 * Ensures an in-page @media print mount exists so mobile & desktop browsers
 * can trigger native Save-as-PDF via window.print() without popup blockers.
 */
function mountInPagePrintSheet(sheetHtml: string) {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById('gyankunj-inpage-print-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'gyankunj-inpage-print-style';
    styleEl.textContent = `
      #gyankunj-print-mount { display: none; }
      @media print {
        body > *:not(#gyankunj-print-mount) {
          display: none !important;
        }
        #gyankunj-print-mount {
          display: block !important;
          position: static !important;
          width: 100% !important;
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  let printMount = document.getElementById('gyankunj-print-mount');
  if (!printMount) {
    printMount = document.createElement('div');
    printMount.id = 'gyankunj-print-mount';
    document.body.appendChild(printMount);
  }
  printMount.innerHTML = sheetHtml;
}

/**
 * Opens the print/Save-as-PDF dialog (works reliably on Android Chrome, iOS Safari, and Desktop).
 */
export async function exportWatermarkedPdf(
  quiz: any,
  config: Partial<WatermarkPdfConfig> = {},
  attemptDetails?: any[]
): Promise<void> {
  if (typeof window === 'undefined') return;
  const resolvedQuiz = await resolveFullQuizData(quiz);
  const inlineSheetHtml = buildWatermarkedBookletHtml(resolvedQuiz, config, attemptDetails, false);
  mountInPagePrintSheet(inlineSheetHtml);

  // Trigger native in-page print (mobile & desktop safe, never blocked by popup blockers)
  setTimeout(() => {
    window.print();
  }, 120);
}

/**
 * Downloads the standalone print-ready watermarked HTML booklet directly to the user's device.
 */
export async function downloadWatermarkedBookletHtml(
  quiz: any,
  config: Partial<WatermarkPdfConfig> = {},
  attemptDetails?: any[]
): Promise<void> {
  if (typeof window === 'undefined') return;
  const cfg: WatermarkPdfConfig = { ...DEFAULT_WATERMARK_CONFIG, ...config };
  const resolvedQuiz = await resolveFullQuizData(quiz);
  const html = buildWatermarkedBookletHtml(resolvedQuiz, cfg, attemptDetails, true);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = String(resolvedQuiz?.id || 'upsc_paper').replace(/[^a-z0-9_-]/gi, '_');
  a.href = url;
  a.download = `${cfg.instituteName.replace(/\s+/g, '_')}_${slug}_${
    cfg.mode === 'solution' ? 'Answer_Key' : 'Question_Paper'
  }_${cfg.rollNumber}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Self-contained fallback modal mounted directly into document.body if <WatermarkPdfModal />
 * was not mounted in app/layout.tsx.
 */
function renderSelfContainedWatermarkModal(
  resolvedQuiz: any,
  initialMode: 'paper' | 'solution',
  attemptDetails?: any[]
) {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('gyankunj-self-contained-pdf-modal');
  if (existing) existing.remove();

  const state: WatermarkPdfConfig = {
    ...DEFAULT_WATERMARK_CONFIG,
    mode: initialMode,
  };

  const overlay = document.createElement('div');
  overlay.id = 'gyankunj-self-contained-pdf-modal';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:rgba(2,6,23,0.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto;font-family:DM Sans,sans-serif;';

  const renderModalContent = () => {
    const previewHtml = buildWatermarkedBookletHtml(resolvedQuiz, state, attemptDetails, false);
    overlay.innerHTML = `
      <div style="background:#ffffff;color:#0f172a;width:100%;max-width:1080px;border-radius:20px;border:1px solid #cbd5e1;box-shadow:0 25px 60px rgba(0,0,0,0.45);overflow:hidden;margin:auto;">
        <!-- Header -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;background:#0f172a;color:#f8fafc;">
          <div>
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:rgba(16,185,129,0.2);color:#34d399;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
              Anti-Piracy Watermarked PDF Exporter
            </span>
            <h3 style="margin:4px 0 0;font-size:16px;font-weight:800;color:#ffffff;">${escapeHtml(
              resolvedQuiz.title
            )} (${resolvedQuiz.questions.length} Qs)</h3>
          </div>
          <button id="gk-pdf-close-btn" type="button" style="background:rgba(255,255,255,0.1);color:#ffffff;border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">
            ✕ Close
          </button>
        </div>

        <!-- Body Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;padding:16px;max-height:82vh;overflow-y:auto;">
          <!-- Left Controls -->
          <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;">
            <div>
              <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:4px;">Export Mode</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <button id="gk-mode-paper" type="button" style="padding:9px 10px;border-radius:10px;border:2px solid ${
                  state.mode === 'paper' ? '#059669' : '#cbd5e1'
                };background:${
      state.mode === 'paper' ? '#ecfdf5' : '#f8fafc'
    };color:#0f172a;font-weight:800;font-size:12px;cursor:pointer;text-align:left;">
                  📄 Question Paper
                  <span style="display:block;font-size:10px;font-weight:500;color:#475569;">Questions + OMR</span>
                </button>
                <button id="gk-mode-solution" type="button" style="padding:9px 10px;border-radius:10px;border:2px solid ${
                  state.mode === 'solution' ? '#0284c7' : '#cbd5e1'
                };background:${
      state.mode === 'solution' ? '#f0f9ff' : '#f8fafc'
    };color:#0f172a;font-weight:800;font-size:12px;cursor:pointer;text-align:left;">
                  🔑 Answer Key PDF
                  <span style="display:block;font-size:10px;font-weight:500;color:#475569;">Answers + Explanations</span>
                </button>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
              <div>
                <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:3px;">Coaching Institute</label>
                <input id="gk-inp-inst" type="text" value="${escapeHtml(
                  state.instituteName
                )}" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;font-weight:700;" />
              </div>
              <div>
                <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:3px;">Series</label>
                <select id="gk-inp-series" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;font-weight:700;">
                  ${['A', 'B', 'C', 'D']
                    .map(
                      (s) =>
                        `<option value="${s}" ${
                          state.bookletSeries === s ? 'selected' : ''
                        }>Series ${s}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:3px;">Student Name</label>
                <input id="gk-inp-student" type="text" value="${escapeHtml(
                  state.studentName
                )}" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;font-weight:600;" />
              </div>
              <div>
                <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:3px;">Roll Number</label>
                <input id="gk-inp-roll" type="text" value="${escapeHtml(
                  state.rollNumber
                )}" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;font-weight:700;" />
              </div>
            </div>

            <div>
              <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:3px;">Email / Phone Watermark</label>
              <input id="gk-inp-email" type="text" value="${escapeHtml(
                state.emailOrPhone
              )}" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;" />
            </div>

            <div style="padding-top:6px;display:flex;flex-direction:column;gap:8px;">
              <button id="gk-btn-print" type="button" style="width:100%;padding:12px 14px;border-radius:12px;border:none;background:#059669;color:#ffffff;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 16px rgba(5,150,105,0.28);">
                🖨 1-Click Print / Save as Watermarked PDF
              </button>
              <button id="gk-btn-download" type="button" style="width:100%;padding:10px 14px;border-radius:12px;border:1.5px solid #0284c7;background:#f0f9ff;color:#0369a1;font-size:12px;font-weight:800;cursor:pointer;">
                ⬇ Download Offline Watermarked Booklet (.HTML)
              </button>
            </div>
          </div>

          <!-- Right Preview -->
          <div style="border:1px solid #cbd5e1;border-radius:14px;background:#f1f5f9;padding:10px;max-height:480px;overflow-y:auto;">
            <div style="font-size:11px;font-weight:800;color:#334155;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>LIVE WATERMARKED A4 PREVIEW</span>
              <span>${resolvedQuiz.questions.length} Questions</span>
            </div>
            <div id="gk-preview-box" style="background:#ffffff;border-radius:8px;padding:10px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.08);">
              ${previewHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    const syncInputs = () => {
      state.instituteName =
        (document.getElementById('gk-inp-inst') as HTMLInputElement)?.value || state.instituteName;
      state.bookletSeries = ((document.getElementById('gk-inp-series') as HTMLSelectElement)
        ?.value || 'A') as 'A' | 'B' | 'C' | 'D';
      state.studentName =
        (document.getElementById('gk-inp-student') as HTMLInputElement)?.value || state.studentName;
      state.rollNumber =
        (document.getElementById('gk-inp-roll') as HTMLInputElement)?.value || state.rollNumber;
      state.emailOrPhone =
        (document.getElementById('gk-inp-email') as HTMLInputElement)?.value || state.emailOrPhone;
      const box = document.getElementById('gk-preview-box');
      if (box) {
        box.innerHTML = buildWatermarkedBookletHtml(resolvedQuiz, state, attemptDetails, false);
      }
    };

    document.getElementById('gk-pdf-close-btn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('gk-mode-paper')?.addEventListener('click', () => {
      state.mode = 'paper';
      renderModalContent();
    });
    document.getElementById('gk-mode-solution')?.addEventListener('click', () => {
      state.mode = 'solution';
      renderModalContent();
    });

    ['gk-inp-inst', 'gk-inp-series', 'gk-inp-student', 'gk-inp-roll', 'gk-inp-email'].forEach(
      (id) => {
        document.getElementById(id)?.addEventListener('input', syncInputs);
        document.getElementById(id)?.addEventListener('change', syncInputs);
      }
    );

    document.getElementById('gk-btn-print')?.addEventListener('click', () => {
      syncInputs();
      exportWatermarkedPdf(resolvedQuiz, state, attemptDetails);
    });

    document.getElementById('gk-btn-download')?.addEventListener('click', () => {
      syncInputs();
      downloadWatermarkedBookletHtml(resolvedQuiz, state, attemptDetails);
    });
  };

  document.body.appendChild(overlay);
  renderModalContent();
}

/**
 * Triggers the interactive Watermarked PDF Studio Modal from anywhere in the app.
 * Automatically resolves full quiz questions from Supabase if needed, and falls back
 * to a self-contained DOM modal if <WatermarkPdfModal /> is not mounted in layout.tsx.
 */
export async function openWatermarkStudio(
  quiz?: any,
  mode: 'paper' | 'solution' = 'paper',
  attemptDetails?: any[]
): Promise<void> {
  if (typeof window === 'undefined') return;
  const resolvedQuiz = await resolveFullQuizData(quiz);

  const hasMountedModal = Boolean(document.getElementById('gyankunj-watermark-modal-mounted'));
  if (hasMountedModal) {
    window.dispatchEvent(
      new CustomEvent('open-watermark-pdf-studio', {
        detail: { quiz: resolvedQuiz, mode, attemptDetails },
      })
    );
  } else {
    renderSelfContainedWatermarkModal(resolvedQuiz, mode, attemptDetails);
  }
}
