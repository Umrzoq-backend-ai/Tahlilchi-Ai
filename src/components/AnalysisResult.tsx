'use client';

import React, { useState, useEffect } from 'react';
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
  Pause,
  Headphones,
  Flame,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import ContentRepurposer from './ContentRepurposer';
import VisualTimelineChart from './VisualTimelineChart';
import SynchronizedTranscript from './SynchronizedTranscript';
import ShareExportModal from './ShareExportModal';
import ViralClipsExtractor from './ViralClipsExtractor';
import VoiceReader from './VoiceReader';
import AudioPodcastOverview from './AudioPodcastOverview';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  videoUrl?: string | null;
  onSeek?: (timeStr: string) => void;
}

type MainTab = 'summary' | 'podcast' | 'transcript';
type ExtraTool = 'viral' | 'repurpose' | 'timeline' | 'export' | null;

export default function AnalysisResult({
  result,
  loading,
  error,
  videoUrl,
  onSeek,
}: AnalysisResultProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('summary');
  const [extraTool, setExtraTool] = useState<ExtraTool>(null);
  const [isSummarySpeaking, setIsSummarySpeaking] = useState(false);

  // Stop any active speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeakSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !result?.summary) return;
    if (isSummarySpeaking) {
      window.speechSynthesis.cancel();
      setIsSummarySpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(result.summary);
    u.rate = 1.0;
    u.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR';
    u.onend = () => setIsSummarySpeaking(false);
    u.onerror = () => setIsSummarySpeaking(false);
    setIsSummarySpeaking(true);
    window.speechSynthesis.speak(u);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-slate-800 animate-pulse bg-[#0a101f]/80">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
          <Sparkles className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          {language === 'en' ? 'Multimodal AI is analyzing the material...' : language === 'ru' ? 'Мультимодальный ИИ изучает материалы...' : "Multimodal Sun'iy Intellekt materialni o'rganmoqda..."}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {language === 'en' ? 'Frames, transcript, audio intonations, and document text are being evaluated. Please wait a few seconds.' : language === 'ru' ? 'Кадры, транскрипт, интонации аудио и текст документа анализируются. Пожалуйста, подождите несколько секунд.' : "Kadrlar, transkript, audio intonatsiya va hujjat matni tahlil qilinmoqda. Bir necha soniya kuting."}
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
            <h4 className="text-sm font-bold text-red-100 mb-1">
              {language === 'en' ? 'Analysis Error' : language === 'ru' ? 'Ошибка анализа' : 'Tahlilda xatolik yuz berdi'}
            </h4>
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
                {isDocument
                  ? (language === 'en' ? 'PDF & DOCUMENT' : language === 'ru' ? 'PDF И ДОКУМЕНТ' : 'PDF & HUJJAT')
                  : result.mode?.toUpperCase()}{' '}
                {language === 'en' ? 'ANALYSIS' : language === 'ru' ? 'АНАЛИЗ' : 'TAHLILI'}
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
                  {language === 'en' ? 'Tone: ' : language === 'ru' ? 'Тон: ' : 'Ohang: '}{result.sentiment}
                </span>
              )}
              {result.tokens && result.tokens.total_tokens > 0 && (
                <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                  {result.tokens.total_tokens.toLocaleString()} {language === 'en' ? 'tokens' : language === 'ru' ? 'токенов' : 'token'}
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
              title="JSON Copy"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (language === 'en' ? 'Copied' : language === 'ru' ? 'Скопировано' : 'Nusxalandi') : (language === 'en' ? 'Copy' : language === 'ru' ? 'Копия' : 'Nusxa')}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition-colors"
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* ================= SIMPLIFIED 3-TAB NAVIGATION (NOTEBOOKLM GRADE) ================= */}
        <div className="space-y-3">
          {/* Main 3 Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 bg-[#060b18] rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center gap-1.5 flex-1">
              {/* Tab 1: Asosiy Xulosa */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('summary');
                  setExtraTool(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'summary' && !extraTool
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{language === 'en' ? '📝 Executive Summary' : language === 'ru' ? '📝 Краткое резюме' : '📝 Asosiy Xulosa'}</span>
              </button>

              {/* Tab 2: AI Podkast (NotebookLM) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('podcast');
                  setExtraTool(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'podcast' && !extraTool
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Headphones className="w-4 h-4 text-cyan-300" />
                <span>{language === 'en' ? '🎙️ AI Podcast' : language === 'ru' ? '🎙️ ИИ Подкаст' : '🎙️ AI Podkast'}</span>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  NotebookLM
                </span>
              </button>

              {/* Tab 3: To'liq Transkript */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('transcript');
                  setExtraTool(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'transcript' && !extraTool
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Volume2 className="w-4 h-4 text-cyan-300" />
                <span>{language === 'en' ? '📜 Transcript' : language === 'ru' ? '📜 Транскрипт' : "📜 To'liq Transkript"}</span>
                {result.audio_timeline?.length ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {result.audio_timeline.length} {language === 'en' ? 'lines' : language === 'ru' ? 'строк' : 'gap'}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Secondary Tools Bar: Viral Clips, SMM, Timeline, Export */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#080d1a] border border-slate-800/80 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1.5 pl-1">
              <span>⚡ {language === 'en' ? 'Creator & Growth Tools:' : language === 'ru' ? 'Инструменты для блогеров:' : 'Bloger & Biznes Vositalari:'}</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExtraTool(extraTool === 'viral' ? null : 'viral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  extraTool === 'viral'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Viral Shorts</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraTool(extraTool === 'repurpose' ? null : 'repurpose')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  extraTool === 'repurpose'
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>SMM Post</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraTool(extraTool === 'timeline' ? null : 'timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  extraTool === 'timeline'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraTool(extraTool === 'export' ? null : 'export')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  extraTool === 'export'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{language === 'en' ? 'Share & Export' : language === 'ru' ? 'Экспорт' : 'Eksport'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Extra Tool Panel (renders when an extra tool is clicked) */}
        {extraTool && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#080d1c] border border-cyan-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <span>⚡</span>
                <span>
                  {extraTool === 'viral' && 'Viral Shorts & Reels AI Clips'}
                  {extraTool === 'repurpose' && 'SMM & Content Repurposing'}
                  {extraTool === 'timeline' && 'Visual Timeline & Sentiment Analysis'}
                  {extraTool === 'export' && 'Share & Export Options'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setExtraTool(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ✕ {language === 'en' ? 'Close' : language === 'ru' ? 'Закрыть' : 'Yopish'}
              </button>
            </div>

            {extraTool === 'viral' && (
              <ViralClipsExtractor result={result} videoUrl={videoUrl} onSeek={onSeek} />
            )}
            {extraTool === 'repurpose' && (
              <ContentRepurposer result={result} videoTitle={videoTitle} videoUrl={videoUrl} />
            )}
            {extraTool === 'timeline' && (
              <VisualTimelineChart result={result} onSeek={onSeek} />
            )}
            {extraTool === 'export' && (
              <ShareExportModal result={result} videoUrl={videoUrl} />
            )}
          </div>
        )}

        {/* ================= PRIMARY CONTENT: 3 MAIN TABS ================= */}
        {!extraTool && activeTab === 'podcast' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <AudioPodcastOverview result={result} />
          </div>
        )}

        {!extraTool && activeTab === 'transcript' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <SynchronizedTranscript result={result} onSeek={onSeek} />
          </div>
        )}

        {!extraTool && activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
                {/* Executive Summary Card with 1-Click Direct Audio Playback */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#090e1d] border border-slate-800 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span>📝</span>
                      <span>{t.analyzer.summaryTitle}</span>
                    </h4>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      AI Xulosa
                    </span>
                  </div>

                  <div className="border-l-2 border-blue-500/80 pl-4 py-1">
                    <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line font-medium">
                      {result.summary}
                    </p>
                  </div>

                  {/* PROMINENT DIRECT 1-CLICK VOICE BUTTON UNDER TEXT (USER REQUESTED) */}
                  <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={toggleSpeakSummary}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                        isSummarySpeaking
                          ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 animate-pulse'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
                      }`}
                    >
                      {isSummarySpeaking ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>{language === 'en' ? 'Stop Voice' : language === 'ru' ? 'Остановить озвучку' : "Ovozni To'xtatish"}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>{language === 'en' ? 'Listen Aloud in Uzbek' : language === 'ru' ? 'Слушать резюме голосом' : "Ovozda Tinglash (AI O'zbek tilida gapirib beradi)"}</span>
                        </>
                      )}
                    </button>

                    {isSummarySpeaking && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" />
                        <span className="w-1 bg-blue-500 rounded-full animate-bounce h-5" />
                        <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-2" />
                        <span className="text-xs font-mono text-cyan-300 ml-1">AI gapirmoqda...</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('podcast');
                        setExtraTool(null);
                      }}
                      className="px-4 py-2 rounded-2xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5 text-purple-400" />
                      <span>{language === 'en' ? '2-Host AI Podcast (NotebookLM) →' : language === 'ru' ? '2 Ведущих ИИ Подкаст →' : "2 Boshlovchili AI Podkast →"}</span>
                    </button>
                  </div>

                  {result.agenda && (
                    <div className="mt-2 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                      <strong className="text-slate-300 block mb-1">
                        {language === 'en' ? 'Topics Chronology:' : language === 'ru' ? 'Хронология тем:' : 'Mavzular xronologiyasi:'}
                      </strong>
                      <p className="whitespace-pre-line leading-relaxed">{result.agenda}</p>
                    </div>
                  )}
                </div>

            {/* A. YANGILIKLAR & FACT-CHECK */}
            {result.mode === 'news' && (
              <div className="space-y-5 pt-3 border-t border-slate-800/80">
                {result.bias_indicators && result.bias_indicators.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'en' ? 'Objectivity / Bias:' : language === 'ru' ? 'Объективность:' : 'Obyektivlik:'}</span>
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
                      <span>{language === 'en' ? 'Verified Key Facts' : language === 'ru' ? 'Проверенные ключевые факты' : 'Tekshirilgan Asosiy Faktlar'}</span>
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
                      <span>{language === 'en' ? 'Claims & Fact-Check Verification' : language === 'ru' ? 'Проверка фактов и утверждений' : "Da'volar va Haqiqat Tekshiruvi (Fact-Check)"}</span>
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
                                {isTrue
                                  ? (language === 'en' ? '✓ TRUE' : language === 'ru' ? '✓ ПРАВДА' : '✓ HAQIQAT')
                                  : isFalse
                                  ? (language === 'en' ? '❌ FALSE' : language === 'ru' ? '❌ ЛОЖЬ' : "❌ YOLG'ON")
                                  : item.verdict}
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
                      <span>{language === 'en' ? 'Key Document Theses' : language === 'ru' ? 'Ключевые тезисы документа' : 'Hujjatning Asosiy Tezislari'}</span>
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
                      <span>{language === 'en' ? 'Key Findings & Page Indicators' : language === 'ru' ? 'Важные выводы и страницы' : "Muhim Natijalar va Sahifa Ko'rsatkichlari"}</span>
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
                      <span>{language === 'en' ? 'Key Decisions Taken' : language === 'ru' ? 'Принятые ключевые решения' : 'Qabul Qilingan Muhim Qarorlar'}</span>
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
                      <span>{language === 'en' ? 'Action Items Plan' : language === 'ru' ? 'План действий' : 'Harakatlar Rejasi (Action Items)'}</span>
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
                              {item.deadline && <span>{language === 'en' ? 'Deadline: ' : language === 'ru' ? 'Срок: ' : 'Muddati: '}{item.deadline}</span>}
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
                    <span className="font-bold text-slate-400">{language === 'en' ? 'Prerequisites:' : language === 'ru' ? 'Необходимые знания:' : "Kerakli boshlang'ich bilimlar:"}</span>
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
                      {language === 'en' ? 'Core Concepts & Principles' : language === 'ru' ? 'Ключевые концепции и правила' : 'Asosiy Tushunchalar va Qoidalar'}
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
                    <span className="text-[11px] uppercase font-bold text-slate-400">{language === 'en' ? 'Safety Verdict' : language === 'ru' ? 'Вердикт безопасности' : 'Xavfsizlik Xulosasi'}</span>
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
                          ? (language === 'en' ? '✓ SAFE' : language === 'ru' ? '✓ БЕЗОПАСНО' : '✓ XAVFSIZ')
                          : result.safety_verdict === 'CAUTION'
                          ? (language === 'en' ? '⚠️ CAUTION' : language === 'ru' ? '⚠️ ОСТОРОЖНО' : '⚠️ EHTIYOTKORLIK ZARUR')
                          : (language === 'en' ? '⛔ HARMFUL' : language === 'ru' ? '⛔ ОПАСНО' : '⛔ ZARARLI')}
                      </span>
                      {result.safety_score && (
                        <span className="text-xs text-slate-300 font-mono">{language === 'en' ? 'Score: ' : language === 'ru' ? 'Оценка: ' : 'Baho: '}{result.safety_score}/100</span>
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
                      <span>{language === 'en' ? 'Scenes Requiring Attention' : language === 'ru' ? 'Сцены требующие внимания' : "Diqqat Qilinishi Kerak Bo'lgan Sahnalar"}</span>
                    </h5>
                    <div className="space-y-2">
                      {result.negative_triggers.map((trig, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-red-300">{trig.type}</span>
                            <span className="text-slate-400 ml-2">({trig.intensity})</span>
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
                    <span className="text-[11px] uppercase font-bold text-slate-400">{language === 'en' ? 'Candidate Match Score' : language === 'ru' ? 'Оценка соответствия' : 'Nomzod Moslik Bali'}</span>
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
                      <strong>{language === 'en' ? 'HR Advice: ' : language === 'ru' ? 'Совет HR: ' : 'HR maslahati: '}</strong> {result.interviewer_advice}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {result.strengths && result.strengths.length > 0 && (
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> {language === 'en' ? 'Strengths' : language === 'ru' ? 'Сильные стороны' : 'Kuchli tomonlari'}
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
                        <ThumbsDown className="w-3.5 h-3.5" /> {language === 'en' ? 'Growth Areas' : language === 'ru' ? 'Зоны развития' : 'Rivojlanish sohalari'}
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
                    <span className="text-slate-400 block mb-0.5">{language === 'en' ? 'Overall Score' : language === 'ru' ? 'Общий балл' : 'Umumiy Ball'}</span>
                    <span className="text-xl font-black text-purple-300 font-mono">{result.overall_pitch_score || 80}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">{language === 'en' ? 'Verbal (Speech)' : language === 'ru' ? 'Вербально' : 'Verbal (Nutq)'}</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.verbal_score || 85}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">{language === 'en' ? 'Visual (Body)' : language === 'ru' ? 'Визуально' : 'Visual (Tana tili)'}</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.visual_score || 75}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">{language === 'en' ? 'Vocal (Tone)' : language === 'ru' ? 'Вокально' : 'Vocal (Intonatsiya)'}</span>
                    <span className="text-lg font-bold text-slate-200 font-mono">{result.vocal_score || 80}</span>
                  </div>
                </div>

                {result.parasite_words && result.parasite_words.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400">{language === 'en' ? 'Filler words:' : language === 'ru' ? 'Слова-паразиты:' : "Parazit so'zlar:"}</span>
                    {result.parasite_words.map((pw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-900/50">
                        ❌ "{pw}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* H. AUDIO & MUSIC SPECIFIC CARD */}
            {(result.mode === 'audio' || result.genre) && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">
                      {language === 'en' ? 'Music / Audio Analysis' : language === 'ru' ? 'Анализ музыки и аудио' : 'Musiqa va Audio Tahlili'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {result.genre && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                          🎵 {result.genre}
                        </span>
                      )}
                      {result.sentiment && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 font-medium">
                          ✨ {result.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('transcript');
                      setExtraTool(null);
                    }}
                    className="px-3 py-1.5 rounded-xl font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'View Full Lyrics / Transcript →' : language === 'ru' ? 'Смотреть текст / транскрипт →' : "To'liq Qo'shiq Matnini Ko'rish →"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. VIDEODAGI VAQT BELGILARI (Foydalanuvchi iltimosiga ko'ra pasda bir bosishda o'tish uchun) */}
      {result.timestamps && result.timestamps.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border border-slate-800 bg-[#0a101f]/90 space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{t.analyzer.timestampsTitle}</span>
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
              <h4 className="text-sm font-bold text-slate-100">
                {language === 'en' ? 'Interactive Knowledge Quiz' : language === 'ru' ? 'Интерактивный тест на знания' : 'Bilimni Sinash Testi (Interactive Quiz)'}
              </h4>
            </div>
            {quizSubmitted && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {language === 'en' ? 'Result: ' : language === 'ru' ? 'Результат: ' : 'Natija: '}
                {quizScore.correct} / {quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
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
                        💡 {q.timestamp_hint} {language === 'en' ? 'has answer' : language === 'ru' ? 'содержит ответ' : 'da javobi bor'}
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
                      <strong>{language === 'en' ? 'Explanation: ' : language === 'ru' ? 'Пояснение: ' : 'Izoh: '}</strong>
                      {q.explanation}
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
                {language === 'en' ? 'Check Answers' : language === 'ru' ? 'Проверить ответы' : 'Javoblarni Tekshirish'}
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
                <span>{language === 'en' ? 'Retake Quiz' : language === 'ru' ? 'Пройти снова' : 'Qayta topshirish'}</span>
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
