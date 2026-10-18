'use client';

import React, { useState, useRef } from 'react';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import VideoInput, { AnalyzeParams } from '@/components/VideoInput';
import AnalysisResult from '@/components/AnalysisResult';
import Chat from '@/components/Chat';
import SettingsModal from '@/components/SettingsModal';
import HistoryModal, { saveToHistory } from '@/components/HistoryModal';
import AboutModal from '@/components/AboutModal';
import { AnalysisResponse, HistoryItem } from '@/types';
import {
  Sparkles,
  History,
  Info,
  Key,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentLocalFile, setCurrentLocalFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  const handleSeek = (timeStr: string) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timeStr);
    }
  };

  const handleAnalyze = async (params: AnalyzeParams) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const apiKey = localStorage.getItem('tahlilchi_api_key');
    if (!apiKey) {
      setError("Iltimos, avval chap paneldagi 'Sozlamalar' bo'limida Gemini API kalitini saqlang.");
      setLoading(false);
      return;
    }

    const model = localStorage.getItem('tahlilchi_model') || 'gemini-2.0-flash';

    if (params.videoSource === 'youtube') {
      setCurrentVideoUrl(params.videoUrl || null);
      setCurrentLocalFile(null);
      setMediaType('video');
    } else {
      setCurrentVideoUrl(null);
      setCurrentLocalFile(params.videoFile || null);
      setMediaType(params.videoSource === 'audio' ? 'audio' : 'video');
    }

    try {
      if (params.videoSource !== 'youtube' && params.videoFile) {
        const formData = new FormData();
        formData.append('api_key', apiKey);
        formData.append('mode', params.mode);
        formData.append('target_language', params.targetLanguage);
        formData.append('model_name', model);
        if (params.prompt) formData.append('prompt', params.prompt);
        formData.append('enable_transcript', String(params.enableTranscript || false));
        formData.append('child_age', String(params.childAge || 5));
        formData.append('target_role', params.targetRole || 'Full Stack Developer');
        formData.append('seniority_level', params.seniorityLevel || 'Middle');
        formData.append('tech_stack', params.techStack || 'General');
        formData.append('video', params.videoFile);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server xatosi: ${res.status}`);
        }

        const data: AnalysisResponse = await res.json();
        setResult(data);
        saveToHistory(data, undefined);
      } else {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            video_url: params.videoUrl,
            video_source: 'youtube',
            mode: params.mode,
            target_language: params.targetLanguage,
            prompt: params.prompt || '',
            model_name: model,
            enable_transcript: params.enableTranscript || false,
            child_age: params.childAge || 5,
            target_role: params.targetRole || 'Full Stack Developer',
            seniority_level: params.seniorityLevel || 'Middle',
            tech_stack: params.techStack || 'General',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server xatosi: ${res.status}`);
        }

        const data: AnalysisResponse = await res.json();
        setResult(data);
        saveToHistory(data, params.videoUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Tahlil vaqtida kutilmagan xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.result);
    if (item.videoUrl) {
      setCurrentVideoUrl(item.videoUrl);
      setCurrentLocalFile(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/25">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  Tahlilchi <span className="text-blue-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                  v2.0 Master
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Har bir kadrdagi aql • Multimodal Video Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-card hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Tarix</span>
            </button>

            <button
              onClick={() => setAboutOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-card hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Haqida</span>
            </button>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              <span>API Kalit olish</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player & Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <VideoPlayer
              ref={videoPlayerRef}
              videoUrl={currentVideoUrl}
              localFile={currentLocalFile}
              mediaType={mediaType}
            />

            <VideoInput onAnalyze={handleAnalyze} loading={loading} />

            <SettingsModal />
          </div>

          {/* Right Column: Results & Interactive Chat */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <>
                <AnalysisResult
                  result={result}
                  loading={loading}
                  error={error}
                  videoUrl={currentVideoUrl}
                  onSeek={handleSeek}
                />

                <Chat
                  transcript={result.transcript || result.summary}
                  mode={result.mode || 'meeting'}
                  videoUrl={currentVideoUrl}
                  onSeek={handleSeek}
                />
              </>
            ) : (
              <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Multimodal Sun'iy Intellekt Platformasi</span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Xom videoni bir necha soniyada{' '}
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                      amaliy bilimga
                    </span>{' '}
                    aylantiring.
                  </h2>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed max-w-xl">
                    Uzoq davom etadigan yig'ilishlar, darslar, intervyular va nutqlarni ko'rishga soatlab vaqt
                    sarflamang. Tahlilchi AI kadrlar va audio-trekni birgalikda o'rganib, eng muhim ma'lumotlarni
                    chiqarib beradi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-4 bg-dark-bg/60 border border-slate-800/80 rounded-2xl hover:border-blue-500/40 transition-colors">
                    <div className="text-xl mb-1.5">🤝</div>
                    <h4 className="text-xs font-bold text-slate-100">Uchrashuv Yozuvlari</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kimga qanday vazifa topshirilgani va qabul qilingan qarorlar ro'yxati.
                    </p>
                  </div>

                  <div className="p-4 bg-dark-bg/60 border border-slate-800/80 rounded-2xl hover:border-emerald-500/40 transition-colors">
                    <div className="text-xl mb-1.5">🎓</div>
                    <h4 className="text-xs font-bold text-slate-100">Ta'lim & Interaktiv Test</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tizimli dars konspekti va bilmni tekshirish uchun avtomatik testlar (Quiz).
                    </p>
                  </div>

                  <div className="p-4 bg-dark-bg/60 border border-slate-800/80 rounded-2xl hover:border-purple-500/40 transition-colors">
                    <div className="text-xl mb-1.5">🎤</div>
                    <h4 className="text-xs font-bold text-slate-100">3V Notiqlik Tahlili</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Verbal (so'zlar), Visual (tana tili) va Vocal (ovoz) bo'yicha mahorat bahosi.
                    </p>
                  </div>

                  <div className="p-4 bg-dark-bg/60 border border-slate-800/80 rounded-2xl hover:border-amber-500/40 transition-colors">
                    <div className="text-xl mb-1.5">🧒</div>
                    <h4 className="text-xs font-bold text-slate-100">Bolalar Xavfsizligi</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      1-16 yosh toifasi, qo'rqinchli sahnalar va ota-onalar uchun tavsiyalar.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Stateless & Xavfsiz BYOK Arxitekturasi</span>
                  </span>
                  <span>13 ta xalqaro til qo'llab-quvvatlanadi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-bg/90 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">🧠 Tahlilchi AI</span>
            <span>•</span>
            <span>Multimodal Video & Audio Intelligence Platformasi</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setAboutOpen(true)} className="hover:text-slate-200 cursor-pointer">
              Loyiha Haqida
            </button>
            <button onClick={() => setHistoryOpen(true)} className="hover:text-slate-200 cursor-pointer">
              Tarix
            </button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 flex items-center gap-1"
            >
              <span>Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modallar */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
