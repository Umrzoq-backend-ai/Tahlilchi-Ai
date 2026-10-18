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
    },
    {
      mode: 'news',
      name: t.analyzer.modes.news.name,
      desc: t.analyzer.modes.news.desc,
      icon: Newspaper,
      color: 'from-rose-500 to-orange-500',
    },
    {
      mode: 'education',
      name: t.analyzer.modes.education.name,
      desc: t.analyzer.modes.education.desc,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      mode: 'child',
      name: t.analyzer.modes.child.name,
      desc: t.analyzer.modes.child.desc,
      icon: Smile,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      mode: 'interview',
      name: t.analyzer.modes.interview.name,
      desc: t.analyzer.modes.interview.desc,
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      mode: 'pitch',
      name: t.analyzer.modes.pitch.name,
      desc: t.analyzer.modes.pitch.desc,
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
    },
    {
      mode: 'chat',
      name: t.analyzer.modes.chat.name,
      desc: t.analyzer.modes.chat.desc,
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. Hero Section (Screenshot 2) */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-8 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Small Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#131d33] border border-slate-700/80 text-xs font-semibold text-slate-300 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.hero.badge}</span>
        </div>

        {/* Big H1 Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
          {t.hero.title1}
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
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
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{t.hero.launch}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-[#131c31] hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
          >
            {t.hero.seeHow}
          </a>
        </div>
      </section>

      {/* 2. Visual Transformation Flow */}
      <section className="py-12 border-y border-slate-800/80 bg-[#070b14]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">1. Raw Video & Audio</h3>
              <p className="text-xs text-slate-400">YouTube URL, MP4 video yoki audio fayl yuklang.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">2. Multimodal AI Analysis</h3>
              <p className="text-xs text-slate-400">Gemini kadrlar, subtitr va audio trekni sintez qiladi.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">3. Actionable Intelligence</h3>
              <p className="text-xs text-slate-400">Vazifalar, testlar, 3V tahlil va suhbatdosh chat oling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section (7 Specialized Modes) */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
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
                className="p-6 rounded-2xl bg-[#10182b] hover:bg-[#14203a] border border-slate-800 hover:border-blue-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Rejimni ochish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Final CTA Section */}
      <section className="py-20 px-4 sm:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#131f3b] to-[#0c1324] border border-blue-500/20 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
            Birinchi videongizni tahlil qilishga tayyormisiz?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-8">
            Ro‘yxatdan o‘tish talab qilinmaydi. O‘z Gemini API kalitingiz bilan darhol ishga tushiring.
          </p>
          <Link
            href="/analyzer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/30 transition-all"
          >
            <span>Studiyani Ochish</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
