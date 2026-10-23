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
      <section className="relative pt-4 pb-8 sm:pt-6 sm:pb-10 md:pt-8 md:pb-12 px-3 sm:px-6 md:px-8 text-center max-w-5xl mx-auto flex flex-col items-center w-full">
        {/* Soft Eye-Friendly Background Mesh Lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Hero Glassmorphism Container Card with Distinct Elegant Glowing Frame (Ramka) */}
        <div className="relative w-full max-w-4xl p-5 sm:p-7 md:p-8 lg:p-9 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e172a]/95 via-[#0b1222]/90 to-[#070c18]/95 border border-cyan-500/30 sm:border-slate-700/80 shadow-[0_0_50px_-10px_rgba(6,182,212,0.2),0_20px_50px_rgba(0,0,0,0.7)] ring-1 ring-cyan-500/20 backdrop-blur-2xl flex flex-col items-center text-center overflow-hidden transition-all">
          {/* Subtle top edge neon highlight line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          {/* Ambient top light cone inside the card */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-20 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

          {/* Small Pill Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-blue-500/10 border border-cyan-400/30 text-[11px] sm:text-xs font-semibold text-cyan-300 mb-3 sm:mb-4 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.hero.badge}</span>
          </div>

          {/* H1 Title with Fluid Responsive Scaling (Fits perfectly across mobile, tablet, laptop, desktop) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-extrabold sm:font-black text-white tracking-tight leading-[1.18] mb-2.5 sm:mb-3.5 max-w-3xl">
            {t.hero.title1}
            <br className="hidden sm:inline" />{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-300/90 max-w-2xl leading-relaxed mb-5 sm:mb-6 px-2">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/analyzer"
              className="w-full sm:w-auto px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{t.hero.launch}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm bg-[#0e1628]/90 hover:bg-[#131e36] text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer backdrop-blur-md flex items-center justify-center"
            >
              {t.hero.seeHow}
            </a>
          </div>

          {/* Trust Badges Bar (No account, 100% free, fast) */}
          <div className="mt-5 pt-4 sm:mt-6 sm:pt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-slate-400 border-t border-slate-800/80 w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustNoAccount}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustFree}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">{t.hero.trustTranscript}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Transformation Flow (Step Cards) */}
      <section className="py-10 sm:py-14 border-y border-slate-800/80 bg-[#060a16]/80 backdrop-blur-md relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center">
            {/* Step 1 */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-3 right-4 text-2xl sm:text-3xl font-black text-slate-800 group-hover:text-blue-500/20 transition-colors">
                01
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3.5 sm:mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 sm:mb-2">{t.home.step1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="absolute top-3 right-4 text-2xl sm:text-3xl font-black text-slate-800 group-hover:text-cyan-500/20 transition-colors">
                02
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3.5 sm:mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 sm:mb-2">{t.home.step2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-3 right-4 text-2xl sm:text-3xl font-black text-slate-800 group-hover:text-emerald-500/20 transition-colors">
                03
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3.5 sm:mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 sm:mb-2">{t.home.step3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section (Specialized Modes) */}
      <section id="features" className="py-12 sm:py-16 md:py-20 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 mb-2.5 sm:mb-3 uppercase tracking-wider">
            {t.home.featuresBadge}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2.5 sm:mb-3 tracking-tight">
            {t.home.featuresTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 px-2">
            {t.home.featuresDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.mode}
                href={`/analyzer?mode=${card.mode}`}
                className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1020]/95 border border-slate-800/80 shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between ${card.bgGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1.5 sm:mb-2 group-hover:text-cyan-300 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{card.desc}</p>
                </div>

                <div className="pt-3.5 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-cyan-300 transition-colors">
                  <span>{t.home.openMode}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Final CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-6 md:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#111c38] to-[#0a1022] border border-cyan-500/30 sm:border-blue-500/25 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 relative z-10 tracking-tight">
            {t.home.ctaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6 sm:mb-8 relative z-10 leading-relaxed px-2">
            {t.home.ctaDesc}
          </p>
          <div className="flex flex-col items-center gap-4 relative z-10 w-full sm:w-auto">
            <Link
              href="/analyzer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/30 hover:shadow-cyan-500/40 transition-all cursor-pointer"
            >
              <span>{t.home.ctaBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-slate-400">
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
