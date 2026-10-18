'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative border-t border-slate-800/80 bg-[#060a14] py-12 mt-auto text-xs text-slate-400 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[100px] bg-blue-600/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#060a14] rounded-md flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-white text-sm tracking-tight">
              Tahlilchi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs">Har bir kadrdagi aql va zakovat</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Google Gemini 2.5 & 3 Native Multimodal arxitekturasi asosida ishlaydi.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <Link href="/" className="hover:text-cyan-400 transition-colors font-medium">
            {t.nav.home}
          </Link>
          <Link href="/analyzer" className="hover:text-cyan-400 transition-colors font-medium">
            {t.nav.analyzer}
          </Link>
          <Link href="/history" className="hover:text-cyan-400 transition-colors font-medium">
            {t.nav.history}
          </Link>
          <Link href="/about" className="hover:text-cyan-400 transition-colors font-medium">
            {t.nav.about}
          </Link>
          <Link href="/settings" className="hover:text-cyan-400 transition-colors font-medium">
            {t.nav.settings}
          </Link>
        </div>
      </div>
    </footer>
  );
}
