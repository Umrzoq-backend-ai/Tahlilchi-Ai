'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Music,
  Users,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Mic,
  Newspaper,
  Languages,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisMode, OutputLanguage } from '@/types';

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export interface AnalyzeParams {
  videoSource: 'youtube' | 'local' | 'audio';
  videoUrl?: string;
  videoFile?: File | null;
  mode: AnalysisMode;
  targetLanguage: OutputLanguage;
  prompt?: string;
  enableTranscript?: boolean;
  childAge?: number;
  targetRole?: string;
  seniorityLevel?: string;
  techStack?: string;
}

interface VideoInputProps {
  onAnalyze: (params: AnalyzeParams) => void;
  loading: boolean;
}

const MODES: {
  id: AnalysisMode;
  name: string;
  badge: string;
  icon: any;
  desc: string;
}[] = [
  {
    id: 'meeting',
    name: 'Uchrashuv',
    badge: 'Biznes',
    icon: Users,
    desc: 'Qarorlar, vazifalar va spikerlar',
  },
  {
    id: 'education',
    name: "Ta'lim & Test",
    badge: 'Interaktiv Quiz',
    icon: GraduationCap,
    desc: 'Dars konspekti va bilimni sinash',
  },
  {
    id: 'interview',
    name: 'HR & Intervyu',
    badge: 'Scorecard',
    icon: Briefcase,
    desc: 'Nomzod bilimi va moslik bali',
  },
  {
    id: 'child',
    name: 'Bolalar Xavfsizligi',
    badge: '1-16 yosh',
    icon: ShieldCheck,
    desc: 'Zararli sahnalar va ota-onaga maslahat',
  },
  {
    id: 'pitch',
    name: 'Notiqlik (3V)',
    badge: 'Verbal / Visual / Vocal',
    icon: Mic,
    desc: 'Parazit so\'zlar va tana tili',
  },
  {
    id: 'news',
    name: 'Yangiliklar & Fakt',
    badge: 'Fact-Check',
    icon: Newspaper,
    desc: 'Faktlar tekshiruvi va manipulyatsiya',
  },
  {
    id: 'audio',
    name: 'Audio Diarizatsiya',
    badge: 'Hissiyotlar',
    icon: Music,
    desc: 'Spikerlar va kayfiyat tahlili',
  },
  {
    id: 'multi',
    name: "Ko'p Tillilik",
    badge: '13 ta til',
    icon: Languages,
    desc: 'Boshqa tildan to\'g\'ridan-to\'g\'ri tarjima',
  },
];

const LANGUAGES: { code: OutputLanguage; name: string }[] = [
  { code: 'uz', name: "O'zbek tili (Lotin)" },
  { code: 'ru', name: 'Русский язык' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'auto', name: 'Asl tilida (Auto)' },
];

export default function VideoInput({ onAnalyze, loading }: VideoInputProps) {
  const [sourceTab, setSourceTab] = useState<'youtube' | 'local' | 'audio'>('youtube');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('meeting');
  const [targetLanguage, setTargetLanguage] = useState<OutputLanguage>('uz');
  const [prompt, setPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Maxsus parametrlar
  const [enableTranscript, setEnableTranscript] = useState(false);
  const [childAge, setChildAge] = useState(6);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [seniorityLevel, setSeniorityLevel] = useState('Middle');
  const [techStack, setTechStack] = useState('React, Node.js, PostgreSQL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({
      videoSource: sourceTab,
      videoUrl: sourceTab === 'youtube' ? url : undefined,
      videoFile: sourceTab !== 'youtube' ? selectedFile : undefined,
      mode,
      targetLanguage,
      prompt: prompt.trim() || undefined,
      enableTranscript,
      childAge,
      targetRole,
      seniorityLevel,
      techStack,
    });
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-800">
      {/* 1. Manba tanlash tablari */}
      <div className="flex items-center gap-2 p-1 bg-dark-bg/80 border border-slate-800 rounded-xl mb-6 max-w-md">
        <button
          type="button"
          onClick={() => setSourceTab('youtube')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            sourceTab === 'youtube'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <YouTubeIcon className="w-4 h-4 text-red-500" />
          <span>YouTube URL</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceTab('local')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            sourceTab === 'local'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Video Fayl</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSourceTab('audio');
            if (mode !== 'audio') setMode('audio');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            sourceTab === 'audio'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-4 h-4 text-emerald-400" />
          <span>Audio Fayl</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manba kiritish maydoni */}
        {sourceTab === 'youtube' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              YouTube Video Havolasi
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... yoki https://youtu.be/..."
                required
                className="w-full bg-dark-bg/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {url && (
                <div className="absolute right-3 top-3 text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              YouTube videosining transkripti yoki media oqimi avtomatik olinadi.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {sourceTab === 'local' ? 'Lokal Video Yuklash' : 'Audio Fayl Yuklash'}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 bg-dark-bg/50 hover:bg-dark-bg rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={sourceTab === 'local' ? 'video/mp4,video/webm,video/quicktime' : 'audio/*'}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-500/10 border border-slate-700 group-hover:border-blue-500/30 flex items-center justify-center text-slate-400 group-hover:text-blue-400 mx-auto mb-3 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Faylni tanlash uchun bosing yoki shu yerga tashlang'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {sourceTab === 'local'
                  ? 'MP4, WEBM, MOV (maksimal 1GB)'
                  : 'MP3, WAV, M4A, OGG, FLAC (maksimal 200MB)'}
              </p>
            </div>
          </div>
        )}

        {/* 2. Rejim tanlash */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tahlil Rejimini Tanlang
            </label>
            <span className="text-[11px] text-blue-400 font-medium">8 xil ixtisoslashgan rejim</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-dark-card/50 hover:bg-dark-card border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        {m.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{m.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Rejimga mos maxsus sozlamalar */}
        {mode === 'meeting' && (
          <div className="bg-dark-bg/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200">Muhim transkript iqtiboslari</span>
              <p className="text-[11px] text-slate-500">Videodagi 15 tagacha eng muhim gaplarni ajratib ko'rsatish</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableTranscript}
                onChange={(e) => setEnableTranscript(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}

        {mode === 'child' && (
          <div className="bg-dark-bg/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Farzandingiz Yoshi:</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {childAge} yosh
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={16}
              value={childAge}
              onChange={(e) => setChildAge(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 yosh</span>
              <span>8 yosh</span>
              <span>16 yosh</span>
            </div>
          </div>
        )}

        {mode === 'interview' && (
          <div className="bg-dark-bg/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Lavozim</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Backend Developer"
                className="w-full bg-dark-card border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Daraja</label>
              <select
                value={seniorityLevel}
                onChange={(e) => setSeniorityLevel(e.target.value)}
                className="w-full bg-dark-card border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead / Architect</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Texnologiyalar</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Python, Django, PostgreSQL"
                className="w-full bg-dark-card border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        )}

        {/* 4. Til va Qo'shimcha parametrlar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Natija tili:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as OutputLanguage)}
              className="bg-dark-bg border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Qo'shimcha so'rov</span>
          </button>
        </div>

        {showAdvanced && (
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="AI uchun qo'shimcha ko'rsatmalar kiriting..."
              className="w-full bg-dark-bg/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={loading || (sourceTab === 'youtube' && !url) || (sourceTab !== 'youtube' && !selectedFile)}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
            loading || (sourceTab === 'youtube' && !url) || (sourceTab !== 'youtube' && !selectedFile)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 cursor-pointer hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI videoni tahlil qilmoqda...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Tahlilni Boshlash</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
