'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Newspaper,
  GraduationCap,
  Smile,
  Users,
  Mic,
  MessageSquare,
  FileText,
  ShieldCheck,
  Zap,
  Cpu,
  CheckCircle2,
  Play,
  Film,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  const featureCards = [
    {
      mode: 'meeting' as const,
      name: t.analyzer.modes.meeting.name,
      desc: t.analyzer.modes.meeting.desc,
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
      bgGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      badge: t.analyzer.modes.meeting.badge,
    },
    {
      mode: 'news' as const,
      name: t.analyzer.modes.news.name,
      desc: t.analyzer.modes.news.desc,
      icon: Newspaper,
      color: 'from-rose-500 to-amber-500',
      bgGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      badge: t.analyzer.modes.news.badge,
    },
    {
      mode: 'education' as const,
      name: t.analyzer.modes.education.name,
      desc: t.analyzer.modes.education.desc,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-400',
      bgGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      badge: t.analyzer.modes.education.badge,
    },
    {
      mode: 'child' as const,
      name: t.analyzer.modes.child.name,
      desc: t.analyzer.modes.child.desc,
      icon: Smile,
      color: 'from-amber-500 to-orange-400',
      bgGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      badge: t.analyzer.modes.child.badge,
    },
    {
      mode: 'interview' as const,
      name: t.analyzer.modes.interview.name,
      desc: t.analyzer.modes.interview.desc,
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      bgGlow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      badge: t.analyzer.modes.interview.badge,
    },
    {
      mode: 'pitch' as const,
      name: t.analyzer.modes.pitch.name,
      desc: t.analyzer.modes.pitch.desc,
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
      bgGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      badge: t.analyzer.modes.pitch.badge,
    },
    {
      mode: 'chat' as const,
      name: t.analyzer.modes.chat.name,
      desc: t.analyzer.modes.chat.desc,
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
      bgGlow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      badge: t.analyzer.modes.chat.badge,
    },
    {
      mode: 'document' as const,
      name: t.analyzer.modes.document.name,
      desc: t.analyzer.modes.document.desc,
      icon: FileText,
      color: 'from-amber-500 to-red-500',
      bgGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      badge: t.analyzer.modes.document.badge,
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 1. Hero Section with Rich Multi-Layer Gradient Ambient Glow */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-8 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Soft Eye-Friendly Background Mesh Lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/25 via-indigo-600/20 to-cyan-500/20 blur-[140px] rounded-full pointer-events-none -z-10" />

        {/* Hero Glassmorphism Container Card */}
        <div className="relative w-full max-w-4xl p-8 sm:p-14 md:p-16 rounded-[2.5rem] bg-gradient-to-b from-[#0e172a]/85 via-[#0b1222]/85 to-[#070c18]/90 border border-slate-700/60 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col items-center text-center">
          {/* Small Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0e172a]/90 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-8 shadow-lg shadow-black/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Big H1 Title with Subtle Eye-Comfortable Gradient */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
            {t.hero.title1}
            <br className="hidden sm:inline" />{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/analyzer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-600/30 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{t.hero.launch}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-sm bg-[#0e1628]/90 hover:bg-[#131e36] text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer backdrop-blur-md"
            >
              {t.hero.seeHow}
            </a>
          </div>

          {/* Trust Badges Bar (No account, 100% free, fast) */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400 pt-6 border-t border-slate-800/80 w-full">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustNoAccount}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustFree}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustTranscript}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Transformation Flow (Step Cards) */}
      <section className="py-14 border-y border-slate-800/80 bg-[#060a16]/80 backdrop-blur-md relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Step 1 */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 group-hover:text-blue-500/20 transition-colors">
                01
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{t.home.step1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 group-hover:text-cyan-500/20 transition-colors">
                02
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{t.home.step2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 group-hover:text-emerald-500/20 transition-colors">
                03
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{t.home.step3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section (Specialized Modes) */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 mb-3 uppercase tracking-wider">
            {t.home.featuresBadge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            {t.home.featuresTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.home.featuresDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.mode}
                href={`/analyzer?mode=${card.mode}`}
                className={`p-6 rounded-3xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1020]/95 border border-slate-800/80 shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between ${card.bgGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{card.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-cyan-300 transition-colors">
                  <span>{t.home.openMode}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Final CTA Section */}
      <section className="py-20 px-4 sm:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#111c38] to-[#0a1022] border border-blue-500/25 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 relative z-10 tracking-tight">
            {t.home.ctaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-8 relative z-10 leading-relaxed">
            {t.home.ctaDesc}
          </p>
          <div className="flex flex-col items-center gap-4 relative z-10">
            <Link
              href="/analyzer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/30 hover:shadow-cyan-500/40 transition-all cursor-pointer"
            >
              <span>{t.home.ctaBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.home.ctaTrust1}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.home.ctaTrust2}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.home.ctaTrust3}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
