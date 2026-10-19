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
  RotateCcw,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
  FileText,
  Bookmark,
  Scale,
  Send,
  Activity,
  Share2,
  Printer,
  Volume2,
  Play,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';
import ContentRepurposer from './ContentRepurposer';
import VisualTimelineChart from './VisualTimelineChart';
import SynchronizedTranscript from './SynchronizedTranscript';
import ShareExportModal from './ShareExportModal';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  videoUrl?: string | null;
  onSeek?: (timeStr: string) => void;
}

type WorkspaceView = 'dossier' | 'repurpose' | 'transcript' | 'timeline' | 'export';

export default function AnalysisResult({
  result,
  loading,
  error,
  videoUrl,
  onSeek,
}: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceView>('dossier');

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-slate-800 animate-pulse bg-[#0a101f]/80">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
          <Sparkles className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Multimodal Sun'iy Intellekt materialni o'rganmoqda...
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Kadrlar, transkript, audio intonatsiya va hujjat matni tahlil qilinmoqda. Bir necha soniya kuting.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl p-6 bg-red-950/40 border border-red-800/80 text-red-200">
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
    a.download = `tahlil_${result.mode || 'kontent'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let md = `# Tahlilchi AI Hisoboti (${result.mode})\n\n`;
    md += `## Sarlavha: ${result.metadata?.title || result.headline || 'Tahlil'}\n\n`;
    md += `## Asosiy Xulosa\n${result.summary}\n\n`;
    if (result.key_facts?.length) {
      md += `## Asosiy Faktlar\n`;
      result.key_facts.forEach((f) => {
        md += `- ${f}\n`;
      });
      md += `\n`;
    }
    if (result.fact_check?.length) {
      md += `## Fakt-Tekshiruv (Fact-Check)\n`;
      result.fact_check.forEach((fc) => {
        md += `- [${fc.verdict}] "${fc.claim}" (${fc.timestamp || ''}): ${fc.explanation}\n`;
      });
      md += `\n`;
    }
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
    a.download = `hisobot_${result.mode || 'kontent'}_${Date.now()}.md`;
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
  const isDocument = result.mode === 'document';
  const videoTitle = result.metadata?.title || result.headline || result.document_title || 'Tahlil Natijalari';

  return (
    <div className="space-y-6">
      {/* 1. YAGONA ASOSIY TAHLILIY DOSYE (Single Unified Intelligence Dossier) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/70 shadow-2xl space-y-6 bg-[#0a101f]/95">
        
        {/* Header Strip: Meta Badges + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {isDocument ? 'PDF & HUJJAT' : result.mode?.toUpperCase()} TAHLILI
              </span>
              {result.metadata?.author && (
                <span className="text-xs text-slate-300 font-semibold px-2 py-0.5 rounded-lg bg-slate-800/70 border border-slate-700">
                  {result.metadata.author}
                </span>
              )}
              {result.metadata?.duration && (
                <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded-lg bg-slate-800/70 border border-slate-700">
                  ⏱️ {result.metadata.duration}
                </span>
              )}
              {result.sentiment && (
                <span className="text-xs font-medium text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  Ohang: {result.sentiment}
                </span>
              )}
              {result.tokens && result.tokens.total_tokens > 0 && (
                <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                  {result.tokens.total_tokens.toLocaleString()} token
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
              {videoTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="JSON nusxalash"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Markdown formatda yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition-colors"
              title="JSON formatda yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* ================= WORKSPACE TOOLBAR (SaaS STARTUP ENGINE) ================= */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#070b16] rounded-2xl border border-slate-800/90">
          <button
            type="button"
            onClick={() => setActiveWorkspaceView('dossier')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkspaceView === 'dossier'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tahliliy Dosye</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceView('repurpose')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkspaceView === 'repurpose'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>SMM & Biznes Repurposing</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-400/20 text-sky-300 font-mono">
              Yangi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceView('transcript')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkspaceView === 'transcript'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sinxron Transkript</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 font-mono border border-cyan-400/30">
              Nutq & Tarjima
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceView('timeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkspaceView === 'timeline'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vizual Xronologiya</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceView('export')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkspaceView === 'export'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Ulashish & Chop Etish</span>
          </button>
        </div>

        {/* ================= VIEW 1: MASTER DOSSIER (DEFAULT) ================= */}
        {activeWorkspaceView === 'dossier' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Executive Summary */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>📝</span>
                <span>Umumiy Xulosa va Asosiy Mazmun</span>
              </h4>
              <div className="border-l-2 border-blue-500/80 pl-4 py-1">
                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line font-medium">
                  {result.summary}
                </p>
              </div>
              {result.agenda && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <strong className="text-slate-300 block mb-1">Mavzular xronologiyasi:</strong>
                  <p className="whitespace-pre-line leading-relaxed">{result.agenda}</p>
                </div>
              )}
            </div>

            {/* B. TO'LIQ NUTQ TRANSKRIPTI VA O'ZBEKCHA TARJIMASI (FULL SPEECH-TO-TEXT HIGHLIGHT) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-cyan-950/40 border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Videodagi To&apos;liq Nutq va O&apos;zbekcha Tarjima</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                        {result.audio_timeline?.length || (result.transcript ? 'Mavjud' : 'Transkript')}
                      </span>
                    </h5>
                    <p className="text-xs text-slate-400">
                      Videoda gapirilgan barcha gaplar, vaqt belgilari va o&apos;zbek tilidagi to&apos;liq matni
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView('transcript')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sinxron Transkriptga O&apos;tish &rarr;</span>
                </button>
              </div>

              {/* Dialogue Preview Snippets */}
              {result.audio_timeline && result.audio_timeline.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {result.audio_timeline.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-start gap-3 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onSeek && onSeek(item.start)}
                        className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950/70 hover:bg-cyan-900 px-2.5 py-1 rounded-lg border border-cyan-800/60 shrink-0 transition-colors flex items-center gap-1"
                        title="Videoni shu vaqtdan ko'rish"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{item.start}</span>
                      </button>
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {item.speaker || 'Spiker'}:
                        </span>
                        <p className="text-slate-100 font-medium leading-relaxed">
                          {item.translation || item.text}
                        </p>
                        {item.translation && item.text !== item.translation && (
                          <p className="text-[11px] text-slate-400 italic">
                            Asl tilda: &ldquo;{item.text}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Jami {result.audio_timeline.length} ta gap transkript qilindi.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceView('transcript')}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <span>Barcha gaplarni vaqt bo&apos;yicha ko&apos;rish va .SRT yuklab olish &rarr;</span>
                    </button>
                  </div>
                </div>
              ) : result.transcript ? (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line font-sans">
                  {result.transcript.slice(0, 450)}...
                </div>
              ) : null}
            </div>

            {/* A. YANGILIKLAR & FACT-CHECK */}
            {result.mode === 'news' && (
              <div className="space-y-5 pt-3 border-t border-slate-800/80">
                {result.bias_indicators && result.bias_indicators.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Obyektivlik:
                    </span>
                    {result.bias_indicators.map((b, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium"
                      >
                        ⚖️ {b}
                      </span>
                    ))}
                  </div>
                )}

                {result.key_facts && result.key_facts.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tekshirilgan Asosiy Faktlar</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.key_facts.map((fact, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-start gap-2.5 text-xs text-slate-200"
                        >
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{fact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.fact_check && result.fact_check.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span>🔍</span>
                      <span>Da'volar va Haqiqat Tekshiruvi (Fact-Check)</span>
                    </h5>
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-2xl bg-[#080d1a]/80 overflow-hidden">
                      {result.fact_check.map((item, idx) => {
                        const isTrue = item.verdict?.toLowerCase() === 'true';
                        const isFalse = item.verdict?.toLowerCase() === 'false';
                        return (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.timestamp && (
                                  <button
                                    onClick={() => onSeek && onSeek(item.timestamp!)}
                                    className="timestamp-chip font-mono text-[11px] font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 shrink-0 transition-colors"
                                    title="Videoning ushbu daqiqasiga o'tish"
                                  >
                                    ⏱️ {item.timestamp}
                                  </button>
                                )}
                                <span className="text-xs font-bold text-slate-100">
                                  "{item.claim}"
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>

                            <div className="shrink-0 self-start sm:self-center">
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                                  isTrue
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : isFalse
                                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {isTrue ? '✓ HAQIQAT' : isFalse ? '❌ YOLG\'ON' : item.verdict}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. PDF & HUJJAT REJIMI */}
            {(result.mode === 'document' || result.key_theses?.length || result.findings?.length) && (
              <div className="space-y-5 pt-3 border-t border-slate-800/80">
                {result.key_theses && result.key_theses.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" />
                      <span>Hujjatning Asosiy Tezislari</span>
                    </h5>
                    <div className="space-y-2">
                      {result.key_theses.map((thesis, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-start gap-2.5 text-xs text-slate-200"
                        >
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className="leading-relaxed">{thesis}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.findings && result.findings.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Muhim Natijalar va Sahifa Ko'rsatkichlari</span>
                    </h5>
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-2xl bg-[#080d1a]/80 overflow-hidden">
                      {result.findings.map((f, idx) => (
                        <div key={idx} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <strong className="text-slate-200 block mb-1">{f.title}</strong>
                            <p className="text-slate-400 leading-relaxed">{f.detail}</p>
                          </div>
                          {f.page && (
                            <span className="shrink-0 font-mono text-[11px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                              📄 {f.page}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. MEETING REJIMI */}
            {result.mode === 'meeting' && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                {result.key_decisions && result.key_decisions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Qabul Qilingan Muhim Qarorlar</span>
                    </h5>
                    <div className="space-y-2">
                      {result.key_decisions.map((d, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-200 leading-snug">{d.decision}</span>
                          {d.timestamp && (
                            <button
                              onClick={() => onSeek && onSeek(d.timestamp!)}
                              className="timestamp-chip shrink-0 text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/40"
                            >
                              ⏱️ {d.timestamp}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.action_items && result.action_items.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Harakatlar Rejasi (Action Items)</span>
                    </h5>
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-2xl bg-[#080d1a]/80 overflow-hidden">
                      {result.action_items.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-slate-200">{item.task}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                              {item.assignee && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-500" />
                                  <span>{item.assignee}</span>
                                </span>
                              )}
                              {item.deadline && <span>Muddati: {item.deadline}</span>}
                            </div>
                          </div>
                          {item.timestamp && (
                            <button
                              onClick={() => onSeek && onSeek(item.timestamp!)}
                              className="timestamp-chip font-mono text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"
                            >
                              ⏱️ {item.timestamp}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* D. EDUCATION REJIMI */}
            {result.mode === 'education' && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                {result.prerequisites && result.prerequisites.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400">Kerakli boshlang'ich bilimlar:</span>
                    {result.prerequisites.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {result.core_concepts && result.core_concepts.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      Asosiy Tushunchalar va Qoidalar
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {result.core_concepts.map((c, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-slate-200">{c.concept}</h6>
                            {c.timestamp && (
                              <button
                                onClick={() => onSeek && onSeek(c.timestamp!)}
                                className="timestamp-chip text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20"
                              >
                                ⏱️ {c.timestamp}
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* E. BOLALAR XAVFSIZLIGI REJIMI */}
            {result.mode === 'child' && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400">Xavfsizlik Xulosasi</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-xl border ${
                          result.safety_verdict === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : result.safety_verdict === 'CAUTION'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {result.safety_verdict === 'SAFE'
                          ? '✓ XAVFSIZ'
                          : result.safety_verdict === 'CAUTION'
                          ? '⚠️ EHTIYOTKORLIK ZARUR'
                          : '⛔ ZARARLI'}
                      </span>
                      {result.safety_score && (
                        <span className="text-xs text-slate-300 font-mono">Baho: {result.safety_score}/100</span>
                      )}
                    </div>
                  </div>
                  {result.parental_advice && (
                    <p className="text-xs text-slate-300 max-w-md italic">
                      "{result.parental_advice}"
                    </p>
                  )}
                </div>

                {result.negative_triggers && result.negative_triggers.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase text-red-400 flex items-center gap-1.5">
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
                              ⏱️ {trig.timestamp}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* F. INTERVIEW REJIMI */}
            {result.mode === 'interview' && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400">Nomzod Moslik Bali</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-black text-blue-400 font-mono">
                        {result.match_score || 85}/100
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {result.hiring_verdict || 'HIRE'}
                      </span>
                    </div>
                  </div>
                  {result.interviewer_advice && (
                    <p className="text-xs text-slate-300 max-w-md">
                      <strong>HR maslahati:</strong> {result.interviewer_advice}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {result.strengths && result.strengths.length > 0 && (
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Kuchli tomonlari
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-slate-300">
                        {result.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.weaknesses && result.weaknesses.length > 0 && (
                    <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1.5">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> Rivojlanish sohalari
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-slate-300">
                        {result.weaknesses.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* G. PITCH (3V) REJIMI */}
            {result.mode === 'pitch' && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Umumiy Ball</span>
                    <span className="text-xl font-black text-purple-300 font-mono">{result.overall_pitch_score || 80}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Verbal (Nutq)</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.verbal_score || 85}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Visual (Tana tili)</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.visual_score || 75}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Vocal (Intonatsiya)</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.vocal_score || 80}</span>
                  </div>
                </div>

                {result.parasite_words && result.parasite_words.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400">Parazit so'zlar:</span>
                    {result.parasite_words.map((pw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-900/50">
                        ❌ "{pw}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: SMM & BUSINESS REPURPOSING ================= */}
        {activeWorkspaceView === 'repurpose' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <ContentRepurposer
              result={result}
              videoTitle={videoTitle}
              videoUrl={videoUrl}
            />
          </div>
        )}

        {/* ================= VIEW 3: SYNCHRONIZED TRANSCRIPT ================= */}
        {activeWorkspaceView === 'transcript' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <SynchronizedTranscript
              result={result}
              onSeek={onSeek}
            />
          </div>
        )}

        {/* ================= VIEW 4: VISUAL TIMELINE & SENTIMENT ================= */}
        {activeWorkspaceView === 'timeline' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <VisualTimelineChart
              result={result}
              onSeek={onSeek}
            />
          </div>
        )}

        {/* ================= VIEW 5: SHARE & EXPORT ================= */}
        {activeWorkspaceView === 'export' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <ShareExportModal
              result={result}
              videoUrl={videoUrl}
            />
          </div>
        )}

      </div>

      {/* 2. VIDEODAGI VAQT BELGILARI (Foydalanuvchi iltimosiga ko'ra pasda bir bosishda o'tish uchun) */}
      {result.timestamps && result.timestamps.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border border-slate-800 bg-[#0a101f]/90 space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Videodagi Vaqt Belgilari (Bir bosishda o'ting)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.timestamps.map((t, idx) => (
              <button
                key={idx}
                onClick={() => onSeek && onSeek(t.time)}
                className="timestamp-chip flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-blue-500/80 text-xs text-slate-300 hover:text-white transition-all group"
              >
                <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px] group-hover:bg-blue-500/20">
                  ⏱️ {t.time}
                </span>
                <span className="truncate max-w-[200px]">{t.text || "Ushbu daqiqa"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. INTERAKTIV QUIZ (Agar Education rejimi bo'lsa) */}
      {result.mode === 'education' && result.quiz && result.quiz.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 bg-[#0a101f]/90">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-100">Bilimni Sinash Testi (Interactive Quiz)</h4>
            </div>
            {quizSubmitted && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Natija: {quizScore.correct} / {quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {result.quiz.map((q) => {
              const selectedOpt = quizAnswers[q.id];
              return (
                <div key={q.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
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

          <div className="pt-2 flex items-center justify-between">
            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/20"
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

      {/* 4. Huquqiy Ogohlantirish (Disclaimer) */}
      {result.disclaimer && (
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-tight">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
