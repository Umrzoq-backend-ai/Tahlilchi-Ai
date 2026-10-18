'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Clock,
  Sparkles,
  Users,
  Calendar,
  Award,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  videoUrl?: string | null;
  onSeek?: (timeStr: string) => void;
}

export default function AnalysisResult({
  result,
  loading,
  error,
  onSeek,
}: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-slate-800 animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
          <Sparkles className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Multimodal Sun'iy Intellekt videoni o'rganmoqda...
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Kadrlar ketma-ketligi, nutq intonatsiyasi va matn tahlil qilinmoqda. Bir necha soniya kuting.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-red-950/40 border border-red-800/80 text-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-100 mb-1">Tahlilda xatolik yuz berdi</h4>
            <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const handleCopy = () => {
    const text = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahlil_${result.mode || 'video'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let md = `# Tahlilchi AI Hisoboti (${result.mode})\n\n`;
    md += `## Umumiy Xulosa\n${result.summary}\n\n`;
    if (result.agenda) md += `## Kun Tartibi\n${result.agenda}\n\n`;
    if (result.key_decisions?.length) {
      md += `## Qabul Qilingan Qarorlar\n`;
      result.key_decisions.forEach((d) => {
        md += `- [${d.timestamp || ''}] ${d.decision}\n`;
      });
      md += `\n`;
    }
    if (result.action_items?.length) {
      md += `## Harakatlar Rejasi\n`;
      result.action_items.forEach((a) => {
        md += `- [${a.timestamp || ''}] ${a.task} (Mas'ul: ${a.assignee || 'Belgilanmagan'}, Muddat: ${a.deadline || '-'})\n`;
      });
      md += `\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisobot_${result.mode || 'video'}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuizSelect = (qId: number, optIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const calculateQuizScore = () => {
    if (!result.quiz) return { correct: 0, total: 0 };
    let correct = 0;
    result.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_index) correct++;
    });
    return { correct, total: result.quiz.length };
  };

  const quizScore = calculateQuizScore();

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {result.mode?.toUpperCase()} TAHLILI
            </span>
            {result.tokens && result.tokens.total_tokens > 0 && (
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {result.tokens.total_tokens.toLocaleString()} token sarflandi
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100">
            {result.metadata?.title || result.headline || 'Tahlil Natijalari'}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Asosiy Umumiy Xulosa (Summary) */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
          <span>📝</span> Umumiy Xulosa
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{result.summary}</p>

        {result.agenda && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <h5 className="text-xs font-semibold text-slate-300 mb-1.5">Kun tartibi:</h5>
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{result.agenda}</p>
          </div>
        )}
      </div>

      {/* 3. Rejimga mos maxsus seksiyalar */}

      {/* A. MEETING REJIMI */}
      {result.mode === 'meeting' && (
        <div className="space-y-4">
          {result.key_decisions && result.key_decisions.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Qabul Qilingan Qarorlar</span>
              </h4>
              <div className="space-y-2">
                {result.key_decisions.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-start justify-between gap-3"
                  >
                    <span className="text-xs text-slate-200 leading-snug">{d.decision}</span>
                    {d.timestamp && (
                      <button
                        onClick={() => onSeek && onSeek(d.timestamp!)}
                        className="timestamp-chip shrink-0 text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/40"
                      >
                        {d.timestamp}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.action_items && result.action_items.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Harakatlar Rejasi (Action Items)</span>
              </h4>
              <div className="divide-y divide-slate-800/80">
                {result.action_items.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{item.task}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        {item.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>{item.assignee}</span>
                          </span>
                        )}
                        {item.deadline && (
                          <span className="text-amber-400/90 font-medium">Muddat: {item.deadline}</span>
                        )}
                      </div>
                    </div>
                    {item.timestamp && (
                      <button
                        onClick={() => onSeek && onSeek(item.timestamp!)}
                        className="timestamp-chip shrink-0 text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 hover:bg-blue-500/40"
                      >
                        {item.timestamp}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.open_questions && result.open_questions.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Ochiq Qolgan Savollar</span>
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                {result.open_questions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* B. TA'LIM VA INTERAKTIV QUIZ REJIMI */}
      {result.mode === 'education' && (
        <div className="space-y-4">
          {result.prerequisites && result.prerequisites.length > 0 && (
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-2">
                Dastlabki Kerakli Bilimlar:
              </span>
              <div className="flex flex-wrap gap-2">
                {result.prerequisites.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.core_concepts && result.core_concepts.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">
                Asosiy Tushunchalar va Qoidalar
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.core_concepts.map((c, idx) => (
                  <div key={idx} className="p-3 bg-dark-bg/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-xs font-bold text-slate-200">{c.concept}</h5>
                      {c.timestamp && (
                        <button
                          onClick={() => onSeek && onSeek(c.timestamp!)}
                          className="timestamp-chip text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20"
                        >
                          {c.timestamp}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{c.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interaktiv Quiz */}
          {result.quiz && result.quiz.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-100">Bilimni Sinash Testi</h4>
                </div>
                {quizSubmitted && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Natija: {quizScore.correct} / {quizScore.total} (
                    {Math.round((quizScore.correct / quizScore.total) * 100)}%)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {result.quiz.map((q) => {
                  const selectedOpt = quizAnswers[q.id];
                  return (
                    <div key={q.id} className="p-4 bg-dark-bg/70 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-200">
                          {q.id}. {q.question}
                        </p>
                        {q.timestamp_hint && (
                          <button
                            onClick={() => onSeek && onSeek(q.timestamp_hint!)}
                            className="timestamp-chip text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0"
                          >
                            💡 {q.timestamp_hint} da javobi bor
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrect = q.correct_index === optIdx;

                          let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800';
                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-blue-600/30 border-blue-500 text-white font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleQuizSelect(q.id, optIdx)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${btnStyle}`}
                            >
                              <span className="font-mono text-[11px] opacity-60 mr-1.5">
                                {String.fromCharCode(65 + optIdx)})
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-slate-800">
                          <strong>Izoh:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/20"
                  >
                    Javoblarni Tekshirish
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Qayta topshirish</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* C. BOLALAR XAVFSIZLIGI REJIMI */}
      {result.mode === 'child' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Xavfsizlik Xulosasi</span>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`text-sm font-extrabold px-3 py-1 rounded-xl border ${
                    result.safety_verdict === 'SAFE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : result.safety_verdict === 'CAUTION'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-red-500/20 text-red-400 border-red-500/40'
                  }`}
                >
                  {result.safety_verdict === 'SAFE'
                    ? 'XAVFSIZ (Tavsiya etiladi)'
                    : result.safety_verdict === 'CAUTION'
                    ? 'EHTIYOTKORLIK ZARUR'
                    : 'ZARARLI / TAVSIYA ETILMAYDI'}
                </span>
                {result.safety_score && (
                  <span className="text-xs text-slate-300 font-mono">Baho: {result.safety_score}/100</span>
                )}
              </div>
            </div>
            {result.parental_advice && (
              <div className="max-w-md bg-dark-bg/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-100 block mb-0.5">Ota-onalarga maslahat:</strong>
                {result.parental_advice}
              </div>
            )}
          </div>

          {result.negative_triggers && result.negative_triggers.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase text-red-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Diqqat Qilinishi Kerak Bo'lgan Sahnalar</span>
              </h5>
              <div className="space-y-2">
                {result.negative_triggers.map((trig, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-red-300">{trig.type}</span>
                      <span className="text-slate-400 ml-2">({trig.intensity} daraja)</span>
                      <p className="text-slate-300 mt-1">{trig.description}</p>
                    </div>
                    {trig.timestamp && (
                      <button
                        onClick={() => onSeek && onSeek(trig.timestamp!)}
                        className="timestamp-chip font-mono text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 shrink-0"
                      >
                        {trig.timestamp}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.positive_themes && result.positive_themes.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                <span>Ijobiy va Tarbiyaviy Mavzular</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.positive_themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/30 text-emerald-300 border border-emerald-900/40"
                  >
                    ✨ {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* D. INTERVYU VA HR BAHOSI */}
      {result.mode === 'interview' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Nomzod Moslik Bali</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {result.match_score || 85}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                    result.hiring_verdict === 'STRONG_HIRE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.hiring_verdict === 'HIRE'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {result.hiring_verdict || 'HIRE'}
                </span>
              </div>
            </div>
            {result.interviewer_advice && (
              <div className="max-w-md bg-dark-bg/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-100 block mb-0.5">HR / Texnik intervyuverga tavsiya:</strong>
                {result.interviewer_advice}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Kuchli Tomonlari</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {result.strengths?.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Rivojlanish Sohalari (Kamchiliklari)</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {result.weaknesses?.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* E. PITCH NOTIQLIK (3V TAHLILI) */}
      {result.mode === 'pitch' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Umumiy Notiqlik Bali</span>
              <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                {result.overall_pitch_score || 80}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-dark-bg/60 border border-slate-800 rounded-xl text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Verbal (Nutq & So'zlar)</span>
              <span className="text-xl font-bold text-slate-100 font-mono">{result.verbal_score || 85}</span>
            </div>
            <div className="p-4 bg-dark-bg/60 border border-slate-800 rounded-xl text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Visual (Tana tili & Nigoh)</span>
              <span className="text-xl font-bold text-slate-100 font-mono">{result.visual_score || 75}</span>
            </div>
            <div className="p-4 bg-dark-bg/60 border border-slate-800 rounded-xl text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Vocal (Ovoz & Intonatsiya)</span>
              <span className="text-xl font-bold text-slate-100 font-mono">{result.vocal_score || 80}</span>
            </div>
          </div>

          {result.parasite_words && result.parasite_words.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Parazit So'zlar:</span>
              <div className="flex flex-wrap gap-2">
                {result.parasite_words.map((pw, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-red-950/40 text-red-300 border border-red-900/50"
                  >
                    ❌ "{pw}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.pitch_recommendations && result.pitch_recommendations.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Notiq Uchun Tavsiyalar:</span>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                {result.pitch_recommendations.map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* F. YANGILIKLAR & FACT-CHECK */}
      {result.mode === 'news' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Hissiy Ohang (Sentiment)</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{result.sentiment || 'Neytral'}</p>
            </div>
          </div>

          {result.fact_check && result.fact_check.length > 0 && (
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase text-slate-400">Da'volar Tekshiruvi (Fact-Check)</h5>
              {result.fact_check.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-dark-bg/60 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">"{item.claim}"</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.verdict?.toLowerCase() === 'true'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.verdict?.toLowerCase() === 'false'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.verdict}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* G. AUDIO TIMELINE DIARIZATION */}
      {result.mode === 'audio' && result.audio_timeline && result.audio_timeline.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Spikerlar Bo'yicha Audio Xronologiya
          </h4>
          <div className="space-y-2.5">
            {result.audio_timeline.map((item, idx) => (
              <div key={idx} className="p-3 bg-dark-bg/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <button
                  onClick={() => onSeek && onSeek(item.start)}
                  className="timestamp-chip font-mono text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 shrink-0"
                >
                  {item.start} - {item.end}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-300">{item.speaker}</span>
                    {item.emotion && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Videodagi barcha vaqt belgilari */}
      {result.timestamps && result.timestamps.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Videodagi Vaqt Belgilari (Bir bosishda o'ting)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.timestamps.map((t, idx) => (
              <button
                key={idx}
                onClick={() => onSeek && onSeek(t.time)}
                className="timestamp-chip flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-bg/80 border border-slate-700/80 hover:border-blue-500/80 text-xs text-slate-300 hover:text-white transition-all"
              >
                <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">
                  {t.time}
                </span>
                <span className="truncate max-w-[180px]">{t.text || 'Ushbu daqiqa'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Huquqiy Ogohlantirish (Disclaimer) */}
      {result.disclaimer && (
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-tight">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
