'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  Film,
  Music,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Newspaper,
  GraduationCap,
  Smile,
  Users,
  Mic,
  MessageSquare,
  Key,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { AnalysisMode, OutputLanguage, AnalysisResponse } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import AnalysisResult from '@/components/AnalysisResult';
import Chat from '@/components/Chat';

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SAMPLE_VIDEOS = [
  {
    title: 'Stanford CS229: ML Keynote',
    url: 'https://www.youtube.com/watch?v=jGwO_UgTS7I',
    mode: 'education' as AnalysisMode,
  },
  {
    title: 'Google I/O: Gemini Multimodal',
    url: 'https://www.youtube.com/watch?v=XEzRZ35urlk',
    mode: 'meeting' as AnalysisMode,
  },
  {
    title: 'BBC News: Global Tech Report',
    url: 'https://www.youtube.com/watch?v=2ePf9rue1Ao',
    mode: 'news' as AnalysisMode,
  },
];

export default function AnalyzerPage() {
  const { t, language } = useLanguage();
  const playerRef = useRef<VideoPlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Media state
  const [sourceTab, setSourceTab] = useState<'video' | 'youtube' | 'audio'>('video');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');

  // Mode and params
  const [mode, setMode] = useState<AnalysisMode>('meeting');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('uz');
  const [enableTranscript, setEnableTranscript] = useState(true);
  const [batchMode, setBatchMode] = useState(false);

  // Domain specific options
  const [childAge, setChildAge] = useState(6);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [seniorityLevel, setSeniorityLevel] = useState('Middle');

  // Execution state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [hasApiKey, setHasApiKey] = useState(true);

  // Mode definitions with distinctive colors and badges
  const modes = [
    {
      id: 'meeting' as AnalysisMode,
      name: t.analyzer.modes.meeting.name,
      desc: t.analyzer.modes.meeting.desc,
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
      activeBorder: 'border-blue-500 shadow-blue-500/20',
      activeBg: 'bg-blue-600/15',
      badge: 'Biznes',
    },
    {
      id: 'news' as AnalysisMode,
      name: t.analyzer.modes.news.name,
      desc: t.analyzer.modes.news.desc,
      icon: Newspaper,
      color: 'from-rose-500 to-amber-500',
      activeBorder: 'border-rose-500 shadow-rose-500/20',
      activeBg: 'bg-rose-600/15',
      badge: 'Faktlar',
    },
    {
      id: 'education' as AnalysisMode,
      name: t.analyzer.modes.education.name,
      desc: t.analyzer.modes.education.desc,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-400',
      activeBorder: 'border-emerald-500 shadow-emerald-500/20',
      activeBg: 'bg-emerald-600/15',
      badge: 'Test & Quiz',
    },
    {
      id: 'child' as AnalysisMode,
      name: t.analyzer.modes.child.name,
      desc: t.analyzer.modes.child.desc,
      icon: Smile,
      color: 'from-amber-500 to-orange-400',
      activeBorder: 'border-amber-500 shadow-amber-500/20',
      activeBg: 'bg-amber-600/15',
      badge: '1-16 Yosh',
    },
    {
      id: 'interview' as AnalysisMode,
      name: t.analyzer.modes.interview.name,
      desc: t.analyzer.modes.interview.desc,
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      activeBorder: 'border-indigo-500 shadow-indigo-500/20',
      activeBg: 'bg-indigo-600/15',
      badge: 'HR Baho',
    },
    {
      id: 'pitch' as AnalysisMode,
      name: t.analyzer.modes.pitch.name,
      desc: t.analyzer.modes.pitch.desc,
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
      activeBorder: 'border-purple-500 shadow-purple-500/20',
      activeBg: 'bg-purple-600/15',
      badge: '3V Nutq',
    },
    {
      id: 'chat' as AnalysisMode,
      name: t.analyzer.modes.chat.name,
      desc: t.analyzer.modes.chat.desc,
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
      activeBorder: 'border-cyan-500 shadow-cyan-500/20',
      activeBg: 'bg-cyan-600/15',
      badge: 'Video Chat',
    },
  ];

  // Check API Key and active stored analysis on mount
  useEffect(() => {
    const key =
      localStorage.getItem('quanta_api_key') ||
      localStorage.getItem('tahlilchi_api_key');
    setHasApiKey(!!key);

    // Check if navigated from history
    try {
      const stored = localStorage.getItem('quanta_active_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        setResult(parsed);
        if (parsed.mode) setMode(parsed.mode);
        const storedUrl = localStorage.getItem('quanta_active_video_url');
        if (storedUrl) {
          setActiveVideoUrl(storedUrl);
          setYoutubeUrl(storedUrl);
          setSourceTab('youtube');
        }
        localStorage.removeItem('quanta_active_analysis');
        localStorage.removeItem('quanta_active_video_url');
      }
    } catch (e) {
      // ignore
    }

    // Check URL query parameters (e.g. /analyzer?mode=education)
    try {
      const params = new URLSearchParams(window.location.search);
      const queryMode = params.get('mode') as AnalysisMode;
      if (
        queryMode &&
        ['meeting', 'news', 'education', 'child', 'interview', 'pitch', 'chat'].includes(queryMode)
      ) {
        setMode(queryMode);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSeek = (timeStr: string) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timeStr);
    }
  };

  const handleFileSelect = (file: File, type: 'video' | 'audio') => {
    setSelectedFile(file);
    setMediaType(type);
    setActiveVideoUrl(null);
  };

  const handleLoadYoutube = () => {
    if (!youtubeUrl.trim()) return;
    setActiveVideoUrl(youtubeUrl.trim());
    setSelectedFile(null);
    setMediaType('video');
  };

  const handleSelectSample = (sample: typeof SAMPLE_VIDEOS[0]) => {
    setYoutubeUrl(sample.url);
    setActiveVideoUrl(sample.url);
    setSelectedFile(null);
    setMediaType('video');
    setSourceTab('youtube');
    setMode(sample.mode);
  };

  const handleResetMedia = () => {
    setSelectedFile(null);
    setActiveVideoUrl(null);
    setResult(null);
    setError(null);
  };

  const handleRunAnalysis = async () => {
    const apiKey =
      localStorage.getItem('quanta_api_key') ||
      localStorage.getItem('tahlilchi_api_key');

    if (!apiKey) {
      setHasApiKey(false);
      setError('Gemini API key is required. Please add your key in Settings.');
      return;
    }

    if (!activeVideoUrl && !selectedFile) {
      setError('Please upload a video/audio file or enter a YouTube URL.');
      return;
    }

    setLoading(true);
    setError(null);
    const modelName =
      localStorage.getItem('quanta_model') ||
      localStorage.getItem('tahlilchi_model') ||
      'gemini-2.5-flash';

    try {
      let res: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('api_key', apiKey);
        formData.append('model_name', modelName);
        formData.append('mode', mode);
        formData.append('target_language', outputLanguage);
        formData.append('enable_transcript', String(enableTranscript));
        formData.append('child_age', String(childAge));
        formData.append('target_role', targetRole);
        formData.append('seniority_level', seniorityLevel);

        res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            model_name: modelName,
            video_url: activeVideoUrl,
            mode,
            target_language: outputLanguage,
            enable_transcript: enableTranscript,
            child_age: childAge,
            target_role: targetRole,
            seniority_level: seniorityLevel,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${res.status})`);
      }

      const data: AnalysisResponse = await res.json();
      setResult(data);

      // Save to history
      const historyItem = {
        id: String(Date.now()),
        title: data.headline || selectedFile?.name || activeVideoUrl || 'Video Analysis',
        mode: data.mode || mode,
        createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokens: data.tokens?.total_tokens || 0,
        result: data,
        videoUrl: activeVideoUrl || undefined,
      };

      const existingHistoryStr =
        localStorage.getItem('quanta_analysis_history') ||
        localStorage.getItem('tahlilchi_analysis_history') ||
        '[]';
      try {
        const historyArr = JSON.parse(existingHistoryStr);
        const updated = [historyItem, ...historyArr.filter((h: any) => h.id !== historyItem.id)].slice(0, 100);
        localStorage.setItem('quanta_analysis_history', JSON.stringify(updated));
        localStorage.setItem('tahlilchi_analysis_history', JSON.stringify(updated));
      } catch (err) {
        console.error('History save error:', err);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during multimodal analysis.');
    } finally {
      setLoading(false);
    }
  };

  const isMediaReady = !!activeVideoUrl || !!selectedFile;

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Missing API Key Warning */}
      {!hasApiKey && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs">
              Gemini API key is required for video analysis. Add your free key in Settings to begin.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Main Studio Container Card with Rich Gradient & Backdrop Blur */}
      <div className="bg-gradient-to-b from-[#0e172a]/95 via-[#0b1222]/95 to-[#080d1a]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ================= LEFT COLUMN: MEDIA INPUT & PLAYER ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Media Tabs Header (Screenshot 3) */}
              <div className="flex items-center gap-2 mb-4 bg-[#0a0f1d] p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSourceTab('video')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    sourceTab === 'video'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.analyzer.tabVideo}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceTab('youtube')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    sourceTab === 'youtube'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <YouTubeIcon className="w-4 h-4 text-red-500" />
                  <span>{t.analyzer.tabYoutube}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceTab('audio')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    sourceTab === 'audio'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{t.analyzer.tabAudio}</span>
                </button>
              </div>

              {/* Player or Input Dropzone */}
              {isMediaReady ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black">
                    <VideoPlayer
                      ref={playerRef}
                      videoUrl={activeVideoUrl}
                      localFile={selectedFile}
                      mediaType={mediaType}
                    />
                  </div>

                  {/* Media Info Strip */}
                  <div className="p-3 bg-[#0a0f1d] rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Film className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-slate-300 truncate font-medium">
                        {selectedFile?.name || activeVideoUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetMedia}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] shrink-0 transition-colors"
                    >
                      Change Media
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* TAB 1: VIDEO UPLOAD (Screenshot 3 dashed dropzone) */}
                  {sourceTab === 'video' && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-3xl p-8 sm:p-12 text-center bg-[#0a0f1d]/60 hover:bg-[#0a0f1d] cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[300px]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'video');
                        }}
                      />
                      <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">
                        {t.analyzer.dropVideo}
                      </h4>
                      <p className="text-xs text-slate-400 mb-5">{t.analyzer.dropSubVideo}</p>
                      <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
                      >
                        Select Video
                      </button>
                    </div>
                  )}

                  {/* TAB 2: YOUTUBE URL */}
                  {sourceTab === 'youtube' && (
                    <div className="border border-slate-800 rounded-3xl p-6 sm:p-8 bg-[#0a0f1d]/60 min-h-[300px] flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <YouTubeIcon className="w-5 h-5 text-red-500" />
                          <h4 className="text-sm font-bold text-white">YouTube Stream Streamer</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {t.analyzer.youtubeHelper}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <input
                            type="text"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder={t.analyzer.youtubePlaceholder}
                            className="flex-1 bg-[#090e1a] border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleLoadYoutube}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 shrink-0 transition-all"
                          >
                            Load Video
                          </button>
                        </div>
                      </div>

                      {/* Quick Sample Videos */}
                      <div className="pt-6 border-t border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Try Sample Video:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {SAMPLE_VIDEOS.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSample(s)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AUDIO UPLOAD */}
                  {sourceTab === 'audio' && (
                    <div
                      onClick={() => audioInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-3xl p-8 sm:p-12 text-center bg-[#0a0f1d]/60 hover:bg-[#0a0f1d] cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[300px]"
                    >
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'audio');
                        }}
                      />
                      <div className="w-16 h-16 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                        <Music className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">
                        {t.analyzer.dropAudio}
                      </h4>
                      <p className="text-xs text-slate-400 mb-5">{t.analyzer.dropSubAudio}</p>
                      <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        Select Audio
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: ANALYSIS MODES & SETTINGS ================= */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {t.analyzer.modeTitle}
                </span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  7 Modes Available
                </span>
              </div>

              {/* 7 Vertical Mode Cards with Distinctive Personalities */}
              <div className="space-y-2 mb-5">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                        isSelected
                          ? `${m.activeBg} ${m.activeBorder} text-white shadow-lg`
                          : 'bg-[#0a0f1d] border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-[#0c1428]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? `bg-gradient-to-tr ${m.color} text-white shadow-md`
                              : 'bg-slate-800/80 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold tracking-tight truncate">{m.name}</h5>
                          <p className="text-[11px] text-slate-400 truncate">{m.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/15 text-white border border-white/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.badge}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mode-Specific Custom Inputs */}
              {mode === 'child' && (
                <div className="mb-4 p-4 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Target Child Age</span>
                    <span className="text-xs font-bold text-amber-400">{childAge} years old</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={childAge}
                    onChange={(e) => setChildAge(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Toddler (1-3)</span>
                    <span>Child (4-8)</span>
                    <span>Teen (9-16)</span>
                  </div>
                </div>
              )}

              {mode === 'interview' && (
                <div className="mb-4 p-4 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Target Role</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Seniority Level</label>
                    <select
                      value={seniorityLevel}
                      onChange={(e) => setSeniorityLevel(e.target.value)}
                      className="w-full bg-[#090e1a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Middle">Middle</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead / Principal">Lead / Principal</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Output Language & Switches (Screenshot 3) */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80 mb-5">
                {/* Language Select */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {t.analyzer.outputLang}
                  </span>
                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
                    className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="uz">O'zbek tili (Lotin)</option>
                    <option value="ru">Русский язык</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="tr">Türkçe</option>
                    <option value="auto">Auto (Match video language)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0a0f1d] border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">
                    {t.analyzer.enableTranscript}
                  </span>
                  <input
                    type="checkbox"
                    checked={enableTranscript}
                    onChange={(e) => setEnableTranscript(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0a0f1d] border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">
                    {t.analyzer.batchMode}
                  </span>
                  <input
                    type="checkbox"
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Primary Analyze Button (Screenshot 3) */}
            <button
              type="button"
              disabled={loading || !isMediaReady}
              onClick={handleRunAnalysis}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>{t.analyzer.analyzing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>{t.analyzer.analyzeBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= RESULTS SECTION (Screenshot 4) ================= */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub Navigation Bar for Result view: Analysis vs Interactive Chat */}
          <div className="flex items-center justify-between bg-[#0f172a] border border-slate-800 rounded-3xl p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'analysis'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Analysis Report</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interactive Video Chat</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{(result.tokens?.total_tokens || 0).toLocaleString()} tokens used</span>
            </div>
          </div>

          {/* Render Active View */}
          {activeTab === 'analysis' ? (
            <AnalysisResult
              result={result}
              loading={loading}
              error={error}
              videoUrl={activeVideoUrl}
              onSeek={handleSeek}
            />
          ) : (
            <Chat
              transcript={result.summary || ''}
              mode={result.mode || mode}
              videoUrl={activeVideoUrl}
              onSeek={handleSeek}
            />
          )}
        </div>
      )}
    </div>
  );
}
