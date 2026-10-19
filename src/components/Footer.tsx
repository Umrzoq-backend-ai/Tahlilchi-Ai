'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative border-t border-slate-800/80 bg-[#060a14] pt-14 pb-10 mt-auto text-xs text-slate-400 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[140px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Description */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#060a14] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="font-black text-white text-base tracking-tight">
                Tahlilchi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tizim barqaror ishlamoqda (Online)</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors font-medium">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/analyzer" className="hover:text-cyan-400 transition-colors font-medium">
                  {t.nav.analyzer}
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-cyan-400 transition-colors font-medium">
                  {t.nav.history}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors font-medium">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-cyan-400 transition-colors font-medium">
                  {t.nav.settings}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Modes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.capabilities}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/analyzer?mode=meeting" className="hover:text-cyan-400 transition-colors">
                  Uchrashuv bayonnomasi
                </Link>
              </li>
              <li>
                <Link href="/analyzer?mode=education" className="hover:text-cyan-400 transition-colors">
                  Dars konspekti va Test
                </Link>
              </li>
              <li>
                <Link href="/analyzer?mode=news" className="hover:text-cyan-400 transition-colors">
                  Fakt-cheking va Xolislik
                </Link>
              </li>
              <li>
                <Link href="/analyzer?mode=pitch" className="hover:text-cyan-400 transition-colors">
                  3V Notiqlik & Taqdimot
                </Link>
              </li>
              <li>
                <Link href="/analyzer?mode=document" className="hover:text-cyan-400 transition-colors">
                  PDF & Hujjat Tahlili
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.footer.privacy}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t.footer.noAccount}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{t.footer.security}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                Google Gemini 2.5 & 3 Native Multimodal arxitekturasi asosida ishlaydi.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar: Copyright & Made in Uzbekistan */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            <p className="font-medium">{t.footer.rights}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{t.footer.madeIn}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
