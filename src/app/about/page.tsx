'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Code2,
  CheckCircle2,
  Film,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  const techFeatures = [
    {
      title: 'Native Video Multimodality',
      desc: 'Processes native MP4/WebM video frames and audio tracks at 1 FPS simultaneously without lossy audio-only transcription pipelines.',
      icon: Film,
    },
    {
      title: '2,000,000+ Token Context',
      desc: 'Can ingest and analyze 1+ hour continuous full-HD video lectures, townhalls, or documentary streams in a single inference call.',
      icon: Cpu,
    },
    {
      title: 'Strict JSON Schemas',
      desc: 'Guarantees structured schemas across 7 domain modes: Meeting decisions, Fact-checks, Quizzes, 3V Scorecards, and Child ratings.',
      icon: Code2,
    },
    {
      title: 'Zero-Storage Privacy (BYOK)',
      desc: 'Stateless architecture. Your API key and analysis records stay strictly inside your browser localStorage.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex-1 py-12 px-4 sm:px-8 max-w-5xl mx-auto w-full">
      {/* Hero Header (Screenshot 6) */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Video Intelligence</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          {t.about.title}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            {t.about.highlight}
          </span>
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">{t.about.subtitle}</p>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Mission Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.about.missionTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.about.missionDesc}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-blue-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Eliminating information latency in video</span>
          </div>
        </div>

        {/* Technology Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.about.techTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.about.techDesc}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Google Gemini 2.5 & 3 Native Multimodality</span>
          </div>
        </div>
      </div>

      {/* Tech Specifications */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-xl mb-12">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>Core Architectural Advantages</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {techFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creator Info & CTA */}
      <div className="bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30 border border-blue-500/30 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-400 mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t.about.creatorTitle}</h3>
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-3">
          {t.about.creatorRole}
        </p>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
          {t.about.creatorDesc}
        </p>
        <Link
          href="/analyzer"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all"
        >
          <span>Launch Analyzer Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
