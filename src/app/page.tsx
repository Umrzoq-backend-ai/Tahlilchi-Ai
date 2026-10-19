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
      mode: 'meeting',
      name: t.analyzer.modes.meeting.name,
      desc: t.analyzer.modes.meeting.desc,
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
      bgGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      badge: 'Biznes & Spikerlar',
    },
    {
      mode: 'news',
      name: t.analyzer.modes.news.name,
      desc: t.analyzer.modes.news.desc,
      icon: Newspaper,
      color: 'from-rose-500 to-amber-500',
      bgGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      badge: 'Fakt & Xolislik',
    },
    {
      mode: 'education',
      name: t.analyzer.modes.education.name,
      desc: t.analyzer.modes.education.desc,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-400',
      bgGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      badge: 'Interaktiv Test',
    },
    {
      mode: 'child',
      name: t.analyzer.modes.child.name,
      desc: t.analyzer.modes.child.desc,
      icon: Smile,
      color: 'from-amber-500 to-orange-400',
      bgGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      badge: '1-16 Yosh Filtr',
    },
    {
      mode: 'interview',
      name: t.analyzer.modes.interview.name,
      desc: t.analyzer.modes.interview.desc,
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      bgGlow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      badge: 'HR Scorecard',
    },
    {
      mode: 'pitch',
      name: t.analyzer.modes.pitch.name,
      desc: t.analyzer.modes.pitch.desc,
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
      bgGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      badge: '3V Framework',
    },
    {
      mode: 'chat',
      name: t.analyzer.modes.chat.name,
      desc: t.analyzer.modes.chat.desc,
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
      bgGlow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      badge: 'Jonli Savol-Javob',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 1. Hero Section with Rich Multi-Layer Gradient Ambient Glow */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 px-4 sm:px-8 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Soft Eye-Friendly Background Mesh Lights */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-cyan-500/15 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Small Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0e172a]/90 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-8 shadow-lg shadow-black/30 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.hero.badge}</span>
        </div>

        {/* Big H1 Title with Subtle Eye-Comfortable Gradient */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
          {t.hero.title1}
          <br className="hidden sm:inline" />
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">Akkaunt kiritish shart emas</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">100% Bepul & Ochiq</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">To‘liq Transkript & Timestamps</span>
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
              <h3 className="text-sm font-bold text-white mb-2">1. Video, Audio & PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                YouTube URL, MP4 video, audio yoki PDF hujjatni kiritasiz.
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
              <h3 className="text-sm font-bold text-white mb-2">2. Native Multimodal AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini video kadrlar, audiotrek va slaydlarni bir vaqtda tushunadi.
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
              <h3 className="text-sm font-bold text-white mb-2">3. Actionable Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Qarorlar, interaktiv test, 3V tahlil va suhbatdosh Video Chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section (7 Specialized Modes with Distinctive Accents) */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 mb-3 uppercase tracking-wider">
            Ixtisoslashgan Yo'nalishlar
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            7 xil ixtisoslashgan tahlil rejimlari
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Har bir soha uchun maxsus tuzilgan JSON structured output schemalari va AI modellari.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <span>Rejimni ochish</span>
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
            Ixtiyoriy videoni darhol tahlil qilishga tayyormisiz?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-8 relative z-10 leading-relaxed">
            Akkaunt ochish yoki karta kiritish talab qilinmaydi! Havolani joylang yoki faylni yuklang — soniyalar ichida to‘liq tahlil va transkriptga ega bo‘ling.
          </p>
          <div className="flex flex-col items-center gap-4 relative z-10">
            <Link
              href="/analyzer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/30 hover:shadow-cyan-500/40 transition-all cursor-pointer"
            >
              <span>Studiyani Bepul Ochish</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Ro‘yxatdan o‘tishsiz
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% Bepul va xavfsiz
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Daqiqalik natija
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
